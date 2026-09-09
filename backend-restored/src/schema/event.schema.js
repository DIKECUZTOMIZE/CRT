import { z } from "zod";

const optionalText = (max = 500) =>
    z.string().trim().max(max).optional().or(z.literal(""));

const optionalNumber = z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
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
    amount: optionalNumber,
    reward: optionalText(300),
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
    seatAvailability: optionalText(50),
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
    eventRules: z.array(ruleSchema).max(100).default([]),
    securityRequirements: z.array(ruleSchema).max(100).default([]),
    participationSteps: z
        .array(z.object({ text: optionalText(500) }))
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
    statusReason: optionalText(500),
}).strict();

export const createEventSchema = z.object({
    body: eventBaseSchema,
});

export const updateEventSchema = z.object({
    body: eventBaseSchema.partial(),
    params: z.object({
        id: z.string().trim().min(1),
    }),
});
