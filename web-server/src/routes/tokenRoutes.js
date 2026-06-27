const express = require('express');

const tokenController = require('../controllers/tokenController');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.post('/', asyncHandler(tokenController.createToken));

module.exports = router;
