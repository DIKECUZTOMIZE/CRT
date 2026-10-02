import EventModel, { deriveEventStatus, shouldAutoCompleteByEndTime } from "../../model/event.model.js";
import UserModel from "../../model/user.model.js";
import { getRedisClient } from "../../config/redis.js";
import {
    createEvent,
    deleteEventByIdForOrganizer,
    getEventByIdForOrganizer,
    getEventsByOrganizer,
    updateEventByIdForOrganizer,
} from "../../dao/event.dao.js";
import { createNotificationService } from "../notification/notification.service.js";

const PUBLIC_EVENTS_CACHE_TTL_SECONDS = 300;
const DEFAULT_PUBLIC_EVENTS_CACHE_KEY = "public:events:default";
const inFlightPublicEventsRequests = new Map();
const isEnabled = (value) => value === true || value === "Yes";

const buildPublicEventsCacheKey = (filters = {}, pagination = {}) => {
    const normalizedFilters = { ...filters };
    const normalizedPagination = { ...pagination };

    return `public:events:${JSON.stringify({
        filters: normalizedFilters,
        pagination: normalizedPagination,
    })}`;
};

const buildDefaultPublicEventsCacheKey = (page, limit) => `${DEFAULT_PUBLIC_EVENTS_CACHE_KEY}:${Number(page || 1)}:${Number(limit || 12)}`;
const buildDefaultPublicEventsTotalCacheKey = (page, limit) => `${DEFAULT_PUBLIC_EVENTS_CACHE_KEY}:total:${Number(page || 1)}:${Number(limit || 12)}`;

const normalizeDefaultPublicEventsResult = (events = [], total = 0, page, limit) => ({
    events,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
});

const isExactDefaultPublicEventQuery = (filters = {}, page, limit) => {
    const hasNonEmptyFilter = Object.entries(filters || {}).some(([, value]) =>
        value !== undefined && value !== null && value !== ""
    );

    if (hasNonEmptyFilter) {
        return false;
    }

    return Number(page || 1) === 1 && Number(limit || 12) === 12;
};

const isDefaultPublicEventQuery = (filters = {}, page, limit) => {
    if (Object.keys(filters || {}).length > 0) {
        return false;
    }

    return page === 1 && limit <= 12;
};

const invalidatePublicEventsCache = async () => {
    const redisClient = getRedisClient();

    if (!redisClient?.isOpen) {
        return;
    }

    try {
        const keys = await redisClient.keys("public:events:*");

        if (keys.length > 0) {
            await redisClient.del(keys);
        }
    } catch (error) {
        // Ignore cache invalidation failures so write flows still succeed.
    }
};

const refreshDefaultPublicEventsSnapshot = async (redisClient, total, page, limit, events) => {
    if (!redisClient?.isOpen) {
        return;
    }

    const exactDefaultCacheKey = buildDefaultPublicEventsCacheKey(page, limit);
    const exactDefaultTotalCacheKey = buildDefaultPublicEventsTotalCacheKey(page, limit);
    const snapshot = normalizeDefaultPublicEventsResult(events, total, page, limit);

    try {
        await redisClient.set(exactDefaultCacheKey, JSON.stringify(snapshot), {
            EX: PUBLIC_EVENTS_CACHE_TTL_SECONDS,
        });
        await redisClient.set(exactDefaultTotalCacheKey, JSON.stringify(total), {
            EX: PUBLIC_EVENTS_CACHE_TTL_SECONDS,
        });
    } catch (error) {
        // Ignore cache write errors and continue with the response.
    }
};

const normalizeStateValue = (value) => String(value ?? "").trim();

const getEligibleLocationStateUsers = async (state) => {
    const normalizedState = normalizeStateValue(state);

    if (!normalizedState || normalizedState === "India") {
        return [];
    }

    return UserModel.find({
        $and: [
            {
                $nor: [
                    { role: "ADMIN" },
                    { roles: "ADMIN" },
                ],
            },
            {
                $or: [
                    { role: "USER" },
                    { roles: "USER" },
                ],
            },
            { "location.state": normalizedState },
            {
                $or: [
                    { "location.isSelected": true },
                    { "location.state": { $ne: "", $ne: "India" } },
                ],
            },
        ],
    }).select("_id role roles location").lean();
};

const notifyUsersForEventState = async ({ event, targetStates, notificationType = "event", title, message }) => {
    const states = [...new Set(targetStates.filter((state) => normalizeStateValue(state) && normalizeStateValue(state) !== "India"))];

    if (states.length === 0) {
        return [];
    }

    const uniqueUsers = new Map();

    for (const state of states) {
        const users = await getEligibleLocationStateUsers(state);

        for (const user of users) {
            const userId = String(user._id);
            if (!userId || uniqueUsers.has(userId)) {
                continue;
            }
            uniqueUsers.set(userId, user);
        }
    }

    const notifications = await Promise.all(
        [...uniqueUsers.values()].map(({ _id }) =>
            createNotificationService({
                userId: _id,
                title,
                message,
                type: notificationType,
                link: `/events/${event._id}`,
                metadata: {
                    eventId: String(event._id),
                    state: event.state || "",
                    city: event.city || "",
                    location: event.location || "",
                },
            })
        )
    );

    return notifications;
};

export const createEventService = async (organizerId, payload) => {
    const participationConfig = payload.participation || {};
    const {
        hasParticipationType,
        participationMode,
        minTeamSize,
        maxTeamSize,
        participationSteps,
        eventRules,
        securityRequirements,
        selectedPrizeCategory,
        customPrizeCategory,
        ...eventData
    } = payload;

    const resolvedParticipationEnabled = hasParticipationType ?? participationConfig.enabled ?? false;
    const resolvedParticipationMode = participationMode || participationConfig.mode || "Solo";
    const resolvedMinTeamSize = minTeamSize ?? participationConfig.minTeamSize;
    const resolvedMaxTeamSize = maxTeamSize ?? participationConfig.maxTeamSize;

    const normalizedEntries = (eventData.entries || []).map((entry) => ({
        ...entry,
        category: entry.category || "General / All",
        customName: entry.customName || "",
        participationType: entry.participationType || "Solo",
        isPaid: entry.isPaid || "No",
        price: Number(entry.price || 0),
    }));

    const normalizedPrizes = (eventData.prizes || []).map((prize) => ({
        ...prize,
        category: prize.category || prize.customTitle || "General",
        customTitle: prize.customTitle || prize.title || prize.name || "",
        position: prize.position || "General",
        amount: Number(prize.amount || 0),
        reward: prize.reward || "",
    }));

    const normalizedRules = (eventRules || []).map((rule) => ({
        type: rule.type || "General",
        text: rule.text || "",
    })).filter((rule) => rule.text && rule.text.trim());

    const normalizedSecurityRequirements = (securityRequirements || []).map((rule) => ({
        type: rule.type || "Security Requirement",
        text: rule.text || "",
    })).filter((rule) => rule.text && rule.text.trim());

    const normalizedSteps = (participationSteps || []).map((step) => ({
        text: step.text || "",
    })).filter((step) => step.text && step.text.trim());

    const normalizedCustomFields = (eventData.customFields || []).map((field) => ({
        fieldName: field.fieldName || "",
        fieldType: field.fieldType || "text",
        isRequired: Boolean(field.isRequired),
    })).filter((field) => field.fieldName && field.fieldName.trim());

    const normalizedTeam = (eventData.organizerTeam || []).map((member) => ({
        name: member.name || "",
        role: member.role || "",
        contact: member.contact || "",
    })).filter((member) => member.name && member.name.trim());

    const event = await createEvent({
        ...eventData,
        organizerId,
        entries: normalizedEntries,
        prizes: normalizedPrizes,
        participation: {
            enabled: isEnabled(resolvedParticipationEnabled),
            mode: resolvedParticipationMode,
            minTeamSize: Number(resolvedMinTeamSize || 0) || undefined,
            maxTeamSize: Number(resolvedMaxTeamSize || 0) || undefined,
        },
        eventRules: normalizedRules,
        securityRequirements: normalizedSecurityRequirements,
        participationSteps: normalizedSteps,
        customFields: normalizedCustomFields,
        organizerTeam: normalizedTeam,
    });

    await invalidatePublicEventsCache();

    try {
        const locationContext = [event.city, event.state].filter(Boolean).join(", ") || event.location || "your area";
        const title = "New event is live";
        const message = `${event.title || "A new event"} is now live in ${locationContext}. Explore it now.`;

        await notifyUsersForEventState({
            event,
            targetStates: [event.state],
            notificationType: "event",
            title,
            message,
        });
    } catch (error) {
        // Do not fail event creation if notification delivery is unavailable.
    }

    return event && typeof event.toObject === "function" ? event.toObject() : event;
};

const buildFlexibleRegex = (value = "") => {
    const cleaned = String(value || "").trim();
    if (!cleaned) return new RegExp("", "i");

    const escaped = cleaned.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const spaced = escaped.replace(/\s+/g, ".*");
    return new RegExp(spaced, "i");
};

const normalizeParticipationFilterValue = (value = "") => {
    const normalized = String(value ?? "").trim().toLowerCase();
    if (!normalized) return "";

    const aliases = {
        solo: "solo",
        individual: "solo",
        single: "solo",
        team: "team",
        group: "team",
        duo: "team",
        crew: "team",
        both: "both",
        hybrid: "both",
    };

    return aliases[normalized] || normalized;
};

const normalizeAggregateCount = (payload) => {
    if (payload == null) return 0;

    if (typeof payload === "number") {
        return payload;
    }

    if (Array.isArray(payload)) {
        if (payload.length === 0) return 0;
        return normalizeAggregateCount(payload[0]);
    }

    if (typeof payload === "object") {
        if (typeof payload.count === "number") return payload.count;
        if (typeof payload.total === "number") return payload.total;
        if (Array.isArray(payload.count)) return normalizeAggregateCount(payload.count);
        if (Array.isArray(payload.total)) return normalizeAggregateCount(payload.total);
        if (typeof payload.value === "number") return payload.value;
    }

    const numericValue = Number(payload);
    return Number.isFinite(numericValue) ? numericValue : 0;
};

const normalizeAggregateEvents = (payload) => {
    if (Array.isArray(payload)) {
        if (payload.length === 0) return [];

        const first = payload[0];
        if (first && Array.isArray(first.events)) {
            return first.events;
        }

        return payload.filter((entry) => entry && typeof entry === "object" && !Array.isArray(entry));
    }

    if (payload && typeof payload === "object") {
        if (Array.isArray(payload.events)) return payload.events;
        if (Array.isArray(payload.data)) return payload.data;
    }

    return [];
};

export const getPublicEventsService = async (filters = {}, pagination = {}) => {
    const {
        search,
        organizer,
        category,
        state,
        city,
        location,
        participationType,
        isFreeOnly,
        minPrize,
        dateRange,
    } = filters;

    const page = Math.max(1, Number(pagination.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(pagination.limit) || 12));
    const skip = (page - 1) * limit;

    const publicSelect = {
        _id: 1,
        title: 1,
        category: 1,
        tagline: 1,
        eventMode: 1,
        state: 1,
        city: 1,
        district: 1,
        location: 1,
        eventDate: 1,
        eventEndDate: 1,
        eventStartTime: 1,
        eventEndTime: 1,
        eventTime: 1,
        viewsCount: 1,
        avgRating: 1,
        ratingsCount: 1,
        bannerUrl: 1,
        cardImageUrl: 1,
        status: 1,
        createdAt: 1,
        "organizerContact.name": 1,
        "participation.enabled": 1,
        "participation.mode": 1,
        totalPrizePool: 1,
    };

    const cacheKey = buildPublicEventsCacheKey(filters, { page, limit });
    const redisClient = getRedisClient();
    const exactDefaultCacheKey = buildDefaultPublicEventsCacheKey(page, limit);
    const exactDefaultTotalCacheKey = buildDefaultPublicEventsTotalCacheKey(page, limit);
    const isExactDefaultQuery = isExactDefaultPublicEventQuery(filters, page, limit);

    if (isExactDefaultQuery) {
        if (redisClient?.isOpen) {
            try {
                const cachedValue = await redisClient.get(exactDefaultCacheKey);

                if (cachedValue) {
                    const parsed = JSON.parse(cachedValue);
                    if (parsed && Array.isArray(parsed.events)) {
                        return parsed;
                    }
                }
            } catch (error) {
                // Ignore cache read errors and fall back to the live DB query.
            }
        }

        if (inFlightPublicEventsRequests.has(exactDefaultCacheKey)) {
            return inFlightPublicEventsRequests.get(exactDefaultCacheKey);
        }

        const requestPromise = (async () => {
            const match = {
                status: { $in: ["upcoming", "live"] },
            };

            const total = await EventModel.countDocuments(match);
            const events = await EventModel.find(match)
                .select(publicSelect)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            const normalizedEvents = events.map((event) => ({
                ...event,
                status: deriveEventStatus(event),
            }));

            const result = normalizeDefaultPublicEventsResult(normalizedEvents, total, page, limit);

            if (redisClient?.isOpen) {
                try {
                    await redisClient.set(exactDefaultCacheKey, JSON.stringify(result), {
                        EX: PUBLIC_EVENTS_CACHE_TTL_SECONDS,
                    });
                    await redisClient.set(exactDefaultTotalCacheKey, JSON.stringify(total), {
                        EX: PUBLIC_EVENTS_CACHE_TTL_SECONDS,
                    });
                } catch (error) {
                    // Ignore cache write errors and continue with the response.
                }
            }

            return result;
        })();

        inFlightPublicEventsRequests.set(exactDefaultCacheKey, requestPromise);

        try {
            return await requestPromise;
        } finally {
            inFlightPublicEventsRequests.delete(exactDefaultCacheKey);
        }
    }

    if (redisClient?.isOpen) {
        try {
            const cachedValue = await redisClient.get(cacheKey);

            if (cachedValue) {
                const parsed = JSON.parse(cachedValue);
                if (parsed && Array.isArray(parsed.events)) {
                    return parsed;
                }
            }
        } catch (error) {
            // Ignore cache read errors and fall back to the live DB query.
        }
    }

    if (inFlightPublicEventsRequests.has(cacheKey)) {
        return inFlightPublicEventsRequests.get(cacheKey);
    }

    const requestPromise = (async () => {
        const match = {
            status: { $in: ["upcoming", "live"] },
        };

        let result;

        if (isDefaultPublicEventQuery(filters, page, limit)) {
            const [events, total] = await Promise.all([
                EventModel.find(match)
                    .select(publicSelect)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                EventModel.countDocuments(match),
            ]);

            const normalizedEvents = [];
            for (const event of events) {
                const finalizedEvent = await finalizePastEndTimeEvent(event);
                normalizedEvents.push({
                    ...finalizedEvent,
                    status: deriveEventStatus(finalizedEvent),
                });
            }

            result = {
                events: normalizedEvents,
                total,
                page,
                limit,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            };
        } else {
            const searchText = String(search || "").trim();
            if (searchText) {
                const normalizedSearch = searchText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, ".*");
                match.$or = [
                    { title: new RegExp(normalizedSearch, "i") },
                    { tagline: new RegExp(normalizedSearch, "i") },
                    { category: new RegExp(normalizedSearch, "i") },
                    { location: new RegExp(normalizedSearch, "i") },
                ];
            }

            if (organizer?.trim()) {
                match["organizerContact.name"] = new RegExp(organizer.trim(), "i");
            }

            if (category?.trim()) {
                match.category = new RegExp(`^${category.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
            }

            if (participationType?.trim()) {
                const normalizedType = normalizeParticipationFilterValue(participationType);

                if (normalizedType === "solo") {
                    match["participation.mode"] = { $in: ["solo"] };
                } else if (normalizedType === "team") {
                    match["participation.mode"] = { $in: ["team", "group", "both"] };
                } else if (normalizedType === "both") {
                    match["participation.mode"] = { $in: ["solo", "team", "group", "both"] };
                }
            }

            if (state?.trim() || city?.trim() || location?.trim()) {
                const stateFilter = [];

                if (state?.trim()) {
                    stateFilter.push({ state: new RegExp(`^${state.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
                }

                if (city?.trim()) {
                    stateFilter.push({ city: new RegExp(`^${city.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
                }

                if (location?.trim()) {
                    stateFilter.push({ location: new RegExp(`^${location.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
                }

                if (stateFilter.length > 0) {
                    match.$and = [{ $or: stateFilter }];
                }
            }

            if (isFreeOnly === true || isFreeOnly === "true") {
                match["entries.price"] = { $not: { $gt: 0 } };
            }

            if (minPrize && Number(minPrize) > 0) {
                match.totalPrizePool = { $gte: Number(minPrize) };
            }

            if (dateRange && dateRange !== "all") {
                const parsedDays = Number(dateRange);
                if (!Number.isNaN(parsedDays) && parsedDays > 0) {
                    const now = new Date();
                    const dateLimit = new Date(now.getTime() + parsedDays * 24 * 60 * 60 * 1000);
                    match.eventStart = { $gte: now, $lte: dateLimit };
                }
            }

            const hasParticipationFilter = participationType?.trim();

            if (hasParticipationFilter) {
                const [countResult, eventsResult] = await Promise.all([
                    EventModel.aggregate([
                        { $match: match },
                        { $count: "count" },
                    ]),
                    EventModel.aggregate([
                        { $match: match },
                        { $sort: { createdAt: -1 } },
                        { $skip: skip },
                        { $limit: limit },
                        { $project: publicSelect },
                    ]),
                ]);

                const total = normalizeAggregateCount(countResult ?? 0);
                const events = normalizeAggregateEvents(eventsResult ?? []);

                result = {
                    events,
                    total,
                    page,
                    limit,
                    totalPages: Math.max(1, Math.ceil(total / limit)),
                };
            } else {
                const [facetResult] = await EventModel.aggregate([
                    { $match: match },
                    {
                        $facet: {
                            total: [{ $count: "count" }],
                            events: [
                                { $sort: { createdAt: -1 } },
                                { $skip: skip },
                                { $limit: limit },
                                { $project: publicSelect },
                            ],
                        },
                    },
                ]);

                const total = normalizeAggregateCount(facetResult?.total ?? 0);
                const events = normalizeAggregateEvents(facetResult?.events ?? []);

                result = {
                    events,
                    total,
                    page,
                    limit,
                    totalPages: Math.max(1, Math.ceil(total / limit)),
                };
            }
        }

        if (redisClient?.isOpen) {
            try {
                await redisClient.set(cacheKey, JSON.stringify(result), {
                    EX: PUBLIC_EVENTS_CACHE_TTL_SECONDS,
                });
            } catch (error) {
                // Ignore cache write errors and continue with the response.
            }
        }

        return result;
    })();

    inFlightPublicEventsRequests.set(cacheKey, requestPromise);

    try {
        return await requestPromise;
    } finally {
        inFlightPublicEventsRequests.delete(cacheKey);
    }
};

export const getPublicEventByIdService = async (eventId) => {
    const event = await EventModel.findById(eventId).lean();
    if (!event) {
        return null;
    }

    const finalizedEvent = await finalizePastEndTimeEvent(event);
    return {
        ...finalizedEvent,
        status: deriveEventStatus(finalizedEvent),
    };
};

export const incrementEventViewsService = async (eventId) => {
    if (!eventId) return null;

    const updatedEvent = await EventModel.findByIdAndUpdate(
        eventId,
        { $inc: { viewsCount: 1 } },
        { new: true, runValidators: true }
    ).lean();

    return updatedEvent;
};

export const submitEventRatingService = async (eventId, userId, rawRating) => {
    if (!eventId || !userId) return null;

    const ratingValue = Number(rawRating);
    if (!Number.isFinite(ratingValue) || ratingValue < 1 || ratingValue > 5) {
        const error = new Error("Rating must be between 1 and 5");
        error.statusCode = 400;
        throw error;
    }

    const event = await EventModel.findById(eventId);
    if (!event) return null;

    const existingRatingIndex = event.ratings.findIndex(
        (item) => String(item.userId) === String(userId)
    );

    if (existingRatingIndex >= 0) {
        event.ratings[existingRatingIndex].value = ratingValue;
        event.ratings[existingRatingIndex].createdAt = new Date();
    } else {
        event.ratings.push({
            userId,
            value: ratingValue,
            createdAt: new Date(),
        });
    }

    const totalRating = event.ratings.reduce((sum, item) => sum + Number(item.value || 0), 0);
    event.ratingsCount = event.ratings.length;
    event.avgRating = Number((totalRating / event.ratings.length).toFixed(1));

    await event.save();
    return event.toObject();
};

const finalizePastEndTimeEvent = async (event) => {
    if (!event || typeof event !== "object") {
        return event;
    }

    const currentStatus = String(event.status || "").trim().toLowerCase();
    if (["completed", "ended", "cancelled", "postponed"].includes(currentStatus) || event.completionConfirmedAt) {
        return event;
    }

    if (!shouldAutoCompleteByEndTime(event)) {
        return event;
    }

    const completionConfirmedAt = new Date();
    const updatedEvent = await EventModel.findOneAndUpdate(
        {
            _id: event._id,
            status: { $in: ["upcoming", "live"] },
            completionConfirmedAt: null,
        },
        { $set: { status: "completed", completionConfirmedAt } },
        { new: true, runValidators: true }
    ).lean();

    if (!updatedEvent) {
        return event;
    }

    await invalidatePublicEventsCache();
    return updatedEvent;
};

export const autoCompleteExpiredEvents = async () => {
    const expiredCandidates = await EventModel.find({
        status: { $in: ["upcoming", "live"] },
        completionConfirmedAt: null,
    }).lean();

    if (!Array.isArray(expiredCandidates) || expiredCandidates.length === 0) {
        return { completed: 0, updatedEvents: [] };
    }

    const updatedEvents = [];

    for (const event of expiredCandidates) {
        if (!shouldAutoCompleteByEndTime(event)) {
            continue;
        }

        const completionConfirmedAt = new Date();
        const result = await EventModel.findOneAndUpdate(
            {
                _id: event._id,
                status: { $in: ["upcoming", "live"] },
                completionConfirmedAt: null,
            },
            { $set: { status: "completed", completionConfirmedAt } },
            { new: true, runValidators: true }
        ).lean();

        if (result) {
            updatedEvents.push({
                _id: result._id,
                status: result.status,
                completionConfirmedAt: result.completionConfirmedAt,
            });
        }
    }

    if (updatedEvents.length > 0) {
        await invalidatePublicEventsCache();
    }

    return { completed: updatedEvents.length, updatedEvents };
};

export const getOrganizerEventsService = async (organizerId) => {
    const events = await getEventsByOrganizer(organizerId);

    const finalizedEvents = [];
    for (const event of events) {
        const finalizedEvent = await finalizePastEndTimeEvent(event);
        finalizedEvents.push({
            ...finalizedEvent,
            status: deriveEventStatus(finalizedEvent),
        });
    }

    return finalizedEvents;
};

export const getOrganizerEventByIdService = async (organizerId, eventId, userRole = "ORGANIZER") => {
    if (userRole === "ADMIN") {
        const event = await EventModel.findOne({ _id: eventId }).lean();
        if (!event) {
            return null;
        }

        return finalizePastEndTimeEvent(event);
    }

    const event = await getEventByIdForOrganizer(organizerId, eventId);
    if (!event) {
        return null;
    }

    const finalizedEvent = await finalizePastEndTimeEvent(event);
    return {
        ...finalizedEvent,
        status: deriveEventStatus(finalizedEvent),
    };
};

const normalizeEventStatus = (value) => {
    if (typeof value !== "string") return value;

    const lower = value.trim().toLowerCase();
    const aliases = {
        cancel: "cancelled",
        cancelled: "cancelled",
        canceled: "cancelled",
        popond: "postponed",
        pospond: "postponed",
        postpon: "postponed",
        postpond: "postponed",
        postponed: "postponed",
        complete: "completed",
        completed: "completed",
        end: "ended",
        ended: "ended",
    };

    return aliases[lower] ?? lower;
};

const parseEventTimeString = (value) => {
    if (!value || typeof value !== "string") return null;

    const trimmed = value.trim();
    if (!trimmed) return null;

    const meridiemMatch = trimmed.match(/^([0-9]{1,2}):([0-9]{2})(?::([0-9]{2}))?\s*([AaPp][Mm])$/);
    if (meridiemMatch) {
        let hours = Number(meridiemMatch[1]);
        const minutes = Number(meridiemMatch[2]);
        const seconds = Number(meridiemMatch[3] ?? 0);
        const meridiem = meridiemMatch[4].toUpperCase();

        if (meridiem === "AM" && hours === 12) hours = 0;
        if (meridiem === "PM" && hours !== 12) hours += 12;

        return { hours, minutes, seconds };
    }

    const standardMatch = trimmed.match(/^([0-9]{1,2}):([0-9]{2})(?::([0-9]{2}))?$/);
    if (standardMatch) {
        return {
            hours: Number(standardMatch[1]),
            minutes: Number(standardMatch[2]),
            seconds: Number(standardMatch[3] ?? 0),
        };
    }

    return null;
};

const isEventPastEndTime = (event) => {
    if (!event) return false;

    const normalizedStatus = String(event.status || "").trim().toLowerCase();
    if (normalizedStatus === "completed" || normalizedStatus === "ended") {
        return true;
    }

    const endDateValue = event.eventEndDate || event.eventEnd || event.eventDate || event.eventStart;
    const endTimeValue = event.eventEndTime || event.eventTime || event.eventStartTime;

    if (!endDateValue) {
        return false;
    }

    const endDate = new Date(endDateValue);
    if (Number.isNaN(endDate.getTime())) {
        return false;
    }

    const parsedTime = parseEventTimeString(endTimeValue);
    if (parsedTime) {
        endDate.setHours(parsedTime.hours, parsedTime.minutes, parsedTime.seconds, 0);
    } else {
        endDate.setHours(23, 59, 59, 999);
    }

    return new Date() >= endDate;
};

const isOnlyCompletionPayload = (payload = {}) => {
    if (!payload || typeof payload !== "object") return false;

    const keys = Object.keys(payload);
    if (keys.length === 0) return false;

    return keys.every((key) => key === "status" || key === "completionConfirmedAt");
};

const isFinalCompletionConfirmed = (event) => {
    if (!event || typeof event !== "object") {
        return false;
    }

    if (event.completionConfirmedAt) {
        return true;
    }

    return String(event.status || "").trim().toLowerCase() === "completed"
        && Array.isArray(event.results)
        && event.results.length > 0;
};

const normalizeResultEntries = (results = []) => {
    if (!Array.isArray(results)) {
        return [];
    }

    return results.map((entry) => {
        if (!entry || typeof entry !== "object") {
            throw new Error("Each result entry must be an object.");
        }

        const participation = String(entry?.participation ?? entry?.participationType ?? "Solo").trim();
        const position = String(entry?.position ?? "1st").trim();
        const name = String(entry?.name ?? entry?.winnerName ?? "").trim();

        if (!participation) {
            throw new Error("Result participation is required.");
        }

        if (!position) {
            throw new Error("Result position is required.");
        }

        if (!name) {
            throw new Error("Winner/team name is required.");
        }

        return {
            participation,
            participationType: participation,
            position,
            name,
            winnerName: name,
        };
    });
};

export const updateEventService = async (organizerId, eventId, payload, userRole = "ORGANIZER") => {
    const normalizedPayload = { ...payload };

    if (normalizedPayload.status) {
        normalizedPayload.status = normalizeEventStatus(normalizedPayload.status);
    }

    if (Object.prototype.hasOwnProperty.call(normalizedPayload, "results")) {
        normalizedPayload.results = normalizeResultEntries(normalizedPayload.results);
    }

    if (userRole !== "ADMIN") {
        const existingEvent = await EventModel.findOne({ _id: eventId, organizerId }).lean();

        if (!existingEvent) {
            return null;
        }

        const eventIsCompleted = String(existingEvent.status || "").trim().toLowerCase() === "completed";
        const eventIsFinalCompletion = isFinalCompletionConfirmed(existingEvent);
        const requestedStatus = normalizedPayload.status ? normalizeEventStatus(normalizedPayload.status) : null;
        const allowedCompletion = requestedStatus === "completed" && isOnlyCompletionPayload(normalizedPayload);
        const isResultUpdate = Object.prototype.hasOwnProperty.call(normalizedPayload, "results");
        const isCompletionConfirmation = requestedStatus === "completed" && Object.prototype.hasOwnProperty.call(normalizedPayload, "completionConfirmedAt");
        const hasExistingResults = Array.isArray(existingEvent.results) && existingEvent.results.length > 0;

        if (requestedStatus === "completed") {
            throw new Error("Organizer manual completion is forbidden. Only admins can finalize an event.");
        }

        if (isResultUpdate && !(eventIsCompleted || eventIsFinalCompletion || hasExistingResults || isCompletionConfirmation)) {
            throw new Error("Results can only be saved after the event is finally completed.");
        }

        if ((eventIsCompleted || eventIsFinalCompletion) && !isResultUpdate && !isCompletionConfirmation && !allowedCompletion) {
            throw new Error("This event is already completed and cannot be edited or changed.");
        }

        const derivedStatus = deriveEventStatus({ ...existingEvent, ...normalizedPayload, status: normalizedPayload.status || existingEvent.status || "upcoming" });
        if (["upcoming", "live"].includes(String(existingEvent.status || "").trim().toLowerCase()) && derivedStatus === "completed") {
            normalizedPayload.status = "completed";
            normalizedPayload.completionConfirmedAt = new Date().toISOString();
        }
    }

    if (userRole === "ADMIN") {
        const updatedEvent = await EventModel.findOneAndUpdate(
            { _id: eventId },
            { $set: normalizedPayload },
            { new: true, runValidators: true }
        ).lean();

        if (!updatedEvent) {
            return null;
        }

        return updatedEvent;
    }

    const previousEvent = await EventModel.findOne({ _id: eventId, organizerId }).lean();
    const previousState = previousEvent ? normalizeStateValue(previousEvent.state) : "";

    const updatedEvent = await updateEventByIdForOrganizer(organizerId, eventId, normalizedPayload);

    if (!updatedEvent) {
        return null;
    }

    try {
        const newState = normalizeStateValue(updatedEvent.state);
        const statesToNotify = [...new Set([previousState, newState].filter(Boolean))];

        if (statesToNotify.length === 0) {
            await invalidatePublicEventsCache();
            return updatedEvent;
        }

        const notificationTitle = previousState && previousState !== newState
            ? `Event update in ${previousState}`
            : `Event update in ${newState || previousState}`;

        const oldStateUsers = previousState && previousState !== newState
            ? await getEligibleLocationStateUsers(previousState)
            : [];
        const newStateUsers = newState ? await getEligibleLocationStateUsers(newState) : [];
        const dedupedUserIds = new Set();

        const oldStateUserIds = oldStateUsers.map(({ _id }) => String(_id));
        const newStateUserIds = newStateUsers.map(({ _id }) => String(_id));

        [...oldStateUserIds, ...newStateUserIds].forEach((userId) => {
            if (userId) {
                dedupedUserIds.add(userId);
            }
        });

        const locationContext = [updatedEvent.city, updatedEvent.state].filter(Boolean).join(", ") || updatedEvent.location || "your area";
        const oldStateMessage = `${updatedEvent.title || "An event"} moved out of ${previousState} and is no longer listed there.`;
        const newStateMessage = `${updatedEvent.title || "An event"} is now live in ${locationContext}. Explore it now.`;

        for (const userId of [...dedupedUserIds]) {
            const userState = await UserModel.findById(userId).select("location").lean();
            const userSelectedState = normalizeStateValue(userState?.location?.state);

            if (previousState && previousState !== newState && userSelectedState === previousState) {
                await createNotificationService({
                    userId,
                    title: "Event update",
                    message: oldStateMessage,
                    type: "event",
                    link: `/events/${updatedEvent._id}`,
                    metadata: {
                        eventId: String(updatedEvent._id),
                        state: previousState,
                        city: updatedEvent.city || "",
                        location: updatedEvent.location || "",
                    },
                });
            }

            if (newState && userSelectedState === newState) {
                await createNotificationService({
                    userId,
                    title: notificationTitle,
                    message: newStateMessage,
                    type: "event",
                    link: `/events/${updatedEvent._id}`,
                    metadata: {
                        eventId: String(updatedEvent._id),
                        state: updatedEvent.state || "",
                        city: updatedEvent.city || "",
                        location: updatedEvent.location || "",
                    },
                });
            }
        }
    } catch (error) {
        // Do not fail event updates if notification delivery is unavailable.
    }

    await invalidatePublicEventsCache();

    return updatedEvent;
};

export const completeEventService = async (organizerId, eventId, userRole = "ORGANIZER") => {
    const query = userRole === "ADMIN"
        ? { _id: eventId }
        : { _id: eventId, organizerId };

    const existingEvent = await EventModel.findOne(query).lean();

    if (!existingEvent) {
        return null;
    }

    const currentStatus = String(existingEvent.status || "").trim().toLowerCase();
    if (currentStatus === "completed") {
        const error = new Error("This event is already completed. Use Update to confirm the final completion.");
        error.statusCode = 409;
        throw error;
    }

    const completionConfirmedAt = new Date().toISOString();

    const updatedEvent = await EventModel.findOneAndUpdate(
        query,
        { $set: { status: "completed", completionConfirmedAt } },
        { new: true, runValidators: true }
    ).lean();

    if (!updatedEvent) {
        return null;
    }

    await invalidatePublicEventsCache();

    return updatedEvent;
};

export const deleteEventService = async (organizerId, eventId, userRole = "ORGANIZER") => {
    if (userRole === "ADMIN") {
        const deletedEvent = await EventModel.findOneAndDelete({ _id: eventId }).lean();

        if (!deletedEvent) {
            return null;
        }

        return deletedEvent;
    }

    const deletedEvent = await deleteEventByIdForOrganizer(organizerId, eventId);

    if (!deletedEvent) {
        return null;
    }

    await invalidatePublicEventsCache();

    return deletedEvent;
};
