import { createSlice } from "@reduxjs/toolkit";

const defaultLocation = {
  country: "India",
  state: "India",
  city: "All India",
  isSelected: false,
};

const safeReadLocation = () => ({ ...defaultLocation });

export const normalizeLocation = (payload = {}) => {
  const source = payload && typeof payload === "object" ? payload : {};
  const rawState = String(source.state ?? "").trim();
  const rawCity = String(source.city ?? "").trim();
  const hasMeaningfulSelection = Boolean(
    source.isSelected === true ||
    (rawState && rawState !== "India") ||
    (rawCity && rawCity !== "All India" && rawCity !== "India")
  );

  if (!hasMeaningfulSelection) {
    return safeReadLocation();
  }

  const nextState = rawState || "India";
  const nextCity = rawCity || "All India";

  return {
    country: "India",
    state: nextState === "India" ? "India" : nextState,
    city: nextCity && nextCity !== "India" ? nextCity : "All India",
    isSelected: true,
  };
};

export const hydrateLocationFromUser = (user = {}) => {
  if (!user || typeof user !== "object") {
    return safeReadLocation();
  }

  const directLocation = user.location && typeof user.location === "object" ? user.location : {};
  return normalizeLocation(directLocation);
};

const locationSlice = createSlice({
  name: "location",
  initialState: safeReadLocation(),
  reducers: {
    setUserLocation: (state, action) => {
      return normalizeLocation(action.payload);
    },
    syncUserLocation: (state, action) => {
      return normalizeLocation(action.payload);
    },
    resetUserLocation: () => {
      return safeReadLocation();
    },
  },
});

export const { setUserLocation, syncUserLocation, resetUserLocation } = locationSlice.actions;
export default locationSlice.reducer;
