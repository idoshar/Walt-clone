const asyncHandler = require('../middleware/asyncHandler');
const {
    getExchangeRates
} = require('../services/currencyService');

const getCurrencyRates = asyncHandler(async (req, res) => {
    const currencyRates = await getExchangeRates();

    res.status(200).json(currencyRates);
});

module.exports = {
    getCurrencyRates
};
