import { StatusCodes } from "http-status-codes";

import { logger } from "../config/logger.js";
import { buildFailureResponse } from "../shared/utils/buildFailureResponse.js";

const errorHandleMiddleware = (err, req, res, next) => {
    const statusCode =
        Number.isInteger(err?.statusCode) &&
        err.statusCode >= 400 &&
        err.statusCode < 600
            ? err.statusCode
            : StatusCodes.INTERNAL_SERVER_ERROR;

    const isProduction = process.env.NODE_ENV === "production";

    // ─────────────────────────────────────────────
    // Structured Error Logging
    // ─────────────────────────────────────────────
    logger.error(
        {
            err,
            requestId: req.requestId,
            method: req.method,
            url: req.originalUrl,
            statusCode,
        },
        err.message || "Unhandled application error"
    );

    // ─────────────────────────────────────────────
    // JWT Errors
    // ─────────────────────────────────────────────
    if (err.name === "TokenExpiredError") {
        return buildFailureResponse(
            res,
            "Token expired",
            StatusCodes.UNAUTHORIZED
        );
    }

    if (err.name === "JsonWebTokenError") {
        return buildFailureResponse(
            res,
            "Invalid token",
            StatusCodes.UNAUTHORIZED
        );
    }

    if (err.name === "NotBeforeError") {
        return buildFailureResponse(
            res,
            "Token is not active",
            StatusCodes.UNAUTHORIZED
        );
    }

    // ─────────────────────────────────────────────
    // Production Error Response
    // ─────────────────────────────────────────────
    const message =
        isProduction && statusCode >= 500
            ? "Internal server error"
            : err.message || "Something went wrong";

    return buildFailureResponse(
        res,
        message,
        statusCode
    );
};

export default errorHandleMiddleware;