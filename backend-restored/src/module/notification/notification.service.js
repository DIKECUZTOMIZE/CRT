import mongoose from "mongoose";

import NotificationModel from "../../model/notification.model.js";
import { getSocketServer } from "../../socket/socket.server.js";

const normalizeNotification = (notification = {}) => {
  const normalized = notification?.toObject ? notification.toObject() : { ...notification };

  return {
    _id: normalized._id ? String(normalized._id) : undefined,
    id: normalized._id ? String(normalized._id) : normalized.id || undefined,
    userId: normalized.userId ? String(normalized.userId) : undefined,
    title: String(normalized.title || ""),
    message: String(normalized.message || ""),
    type: String(normalized.type || "system"),
    isRead: Boolean(normalized.isRead),
    read: Boolean(normalized.isRead),
    link: String(normalized.link || ""),
    metadata: normalized.metadata || {},
    createdAt: normalized.createdAt || null,
    updatedAt: normalized.updatedAt || null,
  };
};

const isMongoReady = () => mongoose.connection.readyState === 1;

const ensureMongoForNotifications = (operationName = "notification operation") => {
  if (isMongoReady()) {
    return;
  }

  const message = `MongoDB must be connected before ${operationName}. In production this service does not use an in-memory fallback.`;

  if (process.env.NODE_ENV === "production") {
    throw new Error(`Production notification persistence failed: ${message}`);
  }

  throw new Error(message);
};

const emitUserNotificationUpdate = (userId, payload) => {
  const io = getSocketServer();
  if (!io || !userId) {
    return;
  }

  io.to(`user:${String(userId)}`).emit("notifications:updated", payload);
};

export const createNotificationService = async ({
  userId,
  title,
  message,
  type = "system",
  link = "",
  metadata = {},
} = {}) => {
  const normalizedUserId = userId ? String(userId) : "";
  const safeTitle = String(title || "").trim();
  const safeMessage = String(message || "").trim();

  if (!normalizedUserId || !safeTitle || !safeMessage) {
    throw new Error("Notification requires a user, title, and message.");
  }

  ensureMongoForNotifications("persisting notifications");

  const created = await NotificationModel.create({
    userId: normalizedUserId,
    title: safeTitle,
    message: safeMessage,
    type: String(type || "system"),
    link: String(link || ""),
    metadata: metadata || {},
  });

  const notification = normalizeNotification(created);
  emitUserNotificationUpdate(normalizedUserId, { type: "created", notification });
  return notification;
};

export const getUserNotificationsService = async (userId, options = {}) => {
  const normalizedUserId = userId ? String(userId) : "";
  const limit = Math.min(50, Math.max(1, Number(options.limit || 20)));
  const page = Math.max(1, Number(options.page || 1));

  if (!normalizedUserId) {
    return { notifications: [], total: 0, page, limit };
  }

  ensureMongoForNotifications("fetching notifications");

  const query = { userId: normalizedUserId };
  if (options.unreadOnly) {
    query.isRead = false;
  }

  const [notifications, total] = await Promise.all([
    NotificationModel.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    NotificationModel.countDocuments(query),
  ]);

  const normalizedNotifications = notifications.map((notification) => normalizeNotification(notification));

  return {
    notifications: normalizedNotifications,
    total,
    page,
    limit,
  };
};

export const markNotificationReadService = async (notificationId, userId) => {
  const normalizedNotificationId = notificationId ? String(notificationId) : "";
  const normalizedUserId = userId ? String(userId) : "";

  if (!normalizedNotificationId || !normalizedUserId) {
    return { modifiedCount: 0 };
  }

  ensureMongoForNotifications("marking notifications as read");

  const result = await NotificationModel.updateOne(
    { _id: normalizedNotificationId, userId: normalizedUserId },
    { $set: { isRead: true } }
  );

  if (result.modifiedCount > 0) {
    emitUserNotificationUpdate(normalizedUserId, { type: "read", notificationId: normalizedNotificationId });
  }

  return { modifiedCount: result.modifiedCount || 0 };
};
export const markAllNotificationsReadService = async (userId) => {
  const normalizedUserId = userId ? String(userId) : "";

  if (!normalizedUserId) {
    return { modifiedCount: 0 };
  }

  ensureMongoForNotifications("marking all notifications as read");

  const result = await NotificationModel.updateMany(
    { userId: normalizedUserId, isRead: false },
    { $set: { isRead: true } }
  );

  if (result.modifiedCount > 0) {
    emitUserNotificationUpdate(normalizedUserId, { type: "read-all" });
  }

  return { modifiedCount: result.modifiedCount || 0 };
};
