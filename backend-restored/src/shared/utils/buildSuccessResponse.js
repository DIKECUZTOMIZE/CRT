export const buildSuccessResponse = (
    res,
    message = "Success",
    data = null,
    statusCode = 200
) => {
    return res.status(statusCode).json({
        success: true,
        message,
        statusCode,
        ...(data !== null && { data }),
    });
};