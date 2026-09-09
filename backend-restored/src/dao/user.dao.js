import UserModel from "../model/user.model.js";

const normalizeEmail = (value) => String(value ?? "").trim().toLowerCase();
const normalizeUsername = (value) => String(value ?? "").trim();
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Creates a new user with the provided username, email, and password.
 * @param {Object} params - The parameters for creating a user.
 * @param {string} params.username - The username of the user.
 * @param {string} params.email - The email of the user.
 * @param {string} params.password - The password of the user.
 * @returns {Promise<Object>} - The created user object.
 */
export const createUser = async ({ username, email, password = "", role, googleId, fullName, avatar }) => {
    const normalizedGoogleId = String(googleId ?? "").trim();
    const normalizedUsername = normalizeUsername(username);
    const normalizedEmail = normalizeEmail(email);

    const user = await UserModel.create({
        username: normalizedUsername,
        email: normalizedEmail,
        password,
        role,
        googleId: normalizedGoogleId || undefined,
        fullName,
        avatar,
    });
    return user;
}

/**
 * Retrieves a user by the provided email or username.
 * @param {Object} params - The parameters for retrieving a user.
 * @param {string} params.email - The email of the user.
 * @param {string} params.username - The username of the user.
 * @returns {Promise<Object|null>} - The retrieved user object or null if not found.
 */
export const getUserByEmailOrUsername = async ({ email, username }) => {
    const normalizedEmail = normalizeEmail(email);
    const normalizedUsername = normalizeUsername(username);
    const conditions = [];

    if (normalizedEmail) {
        conditions.push({ email: normalizedEmail });
    }

    if (normalizedUsername) {
        conditions.push({
            username: {
                $regex: `^${escapeRegex(normalizedUsername)}$`,
                $options: "i",
            },
        });
    }

    if (!conditions.length) {
        return null;
    }

    return UserModel.findOne({
        $or: conditions,
    });
}


/**
 * Retrieves a user by the provided userId.
 * @param {string} userId - The ID of the user to retrieve.
 * @returns {Promise<Object|null>} - The retrieved user object or null if not found.
 */
export const getUserById = async (userId) => {
    const user = await UserModel.findById(userId);
    return user;
}

export const getUserByGoogleId = async (googleId) => {
    const normalizedGoogleId = String(googleId ?? "").trim();
    if (!normalizedGoogleId) return null;
    return UserModel.findOne({ googleId: normalizedGoogleId });
}

export const getAdmin = () =>
    UserModel.findOne({ role: "ADMIN" }).select("_id").lean();