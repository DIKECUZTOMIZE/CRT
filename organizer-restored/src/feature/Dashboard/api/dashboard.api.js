import apiClient, { API_ENDPOINTS, normalizeError } from "../../../app/config/axios.js";

export const getOrganizerDashboardEvents = async () => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.events);
    return response.data?.data?.events || [];
  } catch (error) {
    throw normalizeError(error);
  }
};
