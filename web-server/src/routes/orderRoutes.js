const express = require('express');
const orderController = require('../controllers/orderController');

const router = express.Router();

router.post('/', orderController.createOrder);
router.get('/', orderController.getUserOrders);
router.get('/:id', orderController.getOrderById);
router.patch('/:id', orderController.updateOrder);    
router.delete('/:id', orderController.deleteOrder);   

module.exports = router;
