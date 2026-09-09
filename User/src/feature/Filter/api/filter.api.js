import apiClient, { API_ENDPOINTS, normalizeError } from "../../../app/config/axios.js";

export const getPublicEvents = async (filters = {}) => {
  try {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => {
        if (Array.isArray(value)) return value.length > 0;
        return value !== undefined && value !== null && value !== "" && value !== false;
      })
    );

    if (params.participationType) {
      params.participationType = String(params.participationType).trim();
    }

    const response = await apiClient.get(API_ENDPOINTS.publicEvents, { params });
    const events = response.data?.data?.events || response.data?.events || [];
    return Array.isArray(events) ? events : [];
  } catch (error) {
    throw normalizeError(error);
  }
};
