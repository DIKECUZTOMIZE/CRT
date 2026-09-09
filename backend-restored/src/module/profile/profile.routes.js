import { Router } from "express";

import { authMiddleware, requireRole } from "../../middleware/auth.middleware.js";
import asyncHandle from "../../shared/utils/asyncHandle.js";
import {
  getOrganizerProfileController,
  updateOrganizerProfileController,
} from "./profile.controller.js";

const profileRouter = Router();

profileRouter.use(authMiddleware, requireRole("ORGANIZER", "ADMIN"));
profileRouter.get("/", asyncHandle(getOrganizerProfileController));
profileRouter.put("/", asyncHandle(updateOrganizerProfileController));

export default profileRouter;
