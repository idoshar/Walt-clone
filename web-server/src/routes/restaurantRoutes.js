const express = require('express');

const restaurantController =
    require('../controllers/restaurantController');
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