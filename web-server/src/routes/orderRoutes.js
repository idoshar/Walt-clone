const express = require('express');

const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.use(authMiddleware);

router.post('/', asyncHandler(orderController.createOrder));
router.get('/', asyncHandler(orderController.getUserOrders));
router.get('/:id', asyncHandler(orderController.getOrderById));
router.patch('/:id', asyncHandler(orderController.updateOrder));
router.delete('/:id', asyncHandler(orderController.deleteOrder));

module.exports = router;
