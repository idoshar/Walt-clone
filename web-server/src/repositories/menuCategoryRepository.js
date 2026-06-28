const MenuCategory = require('../models/MenuCategory');

function normalizeRestaurantId(restaurantId) {
    return String(restaurantId);
}

function normalizeCategoryId(categoryId) {
    return String(categoryId);
}

function toResponseObject(category) {
    if (!category) {
        return null;
    }

    return {
        id: category.id,
        restaurantId: category.restaurantId,
        name: category.name,
        menuType: category.menuType
    };
}

async function findAllByRestaurant(restaurantId) {
    const categories = await MenuCategory.find({
        restaurantId: normalizeRestaurantId(restaurantId)
    })
        .sort({ menuType: 1, name: 1, _id: 1 })
        .lean();

    return categories.map(toResponseObject);
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
        menuType: category.menuType
    });

    return toResponseObject(savedCategory.toObject());
}

async function removeAllByRestaurant(restaurantId) {
    await MenuCategory.deleteMany({
        restaurantId: normalizeRestaurantId(restaurantId)
    });
}

module.exports = {
    findAllByRestaurant,
    findByNormalizedName,
    save,
    removeAllByRestaurant
};