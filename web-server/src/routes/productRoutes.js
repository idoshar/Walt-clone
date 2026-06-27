const express = require('express');

const router = express.Router({ mergeParams: true });
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

// GET    /api/restaurants/:id/products
router.get('/', asyncHandler(productController.getAllProducts));

// POST   /api/restaurants/:id/products
router.post(
    '/',
    authMiddleware,
    asyncHandler(productController.createProduct)
);

// GET    /api/restaurants/:id/products/:pId/recommendations
router.get(
    '/:pId/recommendations',
    authMiddleware,
    asyncHandler(productController.getProductRecommendations)
);

// GET    /api/restaurants/:id/products/:pId
router.get('/:pId', asyncHandler(productController.getProductById));

// PATCH  /api/restaurants/:id/products/:pId
router.patch(
    '/:pId',
    authMiddleware,
    asyncHandler(productController.updateProduct)
);

// DELETE /api/restaurants/:id/products/:pId
router.delete(
    '/:pId',
    authMiddleware,
    asyncHandler(productController.deleteProduct)
);

module.exports = router;
