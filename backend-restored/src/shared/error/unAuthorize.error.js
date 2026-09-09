import { StatusCodes } from "http-status-codes";

import { AppError } from "./appError.js";

export class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized") {
        super(message, StatusCodes.UNAUTHORIZED);
    }
}