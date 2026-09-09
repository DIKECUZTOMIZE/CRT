import pino from "pino";

import env from "./env.js";

const isDevelopment = env.NODE_ENV === "development";

export const logger = pino({
    level: env.LOGGER_LEVEL,

    ...(isDevelopment && {
        transport: {
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: "SYS:standard",
                ignore: "pid,hostname",
            },
        },
    }),

    base: {
        service: "api",
    },

    timestamp: pino.stdTimeFunctions.isoTime,
});