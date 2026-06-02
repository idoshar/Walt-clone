const express = require('express');

const userRoutes = require('./userRoutes');
const tokenRoutes = require('./tokenRoutes');

const router = express.Router();

router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'food-delivery-api'
    });
});

router.use('/users', userRoutes);
router.use('/tokens', tokenRoutes);

module.exports = router;
