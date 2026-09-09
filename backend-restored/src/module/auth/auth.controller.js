import config from "../../config/config.js";
import env from "../../config/env.js";
import passport from "../../config/passport.js";
import { buildSuccessResponse } from "../../shared/utils/buildSuccessResponse.js";
import {
    googleLoginService,
    loginUserService,
    logoutUserService,
    refreshService,
    registerUserService,
    getCurrentUserService,
    getSavedEventsService,
    toggleSavedEventService,
    registerAdminService,
    registerOrganizerService,
    updateCurrentUserService,
    requestPasswordResetService,
    resetPasswordWithOtpService,
    getRegisteredEmailsService,
} from "./auth.service.js";

const getCookieSetForRole = (role) => {
    const normalizedRole = String(role ?? "").trim().toUpperCase();
    if (normalizedRole === "USER") {
        return config.auth.cookie.user;
    }
    return config.auth.cookie.organizer;
};

const getCookieSetForRequest = (req) => {
    const origin = String(req.headers.origin || req.headers.referer || "").toLowerCase();
    const isOrganizerClient = /5175|5174|organizer/i.test(origin);

    return isOrganizerClient ? config.auth.cookie.organizer : config.auth.cookie.user;
};

const clearAuthCookies = (res) => {
    const cookieOptions = { path: "/" };

    res.clearCookie("userAccessToken", cookieOptions);
    res.clearCookie("userRefreshToken", cookieOptions);
    res.clearCookie("organizerAccessToken", cookieOptions);
    res.clearCookie("organizerRefreshToken", cookieOptions);
    res.clearCookie("adminAccessToken", cookieOptions);
    res.clearCookie("adminRefreshToken", cookieOptions);
};

const setAuthCookies = (res, accessToken, refreshToken, role) => {
    const normalizedRole = String(role ?? "").trim().toUpperCase();

    if (normalizedRole === "USER") {
        res.clearCookie("adminAccessToken", { ...config.auth.cookie.admin.accessToken, path: "/" });
        res.clearCookie("adminRefreshToken", { ...config.auth.cookie.admin.refreshToken, path: "/" });
        res.clearCookie("organizerAccessToken", { ...config.auth.cookie.organizer.accessToken, path: "/" });
        res.clearCookie("organizerRefreshToken", { ...config.auth.cookie.organizer.refreshToken, path: "/" });
        res.cookie("userAccessToken", accessToken, config.auth.cookie.user.accessToken);
        res.cookie("userRefreshToken", refreshToken, config.auth.cookie.user.refreshToken);
        return;
    }

    if (normalizedRole === "ADMIN") {
        res.clearCookie("userAccessToken", { ...config.auth.cookie.user.accessToken, path: "/" });
        res.clearCookie("userRefreshToken", { ...config.auth.cookie.user.refreshToken, path: "/" });
        res.clearCookie("organizerAccessToken", { ...config.auth.cookie.organizer.accessToken, path: "/" });
        res.clearCookie("organizerRefreshToken", { ...config.auth.cookie.organizer.refreshToken, path: "/" });
        res.cookie("adminAccessToken", accessToken, config.auth.cookie.admin.accessToken);
        res.cookie("adminRefreshToken", refreshToken, config.auth.cookie.admin.refreshToken);
        return;
    }

    res.clearCookie("userAccessToken", { ...config.auth.cookie.user.accessToken, path: "/" });
    res.clearCookie("userRefreshToken", { ...config.auth.cookie.user.refreshToken, path: "/" });
    res.clearCookie("adminAccessToken", { ...config.auth.cookie.admin.accessToken, path: "/" });
    res.clearCookie("adminRefreshToken", { ...config.auth.cookie.admin.refreshToken, path: "/" });
    res.cookie("organizerAccessToken", accessToken, config.auth.cookie.organizer.accessToken);
    res.cookie("organizerRefreshToken", refreshToken, config.auth.cookie.organizer.refreshToken);
};

const readCookieValue = (req, cookieName) => {
    const rawCookie = req.headers.cookie || "";
    if (!rawCookie) {
        return req.cookies?.[cookieName] || null;
    }

    const match = rawCookie.match(new RegExp(`(?:^|;\\s*)${cookieName}=([^;]+)`));
    return match ? decodeURIComponent(match[1]) : req.cookies?.[cookieName] || null;
};

export const registerUserController = async (req, res) => {
    const data = await registerUserService(req.body);
    setAuthCookies(res, data.accessToken, data.refreshToken, "USER");

    delete data.accessToken;
    delete data.refreshToken;

    return buildSuccessResponse(
        res,
        "User registered successfully",
        data,
        201
    );
};

export const registerOrganizerController = async (req, res) => {
    const data = await registerOrganizerService(req.body);
    setAuthCookies(res, data.accessToken, data.refreshToken, "ORGANIZER");

    delete data.accessToken;
    delete data.refreshToken;

    return buildSuccessResponse(
        res,
        "Organizer registered successfully",
        data,
        201
    );
};

export const registerAdminController = async (req, res) => {
    const data = await registerAdminService(req.body);
    setAuthCookies(res, data.accessToken, data.refreshToken, "ADMIN");

    delete data.accessToken;
    delete data.refreshToken;

    return buildSuccessResponse(
        res,
        "Admin registered successfully",
        data,
        201
    );
};

export const googleLoginController = (req, res, next) => {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CALLBACK_URL) {
        return res.status(500).json({
            success: false,
            message: "Google auth is not configured",
        });
    }

    return passport.authenticate("google", {
        scope: ["profile", "email"],
        prompt: "consent",
        accessType: "offline",
    })(req, res, next);
};

export const googleCallbackController = async (req, res, next) => {
    passport.authenticate("google", async (error, user) => {
        if (error || !user) {
            return res.redirect("http://localhost:5173/login?error=google_auth_failed");
        }

        try {
            const data = await googleLoginService({ user });
            setAuthCookies(res, data.accessToken, data.refreshToken, data?.user?.role || "USER");
            return res.redirect("http://localhost:5173/profile");
        } catch (loginError) {
            return res.redirect("http://localhost:5173/login?error=google_auth_failed");
        }
    })(req, res, next);
};

export const loginUserController = async (req, res) => {
    const data = await loginUserService(req.body);
    setAuthCookies(res, data.accessToken, data.refreshToken, data?.user?.role || "USER");

    delete data.accessToken;
    delete data.refreshToken;

    return buildSuccessResponse(
        res,
        "User logged in successfully",
        data,
        200
    );
};

export const getRegisteredEmailsController = async (req, res) => {
    const data = await getRegisteredEmailsService();

    return buildSuccessResponse(
        res,
        "Registered emails fetched successfully",
        data,
        200
    );
};

export const requestPasswordResetController = async (req, res) => {
    const data = await requestPasswordResetService(req.body.email);

    return buildSuccessResponse(
        res,
        data.message,
        data,
        200
    );
};

export const resetPasswordWithOtpController = async (req, res) => {
    const data = await resetPasswordWithOtpService(req.body);

    return buildSuccessResponse(
        res,
        data.message,
        data,
        200
    );
};

export const logoutUserController = async (req, res) => {
    const refreshToken = req.cookies.userRefreshToken || req.cookies.organizerRefreshToken || req.cookies.adminRefreshToken || req.headers.authorization?.replace(/^Bearer\s+/i, "");

    await logoutUserService(refreshToken);
    clearAuthCookies(res);

    return buildSuccessResponse(
        res,
        "User logged out successfully",
        null,
        200
    );
};

export const currentUserController = async (req, res) => {
    const user = await getCurrentUserService(req.user.sub);

    return buildSuccessResponse(
        res,
        "Current user retrieved successfully",
        { user },
        200
    );
};

export const updateCurrentUserController = async (req, res) => {
    const user = await updateCurrentUserService(req.user.sub, req.body || {});

    return buildSuccessResponse(
        res,
        "Current user updated successfully",
        { user },
        200
    );
};

export const getSavedEventsController = async (req, res) => {
    const savedEvents = await getSavedEventsService(req.user.sub);

    return buildSuccessResponse(
        res,
        "Saved events retrieved successfully",
        { savedEvents },
        200
    );
};

export const toggleSavedEventController = async (req, res) => {
    const { eventId } = req.params;
    const result = await toggleSavedEventService(req.user.sub, eventId);

    return buildSuccessResponse(
        res,
        "Saved event updated successfully",
        result,
        200
    );
};

export const refreshTokenController = async (req, res) => {
    const refreshToken =
        readCookieValue(req, "userRefreshToken") ||
        readCookieValue(req, "organizerRefreshToken") ||
        readCookieValue(req, "adminRefreshToken") ||
        req.headers.authorization?.replace(/^Bearer\s+/i, "");
    try {
        const data = await refreshService(refreshToken);

        const activeCookieRole =
            readCookieValue(req, "userRefreshToken") ? "USER" :
            readCookieValue(req, "adminRefreshToken") ? "ADMIN" :
            readCookieValue(req, "organizerRefreshToken") ? "ORGANIZER" :
            (req.cookies?.userRefreshToken ? "USER" :
            req.cookies?.adminRefreshToken ? "ADMIN" : "ORGANIZER");

        const normalizedRole = String(activeCookieRole).trim().toUpperCase();
        const role = normalizedRole === "USER" ? "USER" : normalizedRole === "ADMIN" ? "ADMIN" : "ORGANIZER";

        if (role === "USER") {
            res.clearCookie("organizerAccessToken", { ...config.auth.cookie.organizer.accessToken, path: "/" });
            res.clearCookie("organizerRefreshToken", { ...config.auth.cookie.organizer.refreshToken, path: "/" });
            res.clearCookie("adminAccessToken", { ...config.auth.cookie.admin.accessToken, path: "/" });
            res.clearCookie("adminRefreshToken", { ...config.auth.cookie.admin.refreshToken, path: "/" });
            res.cookie("userAccessToken", data.accessToken, config.auth.cookie.user.accessToken);
            res.cookie("userRefreshToken", data.refreshToken, config.auth.cookie.user.refreshToken);
        } else if (role === "ADMIN") {
            res.clearCookie("userAccessToken", { ...config.auth.cookie.user.accessToken, path: "/" });
            res.clearCookie("userRefreshToken", { ...config.auth.cookie.user.refreshToken, path: "/" });
            res.clearCookie("organizerAccessToken", { ...config.auth.cookie.organizer.accessToken, path: "/" });
            res.clearCookie("organizerRefreshToken", { ...config.auth.cookie.organizer.refreshToken, path: "/" });
            res.cookie("adminAccessToken", data.accessToken, config.auth.cookie.admin.accessToken);
            res.cookie("adminRefreshToken", data.refreshToken, config.auth.cookie.admin.refreshToken);
        } else {
            res.clearCookie("userAccessToken", { ...config.auth.cookie.user.accessToken, path: "/" });
            res.clearCookie("userRefreshToken", { ...config.auth.cookie.user.refreshToken, path: "/" });
            res.clearCookie("adminAccessToken", { ...config.auth.cookie.admin.accessToken, path: "/" });
            res.clearCookie("adminRefreshToken", { ...config.auth.cookie.admin.refreshToken, path: "/" });
            res.cookie("organizerAccessToken", data.accessToken, config.auth.cookie.organizer.accessToken);
            res.cookie("organizerRefreshToken", data.refreshToken, config.auth.cookie.organizer.refreshToken);
        }

        return buildSuccessResponse(
            res,
            "Tokens refreshed successfully",
            {
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
            },
            200
        );
    } catch (error) {
        clearAuthCookies(res);
        return res.status(401).json({
            success: false,
            message: error?.message || "Invalid or expired refresh token",
        });
    }
};
