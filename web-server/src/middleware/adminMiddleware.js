function adminMiddleware(req, res, next) {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Admin access is required'
        });
    }

    return next();
}

module.exports = adminMiddleware;
