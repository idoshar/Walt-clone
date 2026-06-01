const express = require('express');

const userRoutes = require('./userRoutes');

const router = express.Router();

router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'food-delivery-api'
    });
});

router.use('/users', userRoutes);

module.exports = router;
