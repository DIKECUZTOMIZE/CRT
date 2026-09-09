import apiClient, { API_ENDPOINTS, normalizeError } from "../../../app/config/axios.js";

export const getOrganizerEvents = async () => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.events);
    return response.data?.data?.events || [];
  } catch (error) {
    throw normalizeError(error);
  }
};

export const updateOrganizerEvent = async (eventId, eventData) => {
  try {
    const response = await apiClient.put(`${API_ENDPOINTS.events}/${eventId}`, eventData);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
};

export const deleteOrganizerEvent = async (eventId) => {
  try {
    const response = await apiClient.delete(`${API_ENDPOINTS.events}/${eventId}`);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
};
