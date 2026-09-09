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
    const rawStatus = normalizeManualStatus(eventData.status || "upcoming");
    const isManualStatus = ["upcoming", "live", "completed", "ended", "cancelled", "postponed"].includes(rawStatus);
    const nextStatus = isManualStatus ? rawStatus : "upcoming";

    return EventModel.create({ ...eventData, status: nextStatus });
};

export const updateEventByIdForOrganizer = async (organizerId, eventId, eventData) => {
    const nextPayload = { ...eventData };
    if (nextPayload.status) {
        nextPayload.status = deriveEventStatus({ ...nextPayload, status: nextPayload.status });
    }

    return EventModel.findOneAndUpdate(
        { _id: eventId, organizerId },
        { $set: nextPayload },
        { new: true, runValidators: true }
    ).lean();
};

export const getEventsByOrganizer = (organizerId) =>
    EventModel.find({ organizerId })
        .sort({ createdAt: -1 })
        .lean();

export const getEventByIdForOrganizer = (organizerId, eventId) =>
    EventModel.findOne({ _id: eventId, organizerId })
        .lean();

export const deleteEventByIdForOrganizer = (organizerId, eventId) =>
    EventModel.findOneAndDelete({ _id: eventId, organizerId })
        .lean();
