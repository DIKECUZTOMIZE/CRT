import mongoose from "mongoose";

import config from "./config.js";
import { logger } from "./logger.js";

const MAX_DB_RETRIES = 8;
const RETRY_DELAY_MS = 2000;

const shouldRetryMongo = (error) => {
    const message = String(error?.message || "");
    const name = String(error?.name || "");

    return (
        name.includes("MongooseServerSelectionError") ||
        name.includes("MongoServerSelectionError") ||
        name.includes("MongoNetworkError") ||
        message.includes("EAI_AGAIN") ||
        message.includes("timed out") ||
        message.includes("connection") ||
        message.includes("ECONNRESET")
    );
};

const connectDB = async (retryCount = 0) => {
    try {
        await mongoose.connect(config.database.mongoUri, {
            serverSelectionTimeoutMS: 10000,
        });

        logger.info(
            "MongoDB connected successfully"
        );
    } catch (error) {
        if (retryCount < MAX_DB_RETRIES && shouldRetryMongo(error)) {
            const delayMs = RETRY_DELAY_MS * (retryCount + 1);

            logger.warn(
                {
                    retryCount: retryCount + 1,
                    maxRetries: MAX_DB_RETRIES,
                    delayMs,
                    error: error.message,
                },
                "MongoDB unavailable, retrying connection"
            );

            await new Promise((resolve) => setTimeout(resolve, delayMs));
            return connectDB(retryCount + 1);
        }

        logger.error(
            { error },
            "MongoDB connection failed"
        );

        throw error;
    }
};

export const closeDB = async () => {
    if (mongoose.connection.readyState === 0) {
        return;
    }

    await mongoose.connection.close();

    logger.info(
        "MongoDB connection closed"
    );
};

export default connectDB;