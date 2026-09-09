import apiClient, { API_ENDPOINTS, normalizeError } from "../../../app/config/axios.js";

export const getOrganizerEventDetails = async (eventId) => {
  try {
    const response = await apiClient.get(`${API_ENDPOINTS.events}/${eventId}`);
    return response.data?.data?.event || null;
  } catch (error) {
    throw normalizeError(error);
  }
};
