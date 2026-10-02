import apiClient, { API_ENDPOINTS, normalizeError } from "../../../app/config/axios.js";

const getRelativeTime = (value) => {
  if (!value) return "Just now";

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Just now";

  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
};

const normalizeNotification = (notification = {}) => {
  if (!notification || typeof notification !== "object") {
    return null;
  }

  const payload = notification.data && typeof notification.data === "object" ? notification.data : notification;
  const id = payload._id || payload.id || "";
  const createdAt = payload.createdAt || payload.updatedAt || null;

  return {
    id: String(id),
    title: String(payload.title || "Notification"),
    message: String(payload.message || ""),
    time: getRelativeTime(createdAt),
    read: Boolean(payload.isRead ?? payload.read),
    link: String(payload.link || ""),
    metadata: payload.metadata || {},
    state: payload.state || payload.locationState || "",
    city: payload.city || payload.locationCity || "",
    raw: payload,
  };
};

export const getNotifications = async ({ page = 1, limit = 20 } = {}) => {
  try {
    const response = await apiClient.get(`${API_ENDPOINTS.notifications}?page=${page}&limit=${limit}`);
    const payload = response?.data?.data || {};
    const items = Array.isArray(payload.notifications) ? payload.notifications : [];

    return {
      notifications: items.map(normalizeNotification).filter(Boolean),
      total: Number(payload.total || 0),
      page: Number(payload.page || page || 1),
      limit: Number(payload.limit || limit || 20),
    };
  } catch (error) {
    throw normalizeError(error);
  }
};

export const markNotificationRead = async (notificationId) => {
  try {
    const response = await apiClient.patch(`${API_ENDPOINTS.markNotificationRead}/${notificationId}/read`);
    return response?.data?.data || response?.data || { modifiedCount: 0 };
  } catch (error) {
    throw normalizeError(error);
  }
};

export const markAllNotificationsRead = async () => {
  try {
    const response = await apiClient.patch(API_ENDPOINTS.markAllNotificationsRead);
    return response?.data?.data || response?.data || { modifiedCount: 0 };
  } catch (error) {
    throw normalizeError(error);
  }
};
