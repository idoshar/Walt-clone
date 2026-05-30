function errorHandler(err, req, res, next) {
    console.error(err);

    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        error: err.name || 'Internal Server Error',
        message: err.message || 'Unexpected server error'
    });
}

module.exports = errorHandler;
