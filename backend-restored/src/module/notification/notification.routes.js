import { Router } from "express";

import { authMiddleware } from "../../middleware/auth.middleware.js";
import asyncHandle from "../../shared/utils/asyncHandle.js";
import {
  getNotificationsController,
  markAllNotificationsReadController,
  markNotificationReadController,
} from "./notification.controller.js";

const notificationRouter = Router();

notificationRouter.use(authMiddleware);
notificationRouter.get("/", asyncHandle(getNotificationsController));
notificationRouter.patch("/read-all", asyncHandle(markAllNotificationsReadController));
notificationRouter.patch("/:notificationId/read", asyncHandle(markNotificationReadController));

export default notificationRouter;
