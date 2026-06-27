const express = require('express');

const searchController = require('../controllers/searchController');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.get(
    '/:query',
    asyncHandler(searchController.searchRestaurantsAndProducts)
);

module.exports = router;
