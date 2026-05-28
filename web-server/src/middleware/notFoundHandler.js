function notFoundHandler(req, res) {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} was not found`
    });
}

module.exports = notFoundHandler;
