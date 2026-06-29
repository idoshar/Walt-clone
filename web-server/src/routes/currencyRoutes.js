const express = require('express');

const {
    getCurrencyRates
} = require('../controllers/currencyController');

const router = express.Router();

router.get('/rates', getCurrencyRates);

module.exports = router;
