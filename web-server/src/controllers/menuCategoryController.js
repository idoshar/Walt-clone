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
const { validateObject } = require('../utilities/validationHelper');

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
            'A category with this name already exists for this restaurant'
        );
    }

    try {
        const category = await menuCategoryRepository.save({
            id: generateId(),
            restaurantId: req.params.id,
            name,
            normalizedName,
            menuType
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
                'A category with this name already exists for this restaurant'
            );
        }

        throw error;
    }
}

module.exports = {
    getAllMenuCategories,
    createMenuCategory
};