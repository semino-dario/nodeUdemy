const ErrorHandler = require('../utils/errorHandler')

const { captureStackTrace } = require("../utils/errorHandler")

module.exports = async (err, req, res, next) => {

    let error


    //Wrong mongoose Object id error
    if (err.name === 'CastError') {
        const message = `Resource not found. Invalid: ${err.path}`
        error = 404
        return (
            res.status(404).json({
                success: false,
                errMessage: message,
            })
        )
    }

    //Handling Mongoose validation error

    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(value => value.message)
        error = 400

        return (
            res.status(400).json({
                success: false,
                errMessage: message,
            })
        )
    }

    //Handle mongoose duplicate key error
    if (err.code === 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} entered.`
        //error = new ErrorHandler(message, 400)
        return (res.status(400).json({
            success: false,
            errMessage: message,
        }))

    }

    //Handle wrong JWT token error
    if (err.name === 'JsonWebTokenError') {
        const message = 'JSON web token is invalid. Try again';
        error = new ErrorHandler(message, 500);
    }

    //Handle JWT expired
    if (err.name === 'TokenExpiredError') {
        const message = 'JSON Web Token is expired, try again';
        error = new ErrorHandler(message, 500);
    }

    if (res.status(500)) {
        const message = `Internal server error - ${err}`;

        console.log(err)

        return (res.status(500).json({
            success: false,
            errMessage: message
        }))

    }
}