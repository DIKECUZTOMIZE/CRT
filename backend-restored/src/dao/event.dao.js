import EventModel, { deriveEventStatus } from "../model/event.model.js";

const normalizeManualStatus = (value) => {
    if (typeof value !== "string") return value;

    const normalized = value.trim().toLowerCase();
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

    return aliases[normalized] ?? normalized;
};

export const buildExpectedEventStateFilter = (event) => {
    const filter = {};

    for (const key of ["status", "completionConfirmedAt"]) {
        if (!Object.prototype.hasOwnProperty.call(event, key) || event[key] === undefined) {
            filter[key] = { $exists: false };
        } else if (event[key] === null) {
            filter[key] = { $exists: true, $eq: null };
        } else {
            filter[key] = event[key];
        }
    }

    return filter;
};

export const createEvent = (eventData) => {
    const statusValue = typeof eventData?.status === "string" ? eventData.status.trim() : "";
    const rawStatus = normalizeManualStatus(statusValue || "");
    const isExplicitManualStatus = ["upcoming", "live", "completed", "ended", "cancelled", "postponed"].includes(rawStatus);
    const nextStatus = isExplicitManualStatus && rawStatus !== "upcoming"
        ? rawStatus
        : deriveEventStatus({ ...eventData, status: rawStatus || "upcoming" });

    return EventModel.create({ ...eventData, status: nextStatus });
};

export const updateEventByIdForOrganizer = async (organizerId, eventId, eventData, expectedEventState = null) => {
    const nextPayload = { ...eventData };
    if (nextPayload.status) {
        nextPayload.status = normalizeManualStatus(nextPayload.status);
    }

    const filter = { _id: eventId, organizerId };
    if (expectedEventState) {
        Object.assign(filter, buildExpectedEventStateFilter(expectedEventState));
    }

    return EventModel.findOneAndUpdate(
        filter,
        { $set: nextPayload },
        { new: true, runValidators: true }
    ).lean();
};

export const getEventsByOrganizer = async (organizerId) => {
    const events = await EventModel.find({ organizerId })
        .sort({ createdAt: -1 })
        .lean();

    return events.map((event) => ({
        ...event,
        status: deriveEventStatus(event),
    }));
};

export const getEventByIdForOrganizer = async (organizerId, eventId) => {
    const event = await EventModel.findOne({ _id: eventId, organizerId }).lean();
    if (!event) return null;

    return {
        ...event,
        status: deriveEventStatus(event),
    };
};

export const deleteEventByIdForOrganizer = (organizerId, eventId) =>
    EventModel.findOneAndDelete({ _id: eventId, organizerId })
        .lean();
