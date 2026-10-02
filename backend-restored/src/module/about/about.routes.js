import { Router } from "express";

import asyncHandle from "../../shared/utils/asyncHandle.js";
import { buildSuccessResponse } from "../../shared/utils/buildSuccessResponse.js";
import { getAboutPageStatsService } from "./about.service.js";

const aboutRouter = Router();

aboutRouter.get(
  "/stats",
  asyncHandle(async (req, res) => {
    const stats = await getAboutPageStatsService();
    return buildSuccessResponse(res, "About page stats fetched successfully", stats, 200);
  })
);

export default aboutRouter;
