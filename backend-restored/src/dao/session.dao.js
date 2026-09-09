import bcrypt from "bcryptjs";
import SessionModel, { SESSION_TTL_MS } from "../model/session.model.js";

const hashRefreshToken = async (refreshToken) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(refreshToken, salt);
};

/**
 * Creates a new session for a user with the provided userId and refreshToken.
 * @param {Object} params - The parameters for creating a session.
 * @param {string} params.userId - The ID of the user for whom the session is being created.
 * @param {string} params.refreshToken - The refresh token associated with the session.
 * @returns {Promise<Object>} - The created session object.
 */
export const createSession = async ({ userId, refreshToken }) => {
    const session = await SessionModel.create({
        userId,
        refreshToken,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    });
    return session;
}

/**
 * Retrieves a session by the provided userId.
 * @param {string} userId - The ID of the user for whom to retrieve the session.
 * @returns {Promise<Object|null>} - The retrieved session object or null if not found.
 */
export const getSessionByUserId = async (userId) => {
    const session = await SessionModel.findOne({ userId });
    return session;
};



/**
 * update refresh token for a session by userId
 * @param {string} userId - The ID of the user for whom to update the session.
 * @param {string} params.refreshToken - The new refresh token associated with the session.
 * @returns {Promise<Object|null>} - The updated session object or null if not found.
 */
export const updateSessionByUserId = async (userId, { refreshToken }) => {
    const session = await SessionModel.findOne({ userId });

    if (!session) {
        return null;
    }

    session.refreshToken = refreshToken;
    session.expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await session.save();

    return session;
}


/**
 * Deletes a session by the provided userId.
 * @param {string} userId - The ID of the user for whom to delete the session.
 * @returns {Promise<Object|null>} - The deleted session object or null if not found.
 */
export const deleteSessionByUserId = async (userId) => {
    const session = await SessionModel.findOneAndDelete({ userId });
    return session;
}