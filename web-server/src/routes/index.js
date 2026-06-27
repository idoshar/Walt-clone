const express = require('express');

const userRoutes = require('./userRoutes');
const tokenRoutes = require('./tokenRoutes');
const restaurantRoutes = require('./restaurantRoutes');
const searchRoutes = require('./searchRoutes');
const orderRoutes = require('./orderRoutes');
const adminRoutes = require('./adminRoutes');

const router = express.Router();

router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'food-delivery-api'
    });
});

router.use('/users', userRoutes);
router.use('/tokens', tokenRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/search', searchRoutes);
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
