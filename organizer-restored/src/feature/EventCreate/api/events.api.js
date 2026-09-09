import apiClient, { normalizeError } from "../../../app/config/axios.js";

export const uploadEventImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await apiClient.post("/api/upload/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data?.data?.url;
  } catch (error) {
    throw normalizeError(error);
  }
};

export const getEventById = async (eventId) => {
  try {
    const response = await apiClient.get(`/api/events/${eventId}`);
    return response.data?.data?.event || null;
  } catch (error) {
    throw normalizeError(error);
  }
};

export const createEvent = async (eventData) => {
  try {
    const response = await apiClient.post("/api/events", eventData);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
};

export const updateEvent = async (eventId, eventData) => {
  try {
    const response = await apiClient.put(`/api/events/${eventId}`, eventData);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
};

export const deleteEvent = async (eventId) => {
  try {
    const response = await apiClient.delete(`/api/events/${eventId}`);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
};
