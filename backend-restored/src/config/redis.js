import { createClient } from "redis";

import env from "./env.js";
import { logger } from "./logger.js";

let redisClient = null;

const noopRedisClient = {
    isOpen: false,
    connected: false,
    async connect() {
        return this;
    },
    async quit() {
        return this;
    },
    async set() {
        return "OK";
    },
    async get() {
        return null;
    },
    async del() {
        return 0;
    },
};

const isRedisTestMode = env.NODE_ENV === "test" || process.argv.some((arg) => arg === "--test" || arg.includes("node:test")) || process.execArgv.some((arg) => arg.includes("--test") || arg.includes("node:test"));

export const connectRedis = async () => {
    if (isRedisTestMode) {
        redisClient = { ...noopRedisClient };
        logger.warn("Redis disabled for test environment");
        return redisClient;
    }

    if (redisClient?.isOpen) {
        return redisClient;
    }

    redisClient = createClient({
        url: env.REDIS_URL,

        socket: {
            reconnectStrategy: (retries) => {
                const delay = Math.min(retries * 100, 3000);

                logger.warn(
                    { retries, delay },
                    "Redis reconnecting..."
                );

                return delay;
            },
        },
    });

    redisClient.on("connect", () => {
        logger.info("Redis connecting...");
    });

    redisClient.on("ready", () => {
        logger.info("Redis connected and ready");
    });

    redisClient.on("error", (error) => {
        logger.error(
            { error },
            "Redis error"
        );
    });

    redisClient.on("reconnecting", () => {
        logger.warn("Redis reconnecting...");
    });

    redisClient.on("end", () => {
        logger.warn("Redis connection closed");
    });

    try {
        await redisClient.connect();
        return redisClient;
    } catch (error) {
        logger.warn({ error }, "Redis not available; continuing without Redis in local/test mode");
        redisClient = { ...noopRedisClient };
        return redisClient;
    }
};

export const getRedisClient = () => {
    if (!redisClient || !redisClient.isOpen) {
        return noopRedisClient;
    }

    return redisClient;
};

export const closeRedis = async () => {
    if (!redisClient || !redisClient.isOpen) {
        return;
    }

    await redisClient.quit();

    logger.info("Redis connection closed");
};

export default getRedisClient;