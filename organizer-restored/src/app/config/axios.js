import axios from "axios";

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

export const API_ENDPOINTS = Object.freeze({
  login: "/api/auth/login",
  organizerRegister: "/api/auth/organizer/register",
  refresh: "/api/auth/refresh-token",
  logout: "/api/auth/logout",
  currentUser: "/api/auth/current-user",
  organizerProfile: "/api/profile",
  events: "/api/events",
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
  API_ENDPOINTS.organizerRegister,
  API_ENDPOINTS.refresh,
  API_ENDPOINTS.logout,
]);

let refreshRequest = null;

const shouldRefresh = (config) => {
  if (!config?.url || config?.method?.toLowerCase() === "options" || config?.skipAuthRefresh) {
    return false;
  }

  const pathname = new URL(config.url, API_BASE_URL).pathname;
  return !authPaths.has(pathname) && pathname !== API_ENDPOINTS.currentUser;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      !shouldRefresh(originalRequest)
    ) {
      return Promise.reject(normalizeError(error));
    }

    originalRequest._retry = true;

    try {
      refreshRequest ??= apiClient.post(
        API_ENDPOINTS.refresh,
        {},
        {
          skipAuthRefresh: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      await refreshRequest;
      return apiClient(originalRequest);
    } catch (refreshError) {
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
