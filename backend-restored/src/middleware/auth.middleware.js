import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";

import config from "../config/config.js";
import { UnauthorizedError } from "../shared/error/unAuthorize.error.js";

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
        const userAccessToken = getCookieValue(req, "userAccessToken");
        if (userAccessToken) return userAccessToken;

        const organizerAccessToken = getCookieValue(req, "organizerAccessToken");
        if (organizerAccessToken) return organizerAccessToken;

        return getCookieValue(req, "adminAccessToken");
    }

    if (expectedRole === "ADMIN") {
        return getCookieValue(req, "adminAccessToken");
    }

    if (expectedRole === "ORGANIZER") {
        return getCookieValue(req, "organizerAccessToken");
    }

    return getCookieValue(req, "userAccessToken");
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

        const normalizedRole = String(payload?.role ?? "").trim().toUpperCase();

        if (expectedRole && normalizedRole !== expectedRole) {
            throw new UnauthorizedError("Role mismatch for this app");
        }

        req.user = payload;
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
    const userRole = String(req.user?.role ?? "").trim().toUpperCase();

    if (!allowedRoles.includes(userRole)) {
        return next(
            new UnauthorizedError("You do not have permission for this action")
        );
    }

    return next();
};