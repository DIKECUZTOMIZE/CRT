export class AppError extends Error {
    constructor(
        message = "Something went wrong",
        statusCode = 500,
        details = null
    ) {
        super(message);

        this.name = "AppError";
        this.statusCode = statusCode;
        this.success = false;
        this.details = details;

        Error.captureStackTrace(this, this.constructor);
    }
}