const express = require('express');

const restaurantController = require('../controllers/restaurantController');
const productRoutes = require('./productRoutes');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, restaurantController.createRestaurant);

router.get('/', restaurantController.getAllRestaurants);
router.get('/:id', restaurantController.getRestaurantById);
router.patch('/:id', authMiddleware, restaurantController.updateRestaurant);
router.delete('/:id', authMiddleware, restaurantController.deleteRestaurant);

router.use('/:id/products', productRoutes);

module.exports = router;