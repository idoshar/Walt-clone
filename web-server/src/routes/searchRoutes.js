const express = require('express');

const searchController = require('../controllers/searchController');

const router = express.Router();

router.get('/:query', searchController.searchRestaurantsAndProducts);

module.exports = router;
