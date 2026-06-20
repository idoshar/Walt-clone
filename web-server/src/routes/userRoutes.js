const express = require('express');

const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', userController.createUser);
router.patch('/me/location', authMiddleware, userController.updateCurrentUserLocation);
router.get('/:id', userController.getUserById);

module.exports = router;