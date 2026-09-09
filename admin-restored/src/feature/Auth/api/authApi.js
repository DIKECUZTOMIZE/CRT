import { normalizeAuthResponse } from "./responseUtils.js";

const API_BASE_URL = "http://localhost:3000";

const jsonFetch = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
};

const clearAllPortalAuthCookies = () => {
  const cookieNames = [
    "userAccessToken",
    "userRefreshToken",
    "organizerAccessToken",
    "organizerRefreshToken",
    "adminAccessToken",
    "adminRefreshToken",
  ];

  cookieNames.forEach((cookieName) => {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
  });
};

export const loginAdmin = async (payload) => {
  const data = await jsonFetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const normalized = normalizeAuthResponse(data);
  const user = normalized?.data?.user || normalized?.user || null;

  clearAllPortalAuthCookies();

  if (typeof window !== "undefined") {
    window.localStorage.removeItem("crt_auth_user");
  }

  sessionStorage.setItem("crt-admin-auth", "true");
  if (user) {
    sessionStorage.setItem("crt-admin-user", JSON.stringify(user));
  }

  return normalized;
};

export const logoutAdmin = async () => {
  try {
    await jsonFetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
    });
  } finally {
    clearAllPortalAuthCookies();
    sessionStorage.removeItem("crt-admin-auth");
    sessionStorage.removeItem("crt-admin-user");

    if (typeof window !== "undefined") {
      window.localStorage.removeItem("crt_auth_user");
    }
  }
};

export const getCurrentAdmin = async () => {
  const data = await jsonFetch(`${API_BASE_URL}/api/auth/current-user`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  return data?.data?.user || data?.user || null;
};

export const getRegisteredEmails = async () => {
  const data = await jsonFetch(`${API_BASE_URL}/api/auth/password-reset/emails`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  return normalizeAuthResponse(data);
};

export const requestPasswordReset = async (payload) => {
  const data = await jsonFetch(`${API_BASE_URL}/api/auth/password-reset/request`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return normalizeAuthResponse(data);
};

export const resetPasswordWithOtp = async (payload) => {
  const data = await jsonFetch(`${API_BASE_URL}/api/auth/password-reset/confirm`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return normalizeAuthResponse(data);
};
