import http from "node:http";
import { pathToFileURL } from "node:url";

import createApp from "./src/app.js";
import connectDB, { closeDB } from "./src/config/database.js";

import env from "./src/config/env.js";
import { logger } from "./src/config/logger.js";
import UserModel from "./src/model/user.model.js";
import setupSocket from "./src/socket/socket.server.js";
import { connectRedis, closeRedis } from "./src/config/redis.js";
import emailWorker from "./src/worker/email.worker.js";
import { getPublicEventsService } from "./src/module/event/event.service.js";

let server;
let io;
let isShuttingDown = false;

const DEFAULT_SEED_USERS = [
    {
        username: "admin",
        email: "admin@crt.com",
        password: "Admin@123456",
        role: "ADMIN",
    },
    {
        username: "organizer",
        email: "organizer@crt.com",
        password: "Organizer@123456",
        role: "ORGANIZER",
    },
];

const shouldSeedDefaultUsers = () => {
    if (env.NODE_ENV === "production") {
        return false;
    }

    return String(process.env.SEED_DEFAULT_USERS || "false").toLowerCase() === "true";
};

const seedDefaultUsers = async () => {
    if (!shouldSeedDefaultUsers()) {
        return;
    }

    for (const userData of DEFAULT_SEED_USERS) {
        const existingUser = await UserModel.findOne({ email: userData.email });

        if (existingUser) {
            continue;
        }

        await UserModel.create(userData);
        logger.info(
            { email: userData.email, role: userData.role },
            "Seeded default user"
        );
    }
};

/*
|--------------------------------------------------------------------------
| Graceful Shutdown
|--------------------------------------------------------------------------
*/

const shutdown = async (signal) => {
    if (isShuttingDown) return;

    isShuttingDown = true;

    logger.info(
        { signal },
        "Shutdown signal received"
    );

    try {
        // 1. Close HTTP server
        if (server?.listening) {
            await new Promise((resolve, reject) => {
                server.close((error) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve();
                });
            });
        }

        // 2. Close Socket.IO
        if (io) {
            io.close();
        }

        // 3. Close Redis
        await closeRedis();

        // 4. Close MongoDB
        await closeDB();

        logger.info(
            "Application shutdown completed"
        );

        process.exit(0);

    } catch (error) {
        logger.fatal(
            { error },
            "Error during graceful shutdown"
        );

        process.exit(1);
    }
};

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

const startServer = async () => {
    try {
        // 1. Connect MongoDB
        await connectDB();

        // 2. Connect Redis
        await connectRedis();

        // 3. Seed default admin/organizer users
        await seedDefaultUsers();

        // 4. Warm the public events cache so the first load spike does not hit cold DB latency.
        try {
            await getPublicEventsService({}, { page: 1, limit: 12 });
            logger.info("Public events cache warmed");
        } catch (error) {
            logger.warn({ error }, "Public events cache warm-up skipped");
        }

        // 5. Start email worker for queued reset emails
        if (emailWorker) {
            logger.info("Email worker started");
        }

        // 6. Create Express application
        const app = createApp();

        // 7. Create HTTP server
        server = http.createServer(app);

        // 8. Setup Socket.IO
        io = setupSocket(server);

        // 9. Start HTTP server
        server.listen(env.PORT, () => {
            logger.info(
                {
                    port: env.PORT,
                    environment: env.NODE_ENV,
                },
                "Server started successfully"
            );
        });

    } catch (error) {
        logger.fatal(
            { err: error },
            "Server failed to start"
        );

        process.exit(1);
    }
};

/*
|--------------------------------------------------------------------------
| Process Events
|--------------------------------------------------------------------------
*/

process.once(
    "SIGTERM",
    () => shutdown("SIGTERM")
);

process.once(
    "SIGINT",
    () => shutdown("SIGINT")
);

process.on(
    "uncaughtException",
    (error) => {
        logger.fatal(
            { err: error },
            "Uncaught exception"
        );

        shutdown("uncaughtException");
    }
);

process.on(
    "unhandledRejection",
    (error) => {
        logger.fatal(
            { err: error },
            "Unhandled promise rejection"
        );

        shutdown("unhandledRejection");
    }
);

/*
|--------------------------------------------------------------------------
| Bootstrap
|--------------------------------------------------------------------------
*/

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
    startServer();
}