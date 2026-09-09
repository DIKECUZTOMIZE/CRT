import apiClient, {
    API_ENDPOINTS,
    normalizeError,
} from "../../../app/config/axios.js";
import { normalizeAuthResponse } from "./responseUtils.js";

const post = async (endpoint, data) => {
    try {
        const response = await apiClient.post(endpoint, data);
        return normalizeAuthResponse(response);
    } catch (error) {
        throw normalizeError(error);
    }
};

export const login = (credentials) =>
    post(API_ENDPOINTS.login, credentials);

export const registerUser = (account) =>
    post(API_ENDPOINTS.register, account);

export const registerOrganizer = (account) =>
    post(API_ENDPOINTS.organizerRegister, account);

export const getRegisteredEmails = async () => {
    try {
        const response = await apiClient.get(API_ENDPOINTS.registeredEmails);
        return normalizeAuthResponse(response);
    } catch (error) {
        throw normalizeError(error);
    }
};

export const requestPasswordReset = (payload) =>
    post(API_ENDPOINTS.requestPasswordReset, payload);

export const resetPasswordWithOtp = (payload) =>
    post(API_ENDPOINTS.resetPasswordWithOtp, payload);

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
