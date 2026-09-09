import express from "express";
import morgan from "morgan";
import path from "path";
import passport from "passport";

import env from "./config/env.js";
import securityMiddleware from "./middleware/security.middleware.js";
import errorHandleMiddleware from "./middleware/errorHandle.middleware.js";
import "./config/passport.js";

import authRouter from "./module/auth/auth.routes.js";
import eventRouter from "./module/event/event.routes.js";
import uploadRouter from "./module/upload/upload.routes.js";
import profileRouter from "./module/profile/profile.routes.js";
import adminRouter from "./module/admin/admin.routes.js";
import homeSliderRouter from "./module/home-slider/home-slider.routes.js";

const createApp = () => {
    const app = express();

    app.disable("x-powered-by");
    app.set("trust proxy", 1);

    app.use(passport.initialize());

    // Security and common middleware.
    securityMiddleware(app);

    // Development request logging.
    if (env.NODE_ENV === "development") {
        app.use(morgan("dev"));
    }

    // Health check.
    app.get("/health", (req, res) => {
        res.status(200).json({
            success: true,
            message: "API is healthy",
        });
    });

    app.get("/api", (req, res) => {
        res.status(200).json({
            success: true,
            message: "API is healthy",
        });
    });

    app.get("/api/health", (req, res) => {
        res.status(200).json({
            success: true,
            message: "API is healthy",
        });
    });

    // Static uploads.
    const uploadsDir = path.resolve(process.cwd(), "uploads");
    app.use("/uploads", express.static(uploadsDir));

    // API routes.
    app.use("/api/v1/auth", authRouter);
    app.use("/api/v1/upload", uploadRouter);
    app.use("/api/v1/profile", profileRouter);
    app.use("/api/v1/events", eventRouter);
    app.use("/api/v1/admin", adminRouter);
    app.use("/api/v1/home-slider", homeSliderRouter);

    // Backward compatibility during migration to v1.
    app.use("/api/auth", authRouter);
    app.use("/api/upload", uploadRouter);
    app.use("/api/profile", profileRouter);
    app.use("/api/events", eventRouter);
    app.use("/api/admin", adminRouter);
    app.use("/api/home-slider", homeSliderRouter);

    // 404 handler.
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: "Route not found",
        });
    });

    // Global error handler.
    app.use(errorHandleMiddleware);

    return app;
};

export default createApp;