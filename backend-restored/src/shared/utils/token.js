import jwt from "jsonwebtoken";

import config from "../../config/config.js";

/**
 * Generate access token
 */
export const generateAccessToken = (userId, role) => {
    return jwt.sign(
        {
            sub: userId,
            role,
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
export const generateRefreshToken = (userId, role) => {
    return jwt.sign(
        {
            sub: userId,
            role,
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