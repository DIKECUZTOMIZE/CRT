import jwt from "jsonwebtoken";

import config from "../../config/config.js";
import { ROLES } from "../../constant/model.constant.js";

const normalizeRoles = (value) => {
    const items = Array.isArray(value) ? value : [value];
    const normalized = items
        .map((entry) => String(entry ?? "").trim().toUpperCase())
        .filter(Boolean)
        .filter((entry) => Object.values(ROLES).includes(entry));

    return [...new Set(normalized)];
};

const buildTokenRoles = (role, roles) => {
    const normalizedRoles = normalizeRoles(roles);
    const primaryRole = String(role ?? "").trim().toUpperCase();

    if (primaryRole && !normalizedRoles.includes(primaryRole)) {
        normalizedRoles.unshift(primaryRole);
    }

    if (!normalizedRoles.length) {
        return [ROLES.USER];
    }

    return normalizedRoles;
};

/**
 * Generate access token
 */
export const generateAccessToken = (userId, role, roles) => {
    const tokenRoles = buildTokenRoles(role, roles);
    const primaryRole = tokenRoles[0] || ROLES.USER;

    return jwt.sign(
        {
            sub: userId,
            role: primaryRole,
            roles: tokenRoles,
        },
        config.auth.accessTokenSecret,
        {
            expiresIn:
                config.auth.jwt.accessToken.expiresIn,
        }
    );
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (userId, role, roles) => {
    const tokenRoles = buildTokenRoles(role, roles);
    const primaryRole = tokenRoles[0] || ROLES.USER;

    return jwt.sign(
        {
            sub: userId,
            role: primaryRole,
            roles: tokenRoles,
        },
        config.auth.refreshTokenSecret,
        {
            expiresIn:
                config.auth.jwt.refreshToken.expiresIn,
        }
    );
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token) => {
    return jwt.verify(
        token,
        config.auth.accessTokenSecret
    );
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token) => {
    return jwt.verify(
        token,
        config.auth.refreshTokenSecret
    );
};