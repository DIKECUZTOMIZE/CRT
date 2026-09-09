import { Router } from "express";

import { authMiddleware, requireRole } from "../../middleware/auth.middleware.js";
import asyncHandle from "../../shared/utils/asyncHandle.js";
import { buildSuccessResponse } from "../../shared/utils/buildSuccessResponse.js";
import {
  createAdminOrganizerService,
  createAdminUserService,
  deleteAdminOrganizerService,
  deleteAdminUserService,
  getAdminDashboardDataService,
  getAdminOrganizerByIdService,
  getAdminOrganizersService,
  getAdminUserByIdService,
  getAdminUsersService,
  updateAdminOrganizerService,
  updateAdminUserService,
} from "./admin.service.js";

const adminRouter = Router();

adminRouter.get(
  "/dashboard",
  authMiddleware,
  requireRole("ADMIN"),
  asyncHandle(async (req, res) => {
    const data = await getAdminDashboardDataService();
    return buildSuccessResponse(res, "Admin dashboard data fetched successfully", data, 200);
  })
);

adminRouter.get(
  "/users",
  authMiddleware,
  requireRole("ADMIN"),
  asyncHandle(async (req, res) => {
    const role = String(req.query.role || "").toUpperCase();
    const users = await getAdminUsersService(role === "USER" || role === "ORGANIZER" ? role : null);
    return buildSuccessResponse(res, "Admin users fetched successfully", users, 200);
  })
);

adminRouter.get(
  "/users/:id",
  authMiddleware,
  requireRole("ADMIN"),
  asyncHandle(async (req, res) => {
    const user = await getAdminUserByIdService(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return buildSuccessResponse(res, "Admin user fetched successfully", { user }, 200);
  })
);

adminRouter.get(
  "/organizers",
  authMiddleware,
  requireRole("ADMIN"),
  asyncHandle(async (req, res) => {
    const organizers = await getAdminOrganizersService();
    return buildSuccessResponse(res, "Admin organizers fetched successfully", organizers, 200);
  })
);

adminRouter.get(
  "/organizers/:id",
  authMiddleware,
  requireRole("ADMIN"),
  asyncHandle(async (req, res) => {
    const organizer = await getAdminOrganizerByIdService(req.params.id);
    if (!organizer) {
      return res.status(404).json({ success: false, message: "Organizer not found" });
    }
    return buildSuccessResponse(res, "Admin organizer fetched successfully", { organizer }, 200);
  })
);

adminRouter.post(
  "/users",
  authMiddleware,
  requireRole("ADMIN"),
  asyncHandle(async (req, res) => {
    const user = await createAdminUserService(req.body || {});
    return buildSuccessResponse(res, "User created successfully", { user }, 201);
  })
);

adminRouter.put(
  "/users/:id",
  authMiddleware,
  requireRole("ADMIN"),
  asyncHandle(async (req, res) => {
    const user = await updateAdminUserService(req.params.id, req.body || {});
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return buildSuccessResponse(res, "User updated successfully", { user }, 200);
  })
);

adminRouter.post(
  "/organizers",
  authMiddleware,
  requireRole("ADMIN"),
  asyncHandle(async (req, res) => {
    const organizer = await createAdminOrganizerService(req.body || {});
    return buildSuccessResponse(res, "Organizer created successfully", { organizer }, 201);
  })
);

adminRouter.put(
  "/organizers/:id",
  authMiddleware,
  requireRole("ADMIN"),
  asyncHandle(async (req, res) => {
    const organizer = await updateAdminOrganizerService(req.params.id, req.body || {});
    if (!organizer) {
      return res.status(404).json({ success: false, message: "Organizer not found" });
    }
    return buildSuccessResponse(res, "Organizer updated successfully", { organizer }, 200);
  })
);

adminRouter.delete(
  "/users/:id",
  authMiddleware,
  requireRole("ADMIN"),
  asyncHandle(async (req, res) => {
    const deleted = await deleteAdminUserService(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return buildSuccessResponse(res, "User deleted successfully", null, 200);
  })
);

adminRouter.delete(
  "/organizers/:id",
  authMiddleware,
  requireRole("ADMIN"),
  asyncHandle(async (req, res) => {
    const deleted = await deleteAdminOrganizerService(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Organizer not found" });
    }
    return buildSuccessResponse(res, "Organizer deleted successfully", null, 200);
  })
);

export default adminRouter;
