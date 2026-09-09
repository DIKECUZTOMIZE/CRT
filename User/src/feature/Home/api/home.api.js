import apiClient, { API_ENDPOINTS, normalizeError } from "../../../app/config/axios.js";

export const getPublicEvents = async (filters = {}, pagination = {}) => {
  try {
    const params = new URLSearchParams();

    if (filters?.state && filters.state !== "India") {
      params.set("state", filters.state);
    }

    if (filters?.city && filters.city !== "All India") {
      params.set("city", filters.city);
    }

    if (filters?.search && String(filters.search).trim()) {
      params.set("search", String(filters.search).trim());
    }

    if (filters?.category && String(filters.category).trim() !== "all") {
      params.set("category", String(filters.category).trim());
    }

    const page = Number(pagination.page) || 1;
    const limit = Math.max(1, Math.min(50, Number(pagination.limit) || 12));
    params.set("page", String(page));
    params.set("limit", String(limit));

    const queryString = params.toString();
    const response = await apiClient.get(`${API_ENDPOINTS.publicEvents}${queryString ? `?${queryString}` : ""}`);
    const payload = response.data?.data || {};
    const events = Array.isArray(payload.events) ? payload.events : [];

    return {
      events,
      page: Number(payload.page) || page,
      limit: Number(payload.limit) || limit,
      total: Number(payload.total) || 0,
      totalPages: Number(payload.totalPages) || 1,
    };
  } catch (error) {
    throw normalizeError(error);
  }
};
