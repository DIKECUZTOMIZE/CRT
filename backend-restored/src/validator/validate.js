import { StatusCodes } from "http-status-codes";

import { buildFailureResponse } from "../shared/utils/buildFailureResponse.js";

export const validate = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse({
            body: req.body,
            params: req.params,
            query: req.query,
        });

        if (!result.success) {
            return buildFailureResponse(
                res,
                "Validation failed",
                StatusCodes.BAD_REQUEST,
                result.error.issues
            );
        }

        req.validated = result.data;
        req.body = result.data.body;
        req.params = result.data.params;

        next();
    };
};
