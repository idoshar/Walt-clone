const express = require('express');

const restaurantController =
    require('../controllers/restaurantController');
const restaurantAccessController =
    require('../controllers/restaurantAccessController');
const restaurantStatisticsController =
    require('../controllers/restaurantStatisticsController');
const productRoutes = require('./productRoutes');
const menuCategoryRoutes = require('./menuCategoryRoutes');
const authMiddleware = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.post(
    '/',
    authMiddleware,
    asyncHandler(restaurantController.createRestaurant)
);

router.get(
    '/mine',
    authMiddleware,
    asyncHandler(restaurantController.getMyRestaurants)
);

router.get(
    '/:id/access',
    authMiddleware,
    asyncHandler(restaurantAccessController.getAccess)
);

router.post(
    '/:id/editors',
    authMiddleware,
    asyncHandler(restaurantAccessController.addEditor)
);

router.delete(
    '/:id/editors/:userId',
    authMiddleware,
    asyncHandler(restaurantAccessController.removeEditor)
);

router.put(
    '/:id/owner',
    authMiddleware,
    asyncHandler(restaurantAccessController.transferOwnership)
);

router.get(
    '/:id/statistics',
    authMiddleware,
    asyncHandler(restaurantStatisticsController.getRestaurantStatistics)
);

router.get('/', asyncHandler(restaurantController.getAllRestaurants));

router.use('/:id/menu-categories', menuCategoryRoutes);
router.use('/:id/products', productRoutes);

router.get(
    '/:id',
    asyncHandler(restaurantController.getRestaurantById)
);

router.patch(
    '/:id',
    authMiddleware,
    asyncHandler(restaurantController.updateRestaurant)
);

router.delete(
    '/:id',
    authMiddleware,
    asyncHandler(restaurantController.deleteRestaurant)
);

module.exports = router;