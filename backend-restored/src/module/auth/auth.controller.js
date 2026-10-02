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
    organizerHandoffService,
} from "./auth.service.js";
import {
    createGoogleOAuthState,
    getGoogleOAuthPortal,
    validateGoogleOAuthState,
    OAUTH_PORTALS,
} from "./oauth.state.js";

const getCookieSetForRole = (role) => {
    const normalizedRole = String(role ?? "").trim().toUpperCase();
    if (normalizedRole === "USER") {
        return config.auth.cookie.user;
    }
    return config.auth.cookie.organizer;
};

export const resolvePortalCookieRole = (req, fallbackRole = "USER") => {
    const explicitPortal = String(
        req?.body?.portal ||
        req?.query?.portal ||
        req?.headers?.["x-portal"] ||
        ""
    ).trim().toLowerCase();

    if (explicitPortal === "organizer") return "ORGANIZER";
    if (explicitPortal === "admin") return "ADMIN";
    if (explicitPortal === "user") return "USER";

    const origin = String(req?.headers?.origin || req?.headers?.referer || "").toLowerCase();
    if (/5174|admin/i.test(origin)) return "ADMIN";
    if (/5175|organizer/i.test(origin)) return "ORGANIZER";

    // When a request comes without an explicit portal marker, prefer the safe default User portal.
    // A mixed-role user can have an organizer primary role, and using that as the cookie fallback
    // would incorrectly set organizer cookies during User login.
    return "USER";
};

const getCookieSetForRequest = (req) => {
    const requestRole = resolvePortalCookieRole(req, "USER");

    if (requestRole === "ADMIN") {
        return config.auth.cookie.admin;
    }

    if (requestRole === "ORGANIZER") {
        return config.auth.cookie.organizer;
    }

    return config.auth.cookie.user;
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

const getFrontendRedirectUrl = (path, portal = "user") => {
    const baseUrl = portal === "organizer"
        ? String(config.app.organizerFrontendUrl || config.app.frontendUrl || "http://localhost:5175").replace(/\/+$/, "")
        : String(config.app.frontendUrl || "http://localhost:5173").replace(/\/+$/, "");

    return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
};

const getGoogleLoginRedirect = async (req, res, portal) => {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CALLBACK_URL) {
        return res.status(500).json({
            success: false,
            message: "Google auth is not configured",
        });
    }

    const portalKey = getGoogleOAuthPortal(portal);
    const state = await createGoogleOAuthState(portalKey);

    const authOptions = {
        scope: ["profile", "email"],
        prompt: "consent",
        accessType: "offline",
        state,
    };

    return passport.authenticate("google", authOptions)(req, res, () => {});
};

const getGoogleLoginService = () => globalThis.__CRT_GOOGLE_LOGIN_SERVICE || googleLoginService;

export const googleLoginController = async (req, res, next) => {
    const requestedPortal = String(req.query?.portal || "user").trim().toLowerCase();

    if (requestedPortal === "organizer") {
        return getGoogleLoginRedirect(req, res, OAUTH_PORTALS.ORGANIZER);
    }

    return getGoogleLoginRedirect(req, res, OAUTH_PORTALS.USER);
};

export const googleCallbackController = async (req, res, next) => {
    const state = String(req.query?.state || "").trim();
    const portalFromRequest = String(req.query?.portal || "").trim().toLowerCase();
    const validation = await validateGoogleOAuthState(state, portalFromRequest || undefined);

    if (!validation.valid) {
        const redirectPortal = portalFromRequest === "organizer" ? "organizer" : "user";
        const loginPath = redirectPortal === "organizer" ? "/organizer/login" : "/login";
        return res.redirect(getFrontendRedirectUrl(loginPath, redirectPortal) + "?error=google_auth_failed");
    }

    req.googleOAuthStateValidation = validation;

    return new Promise((resolve) => {
        passport.authenticate("google", { session: false }, async (error, user) => {
            if (error || !user) {
                const redirectPortal = validation.portal === OAUTH_PORTALS.ORGANIZER ? "organizer" : "user";
                const loginPath = redirectPortal === "organizer" ? "/organizer/login" : "/login";
                res.redirect(getFrontendRedirectUrl(loginPath, redirectPortal) + "?error=google_auth_failed");
                return resolve();
            }

            try {
                const normalizedRole = String(user.role ?? "").trim().toUpperCase();
                const roles = Array.isArray(user.roles) ? user.roles.map((role) => String(role ?? "").trim().toUpperCase()) : [];
                const isAdmin = normalizedRole === "ADMIN" || roles.includes("ADMIN");
                const isOrganizer = normalizedRole === "ORGANIZER" || roles.includes("ORGANIZER");
                const isUser = normalizedRole === "USER" || roles.includes("USER");
                const requestedPortal = validation.portal || portalFromRequest || OAUTH_PORTALS.USER;

                if (isAdmin) {
                    const loginPath = "/login";
                    res.redirect(getFrontendRedirectUrl(loginPath, "user") + "?error=admin_google_oauth_not_allowed");
                    return resolve();
                }

                if (requestedPortal === OAUTH_PORTALS.ORGANIZER) {
                    if (!isOrganizer && !roles.includes("USER")) {
                        res.redirect(getFrontendRedirectUrl("/organizer/login", "organizer") + "?error=organizer_access_required");
                        return resolve();
                    }

                    if (!isOrganizer && roles.includes("USER")) {
                        res.redirect(getFrontendRedirectUrl("/organizer/login", "organizer") + "?error=organizer_access_required");
                        return resolve();
                    }

                    const data = await getGoogleLoginService()({ user });
                    setAuthCookies(res, data.accessToken, data.refreshToken, "ORGANIZER");
                    res.redirect(getFrontendRedirectUrl("/organizer/dashboard", "organizer"));
                    return resolve();
                }

                if (requestedPortal === OAUTH_PORTALS.USER) {
                    if (isOrganizer && (normalizedRole === "ORGANIZER" || roles.includes("ORGANIZER"))) {
                        const data = await getGoogleLoginService()({ user });
                        setAuthCookies(res, data.accessToken, data.refreshToken, "USER");
                        res.redirect(getFrontendRedirectUrl("/profile", "user"));
                        return resolve();
                    }

                    if (!isUser && !isOrganizer) {
                        const data = await getGoogleLoginService()({ user });
                        setAuthCookies(res, data.accessToken, data.refreshToken, "USER");
                        res.redirect(getFrontendRedirectUrl("/profile", "user"));
                        return resolve();
                    }

                    const data = await getGoogleLoginService()({ user });
                    setAuthCookies(res, data.accessToken, data.refreshToken, "USER");
                    res.redirect(getFrontendRedirectUrl("/profile", "user"));
                    return resolve();
                }

                res.redirect(getFrontendRedirectUrl("/login", "user") + "?error=google_auth_failed");
                return resolve();
            } catch (loginError) {
                const redirectPortal = validation.portal === OAUTH_PORTALS.ORGANIZER ? "organizer" : "user";
                const loginPath = redirectPortal === "organizer" ? "/organizer/login" : "/login";
                res.redirect(getFrontendRedirectUrl(loginPath, redirectPortal) + "?error=google_auth_failed");
                return resolve();
            }
        })(req, res, next);
    });
};

export const loginUserController = async (req, res) => {
    const data = await loginUserService(req.body);
    const portalRole = resolvePortalCookieRole(req, "USER");

    setAuthCookies(res, data.accessToken, data.refreshToken, portalRole);

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

export const organizerHandoffController = async (req, res) => {
    const data = await organizerHandoffService(req.user.sub);
    setAuthCookies(res, data.accessToken, data.refreshToken, "ORGANIZER");

    delete data.accessToken;
    delete data.refreshToken;

    return buildSuccessResponse(
        res,
        "Organizer handoff successful",
        { user: data.user, authorized: true },
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
