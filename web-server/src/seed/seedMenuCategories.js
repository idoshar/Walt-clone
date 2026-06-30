const MenuCategory = require('../models/MenuCategory');
const {
    catalogMenuCategories
} = require('./restaurantCatalog');

async function seedMenuCategories(createdCatalogRestaurantIds = []) {
    const restaurantIdsToSeed = new Set(
        createdCatalogRestaurantIds.map((restaurantId) => String(restaurantId))
    );

    for (const category of catalogMenuCategories) {
        if (!restaurantIdsToSeed.has(String(category.restaurantId))) {
            continue;
        }

        const existingCategory = await MenuCategory.findOne({
            id: category.id
        }).lean();

        if (existingCategory) {
            continue;
        }

        await MenuCategory.create(category);
    }
}

module.exports = {
    seedMenuCategories
};
