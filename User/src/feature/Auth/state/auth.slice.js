import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
    getCurrentUser,
    login,
    logout,
    registerOrganizer,
    registerUser,
} from "../api/auth.api.js";
import { connectSocketIfAuthenticated, socket } from "../../../app/config/socket.js";
import { hasPortalAuthCookie } from "./sessionGuard.js";

const hasPortalRole = (user, expectedRole) => {
    if (!user || typeof user !== "object") {
        return false;
    }

    const normalizedExpectedRole = String(expectedRole ?? "").trim().toUpperCase();
    if (!normalizedExpectedRole) {
        return false;
    }

    const candidateRoles = Array.isArray(user.roles)
        ? user.roles
        : Array.isArray(user.role)
            ? user.role
            : [user.role];

    return candidateRoles
        .filter(Boolean)
        .map((role) => String(role).trim().toUpperCase())
        .includes(normalizedExpectedRole);
};

const extractUserFromResponse = (payload) => {
    if (!payload || typeof payload !== "object") return null;

    const candidates = [
        payload.user,
        payload.data?.user,
        payload.data?.data?.user,
        payload.data,
        payload.result,
        payload.profile,
    ];

    for (const candidate of candidates) {
        if (!candidate || typeof candidate !== "object") continue;

        const hasIdentity =
            candidate.id ||
            candidate._id ||
            candidate.email ||
            candidate.username ||
            candidate.fullName ||
            candidate.name;

        if (hasIdentity) {
            return {
                ...candidate,
                raw: payload,
            };
        }
    }

    return null;
};

const clearAllPortalAuthState = () => {
    if (typeof window === "undefined") return;

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

    window.sessionStorage.removeItem("crt-admin-auth");
    window.sessionStorage.removeItem("crt-admin-user");
};

const initialState = {
    user: null,
    status: "idle",
    error: null,
};

export const bootstrapAuth = createAsyncThunk(
    "auth/bootstrap",
    async (_, { rejectWithValue }) => {
        try {
            const result = await getCurrentUser();
            const user = extractUserFromResponse(result);
            const safeUser = user && hasPortalRole(user, "USER") ? user : null;
            return safeUser;
        } catch (error) {
            if (error.status === 401 || error.status === 403 || error.status === 404) {
                return null;
            }

            return rejectWithValue(error.message);
        }
    }
);

export const loginUser = createAsyncThunk(
    "auth/login",
    async (credentials, { rejectWithValue }) => {
        try {
            const result = await login(credentials);
            const user = extractUserFromResponse(result);
            const safeUser = user && hasPortalRole(user, "USER") ? user : null;
            return safeUser;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const registerUserAccount = createAsyncThunk(
    "auth/registerUser",
    async (account, { rejectWithValue }) => {
        try {
            const result = await registerUser(account);
            const user = extractUserFromResponse(result);
            const safeUser = user && hasPortalRole(user, "USER") ? user : null;
            return safeUser;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const registerOrganizerAccount = createAsyncThunk(
    "auth/registerOrganizer",
    async (account, { rejectWithValue }) => {
        try {
            const result = await registerOrganizer(account);
            const user = extractUserFromResponse(result);
            const safeUser = user && hasPortalRole(user, "ORGANIZER") ? user : null;
            return safeUser;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

export const logoutUser = createAsyncThunk(
    "auth/logout",
    async (_, { rejectWithValue }) => {
        try {
            await logout();
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(bootstrapAuth.pending, (state) => {
                state.status = "loading";
            })
            .addCase(bootstrapAuth.fulfilled, (state, action) => {
                state.status = action.payload ? "authenticated" : "unauthenticated";
                state.user = action.payload;
                state.error = null;

                if (action.payload) {
                    connectSocketIfAuthenticated();
                } else if (socket.connected) {
                    socket.disconnect();
                }
            })
            .addCase(bootstrapAuth.rejected, (state, action) => {
                state.status = "unauthenticated";
                state.user = null;
                state.error = action.payload || "Unable to restore session";
            })
            .addCase(loginUser.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.status = action.payload ? "authenticated" : "unauthenticated";
                state.user = action.payload;

                if (action.payload) {
                    connectSocketIfAuthenticated();
                } else if (socket.connected) {
                    socket.disconnect();
                }
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.status = "unauthenticated";
                state.user = null;
                state.error = action.payload;
            })
            .addCase(registerUserAccount.fulfilled, (state, action) => {
                state.status = action.payload ? "authenticated" : "unauthenticated";
                state.user = action.payload;

                if (action.payload) {
                    connectSocketIfAuthenticated();
                } else if (socket.connected) {
                    socket.disconnect();
                }
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.status = "unauthenticated";
                state.user = null;
                clearAllPortalAuthState();
                if (socket.connected) {
                    socket.disconnect();
                }
                state.error = null;
            })
            .addCase(logoutUser.rejected, (state) => {
                state.status = "unauthenticated";
                state.user = null;
                clearAllPortalAuthState();
            });
    },
});

export default authSlice.reducer;
