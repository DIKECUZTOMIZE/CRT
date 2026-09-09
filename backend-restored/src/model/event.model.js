import mongoose from "mongoose";

const normalizeStatusValue = (value) => {
    if (typeof value !== "string") return value;

    const normalized = value.trim().toLowerCase();
    const aliases = {
        complete: "completed",
        completee: "completed",
        completed: "completed",
        end: "ended",
        ended: "ended",
        cancel: "cancelled",
        cancelled: "cancelled",
        canceled: "cancelled",
        popond: "postponed",
        pospond: "postponed",
        postpon: "postponed",
        postpond: "postponed",
        postponed: "postponed",
    };

    return aliases[normalized] ?? normalized;
};

const parseEventDate = (value) => {
    if (!value) return null;

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return null;

        const parsed = new Date(trimmed);
        if (!Number.isNaN(parsed.getTime())) return parsed;
    }

    return null;
};

const parseTimeValue = (value) => {
    if (!value || typeof value !== "string") return null;

    const trimmed = value.trim();
    if (!trimmed) return null;

    const meridiemMatch = trimmed.match(/^([0-9]{1,2}):([0-9]{2})\s*([AaPp][Mm])$/);
    if (meridiemMatch) {
        let hours = Number(meridiemMatch[1]);
        const minutes = Number(meridiemMatch[2]);
        const meridiem = meridiemMatch[3].toUpperCase();

        if (meridiem === "AM" && hours === 12) hours = 0;
        if (meridiem === "PM" && hours !== 12) hours += 12;

        return new Date(0, 0, 0, hours, minutes, 0);
    }

    const standardMatch = trimmed.match(/^([0-9]{1,2}):([0-9]{2})$/);
    if (standardMatch) {
        const hours = Number(standardMatch[1]);
        const minutes = Number(standardMatch[2]);
        return new Date(0, 0, 0, hours, minutes, 0);
    }

    return null;
};

const combineDateTime = (dateValue, timeValue) => {
    const baseDate = parseEventDate(dateValue);
    if (!baseDate) return null;

    const baseTime = parseTimeValue(timeValue);
    if (!baseTime) return baseDate;

    const result = new Date(baseDate);
    result.setHours(baseTime.getHours(), baseTime.getMinutes(), 0, 0);
    return result;
};

export const deriveEventStatus = (eventData = {}) => {
    const incomingStatus = normalizeStatusValue(eventData.status);

    if (["cancelled", "postponed", "upcoming", "live", "completed", "ended"].includes(incomingStatus)) {
        return incomingStatus;
    }

    if (incomingStatus === undefined || incomingStatus === null || incomingStatus === "") {
        return "upcoming";
    }

    const hasExplicitDateWindow = Boolean(
        eventData.eventDate || eventData.eventEndDate || eventData.eventStart || eventData.eventEnd
    );

    const startDate = combineDateTime(
        eventData.eventDate || eventData.eventStart || eventData.registrationStart,
        eventData.eventStartTime || eventData.eventTime
    );

    const endDate = combineDateTime(
        eventData.eventEndDate || eventData.eventEnd || eventData.eventDate || eventData.eventStart,
        eventData.eventEndTime || eventData.eventTime || eventData.eventStartTime
    );

    if (!startDate && !endDate) {
        return "upcoming";
    }

    if (endDate && !eventData.eventEndTime && !eventData.eventTime && !eventData.eventStartTime) {
        endDate.setHours(23, 59, 59, 999);
    }

    const now = new Date();

    if (endDate && now > endDate) {
        return "completed";
    }

    if (startDate && now >= startDate && endDate && now < endDate) {
        return "live";
    }

    if (startDate && now < startDate) {
        return "upcoming";
    }

    if (!hasExplicitDateWindow) {
        return "upcoming";
    }

    return "upcoming";
};

const scheduleSchema = new mongoose.Schema(
    {
        type: { type: String, trim: true, maxlength: 80 },
        customType: { type: String, trim: true, maxlength: 80 },
        date: { type: String, trim: true, maxlength: 30 },
        time: { type: String, trim: true, maxlength: 30 },
    },
    { _id: false }
);

const entrySchema = new mongoose.Schema(
    {
        name: { type: String, trim: true, maxlength: 100 },
        category: { type: String, trim: true, maxlength: 100 },
        customName: { type: String, trim: true, maxlength: 100 },
        participationType: { type: String, trim: true, maxlength: 40 },
        isPaid: { type: String, enum: ["Yes", "No"], default: "No" },
        price: { type: Number, min: 0, default: 0 },
    },
    { _id: false }
);

const prizeSchema = new mongoose.Schema(
    {
        category: { type: String, trim: true, maxlength: 100 },
        customTitle: { type: String, trim: true, maxlength: 150 },
        position: { type: String, trim: true, maxlength: 80 },
        amount: { type: Number, min: 0 },
        reward: { type: String, trim: true, maxlength: 300 },
    },
    { _id: false }
);

const ruleSchema = new mongoose.Schema(
    {
        type: { type: String, trim: true, maxlength: 80 },
        text: { type: String, trim: true, maxlength: 500 },
    },
    { _id: false }
);

const customFieldSchema = new mongoose.Schema(
    {
        fieldName: { type: String, trim: true, maxlength: 100 },
        fieldType: {
            type: String,
            enum: ["text", "number", "url", "dropdown"],
            default: "text",
        },
        isRequired: { type: Boolean, default: false },
    },
    { _id: false }
);

const organizerSchema = new mongoose.Schema(
    {
        name: { type: String, trim: true, maxlength: 100 },
        role: { type: String, trim: true, maxlength: 100 },
        contact: { type: String, trim: true, maxlength: 100 },
    },
    { _id: false }
);

const eventSchema = new mongoose.Schema(
    {
        organizerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true,
            index: true,
        },
        title: { type: String, required: true, trim: true, maxlength: 120 },
        category: { type: String, required: true, trim: true, maxlength: 80 },
        tagline: { type: String, trim: true, maxlength: 240 },
        description: { type: String, trim: true, maxlength: 5000 },
        bannerUrl: { type: String, trim: true, maxlength: 1000 },
        cardImageUrl: { type: String, trim: true, maxlength: 1000 },
        eventMode: {
            type: String,
            enum: ["Offline", "Online", "Hybrid"],
            required: true,
        },
        state: { type: String, trim: true, maxlength: 120 },
        district: { type: String, trim: true, maxlength: 120 },
        city: { type: String, trim: true, maxlength: 120 },
        location: { type: String, trim: true, maxlength: 240 },
        venueAddress: { type: String, trim: true, maxlength: 500 },
        pinCode: { type: String, trim: true, maxlength: 20 },
        onlineLink: { type: String, trim: true, maxlength: 1000 },
        eventDate: { type: String, trim: true, maxlength: 30 },
        eventEndDate: { type: String, trim: true, maxlength: 30 },
        eventStartTime: { type: String, trim: true, maxlength: 30 },
        eventEndTime: { type: String, trim: true, maxlength: 30 },
        eventTime: { type: String, trim: true, maxlength: 30 },
        registrationStart: { type: Date },
        registrationEnd: { type: Date },
        eventStart: { type: Date },
        eventEnd: { type: Date },
        seatAvailability: { type: String, trim: true, maxlength: 50 },
        totalSeats: { type: Number, min: 1 },
        viewsCount: { type: Number, min: 0, default: 0 },
        avgRating: { type: Number, min: 0, max: 5, default: 0 },
        ratingsCount: { type: Number, min: 0, default: 0 },
        ratings: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "users",
                required: true,
            },
            value: { type: Number, min: 1, max: 5, required: true },
            createdAt: { type: Date, default: Date.now },
        }],
        customSeatDetails: { type: String, trim: true, maxlength: 500 },
        schedules: { type: [scheduleSchema], default: [] },
        entries: { type: [entrySchema], default: [] },
        participation: {
            enabled: { type: Boolean, default: false },
            mode: { type: String, trim: true, maxlength: 40 },
            minTeamSize: { type: Number, min: 2 },
            maxTeamSize: { type: Number, min: 2 },
        },
        totalPrizePool: { type: Number, min: 0 },
        prizes: { type: [prizeSchema], default: [] },
        eventRules: { type: [ruleSchema], default: [] },
        securityRequirements: { type: [ruleSchema], default: [] },
        participationSteps: {
            type: [{ text: { type: String, trim: true, maxlength: 500 } }],
            default: [],
        },
        customFields: { type: [customFieldSchema], default: [] },
        organizerTeam: { type: [organizerSchema], default: [] },
        organizerContact: {
            name: { type: String, trim: true, maxlength: 100 },
            whatsapp: { type: String, trim: true, maxlength: 40 },
        },
        status: {
            type: String,
            enum: ["live", "upcoming", "completed", "ended", "cancelled", "postponed"],
            default: "upcoming",
            set: (value) => normalizeStatusValue(value),
            index: true,
        },
        statusReason: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },
    },
    { timestamps: true }
);

eventSchema.index({ status: 1, createdAt: -1 });
eventSchema.index({ organizerId: 1, status: 1, createdAt: -1 });
eventSchema.index({ category: 1, status: 1, createdAt: -1 });
eventSchema.index({ status: 1, category: 1, createdAt: -1 });
eventSchema.index({ eventStart: 1, status: 1, createdAt: -1 });
eventSchema.index({ eventEnd: 1, status: 1, createdAt: -1 });
eventSchema.index({ state: 1, city: 1, status: 1, createdAt: -1 });
eventSchema.index({ status: 1, city: 1, state: 1, createdAt: -1 });
eventSchema.index({ status: 1, eventStart: 1, createdAt: -1 });

const EventModel = mongoose.model("events", eventSchema);

export default EventModel;
