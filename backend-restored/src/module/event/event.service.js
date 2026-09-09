import EventModel from "../../model/event.model.js";
import { getRedisClient } from "../../config/redis.js";
import {
    createEvent,
    deleteEventByIdForOrganizer,
    getEventByIdForOrganizer,
    getEventsByOrganizer,
    updateEventByIdForOrganizer,
} from "../../dao/event.dao.js";

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

    return event.toObject();
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

            const result = normalizeDefaultPublicEventsResult(events, total, page, limit);

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

            result = {
                events,
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

export const getPublicEventByIdService = async (eventId) =>
    EventModel.findById(eventId).lean();

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

export const getOrganizerEventsService = (organizerId) =>
    getEventsByOrganizer(organizerId);

export const getOrganizerEventByIdService = (organizerId, eventId, userRole = "ORGANIZER") => {
    if (userRole === "ADMIN") {
        return EventModel.findOne({ _id: eventId }).lean();
    }

    return getEventByIdForOrganizer(organizerId, eventId);
};

export const updateEventService = async (organizerId, eventId, payload, userRole = "ORGANIZER") => {
    const normalizedPayload = { ...payload };

    if (normalizedPayload.status) {
        normalizedPayload.status = (() => {
            const lower = String(normalizedPayload.status).trim().toLowerCase();
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
        })();
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

    const updatedEvent = await updateEventByIdForOrganizer(organizerId, eventId, normalizedPayload);

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
