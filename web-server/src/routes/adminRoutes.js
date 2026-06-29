const express = require('express');
const adminStatisticsController = require('../controllers/adminStatisticsController');

const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

router.get('/me', authMiddleware, adminMiddleware, (req, res) => {
    return res.status(200).json({
        id: req.user.sub,
        username: req.user.username,
        fullName: req.user.fullName,
        role: req.user.role
    });
});

router.get(
    '/statistics',
    authMiddleware,
    adminMiddleware,
    adminStatisticsController.getAdminStatistics
);

module.exports = router;
