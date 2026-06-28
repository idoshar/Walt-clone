const MenuCategory = require('../models/MenuCategory');

const DEFAULT_MENU_TYPE_SORT_ORDERS =
    MenuCategory.DEFAULT_MENU_TYPE_SORT_ORDERS;

function normalizeRestaurantId(restaurantId) {
    return String(restaurantId);
}

function normalizeCategoryId(categoryId) {
    return String(categoryId);
}

function getDefaultSortOrder(menuType) {
    return DEFAULT_MENU_TYPE_SORT_ORDERS[menuType] || 900;
}

function normalizeSortOrder(value, fallbackSortOrder) {
    const numericValue = Number(value);

    if (
        Number.isSafeInteger(numericValue) &&
        numericValue >= 0
    ) {
        return numericValue;
    }

    return fallbackSortOrder;
}

function toResponseObject(category) {
    if (!category) {
        return null;
    }

    return {
        id: category.id,
        restaurantId: category.restaurantId,
        name: category.name,
        menuType: category.menuType,
        sortOrder: normalizeSortOrder(
            category.sortOrder,
            getDefaultSortOrder(category.menuType)
        )
    };
}

function sortCategories(categories) {
    return categories
        .map(toResponseObject)
        .sort(
            (firstCategory, secondCategory) =>
                firstCategory.sortOrder - secondCategory.sortOrder ||
                firstCategory.name.localeCompare(secondCategory.name) ||
                firstCategory.id.localeCompare(secondCategory.id)
        );
}

async function findAllByRestaurant(restaurantId) {
    const categories = await MenuCategory.find({
        restaurantId: normalizeRestaurantId(restaurantId)
    }).lean();

    return sortCategories(categories);
}

async function findById(restaurantId, categoryId) {
    const category = await MenuCategory.findOne({
        restaurantId: normalizeRestaurantId(restaurantId),
        id: normalizeCategoryId(categoryId)
    }).lean();

    return toResponseObject(category);
}

async function findByNormalizedName(restaurantId, normalizedName) {
    const category = await MenuCategory.findOne({
        restaurantId: normalizeRestaurantId(restaurantId),
        normalizedName
    }).lean();

    return toResponseObject(category);
}

async function save(category) {
    const savedCategory = await MenuCategory.create({
        id: normalizeCategoryId(category.id),
        restaurantId: normalizeRestaurantId(category.restaurantId),
        name: category.name,
        normalizedName: category.normalizedName,
        menuType: category.menuType,
        sortOrder: normalizeSortOrder(
            category.sortOrder,
            getDefaultSortOrder(category.menuType)
        )
    });

    return toResponseObject(savedCategory.toObject());
}

async function updateOrder(restaurantId, categoryIds) {
    const normalizedRestaurantId = normalizeRestaurantId(restaurantId);

    await MenuCategory.bulkWrite(
        categoryIds.map((categoryId, index) => ({
            updateOne: {
                filter: {
                    restaurantId: normalizedRestaurantId,
                    id: normalizeCategoryId(categoryId)
                },
                update: {
                    $set: {
                        sortOrder: (index + 1) * 10
                    }
                }
            }
        }))
    );

    return findAllByRestaurant(normalizedRestaurantId);
}

async function removeAllByRestaurant(restaurantId) {
    await MenuCategory.deleteMany({
        restaurantId: normalizeRestaurantId(restaurantId)
    });
}

module.exports = {
    findAllByRestaurant,
    findById,
    findByNormalizedName,
    save,
    updateOrder,
    removeAllByRestaurant,
    getDefaultSortOrder
};