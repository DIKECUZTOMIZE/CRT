import apiClient, { API_ENDPOINTS, normalizeError } from "../../../app/config/axios.js";
import { normalizeAuthResponse } from "./responseUtils.js";

const post = async (endpoint, data) => {
  try {
    const response = await apiClient.post(endpoint, data);
    return normalizeAuthResponse(response);
  } catch (error) {
    throw normalizeError(error);
  }
};

export const login = (credentials) => post(API_ENDPOINTS.login, credentials);

export const registerOrganizer = (account) =>
  post(API_ENDPOINTS.organizerRegister, account);

export const getRegisteredEmails = async () => {
  try {
    const response = await apiClient.get("/api/auth/password-reset/emails");
    return normalizeAuthResponse(response);
  } catch (error) {
    throw normalizeError(error);
  }
};

export const requestPasswordReset = (payload) =>
  post("/api/auth/password-reset/request", payload);

export const resetPasswordWithOtp = (payload) =>
  post("/api/auth/password-reset/confirm", payload);

export const logout = async () => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.logout);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.currentUser);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
};
