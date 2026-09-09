export const buildFailureResponse = (
    res,
    message = "Something went wrong",
    statusCode = 400,
    errors = null
) => {
    return res.status(statusCode).json({
        success: false,
        message,
        statusCode,
        ...(errors && { errors }),
    });
};