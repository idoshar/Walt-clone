const menuCategoryRepository =
    require('../repositories/menuCategoryRepository');
const restaurantRepository =
    require('../repositories/restaurantRepository');
const { MENU_TYPES } = require('../models/MenuCategory');
const { generateId } = require('../utilities/idGenerator');
const {
    ok,
    badRequest,
    notFound
} = require('../utilities/responseHelper');
const { validateObject } =
    require('../utilities/validationHelper');

function normalizeCategoryName(value) {
    if (typeof value !== 'string') {
        return '';
    }

    return value.trim().replace(/\s+/g, ' ');
}

function normalizeMenuType(value) {
    if (typeof value !== 'string') {
        return '';
    }

    return value.trim().toLowerCase();
}

function normalizeOrderedCategoryIds(categoryIds) {
    if (!Array.isArray(categoryIds)) {
        return {
            error: 'categoryIds must be an array'
        };
    }

    const normalizedCategoryIds = categoryIds.map((categoryId) =>
        typeof categoryId === 'string'
            ? categoryId.trim()
            : ''
    );

    if (normalizedCategoryIds.some((categoryId) => !categoryId)) {
        return {
            error: 'categoryIds must contain only non-empty strings'
        };
    }

    if (
        new Set(normalizedCategoryIds).size !==
        normalizedCategoryIds.length
    ) {
        return {
            error: 'categoryIds must not contain duplicates'
        };
    }

    return {
        value: normalizedCategoryIds
    };
}

async function findRestaurant(req, res) {
    const restaurant = await restaurantRepository.findById(req.params.id);

    if (!restaurant) {
        notFound(res, 'Restaurant not found');
        return null;
    }

    return restaurant;
}

function canManageRestaurant(req, restaurant) {
    const userId = req.user?.sub || req.user?.id;

    return Boolean(
        restaurant.ownerId &&
        userId &&
        String(restaurant.ownerId) === String(userId)
    );
}

async function requireManagedRestaurant(req, res) {
    const restaurant = await findRestaurant(req, res);

    if (!restaurant) {
        return null;
    }

    if (!canManageRestaurant(req, restaurant)) {
        res.status(403).json({
            error: 'Forbidden',
            message: 'You can manage only your own restaurants'
        });

        return null;
    }

    return restaurant;
}

async function getAllMenuCategories(req, res) {
    if (!(await findRestaurant(req, res))) {
        return;
    }

    const categories =
        await menuCategoryRepository.findAllByRestaurant(req.params.id);

    return ok(res, categories);
}

async function createMenuCategory(req, res) {
    if (!(await requireManagedRestaurant(req, res))) {
        return;
    }

    const bodyError = validateObject(req.body);

    if (bodyError) {
        return badRequest(res, bodyError);
    }

    const name = normalizeCategoryName(req.body.name);
    const menuType = normalizeMenuType(req.body.menuType);

    if (!name) {
        return badRequest(res, 'name is required');
    }

    if (!MENU_TYPES.includes(menuType)) {
        return badRequest(
            res,
            `menuType must be one of: ${MENU_TYPES.join(', ')}`
        );
    }

    const normalizedName = name.toLowerCase();

    const existingCategory =
        await menuCategoryRepository.findByNormalizedName(
            req.params.id,
            normalizedName
        );

    if (existingCategory) {
        return badRequest(
            res,
            'A category with this name already exists in this restaurant'
        );
    }

    try {
        const category = await menuCategoryRepository.save({
            id: generateId(),
            restaurantId: req.params.id,
            name,
            normalizedName,
            menuType,
            sortOrder: menuCategoryRepository.getDefaultSortOrder(
                menuType
            )
        });

        return res
            .status(201)
            .location(
                `/api/restaurants/${req.params.id}/menu-categories/${category.id}`
            )
            .json(category);
    } catch (error) {
        if (error?.code === 11000) {
            return badRequest(
                res,
                'A category with this name already exists in this restaurant'
            );
        }

        throw error;
    }
}

async function updateMenuCategoryOrder(req, res) {
    if (!(await requireManagedRestaurant(req, res))) {
        return;
    }

    const bodyError = validateObject(req.body);

    if (bodyError) {
        return badRequest(res, bodyError);
    }

    const orderInput = normalizeOrderedCategoryIds(req.body.categoryIds);

    if (orderInput.error) {
        return badRequest(res, orderInput.error);
    }

    const currentCategories =
        await menuCategoryRepository.findAllByRestaurant(req.params.id);

    if (currentCategories.length === 0) {
        return badRequest(res, 'This restaurant has no categories to reorder');
    }

    if (orderInput.value.length !== currentCategories.length) {
        return badRequest(
            res,
            'categoryIds must include every category in this restaurant exactly once'
        );
    }

    const currentCategoryIds = new Set(
        currentCategories.map((category) => String(category.id))
    );

    const containsUnknownCategory = orderInput.value.some(
        (categoryId) => !currentCategoryIds.has(String(categoryId))
    );

    if (containsUnknownCategory) {
        return badRequest(
            res,
            'categoryIds must include only categories from this restaurant'
        );
    }

    const updatedCategories =
        await menuCategoryRepository.updateOrder(
            req.params.id,
            orderInput.value
        );

    return ok(res, updatedCategories);
}

module.exports = {
    getAllMenuCategories,
    createMenuCategory,
    updateMenuCategoryOrder
};