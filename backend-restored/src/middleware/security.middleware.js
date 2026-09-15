import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import compression from "compression";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import env from "../config/env.js";

const destructivePatterns = [
    /<\s*script/i,
    /javascript\s*:/i,
    /onerror\s*=/i,
    /onload\s*=/i,
    /\bunion\s+select\b/i,
    /\bselect\s+.*\s+from\b/i,
    /\binsert\s+into\b/i,
    /\bupdate\s+.*\s+set\b/i,
    /\bdelete\s+from\b/i,
    /\bdrop\s+table\b/i,
    /\bexec\s*\(/i,
    /\bfetch\s*\(/i,
    /\.\./,
    /(?:%2e){2,}/i,
    /(?:\\0|\\x00)/i,
    /(?:\b(?:phpmyadmin|wp-admin|\.git|\.env|cgi-bin|server-status)\b)/i,
];

const blockedPathFragments = [
    ".env",
    ".git",
    "phpmyadmin",
    "wp-admin",
    "cgi-bin",
    "server-status",
    "/config",
    "sitemap.xml",
];

const suspiciousHeaderKeys = [
    "x-forwarded-host",
    "x-original-url",
    "x-rewrite-url",
    "cf-connecting-ip",
    "x-real-ip",
];

const normalizeForCheck = (value) => {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value.join(" ");
    if (value && typeof value === "object") return JSON.stringify(value);
    return String(value ?? "");
};

const containsMaliciousPattern = (value) => {
    const normalized = normalizeForCheck(value);
    return destructivePatterns.some((pattern) => pattern.test(normalized));
};

const securityMiddleware = (app) => {
    const allowedOrigins = env.CORS_ORIGIN
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

    const getHostname = (value) => {
        try {
            return new URL(value).hostname.toLowerCase();
        } catch {
            return String(value || "").toLowerCase();
        }
    };

    const isAllowedOrigin = (origin) => {
        if (!origin) return true;

        const normalizedOrigin = String(origin).trim();
        if (allowedOrigins.includes(normalizedOrigin)) return true;

        const originHostname = getHostname(normalizedOrigin);
        const hostnameMatches = allowedOrigins.some((allowedOrigin) => {
            const allowedHostname = getHostname(allowedOrigin);
            return (
                allowedHostname === originHostname ||
                originHostname.endsWith(`.${allowedHostname}`)
            );
        });

        if (hostnameMatches) return true;

        return /^(http|https):\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?$/.test(normalizedOrigin);
    };

    // CORS.
    app.use(
        cors({
            origin: (origin, callback) => {
                if (isAllowedOrigin(origin)) {
                    return callback(null, true);
                }

                return callback(null, false);
            },
            credentials: true,
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
            optionsSuccessStatus: 204,
        })
    );

    // Security headers.
    app.use(
        helmet({
            crossOriginResourcePolicy: false,
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    imgSrc: [
                        "'self'",
                        "data:",
                        "http://localhost:3000",
                        "http://localhost:5173",
                        "http://localhost:5174",
                        "http://localhost:5175",
                    ],
                    connectSrc: [
                        "'self'",
                        "http://localhost:3000",
                        "http://localhost:5173",
                        "http://localhost:5174",
                        "http://localhost:5175",
                    ],
                    scriptSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https:"],
                    fontSrc: ["'self'", "https:", "data:"],
                    objectSrc: ["'none'"],
                    frameAncestors: ["'self'"],
                    formAction: ["'self'"],
                },
            },
        })
    );

    // HTTP parameter pollution protection.
    app.use(hpp());

    // WAF-like traffic filter for common abusive payloads.
    app.use((req, res, next) => {
        const path = String(req.originalUrl || req.url || "").toLowerCase();
        const repeatedHeaderAttack = suspiciousHeaderKeys.some((header) => {
            const value = req.headers[header];
            return typeof value === "string" && containsMaliciousPattern(value);
        });

        const pathBlocked = blockedPathFragments.some((fragment) => path.includes(fragment.toLowerCase()));
        const queryBlocked = containsMaliciousPattern(req.query);
        const bodyBlocked = containsMaliciousPattern(req.body);
        const paramsBlocked = containsMaliciousPattern(req.params);

        if (repeatedHeaderAttack || pathBlocked || queryBlocked || bodyBlocked || paramsBlocked) {
            return res.status(403).json({
                success: false,
                message: "Request blocked by web application firewall policy",
            });
        }

        const dangerousMethod = ["TRACE", "TRACK"].includes(String(req.method || "").toUpperCase());
        if (dangerousMethod) {
            return res.status(405).json({
                success: false,
                message: "Method not allowed",
            });
        }

        return next();
    });

    // Cookie parsing.
    app.use(cookieParser());

    // Response compression.
    app.use(compression());

    const authRateLimiter = rateLimit({
        windowMs: env.RATELIMIT_WINDOW_MS,
        limit: Math.max(200, Number(env.RATELIMIT || 100)),
        standardHeaders: "draft-8",
        legacyHeaders: false,
        message: {
            success: false,
            message: "Too many authentication attempts. Please wait a moment and try again.",
        },
    });

    const apiRateLimiter = rateLimit({
        windowMs: env.RATELIMIT_WINDOW_MS,
        limit: env.RATELIMIT,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        message: {
            success: false,
            message: "Too many requests. Please try again later.",
        },
    });

    const isPublicGetRoute = (req) => {
        const path = String(req.path || req.originalUrl || "").toLowerCase();

        return (
            path === "/health" ||
            path === "/api/health" ||
            path.startsWith("/api/home-slider") ||
            path.startsWith("/api/v1/home-slider") ||
            path.startsWith("/api/events") ||
            path.startsWith("/api/v1/events")
        );
    };

    const publicGetRateLimiter = rateLimit({
        windowMs: env.RATELIMIT_WINDOW_MS,
        limit: Math.max(50000, Number(env.RATELIMIT || 100) * 500),
        standardHeaders: "draft-8",
        legacyHeaders: false,
        message: {
            success: false,
            message: "Too many public requests. Please try again later.",
        },
    });

    app.use((req, res, next) => {
        if (req.path.startsWith("/api/auth")) {
            return authRateLimiter(req, res, next);
        }

        if (req.method === "GET" && isPublicGetRoute(req)) {
            return publicGetRateLimiter(req, res, next);
        }

        return apiRateLimiter(req, res, next);
    });

    // Request body parsing.
    app.use(
        express.json({
            limit: "20mb",
        })
    );

    app.use(
        express.urlencoded({
            extended: true,
            limit: "20mb",
        })
    );
};

export default securityMiddleware;