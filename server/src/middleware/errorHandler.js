export const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Resource not found: ${req.method} ${req.originalUrl}`,
    });
};

export const errorHandler = (err, req, res, next) => {
    console.error('Server Exception:', err);

    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message || 'Internal Server Error';

    // Mongoose duplicate key error
    if (err.code === 11000) {
        statusCode = 400;
        message = 'Duplicate entry detected.';
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(val => val.message).join(', ');
    }

    res.status(statusCode).json({
        success: false,
        message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
};
