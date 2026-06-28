const express = require('express');

const menuCategoryController =
    require('../controllers/menuCategoryController');
const authMiddleware = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router({
    mergeParams: true
});

router.get(
    '/',
    asyncHandler(menuCategoryController.getAllMenuCategories)
);

router.post(
    '/',
    authMiddleware,
    asyncHandler(menuCategoryController.createMenuCategory)
);

router.patch(
    '/order',
    authMiddleware,
    asyncHandler(menuCategoryController.updateMenuCategoryOrder)
);

module.exports = router;