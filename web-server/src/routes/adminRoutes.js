const express = require('express');
const adminStatisticsController =
    require('../controllers/adminStatisticsController');
const adminSponsorshipController =
    require('../controllers/adminSponsorshipController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get(
    '/me',
    authMiddleware,
    adminMiddleware,
    (req, res) => {
        res.json({
            id: req.user.sub,
            username: req.user.username,
            fullName: req.user.fullName,
            role: req.user.role
        });
    }
);

router.get(
    '/restaurants',
    authMiddleware,
    adminMiddleware,
    asyncHandler(adminSponsorshipController.getRestaurants)
);

router.patch(
    '/restaurants/:id/sponsorship',
    authMiddleware,
    adminMiddleware,
    asyncHandler(adminSponsorshipController.updateRestaurantSponsorship)
);

router.get(
    '/statistics',
    authMiddleware,
    adminMiddleware,
    adminStatisticsController.getAdminStatistics
);

module.exports = router;
