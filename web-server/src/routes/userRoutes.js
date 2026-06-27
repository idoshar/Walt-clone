const express = require('express');

const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.post('/', asyncHandler(userController.createUser));

router.patch(
    '/me/location',
    authMiddleware,
    asyncHandler(userController.updateCurrentUserLocation)
);

router.get('/:id', asyncHandler(userController.getUserById));

module.exports = router;
