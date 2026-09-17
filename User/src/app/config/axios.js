import axios from "axios";

const PROD_API_BASE_URL = "https://api.crtcompete.com";

const defaultApiBaseUrl = (() => {
    if (typeof window !== "undefined") {
        const hostname = window.location.hostname || "";
        const isLocalhost = ["localhost", "127.0.0.1"].includes(hostname);

        if (isLocalhost) {
            const origin = window.location.origin || "http://localhost:3000";
            return origin.replace(/:\d+$/, ":3000");
        }
    }

    return PROD_API_BASE_URL;
})();

export const API_BASE_URL = (
    import.meta.env.VITE_API_URL || defaultApiBaseUrl
).replace(/\/$/, "");

export const API_ENDPOINTS = Object.freeze({
    login: "/api/auth/login",
    register: "/api/auth/register",
    organizerRegister: "/api/auth/organizer/register",
    refresh: "/api/auth/refresh-token",
    logout: "/api/auth/logout",
    registeredEmails: "/api/auth/password-reset/emails",
    requestPasswordReset: "/api/auth/password-reset/request",
    resetPasswordWithOtp: "/api/auth/password-reset/confirm",
    currentUser: "/api/auth/current-user",
    updateCurrentUser: "/api/auth/current-user",
    uploadUserImage: "/api/upload/image",
    savedEvents: "/api/auth/saved-events",
    toggleSavedEvent: "/api/auth/saved-events",
    events: "/api/events",
    publicEvents: "/api/events/public",
    publicEventView: "/api/events/public",
    homeSlider: "/api/home-slider",
});

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

const authPaths = new Set([
    API_ENDPOINTS.login,
    API_ENDPOINTS.register,
    API_ENDPOINTS.organizerRegister,
    API_ENDPOINTS.refresh,
    API_ENDPOINTS.logout,
]);

const clearAuthState = () => {
    if (typeof window === "undefined") {
        return;
    }

    try {
        window.localStorage.removeItem("crt_auth_user");
        window.sessionStorage.removeItem("crt-admin-auth");
        window.sessionStorage.removeItem("crt-admin-user");
    } catch {
        // ignore storage access issues in restricted browser contexts
    }

    delete apiClient.defaults.headers.common.Authorization;
};

const redirectToLogin = () => {
    if (typeof window === "undefined") {
        return;
    }

    const currentPath = window.location.pathname || "/";
    if (currentPath === "/login" || currentPath === "/register") {
        return;
    }

    window.location.replace("/login");
};

let refreshRequest = null;

const shouldRefresh = (config) => {
    if (!config?.url || config?.method?.toLowerCase() === "options" || config?.skipAuthRefresh) {
        return false;
    }

    const pathname = new URL(config.url, API_BASE_URL).pathname;

    return !authPaths.has(pathname);
};

apiClient.interceptors.response.use(
    (response) => {
        const authPayload = response?.data?.data || response?.data || {};
        const accessToken = authPayload.accessToken;

        if (accessToken) {
            apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        }

        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest?._retry) {
            clearAuthState();
        }

        if (
            error.response?.status !== 401 ||
            !originalRequest ||
            originalRequest._retry ||
            !shouldRefresh(originalRequest)
        ) {
            if (error.response?.status === 401) {
                redirectToLogin();
            }
            return Promise.reject(normalizeError(error));
        }

        originalRequest._retry = true;

        try {
            refreshRequest ??= apiClient.post(
                API_ENDPOINTS.refresh,
                {},
                {
                    skipAuthRefresh: true,
                    withCredentials: true,
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            const refreshResponse = await refreshRequest;
            const refreshedPayload = refreshResponse?.data?.data || refreshResponse?.data || {};
            const nextAccessToken = refreshedPayload.accessToken;

            if (nextAccessToken) {
                apiClient.defaults.headers.common.Authorization = `Bearer ${nextAccessToken}`;
                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
                return apiClient(originalRequest);
            }

            clearAuthState();
            redirectToLogin();
            return Promise.reject(normalizeError(error));
        } catch (refreshError) {
            clearAuthState();
            redirectToLogin();
            return Promise.reject(normalizeError(refreshError));
        } finally {
            refreshRequest = null;
        }
    }
);

export const normalizeError = (error) => {
    const normalized = new Error(
        error.response?.data?.message || error.message || "Request failed"
    );

    normalized.status = error.response?.status;
    normalized.details = error.response?.data?.errors;
    normalized.response = error.response;

    return normalized;
};

export default apiClient;
