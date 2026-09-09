import { Router } from "express";
import {
    currentUserController,
    getSavedEventsController,
    googleCallbackController,
    googleLoginController,
    loginUserController,
    logoutUserController,
    refreshTokenController,
    registerUserController,
    registerAdminController,
    registerOrganizerController,
    toggleSavedEventController,
    updateCurrentUserController,
    getRegisteredEmailsController,
    requestPasswordResetController,
    resetPasswordWithOtpController,
} from "./auth.controller.js";
import { validate } from "../../validator/validate.js";
import {
    adminRegisterSchema,
    loginSchema,
    organizerRegisterSchema,
    passwordResetConfirmSchema,
    passwordResetRequestSchema,
    registerSchema,
} from "../../schema/auth.schema.js";
import asyncHandle from "../../shared/utils/asyncHandle.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";


const authRouter = Router();

/**
 * Route for user registration.
 * @name POST /api/auth/register
 * @public
 */
authRouter.post(
    "/register",
    validate(registerSchema),
    asyncHandle(registerUserController),
);

authRouter.post(
    "/organizer/register",
    validate(organizerRegisterSchema),
    asyncHandle(registerOrganizerController)
);

authRouter.post(
    "/admin/register",
    validate(adminRegisterSchema),
    asyncHandle(registerAdminController)
);


/**
 * Route for user login.
 * @name POST /api/auth/login
 * @public
 */
authRouter.post("/login", validate(loginSchema), asyncHandle(loginUserController));

authRouter.get(
    "/password-reset/emails",
    asyncHandle(getRegisteredEmailsController)
);

authRouter.post(
    "/password-reset/request",
    validate(passwordResetRequestSchema),
    asyncHandle(requestPasswordResetController)
);

authRouter.post(
    "/password-reset/confirm",
    validate(passwordResetConfirmSchema),
    asyncHandle(resetPasswordWithOtpController)
);

authRouter.get("/google/login", googleLoginController);
authRouter.get("/google/callback", googleCallbackController);

/**
 * Route for user logout.
 * @name POST /api/auth/logout
 * @public
 */
authRouter.post("/logout", asyncHandle(logoutUserController));

/**
 * Route for refreshing access token and refresh token.
 * @name POST /api/auth/refresh-token
 * @public
 */
authRouter.post(
    "/refresh-token",
    asyncHandle(refreshTokenController)
);

authRouter.get(
    "/current-user",
    authMiddleware,
    asyncHandle(currentUserController)
);

authRouter.put(
    "/current-user",
    authMiddleware,
    asyncHandle(updateCurrentUserController)
);

authRouter.get(
    "/saved-events",
    authMiddleware,
    asyncHandle(getSavedEventsController)
);

authRouter.post(
    "/saved-events/:eventId/toggle",
    authMiddleware,
    asyncHandle(toggleSavedEventController)
);

export default authRouter;
