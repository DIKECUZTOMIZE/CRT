import { Router } from "express";

import { authMiddleware, requireRole } from "../../middleware/auth.middleware.js";
import { validate } from "../../validator/validate.js";
import asyncHandle from "../../shared/utils/asyncHandle.js";
import { createEventSchema, updateEventSchema } from "../../schema/event.schema.js";
import {
    createEventController,
    deleteEventController,
    getOrganizerEventByIdController,
    getOrganizerEventsController,
    getPublicEventByIdController,
    getPublicEventsController,
    incrementEventViewsController,
    rateEventController,
    updateEventController,
} from "./event.controller.js";

const eventRouter = Router();

eventRouter.get("/public", asyncHandle(getPublicEventsController));
eventRouter.get("/public/:id", asyncHandle(getPublicEventByIdController));
eventRouter.post("/public/:id/view", asyncHandle(incrementEventViewsController));
eventRouter.post(
    "/public/:id/rate",
    authMiddleware,
    requireRole("USER", "ORGANIZER", "ADMIN"),
    asyncHandle(rateEventController)
);

eventRouter.use(authMiddleware, requireRole("ORGANIZER", "ADMIN"));

eventRouter.get("/", asyncHandle(getOrganizerEventsController));
eventRouter.get("/:id", asyncHandle(getOrganizerEventByIdController));
eventRouter.post(
    "/",
    validate(createEventSchema),
    asyncHandle(createEventController)
);
eventRouter.put(
    "/:id",
    validate(updateEventSchema),
    asyncHandle(updateEventController)
);
eventRouter.delete("/:id", asyncHandle(deleteEventController));

export default eventRouter;
