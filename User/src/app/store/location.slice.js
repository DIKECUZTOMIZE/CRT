import { createSlice } from "@reduxjs/toolkit";

const STORAGE_KEY = "crt-user-location";

const defaultLocation = {
  country: "India",
  state: "India",
  city: "All India",
  isSelected: false,
};

const safeReadLocation = () => {
  if (typeof window === "undefined") {
    return defaultLocation;
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultLocation;

    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object") return defaultLocation;

    return {
      country: "India",
      state: parsed.state || "India",
      city: parsed.city || "All India",
      isSelected: Boolean(parsed.isSelected),
    };
  } catch {
    return defaultLocation;
  }
};

const persistLocation = (location) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  } catch {
    // Ignore persistence failures silently.
  }
};

const normalizeLocation = (payload = {}) => {
  const nextState = payload.state || "India";
  const nextCity = payload.city || "All India";

  return {
    country: "India",
    state: nextState === "India" ? "India" : nextState,
    city: nextCity && nextCity !== "India" ? nextCity : "All India",
    isSelected: nextState !== "India" || nextCity !== "All India",
  };
};

const locationSlice = createSlice({
  name: "location",
  initialState: safeReadLocation(),
  reducers: {
    setUserLocation: (state, action) => {
      const normalized = normalizeLocation(action.payload);
      Object.assign(state, normalized);
      persistLocation(normalized);
    },
    syncUserLocation: (state, action) => {
      const normalized = normalizeLocation(action.payload);
      Object.assign(state, normalized);
      persistLocation(normalized);
    },
    resetUserLocation: (state) => {
      const reset = { ...defaultLocation };
      Object.assign(state, reset);
      persistLocation(reset);
    },
  },
});

export const { setUserLocation, syncUserLocation, resetUserLocation } = locationSlice.actions;
export default locationSlice.reducer;
