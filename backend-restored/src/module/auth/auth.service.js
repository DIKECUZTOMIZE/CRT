
import mongoose from "mongoose";
import nodemailer from "nodemailer";

import * as userDao from "../../dao/user.dao.js";
import * as sessionDao from "../../dao/session.dao.js";
import * as token from "../../shared/utils/token.js";
import { NotFoundError } from "../../shared/error/notFound.error.js";
import { UnauthorizedError } from "../../shared/error/unAuthorize.error.js";
import { AppError } from "../../shared/error/appError.js";
import env from "../../config/env.js";
import { ROLES } from "../../constant/model.constant.js";
import EventModel from "../../model/event.model.js";
import UserModel from "../../model/user.model.js";
import { enqueuePasswordResetEmail } from "./auth.queue.js";

const passwordResetOtpMap = new Map();
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,128}$/;

const isStrongPassword = (value) => typeof value === "string" && strongPasswordRegex.test(value.trim());

export const isPasswordResetEmailConfigured = (host, user, pass) => {
    const normalizedHost = String(host ?? "").trim();
    const normalizedUser = String(user ?? "").trim();
    const normalizedPass = String(pass ?? "").trim();

    if (!normalizedHost || !normalizedUser || !normalizedPass) {
        return false;
    }

    const placeholderPatterns = [
        /^your[-_]?email@/i,
        /^your[-_]?gmail/i,
        /^your-\d+/i,
        /^replace-with-/i,
        /^example\./i,
        /^changeme$/i,
        /^dummy/i,
        /^test@/i,
        /your-16-digit-gmail-app-password/i,
    ];

    return !placeholderPatterns.some((pattern) =>
        pattern.test(normalizedHost) ||
        pattern.test(normalizedUser) ||
        pattern.test(normalizedPass)
    );
};

const buildPasswordResetTransporter = () => {
    const host = String(env.SMTP_HOST || "").trim();
    const user = String(env.SMTP_USER || "").trim();
    const pass = String(env.SMTP_PASS || "").trim();

    if (!isPasswordResetEmailConfigured(host, user, pass)) {
        return null;
    }

    return nodemailer.createTransport({
        host,
        port: Number(env.SMTP_PORT || 587),
        secure: Boolean(env.SMTP_SECURE),
        auth: {
            user,
            pass,
        },
    });
};

const sendPasswordResetEmail = async (email, otp) => {
    const transporter = buildPasswordResetTransporter();

    if (!transporter) {
        if (env.NODE_ENV === "development") {
            console.warn(`Password reset email delivery is not configured. Dev fallback enabled for ${email}. OTP: ${otp}`);
            return { devMode: true, otp };
        }

        throw new AppError(
            "Email delivery is not configured. Add SMTP credentials to the backend environment.",
            503
        );
    }

    const fromAddress = String(env.SMTP_FROM || env.SMTP_USER || "no-reply@crt.local").trim();

    await transporter.sendMail({
        from: fromAddress,
        to: email,
        subject: "CRT Password Reset OTP",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #dfe7ee; border-radius: 12px; background: #f8fafc; color: #0f172a;">
                <h2 style="margin-bottom: 16px;">Password Reset Request</h2>
                <p style="margin-bottom: 12px;">Use the code below to reset your password.</p>
                <div style="padding: 16px 20px; background: #0f172a; border-radius: 10px; color: #f8fafc; font-size: 28px; font-weight: 700; letter-spacing: 6px; text-align: center; width: max-content; min-width: 170px; margin: 18px auto;">
                    ${otp}
                </div>
                <p style="margin: 0; color: #475569;">This code expires in 5 minutes.</p>
            </div>
        `,
    });

    return { devMode: false, otp };
};

export const createPasswordResetOtp = (email) => {
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail) {
        return null;
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 5 * 60 * 1000;

    passwordResetOtpMap.set(normalizedEmail, { otp, expiresAt });

    return { otp, expiresAt };
};

export const verifyPasswordResetOtp = (email, otp, existingEntry = null) => {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const entry = existingEntry ?? passwordResetOtpMap.get(normalizedEmail);

    if (!entry) {
        return { valid: false, reason: "OTP not requested" };
    }

    if (Number(entry.expiresAt) <= Date.now()) {
        passwordResetOtpMap.delete(normalizedEmail);
        return { valid: false, reason: "OTP expired" };
    }

    if (String(entry.otp) !== String(otp || "").trim()) {
        return { valid: false, reason: "Invalid OTP" };
    }

    passwordResetOtpMap.delete(normalizedEmail);
    return { valid: true, reason: "OTP verified" };
};

export const getRegisteredEmailsService = async () => {
    const users = await UserModel.find({ role: ROLES.USER }, { email: 1, _id: 0 })
        .sort({ email: 1 })
        .lean();

    const emails = [...new Set(
        users
            .map((user) => String(user?.email || "").trim().toLowerCase())
            .filter(Boolean)
    )];

    return {
        emails,
    };
};

export const requestPasswordResetService = async (email, dependencies = {}) => {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const {
        enqueuePasswordResetEmailFn = enqueuePasswordResetEmail,
        sendPasswordResetEmailFn = sendPasswordResetEmail,
    } = dependencies;

    if (!normalizedEmail) {
        throw new AppError("Email is required", 400);
    }

    const user = await UserModel.findOne({ email: normalizedEmail }).lean();

    if (!user) {
        return {
            message: "If this email is registered, an OTP has been sent.",
            otpSent: false,
        };
    }

    const { otp, expiresAt } = createPasswordResetOtp(normalizedEmail);

    try {
        if (env.NODE_ENV === "development") {
            console.warn(`Password reset email queued for ${normalizedEmail}. OTP: ${otp}`);
        }

        await enqueuePasswordResetEmailFn(normalizedEmail, otp);
    } catch (queueError) {
        console.warn(`Password reset queue failed for ${normalizedEmail}, falling back to direct SMTP send.`, queueError);

        try {
            await sendPasswordResetEmailFn(normalizedEmail, otp);
        } catch (smtpError) {
            console.error(`Direct password reset email failed for ${normalizedEmail}`, smtpError);
            throw new AppError("Unable to send password reset OTP at the moment. Please try again later.", 503);
        }
    }

    return {
        message: "If this email is registered, an OTP has been sent.",
        otpSent: true,
        expiresAt,
        email: normalizedEmail,
    };
};

export const resetPasswordWithOtpService = async (
    { email, otp, newPassword },
    dependencies = {}
) => {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const trimmedPassword = String(newPassword ?? "").trim();
    const { getUserByEmailOrUsername = userDao.getUserByEmailOrUsername, deleteSessionByUserId = sessionDao.deleteSessionByUserId } = dependencies;

    if (!normalizedEmail) {
        throw new AppError("Email is required", 400);
    }

    if (!trimmedPassword || !isStrongPassword(trimmedPassword)) {
        throw new AppError(
            "Password must be at least 12 characters long and include uppercase, lowercase, number, and special character",
            400
        );
    }

    const verification = verifyPasswordResetOtp(normalizedEmail, otp);

    if (!verification.valid) {
        throw new AppError(
            verification.reason === "OTP expired" ? "OTP expired" : "Invalid or expired OTP",
            400
        );
    }

    const user = await getUserByEmailOrUsername({ email: normalizedEmail });

    if (!user) {
        throw new NotFoundError("User not found");
    }

    const isSameAsCurrentPassword = await user.comparePassword(trimmedPassword);

    if (isSameAsCurrentPassword) {
        throw new AppError("New password must be different from your current password", 400);
    }

    user.password = trimmedPassword;
    await user.save();

    await deleteSessionByUserId(user._id);

    return {
        message: "Password reset successfully. Please log in again with your new password.",
        email: normalizedEmail,
        requiresLogin: true,
    };
};

export const registerUserService = async (
    { username, email, password },
    role = ROLES.USER,
    roles = []
) => {
    const normalizedUsername = String(username ?? "").trim();
    const normalizedEmail = String(email ?? "").trim().toLowerCase();

    const isUserExists =
        await userDao.getUserByEmailOrUsername({ email: normalizedEmail, username: normalizedUsername });

    if (isUserExists) {
        throw new AppError("User already exists", 409);
    }

    const user = await userDao.createUser({
        username: normalizedUsername,
        email: normalizedEmail,
        password,
        role,
        roles: Array.isArray(roles) && roles.length ? roles : undefined,
    });

    const normalizedRoles = Array.isArray(roles) && roles.length
        ? roles
        : [role || user.role || ROLES.USER];
    const accessToken = token.generateAccessToken(user._id, user.role || role || ROLES.USER, normalizedRoles);

    const refreshToken = token.generateRefreshToken(user._id, user.role || role || ROLES.USER, normalizedRoles);

    await sessionDao.createSession({
        userId: user._id,
        refreshToken,
    });



    return {
        user: buildUserPayload(user),
        accessToken,
        refreshToken,
    };
};

export const buildUserPayload = (user) => {
    const normalizedRoles = Array.isArray(user.roles)
        ? user.roles
        : Array.isArray(user.role)
            ? user.role
            : [user.role || ROLES.USER];

    const orderedRoles = [...new Set(normalizedRoles.map((role) => String(role ?? "").trim().toUpperCase()).filter(Boolean))];
    const primaryRole = orderedRoles[0] || String(user.role ?? "").trim().toUpperCase() || ROLES.USER;

    return {
        id: user._id,
        username: user.username,
        email: user.email,
        role: primaryRole,
        roles: orderedRoles,
        roleTitle: user.roleTitle || "",
        fullName: user.fullName || "",
        avatar: user.avatar || user.profileImage || user.picture || user.image || "",
        phone: user.phone || "",
        address: user.address || "",
        city: user.address || "",
        organizationName: user.organizationName || "",
        website: user.website || "",
        bio: user.bio || "",
    };
};

const createSessionForUser = async (userId, refreshToken) => {
    const session = await sessionDao.updateSessionByUserId(userId, { refreshToken });

    if (!session) {
        await sessionDao.createSession({
            userId,
            refreshToken,
        });
    }
};

export const googleLoginService = async ({ user }) => {
    if (!user) {
        throw new AppError("Google user is required", 400);
    }

    const roles = Array.isArray(user.roles) && user.roles.length
        ? user.roles
        : [user.role || ROLES.USER];

    const accessToken = token.generateAccessToken(user._id, user.role || roles[0], roles);
    const refreshToken = token.generateRefreshToken(user._id, user.role || roles[0], roles);

    await createSessionForUser(user._id, refreshToken);

    return {
        user: buildUserPayload(user),
        accessToken,
        refreshToken,
    };
};

export const loginUserService = async ({ email, password }) => {
    const normalizedEmail = String(email ?? "").trim().toLowerCase();
    let user = await userDao.getUserByEmailOrUsername({ email: normalizedEmail });

    if (!user) {
        throw new NotFoundError("User not found");
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        throw new UnauthorizedError("Invalid email or password");
    }

    const roles = Array.isArray(user.roles) && user.roles.length
        ? user.roles
        : [user.role || ROLES.USER];
    const normalizedRole = String(user.role || roles[0] || ROLES.USER).trim().toUpperCase();

    if (!Object.values(ROLES).includes(normalizedRole)) {
        throw new UnauthorizedError("Invalid user role");
    }

    const accessToken = token.generateAccessToken(user._id, normalizedRole, roles);
    const refreshToken = token.generateRefreshToken(user._id, normalizedRole, roles);

    await createSessionForUser(user._id, refreshToken);

    user = buildUserPayload(user);

    return { user, accessToken, refreshToken }


}

export const logoutUserService = async (refreshToken) => {

    if (!refreshToken) {
        return;
    }

    let decoded;

    try {
        decoded = token.verifyRefreshToken(refreshToken);
    } catch {
        return;
    }

    await sessionDao.deleteSessionByUserId(
        decoded.sub
    );


};

export const refreshService = async (refreshToken) => {
    if (!refreshToken) {
        throw new UnauthorizedError("Refresh token not found");
    }

    try {
        const decoded = token.verifyRefreshToken(refreshToken);

        const session = await sessionDao.getSessionByUserId(decoded.sub);

        if (!session) {
            throw new UnauthorizedError("Session not found");
        }

        const isRefreshTokenValid =
            session.refreshToken === refreshToken ||
            await session.compareRefreshToken(refreshToken);

        if (!isRefreshTokenValid) {
            throw new UnauthorizedError("Invalid refresh token");
        }

        const user = await UserModel.findById(decoded.sub).lean();
        const roles = Array.isArray(user?.roles) && user.roles.length
            ? user.roles
            : [user?.role || decoded.role || ROLES.USER];
        const primaryRole = String(decoded.role || user?.role || roles[0] || ROLES.USER).trim().toUpperCase();

        const newAccessToken = token.generateAccessToken(decoded.sub, primaryRole, roles);
        const newRefreshToken = token.generateRefreshToken(decoded.sub, primaryRole, roles);

        await sessionDao.updateSessionByUserId(decoded.sub, {
            refreshToken: newRefreshToken,
        });

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        };
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            throw error;
        }

        throw new UnauthorizedError("Invalid or expired refresh token");
    }
};

const normalizeUserLocation = (value = {}) => {
    const source = value && typeof value === "object" ? value : {};
    const nextCountry = String(source.country || "India").trim() || "India";
    const nextState = String(source.state || "India").trim() || "India";
    const nextCity = String(source.city || "All India").trim() || "All India";
    const nextDistrict = String(source.district || "").trim();

    return {
        country: nextCountry,
        state: nextState === "India" ? "India" : nextState,
        city: nextCity && nextCity !== "India" ? nextCity : "All India",
        district: nextDistrict,
        isSelected: nextState !== "India" || nextCity !== "All India",
    };
};

export const getCurrentUserService = async (userId) => {
    const user = await userDao.getUserById(userId);

    if (!user) {
        throw new UnauthorizedError("Session invalid or user no longer exists");
    }

    const roles = Array.isArray(user.roles) && user.roles.length
        ? user.roles
        : [user.role || ROLES.USER];
    const primaryRole = String(user.role || roles[0] || ROLES.USER).trim().toUpperCase();
    const location = normalizeUserLocation(user.location || {});

    return {
        id: user._id,
        username: user.username,
        email: user.email,
        role: primaryRole,
        roles,
        roleTitle: user.roleTitle || "",
        fullName: user.fullName || "",
        phone: user.phone || "",
        avatar: user.avatar || "",
        organizationName: user.organizationName || "",
        organizationType: user.organizationType || "",
        website: user.website || "",
        address: user.address || "",
        city: user.address || "",
        location,
        bio: user.bio || "",
        isVerified: Boolean(user.isVerified),
        kycStatus: user.kycStatus || "",
        kycDocumentType: user.kycDocumentType || "",
        kycVerifiedAt: user.kycVerifiedAt || "",
        socials: user.socials || { instagram: "", twitter: "", linkedin: "" },
        settings: user.settings || { emailNotifications: true, publicProfile: true },
        stats: user.stats || { totalEvents: 0, activeEvents: 0, totalAttendees: "", rating: 0 },
        savedEvents: Array.isArray(user.savedEvents) ? user.savedEvents.map((item) => String(item)) : [],
    };
};

export const updateCurrentUserService = async (userId, payload = {}) => {
    const user = await userDao.getUserById(userId);

    if (!user) {
        throw new UnauthorizedError("Session invalid or user no longer exists");
    }

    const isLocationOnlyUpdate = Boolean(
        payload &&
        Object.prototype.hasOwnProperty.call(payload, "location") &&
        Object.keys(payload).length === 1
    );

    const nextEmail = String(payload?.email ?? user.email ?? "").trim().toLowerCase();
    const nextFullName = String(payload?.fullName ?? user.fullName ?? "").trim();
    const nextRoleTitle = String(payload?.roleTitle ?? user.roleTitle ?? "").trim();
    const nextPhone = String(payload?.phone ?? user.phone ?? "").trim();
    const nextAddress = String(payload?.address ?? payload?.city ?? user.address ?? "").trim();
    const nextAvatar = String(payload?.avatar ?? user.avatar ?? "").trim();
    const nextLocation = payload && Object.prototype.hasOwnProperty.call(payload, "location")
        ? normalizeUserLocation(payload.location)
        : normalizeUserLocation(user.location || {});

    if (!nextEmail) {
        throw new AppError("Email is required", 400);
    }

    if (!nextFullName && !isLocationOnlyUpdate) {
        throw new AppError("Full name is required", 400);
    }

    const emailTaken = await UserModel.findOne({ email: nextEmail, _id: { $ne: user._id } }).lean();
    if (emailTaken) {
        throw new AppError("This email is already in use", 409);
    }

    user.email = nextEmail;
    user.fullName = nextFullName;
    user.roleTitle = nextRoleTitle;
    user.phone = nextPhone;
    user.address = nextAddress;
    user.avatar = nextAvatar;
    user.location = nextLocation;

    await user.save();

    return getCurrentUserService(user._id);
};

export const getSavedEventsService = async (userId) => {
    const user = await UserModel.findById(userId).populate({
        path: "savedEvents",
        select: "_id title bannerUrl cardImageUrl category location venueAddress status eventDate eventStart totalPrizePool viewsCount avgRating ratingsCount",
    }).lean();

    if (!user) {
        throw new NotFoundError("User not found");
    }

    return (Array.isArray(user.savedEvents) ? user.savedEvents : []).map((event) => ({
        ...event,
        id: String(event._id || event.id),
        _id: String(event._id || event.id),
    }));
};

export const toggleSavedEventService = async (userId, eventId) => {
    if (!eventId) {
        throw new AppError("Event ID is required", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        throw new AppError("Invalid event ID", 400);
    }

    const eventExists = await EventModel.exists({ _id: eventId });
    if (!eventExists) {
        throw new NotFoundError("Event not found");
    }

    const user = await userDao.getUserById(userId);
    if (!user) {
        throw new NotFoundError("User not found");
    }

    const normalizedIds = user.savedEvents.map((savedId) => String(savedId));
    const targetId = String(eventId);
    const alreadySaved = normalizedIds.includes(targetId);

    if (alreadySaved) {
        user.savedEvents = user.savedEvents.filter((savedId) => String(savedId) !== targetId);
    } else {
        user.savedEvents.push(eventId);
    }

    await user.save();

    return {
        savedEventIds: user.savedEvents.map((savedId) => String(savedId)),
        isSaved: !alreadySaved,
    };
};

const normalizeUserRoles = (user = {}) => {
    const rawRoles = Array.isArray(user.roles)
        ? user.roles
        : [];
    const rawRole = user.role;

    const normalized = [...rawRoles, rawRole]
        .flatMap((entry) => Array.isArray(entry) ? entry : [entry])
        .map((entry) => String(entry ?? "").trim().toUpperCase())
        .filter(Boolean)
        .filter((entry) => Object.values(ROLES).includes(entry));

    return [...new Set(normalized)];
};

const getNormalizedUserRoles = (user = {}) => {
    const candidateRoles = [
        user.roles,
        user.role,
    ];

    const normalizedRoles = candidateRoles
        .flatMap((entry) => Array.isArray(entry) ? entry : [entry])
        .map((entry) => String(entry ?? "").trim().toUpperCase())
        .filter(Boolean)
        .filter((entry) => Object.values(ROLES).includes(entry));

    return [...new Set(normalizedRoles)];
};

export const verifyOrganizerAccess = async (userId) => {
    const user = await userDao.getUserById(userId);

    if (!user) {
        throw new NotFoundError("User not found");
    }

    const userData = user.toObject ? user.toObject() : user;
    const roles = getNormalizedUserRoles(userData);

    if (!roles.includes(ROLES.ORGANIZER)) {
        throw new AppError("Organizer access required", 403);
    }

    return { authorized: true };
};

export const assertOrganizerAccess = async (userId) => verifyOrganizerAccess(userId);

export const organizerHandoffService = async (userId) => {
    const user = await userDao.getUserById(userId);

    if (!user) {
        throw new NotFoundError("User not found");
    }

    const normalizedRoles = getNormalizedUserRoles(user);

    if (!normalizedRoles.includes(ROLES.ORGANIZER)) {
        throw new AppError("Organizer access required", 403);
    }

    const accessToken = token.generateAccessToken(user._id, ROLES.ORGANIZER, normalizedRoles);
    const refreshToken = token.generateRefreshToken(user._id, ROLES.ORGANIZER, normalizedRoles);

    await createSessionForUser(user._id, refreshToken);

    return {
        user: buildUserPayload(user),
        accessToken,
        refreshToken,
        authorized: true,
    };
};

export const registerOrganizerService = (data) =>
    registerUserService(data, ROLES.USER, [ROLES.USER, ROLES.ORGANIZER]);

export const registerAdminService = async ({ registrationKey, ...data }) => {
    if (!env.ADMIN_REGISTRATION_KEY) {
        throw new AppError("Admin registration is not configured", 503);
    }

    if (registrationKey !== env.ADMIN_REGISTRATION_KEY) {
        throw new UnauthorizedError("Invalid admin registration key");
    }

    if (await userDao.getAdmin()) {
        throw new AppError("An admin account already exists", 409);
    }

    return registerUserService(data, ROLES.ADMIN);
};