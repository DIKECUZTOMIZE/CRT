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

export const createEvent = (eventData) => {
    const statusValue = typeof eventData?.status === "string" ? eventData.status.trim() : "";
    const rawStatus = normalizeManualStatus(statusValue || "");
    const isExplicitManualStatus = ["upcoming", "live", "completed", "ended", "cancelled", "postponed"].includes(rawStatus);
    const nextStatus = isExplicitManualStatus && rawStatus !== "upcoming"
        ? rawStatus
        : deriveEventStatus({ ...eventData, status: rawStatus || "upcoming" });

    return EventModel.create({ ...eventData, status: nextStatus });
};

export const updateEventByIdForOrganizer = async (organizerId, eventId, eventData) => {
    const nextPayload = { ...eventData };
    if (nextPayload.status) {
        nextPayload.status = normalizeManualStatus(nextPayload.status);
    }

    return EventModel.findOneAndUpdate(
        { _id: eventId, organizerId },
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
