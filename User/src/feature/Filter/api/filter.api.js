import apiClient, { API_ENDPOINTS, normalizeError } from "../../../app/config/axios.js";

const SECTION_PAGE_LIMIT = 50;
const SECTION_MAX_PAGES = 20;

const buildPublicEventParams = (filters = {}) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== "" && value !== false;
    })
  );

  if (params.participationType) {
    params.participationType = String(params.participationType).trim();
  }

  return params;
};

export const getAllPublicEvents = async (filters = {}) => {
  const baseParams = buildPublicEventParams(filters);
  const seenIds = new Set();
  const allEvents = [];

  for (let page = 1; page <= SECTION_MAX_PAGES; page += 1) {
    let payload;

    try {
      const response = await apiClient.get(API_ENDPOINTS.publicEvents, {
        params: { ...baseParams, page, limit: SECTION_PAGE_LIMIT },
      });
      payload = response.data?.data;
    } catch (error) {
      throw normalizeError(error);
    }

    const events = Array.isArray(payload?.events) ? payload.events : [];
    if (events.length === 0) break;

    events.forEach((event) => {
      const id = event?._id ?? event?.id;
      if (id === undefined || id === null || id === "") {
        allEvents.push(event);
        return;
      }

      const key = String(id);
      if (seenIds.has(key)) return;
      seenIds.add(key);
      allEvents.push(event);
    });

    const totalPages = Number(payload?.totalPages);
    if (!Number.isInteger(totalPages) || totalPages < 1 || page >= totalPages) break;
  }

  return allEvents;
};

export const getPublicEvents = async (filters = {}) => {
  try {
    const params = buildPublicEventParams(filters);

    const response = await apiClient.get(API_ENDPOINTS.publicEvents, { params });
    const events = response.data?.data?.events || response.data?.events || [];
    return Array.isArray(events) ? events : [];
  } catch (error) {
    throw normalizeError(error);
  }
};
