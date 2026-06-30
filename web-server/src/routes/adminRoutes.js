const express = require('express');

const adminRestaurantModerationController =
    require('../controllers/adminRestaurantModerationController');
const adminSponsorshipController =
    require('../controllers/adminSponsorshipController');
const adminStatisticsController =
    require('../controllers/adminStatisticsController');
const adminUserManagementController =
    require('../controllers/adminUserManagementController');
const passwordResetRequestController =
    require('../controllers/passwordResetRequestController');
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
    '/users',
    authMiddleware,
    adminMiddleware,
    asyncHandler(adminUserManagementController.getUsers)
);

router.delete(
    '/users/:id',
    authMiddleware,
    adminMiddleware,
    asyncHandler(adminUserManagementController.deleteUser)
);

router.patch(
    '/users/:id/status',
    authMiddleware,
    adminMiddleware,
    asyncHandler(adminUserManagementController.updateUserStatus)
);

router.patch(
    '/users/:id/password',
    authMiddleware,
    adminMiddleware,
    asyncHandler(adminUserManagementController.resetUserPassword)
);

router.patch(
    '/users/:id/role',
    authMiddleware,
    adminMiddleware,
    asyncHandler(adminUserManagementController.updateUserRole)
);

router.get(
    '/password-reset-requests',
    authMiddleware,
    adminMiddleware,
    asyncHandler(passwordResetRequestController.getAdminRequests)
);

router.patch(
    '/password-reset-requests/:id/approve',
    authMiddleware,
    adminMiddleware,
    asyncHandler(passwordResetRequestController.approveRequest)
);

router.patch(
    '/password-reset-requests/:id/reject',
    authMiddleware,
    adminMiddleware,
    asyncHandler(passwordResetRequestController.rejectRequest)
);

router.get(
    '/restaurants',
    authMiddleware,
    adminMiddleware,
    asyncHandler(adminRestaurantModerationController.getRestaurants)
);

router.get(
    '/restaurants/:id',
    authMiddleware,
    adminMiddleware,
    asyncHandler(adminRestaurantModerationController.getRestaurant)
);

router.put(
    '/restaurants/sponsorship-order',
    authMiddleware,
    adminMiddleware,
    asyncHandler(adminSponsorshipController.replaceSponsorshipOrder)
);

router.patch(
    '/restaurants/:id/sponsorship',
    authMiddleware,
    adminMiddleware,
    asyncHandler(adminSponsorshipController.updateRestaurantSponsorship)
);

router.patch(
    '/restaurants/:id',
    authMiddleware,
    adminMiddleware,
    asyncHandler(adminRestaurantModerationController.updateRestaurant)
);

router.delete(
    '/restaurants/:id',
    authMiddleware,
    adminMiddleware,
    asyncHandler(adminRestaurantModerationController.deleteRestaurant)
);

router.get(
    '/statistics',
    authMiddleware,
    adminMiddleware,
    asyncHandler(adminStatisticsController.getAdminStatistics)
);

module.exports = router;