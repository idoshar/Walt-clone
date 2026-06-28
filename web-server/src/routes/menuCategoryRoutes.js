const express = require('express');

const router = express.Router({ mergeParams: true });
const menuCategoryController =
    require('../controllers/menuCategoryController');
const authMiddleware = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/restaurants/:id/menu-categories
router.get(
    '/',
    asyncHandler(menuCategoryController.getAllMenuCategories)
);

// POST /api/restaurants/:id/menu-categories
router.post(
    '/',
    authMiddleware,
    asyncHandler(menuCategoryController.createMenuCategory)
);

module.exports = router;