import { StatusCodes } from "http-status-codes";

import {
  getUserNotificationsService,
  markAllNotificationsReadService,
  markNotificationReadService,
} from "./notification.service.js";
import { buildSuccessResponse } from "../../shared/utils/buildSuccessResponse.js";

export const getNotificationsController = async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const unreadOnly = req.query.unreadOnly === "true" || req.query.unreadOnly === "1";

  const payload = await getUserNotificationsService(req.user.sub, {
    page,
    limit,
    unreadOnly,
  });

  return buildSuccessResponse(
    res,
    "Notifications retrieved successfully",
    payload,
    StatusCodes.OK
  );
};

export const markNotificationReadController = async (req, res) => {
  const payload = await markNotificationReadService(req.params.notificationId, req.user.sub);

  return buildSuccessResponse(
    res,
    "Notification marked as read",
    payload,
    StatusCodes.OK
  );
};

export const markAllNotificationsReadController = async (req, res) => {
  const payload = await markAllNotificationsReadService(req.user.sub);

  return buildSuccessResponse(
    res,
    "All notifications marked as read",
    payload,
    StatusCodes.OK
  );
};
