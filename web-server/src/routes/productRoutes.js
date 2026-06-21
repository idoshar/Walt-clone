const express = require('express');

const router = express.Router({ mergeParams: true });
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');

// GET    /api/restaurants/:id/products
router.get('/', productController.getAllProducts);

// POST   /api/restaurants/:id/products
router.post('/', authMiddleware, productController.createProduct);

// GET    /api/restaurants/:id/products/:pId/recommendations
router.get(
    '/:pId/recommendations',
    authMiddleware,
    productController.getProductRecommendations
);

// GET    /api/restaurants/:id/products/:pId
router.get('/:pId', productController.getProductById);

// PATCH  /api/restaurants/:id/products/:pId
router.patch('/:pId', authMiddleware, productController.updateProduct);

// DELETE /api/restaurants/:id/products/:pId
router.delete('/:pId', authMiddleware, productController.deleteProduct);

module.exports = router;
