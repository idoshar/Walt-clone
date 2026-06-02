const express = require('express');

const restaurantController = require('../controllers/restaurantController');
const productRoutes = require('./productRoutes');

const router = express.Router();

router.get('/', restaurantController.getAllRestaurants);
router.get('/:id', restaurantController.getRestaurantById);

router.use('/:id/products', productRoutes);

module.exports = router;