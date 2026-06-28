const express = require('express');

const restaurantController = require('../controllers/restaurantController');
const restaurantStatisticsController = require('../controllers/restaurantStatisticsController');
const productRoutes = require('./productRoutes');
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

router.use('/:id/products', productRoutes);

module.exports = router;
