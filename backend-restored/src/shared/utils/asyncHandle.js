// async and controller hota hai
 const asyncHandler = (handler) => {
 
    return (req, res, next) => {
        handler(req, res, next).catch((err) => {
            next(err);
        })
    }
}

export default asyncHandler