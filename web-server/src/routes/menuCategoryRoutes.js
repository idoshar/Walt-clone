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

router.patch(
    '/:categoryId',
    authMiddleware,
    asyncHandler(menuCategoryController.updateMenuCategory)
);

router.delete(
    '/:categoryId',
    authMiddleware,
    asyncHandler(menuCategoryController.deleteMenuCategory)
);

module.exports = router;