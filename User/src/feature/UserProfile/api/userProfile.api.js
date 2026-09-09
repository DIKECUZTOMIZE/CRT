import apiClient, { API_ENDPOINTS, normalizeError } from "../../../app/config/axios.js";

export const getUserProfile = async () => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.currentUser);
    return response.data?.data?.user || response.data?.user || null;
  } catch (error) {
    throw normalizeError(error);
  }
};

export const getSavedEvents = async () => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.savedEvents);
    const savedEvents = response.data?.data?.savedEvents || response.data?.savedEvents || [];
    return Array.isArray(savedEvents) ? savedEvents : [];
  } catch (error) {
    throw normalizeError(error);
  }
};

export const updateUserProfile = async (payload = {}) => {
  try {
    const response = await apiClient.put(API_ENDPOINTS.updateCurrentUser, payload);
    return response.data?.data?.user || response.data?.user || null;
  } catch (error) {
    throw normalizeError(error);
  }
};

export const uploadUserAvatar = async (file) => {
  try {
    if (!file) {
      throw new Error("Image file is required");
    }

    const formData = new FormData();
    formData.append("image", file);

    const response = await apiClient.post(API_ENDPOINTS.uploadUserImage, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data?.data?.url || response.data?.url || "";
  } catch (error) {
    throw normalizeError(error);
  }
};

export const toggleSavedEvent = async (eventId) => {
  try {
    const response = await apiClient.post(`${API_ENDPOINTS.toggleSavedEvent}/${eventId}/toggle`);
    return response.data?.data || response.data || { isSaved: false, savedEventIds: [] };
  } catch (error) {
    throw normalizeError(error);
  }
};
