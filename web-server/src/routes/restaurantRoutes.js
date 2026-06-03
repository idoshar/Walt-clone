const express = require('express');

const restaurantController = require('../controllers/restaurantController');
const productRoutes = require('./productRoutes');

const router = express.Router();

router.post('/', restaurantController.createRestaurant);
router.get('/', restaurantController.getAllRestaurants);
router.get('/:id', restaurantController.getRestaurantById);
router.patch('/:id', restaurantController.updateRestaurant);
router.delete('/:id', restaurantController.deleteRestaurant);

router.use('/:id/products', productRoutes);

module.exports = router;