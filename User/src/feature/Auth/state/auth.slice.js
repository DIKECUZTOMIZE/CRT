import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
    getCurrentUser,
    login,
    logout,
    registerOrganizer,
    registerUser,
} from "../api/auth.api.js";
import { getPortalStoredUser } from "./sessionGuard.js";

const AUTH_STORAGE_KEY = "crt_auth_user";

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

    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.sessionStorage.removeItem("crt-admin-auth");
    window.sessionStorage.removeItem("crt-admin-user");
};

const readStoredUser = () => {
    if (typeof window === "undefined") return null;

    const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return getPortalStoredUser(rawValue, "USER");
};

const writeStoredUser = (user) => {
    if (typeof window === "undefined") return;

    if (!user) {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
        return;
    }

    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
};

const initialState = {
    user: readStoredUser(),
    status: readStoredUser() ? "authenticated" : "idle",
    error: null,
};

export const bootstrapAuth = createAsyncThunk(
    "auth/bootstrap",
    async (_, { rejectWithValue }) => {
        try {
            const result = await getCurrentUser();
            const user = extractUserFromResponse(result);
            const safeUser = user && String(user.role || "").trim().toUpperCase() === "USER" ? user : null;
            writeStoredUser(safeUser);
            return safeUser;
        } catch (error) {
            if (error.status === 401 || error.status === 403 || error.status === 404) {
                clearAllPortalAuthState();
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
            const safeUser = user && String(user.role || "").trim().toUpperCase() === "USER" ? user : null;
            writeStoredUser(safeUser);
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
            const safeUser = user && String(user.role || "").trim().toUpperCase() === "USER" ? user : null;
            writeStoredUser(safeUser);
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
            const safeUser = user && String(user.role || "").trim().toUpperCase() === "ORGANIZER" ? user : null;
            writeStoredUser(safeUser);
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
                writeStoredUser(action.payload);
                state.error = null;
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
                state.status = "authenticated";
                state.user = action.payload;
                writeStoredUser(action.payload);
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.status = "unauthenticated";
                state.user = null;
                state.error = action.payload;
            })
            .addCase(registerUserAccount.fulfilled, (state, action) => {
                state.status = "authenticated";
                state.user = action.payload;
                writeStoredUser(action.payload);
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.status = "unauthenticated";
                state.user = null;
                clearAllPortalAuthState();
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
