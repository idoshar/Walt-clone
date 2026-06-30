const express = require('express');

const passwordResetRequestController =
    require('../controllers/passwordResetRequestController');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.post(
    '/',
    asyncHandler(passwordResetRequestController.submitRequest)
);

module.exports = router;