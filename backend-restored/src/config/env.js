import "dotenv/config";
import { z } from "zod";

import appConstant from "../constant/app.constant.js";

const isTestExecution =
    process.env.NODE_ENV === "test" ||
    process.argv.some((arg) => arg === "--test" || arg.includes("node:test") || arg === "test") ||
    process.execArgv.some((arg) => arg.includes("--test") || arg.includes("node:test"));

if (isTestExecution) {
    process.env.NODE_ENV ??= "test";
}

const trimAndFilter = (value) => {
    if (Array.isArray(value)) {
        return value
            .map((item) => String(item).trim())
            .filter(Boolean);
    }

    if (typeof value !== "string") {
        return [];
    }

    return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
};

const parseBoolean = (value) => {
    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "string") {
        return value.trim().toLowerCase() === "true";
    }

    return false;
};

const schema = z.object({
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default(appConstant.NODE_ENV),

    PORT: z.coerce
        .number()
        .int()
        .min(1)
        .max(65535)
        .default(appConstant.PORT),

    MONGO_URI: z
        .string()
        .trim()
        .min(1, "MONGO_URI is required")
        .default(appConstant.MONGO_URL),

    REDIS_URL: z
        .string()
        .trim()
        .url("REDIS_URL must be a valid URL")
        .default(appConstant.REDIS_URL),

    LOGGER_LEVEL: z
        .enum(["fatal", "error", "warn", "info", "debug", "trace"])
        .default(appConstant.LOGGER_LEVEL),

    RATELIMIT_WINDOW_MS: z.coerce
        .number()
        .int()
        .positive()
        .default(appConstant.RATELIMIT_WINDOW_MS),

    RATELIMIT: z.coerce
        .number()
        .int()
        .positive()
        .default(appConstant.RATELIMIT),

    CORS_ORIGIN: z
        .string()
        .trim()
        .min(1, "CORS_ORIGIN is required")
        .default("http://localhost:5173,http://localhost:5174,http://localhost:5175"),

    FRONTEND_URL: z
        .string()
        .trim()
        .url("FRONTEND_URL must be a valid URL")
        .optional()
        .default("http://localhost:5173"),

    ADMIN_FRONTEND_URL: z
        .string()
        .trim()
        .url("ADMIN_FRONTEND_URL must be a valid URL")
        .optional()
        .default("http://localhost:5174"),

    ORGANIZER_FRONTEND_URL: z
        .string()
        .trim()
        .url("ORGANIZER_FRONTEND_URL must be a valid URL")
        .optional()
        .default("http://localhost:5175"),

    ACCESS_TOKEN_SECRET: z
        .string()
        .trim()
        .min(32, "ACCESS_TOKEN_SECRET must be at least 32 characters"),

    REFRESH_TOKEN_SECRET: z
        .string()
        .trim()
        .min(32, "REFRESH_TOKEN_SECRET must be at least 32 characters"),

    ADMIN_REGISTRATION_KEY: z
        .string()
        .trim()
        .min(16, "ADMIN_REGISTRATION_KEY must be at least 16 characters")
        .optional(),

    GOOGLE_CLIENT_ID: z
        .string()
        .trim()
        .optional()
        .default(""),

    GOOGLE_CLIENT_SECRET: z
        .string()
        .trim()
        .optional()
        .default(""),

    GOOGLE_CALLBACK_URL: z
        .string()
        .trim()
        .url("GOOGLE_CALLBACK_URL must be a valid URL")
        .optional()
        .default("http://localhost:3000/api/auth/google/callback"),

    CLOUDINARY_CLOUD_NAME: z
        .string()
        .trim()
        .optional()
        .default(""),

    CLOUDINARY_API_KEY: z
        .string()
        .trim()
        .optional()
        .default(""),

    CLOUDINARY_API_SECRET: z
        .string()
        .trim()
        .optional()
        .default(""),

    SMTP_HOST: z
        .string()
        .trim()
        .optional()
        .default(""),

    SMTP_PORT: z.coerce
        .number()
        .int()
        .positive()
        .optional()
        .default(587),

    SMTP_SECURE: z
        .union([
            z.boolean(),
            z.string().transform(parseBoolean),
        ])
        .optional()
        .default(false),

    SMTP_USER: z
        .string()
        .trim()
        .optional()
        .default(""),

    SMTP_PASS: z
        .string()
        .trim()
        .optional()
        .default(""),

    SMTP_FROM: z
        .string()
        .trim()
        .optional()
        .default(""),
});

const result = schema.safeParse(process.env);

if (!result.success) {
    console.error("❌ Invalid environment variables:");
    for (const issue of result.error.issues) {
        const field = issue.path.length ? issue.path.join(".") : "environment";
        console.error(`- ${field}: ${issue.message}`);
    }
    process.exit(1);
}

const env = result.data;

export const getCorsOrigins = () => trimAndFilter(env.CORS_ORIGIN);
export default env;