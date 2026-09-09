import { Router } from "express";

import { authMiddleware, requireRole } from "../../middleware/auth.middleware.js";
import asyncHandle from "../../shared/utils/asyncHandle.js";
import { buildSuccessResponse } from "../../shared/utils/buildSuccessResponse.js";
import { buildFailureResponse } from "../../shared/utils/buildFailureResponse.js";
import {
  createHomeSliderSlideService,
  deleteHomeSliderSlideService,
  getHomeSliderSlidesAdminService,
  getHomeSliderSlidesService,
  updateHomeSliderSlideService,
} from "./home-slider.service.js";

const homeSliderRouter = Router();

homeSliderRouter.get(
  "/",
  asyncHandle(async (_req, res) => {
    const slides = await getHomeSliderSlidesService();
    return buildSuccessResponse(res, "Home slider slides fetched successfully", slides, 200);
  })
);

homeSliderRouter.get(
  "/admin",
  authMiddleware,
  requireRole("ADMIN"),
  asyncHandle(async (_req, res) => {
    const slides = await getHomeSliderSlidesAdminService();
    return buildSuccessResponse(res, "Admin home slider slides fetched successfully", slides, 200);
  })
);

homeSliderRouter.post(
  "/",
  authMiddleware,
  requireRole("ADMIN"),
  asyncHandle(async (req, res) => {
    const slide = await createHomeSliderSlideService(req.body || {});
    return buildSuccessResponse(res, "Home slider slide created successfully", slide, 201);
  })
);

homeSliderRouter.put(
  "/:id",
  authMiddleware,
  requireRole("ADMIN"),
  asyncHandle(async (req, res) => {
    const slide = await updateHomeSliderSlideService(req.params.id, req.body || {});

    if (!slide) {
      return buildFailureResponse(res, "Slide not found", 404);
    }

    return buildSuccessResponse(res, "Home slider slide updated successfully", slide, 200);
  })
);

homeSliderRouter.delete(
  "/:id",
  authMiddleware,
  requireRole("ADMIN"),
  asyncHandle(async (req, res) => {
    const deleted = await deleteHomeSliderSlideService(req.params.id);

    if (!deleted) {
      return buildFailureResponse(res, "Slide not found", 404);
    }

    return buildSuccessResponse(res, "Home slider slide deleted successfully", null, 200);
  })
);

export default homeSliderRouter;
