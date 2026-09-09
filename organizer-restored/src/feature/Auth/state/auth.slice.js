import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { getCurrentUser, login, logout, registerOrganizer } from "../api/auth.api.js";
import { isOrganizerRole } from "../../../app/utils/roleUtils.js";

const extractUserFromResponse = (payload) => {
  if (!payload) return null;
  if (payload.user) return payload.user;
  if (payload.data && payload.data.user) return payload.data.user;
  return null;
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
      return isOrganizerRole(user?.role) ? user : null;
    } catch (error) {
      if (error.status === 401) {
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
      if (!isOrganizerRole(user?.role)) {
        return rejectWithValue("This account does not have organizer access");
      }
      return user;
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
      if (!isOrganizerRole(user?.role)) {
        return rejectWithValue("This account does not have organizer access");
      }
      return user;
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
        state.error = null;
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.status = action.payload ? "authenticated" : "unauthenticated";
        state.user = action.payload;
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
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "unauthenticated";
        state.user = null;
        state.error = action.payload;
      })
      .addCase(registerOrganizerAccount.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(registerOrganizerAccount.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.user = action.payload;
        state.error = null;
      })
      .addCase(registerOrganizerAccount.rejected, (state, action) => {
        state.status = "unauthenticated";
        state.user = null;
        state.error = action.payload;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.status = "unauthenticated";
        state.user = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.status = "unauthenticated";
        state.user = null;
        state.error = action.payload || "Logout failed";
      });
  },
});

export default authSlice.reducer;
