const express = require('express');
const router = express.Router({ mergeParams: true });
const productController = require('../controllers/productController');

// GET    /api/restaurants/:id/products
router.get('/', productController.getAllProducts);

// POST   /api/restaurants/:id/products
router.post('/', productController.createProduct);

// GET    /api/restaurants/:id/products/:pId
router.get('/:pId', productController.getProductById);

// PATCH  /api/restaurants/:id/products/:pId
router.patch('/:pId', productController.updateProduct);

// DELETE /api/restaurants/:id/products/:pId
router.delete('/:pId', productController.deleteProduct);

module.exports = router;
