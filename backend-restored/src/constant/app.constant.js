import fs from "node:fs";

const isRunningInContainer =
    process.env.DOCKER_CONTAINER === "true" ||
    process.env.IS_DOCKER === "true" ||
    fs.existsSync("/.dockerenv");

const defaultRedisUrl = isRunningInContainer ? "redis://redis:6379" : "redis://localhost:6379";

const appConstant = Object.freeze({
    PORT: 8000,

    MONGO_URL: "mongodb://localhost:27017",

    REDIS_URL: defaultRedisUrl,

    NODE_ENV: "development",

    LOGGER_LEVEL: "info",

    RATELIMIT_WINDOW_MS: 15 * 60 * 1000,

    RATELIMIT: 100,
});

export default appConstant;