import { z } from "zod";

const optionalText = (max = 500) =>
    z.string().trim().max(max).optional().or(z.literal(""));

const optionalNumber = z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().min(0).optional()
);

const optionalPrizeAmount = z.preprocess(
    (value) =>
        value === null || (typeof value === "string" && value.trim() === "")
            ? undefined
            : value,
    z.coerce.number().min(0).optional()
);

const optionalDate = z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.date().optional()
);

const booleanFromFlag = z.preprocess(
    (value) => value === true || value === "Yes" || value === "true",
    z.boolean()
);

const scheduleSchema = z.object({
    type: optionalText(80),
    customType: optionalText(80),
    date: optionalText(30),
    time: optionalText(30),
});

const entrySchema = z.object({
    name: optionalText(100),
    category: optionalText(100),
    customName: optionalText(100),
    participationType: optionalText(40),
    isPaid: z.enum(["Yes", "No"]).default("No"),
    price: optionalNumber,
});

const prizeSchema = z.object({
    category: optionalText(100),
    customTitle: optionalText(150),
    position: z.string().trim().max(80).optional(),
    amount: optionalPrizeAmount,
    reward: optionalText(300),
});

const resultEntrySchema = z.object({
    participation: optionalText(40).default("Solo"),
    participationType: optionalText(40).default("Solo"),
    position: z.string().trim().min(1).max(80).default("1st"),
    name: optionalText(150).default(""),
    winnerName: optionalText(150).default(""),
}).strict().transform((entry) => {
    const participation = (entry.participation ?? entry.participationType ?? "Solo").trim() || "Solo";
    const position = (entry.position ?? "1st").trim() || "1st";
    const name = (entry.name ?? entry.winnerName ?? "").trim();

    return {
        ...entry,
        participation,
        participationType: participation,
        position,
        name,
        winnerName: name,
    };
});

const ruleSchema = z.object({
    type: optionalText(80),
    text: optionalText(500),
});

const customFieldSchema = z.object({
    fieldName: z.string().trim().max(100),
    fieldType: z.enum(["text", "number", "url", "dropdown"]).default("text"),
    isRequired: booleanFromFlag.default(false),
});

const organizerSchema = z.object({
    name: optionalText(100),
    role: optionalText(100),
    contact: optionalText(100),
});

const participationSchema = z.object({
    enabled: booleanFromFlag.default(false),
    mode: optionalText(40),
    minTeamSize: optionalNumber,
    maxTeamSize: optionalNumber,
});

const statusSchema = z.preprocess(
    (value) => {
        if (typeof value !== "string") return value;
        const normalized = value.trim().toLowerCase();
        const aliases = {
            complete: "completed",
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
    },
    z.enum(["live", "upcoming", "completed", "ended", "cancelled", "postponed"]).default("upcoming")
);

const seatAvailabilityValues = ["Available", "Not Available", "Other"];

const validateCustomSeatDetails = (event, context) => {
    if (event.seatAvailability === "Other" && !event.customSeatDetails?.trim()) {
        context.addIssue({
            code: "custom",
            path: ["customSeatDetails"],
            message: "Custom availability details are required",
        });
    }
};

const getEventDateKey = (value) => {
    if (typeof value !== "string") return null;
    const match = value.match(/^(\d{4}-\d{2}-\d{2})(?:$|T)/);
    return match?.[1] ?? null;
};

const parseTimeToSeconds = (value) => {
    if (typeof value !== "string") return null;

    const trimmed = value.trim();
    const meridiemMatch = trimmed.match(
        /^([0-9]{1,2}):([0-5][0-9])(?::([0-5][0-9]))?\s*([AaPp][Mm])$/
    );

    if (meridiemMatch) {
        let hours = Number(meridiemMatch[1]);
        const minutes = Number(meridiemMatch[2]);
        const seconds = Number(meridiemMatch[3] ?? 0);
        const meridiem = meridiemMatch[4].toUpperCase();

        if (hours < 1 || hours > 12) return null;
        if (meridiem === "AM" && hours === 12) hours = 0;
        if (meridiem === "PM" && hours !== 12) hours += 12;

        return hours * 3600 + minutes * 60 + seconds;
    }

    const twentyFourHourMatch = trimmed.match(
        /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?$/
    );
    if (!twentyFourHourMatch) return null;

    return (
        Number(twentyFourHourMatch[1]) * 3600 +
        Number(twentyFourHourMatch[2]) * 60 +
        Number(twentyFourHourMatch[3] ?? 0)
    );
};

const validateEventDateTime = (event, context) => {
    const startDate = getEventDateKey(event.eventDate);
    const endDate = getEventDateKey(event.eventEndDate);

    if (startDate && endDate && endDate < startDate) {
        context.addIssue({
            code: "custom",
            path: ["eventEndDate"],
            message: "Event end date must be on or after the start date",
        });
        return;
    }

    if (!startDate || startDate !== endDate) return;

    const startSeconds = parseTimeToSeconds(event.eventStartTime);
    const endSeconds = parseTimeToSeconds(event.eventEndTime);
    if (startSeconds === null || endSeconds === null || endSeconds >= startSeconds) {
        return;
    }

    context.addIssue({
        code: "custom",
        path: ["eventEndTime"],
        message: "Event end time must be on or after the start time on the same date",
    });
};

const validateEventDates = (event, context) => {
    validateCustomSeatDetails(event, context);
    validateEventDateTime(event, context);
};

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Event dates/times are entered in IST, so compare in IST regardless of server timezone.
const validateStartNotInPast = (event, context) => {
    const dateMatch = getEventDateKey(event.eventDate)?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!dateMatch) return;

    const dayStart =
        Date.UTC(Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3])) - IST_OFFSET_MS;
    const startSeconds = parseTimeToSeconds(event.eventStartTime);
    const isPast = startSeconds === null
        ? dayStart + DAY_MS <= Date.now()
        : dayStart + startSeconds * 1000 < Date.now();

    if (isPast) {
        context.addIssue({
            code: "custom",
            path: ["eventDate"],
            message: "Event start date and time cannot be in the past",
        });
    }
};

const validateCreateEventDates = (event, context) => {
    validateEventDates(event, context);
    validateStartNotInPast(event, context);
};

const eventBaseSchema = z.object({
    title: z.string().trim().min(3).max(120),
    category: z.string().trim().min(1).max(80),
    tagline: optionalText(240),
    description: optionalText(5000),
    bannerUrl: optionalText(1000),
    cardImageUrl: optionalText(1000),
    eventMode: z.enum(["Offline", "Online", "Hybrid"]),
    state: optionalText(120),
    district: optionalText(120),
    city: optionalText(120),
    location: optionalText(240),
    venueAddress: optionalText(500),
    pinCode: optionalText(20),
    onlineLink: optionalText(1000),
    eventDate: optionalText(30),
    eventEndDate: optionalText(30),
    eventStartTime: optionalText(30),
    eventEndTime: optionalText(30),
    eventTime: optionalText(30),
    registrationStart: optionalDate,
    registrationEnd: optionalDate,
    eventStart: optionalDate,
    eventEnd: optionalDate,
    seatAvailability: z.enum(seatAvailabilityValues),
    totalSeats: z.preprocess(
        (value) => (value === "" || value === null ? undefined : value),
        z.coerce.number().int().min(1).optional()
    ),
    customSeatDetails: optionalText(500),
    schedules: z.array(scheduleSchema).max(50).default([]),
    entries: z.array(entrySchema).max(50).default([]),
    participation: participationSchema.optional(),
    totalPrizePool: optionalNumber,
    prizes: z.array(prizeSchema).max(50).default([]),
    results: z.array(resultEntrySchema).max(50).default([]),
    eventRules: z.array(ruleSchema).max(100).default([]),
    securityRequirements: z.array(ruleSchema).max(100).default([]),
    participationSteps: z
        .array(z.object({
            title: optionalText(500),
            text: optionalText(500),
        }))
        .max(100)
        .default([]),
    customFields: z.array(customFieldSchema).max(30).default([]),
    organizerTeam: z.array(organizerSchema).max(30).default([]),
    organizerContact: z
        .object({
            name: optionalText(100),
            whatsapp: optionalText(40),
        })
        .optional(),
    status: statusSchema,
    completionConfirmedAt: optionalDate,
    statusReason: optionalText(500),
}).strict();

export const createEventSchema = z.object({
    body: eventBaseSchema.superRefine(validateCreateEventDates),
});

const updateEventBaseSchema = eventBaseSchema
    .omit({ results: true })
    .extend({
        results: z.array(resultEntrySchema).max(50).optional(),
        // Updates must not receive injected defaults, otherwise absent keys look like extra changes.
        schedules: eventBaseSchema.shape.schedules.unwrap().optional(),
        entries: eventBaseSchema.shape.entries.unwrap().optional(),
        prizes: eventBaseSchema.shape.prizes.unwrap().optional(),
        eventRules: eventBaseSchema.shape.eventRules.unwrap().optional(),
        securityRequirements: eventBaseSchema.shape.securityRequirements.unwrap().optional(),
        participationSteps: eventBaseSchema.shape.participationSteps.unwrap().optional(),
        customFields: eventBaseSchema.shape.customFields.unwrap().optional(),
        organizerTeam: eventBaseSchema.shape.organizerTeam.unwrap().optional(),
    });

export const updateEventSchema = z.object({
    body: updateEventBaseSchema.partial().superRefine(validateEventDates),
    params: z.object({
        id: z.string().trim().min(1),
    }),
});
