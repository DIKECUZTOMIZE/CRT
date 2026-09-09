import { Queue } from "bullmq";
import IORedis from "ioredis";

import env from "./env.js";
import { logger } from "./logger.js";

const isRedisDisabled = env.NODE_ENV === "test" || process.argv.some((arg) => arg === "--test" || arg.includes("node:test")) || process.execArgv.some((arg) => arg.includes("--test") || arg.includes("node:test"));

const noopQueue = (name) => ({
  name,
  add: async () => ({ id: `noop-${name}-${Date.now()}` }),
  close: async () => undefined,
  pause: async () => undefined,
  resume: async () => undefined,
});

const connection = isRedisDisabled
  ? null
  : new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });

if (connection) {
  connection.on("error", (error) => {
    logger.error({ error }, "Redis connection error for BullMQ");
  });
}

export const emailQueue = isRedisDisabled ? noopQueue("email") : new Queue("email", { connection });
export const notificationQueue = isRedisDisabled ? noopQueue("notifications") : new Queue("notifications", { connection });
export const mediaQueue = isRedisDisabled ? noopQueue("media-processing") : new Queue("media-processing", { connection });

export const closeBullMQ = async () => {
  try {
    if (!connection) {
      return;
    }

    await emailQueue.close();
    await notificationQueue.close();
    await mediaQueue.close();
    await connection.quit();
  } catch (error) {
    logger.warn({ error }, "BullMQ shutdown warning");
  }
};
