import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";

import config from "../config/config.js";
import { UnauthorizedError } from "../shared/error/unAuthorize.error.js";

const normalizeRoles = (value) => {
    const entries = Array.isArray(value) ? value : [value];
    const normalized = entries
        .map((entry) => String(entry ?? "").trim().toUpperCase())
        .filter(Boolean)
        .filter((entry) => ["USER", "ORGANIZER", "ADMIN"].includes(entry));

    return [...new Set(normalized)];
};

const getCookieValue = (req, cookieName) => {
    if (req.cookies?.[cookieName]) {
        return req.cookies[cookieName];
    }

    const rawCookieHeader = String(req.headers?.cookie || "");
    if (!rawCookieHeader) {
        return null;
    }

    const match = rawCookieHeader.match(new RegExp(`(?:^|;\\s*)${cookieName}=([^;]+)`));
    return match ? decodeURIComponent(match[1]) : null;
};

const getExpectedRoleFromRequest = (req) => {
    const origin = String(req.headers?.origin || req.headers?.referer || "").toLowerCase();

    if (!origin) {
        return null;
    }

    if (/5174|admin/i.test(origin)) {
        return "ADMIN";
    }

    if (/5175|organizer/i.test(origin)) {
        return "ORGANIZER";
    }

    return "USER";
};

const getRoleSpecificCookieToken = (req, expectedRole) => {
    if (!expectedRole) {
        const requestPath = String(req.originalUrl || req.path || "").toLowerCase();
        const hasAdminPath = /\/admin\b|\/api\/admin\b/i.test(requestPath);
        const hasOrganizerPath = /\/organizer\b|\/api\/events\b|\/api\/profile\b|\/api\/organizer\b/i.test(requestPath);

        const cookieOrder = hasAdminPath
            ? ["adminAccessToken", "organizerAccessToken", "userAccessToken"]
            : hasOrganizerPath
                ? ["organizerAccessToken", "userAccessToken", "adminAccessToken"]
                : ["userAccessToken", "organizerAccessToken", "adminAccessToken"];

        for (const cookieName of cookieOrder) {
            const token = getCookieValue(req, cookieName);
            if (token) return token;
        }
        return null;
    }

    const cookieName = expectedRole === "ADMIN"
        ? "adminAccessToken"
        : expectedRole === "ORGANIZER"
            ? "organizerAccessToken"
            : "userAccessToken";

    return getCookieValue(req, cookieName);
};

const getUserRoles = (payload) => {
    if (!payload || typeof payload !== "object") {
        return [];
    }

    return [...new Set([
        ...normalizeRoles(payload.roles),
        ...normalizeRoles(payload.role),
    ])];
};

export const authMiddleware = (req, res, next) => {
    try {
        const bearerToken = req.headers.authorization?.startsWith("Bearer ")
            ? req.headers.authorization.split(" ")[1]
            : null;
        const expectedRole = getExpectedRoleFromRequest(req);
        const roleSpecificToken = getRoleSpecificCookieToken(req, expectedRole);
        const token = bearerToken || roleSpecificToken || null;

        if (!token) {
            throw new UnauthorizedError(
                "Authentication required",
                StatusCodes.UNAUTHORIZED
            );
        }

        const payload = jwt.verify(
            token,
            config.auth.accessTokenSecret
        );

        const normalizedRoles = getUserRoles(payload);

        if (expectedRole && !normalizedRoles.includes(expectedRole)) {
            throw new UnauthorizedError("Role mismatch for this app");
        }

        req.user = {
            ...payload,
            roles: normalizedRoles,
            role: expectedRole && normalizedRoles.includes(expectedRole)
                ? expectedRole
                : payload.role || normalizedRoles[0] || "USER",
        };
        next();
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            return next(error);
        }

        if (error.name === "TokenExpiredError") {
            return next(
                new UnauthorizedError("Access token expired")
            );
        }

        if (error.name === "JsonWebTokenError") {
            return next(
                new UnauthorizedError("Invalid access token")
            );
        }

        if (error.name === "NotBeforeError") {
            return next(
                new UnauthorizedError("Access token is not active")
            );
        }

        return next(error);
    }
};

export const requireRole = (...roles) => (req, res, next) => {
    const allowedRoles = roles.map((role) => String(role).trim().toUpperCase());
    const userRoles = getUserRoles(req.user);

    if (!allowedRoles.some((role) => userRoles.includes(role))) {
        return next(
            new UnauthorizedError("You do not have permission for this action")
        );
    }

    return next();
};