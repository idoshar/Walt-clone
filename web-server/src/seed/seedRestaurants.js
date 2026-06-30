const Restaurant = require('../models/Restaurant');
const { catalogRestaurants } = require('./restaurantCatalog');

async function seedRestaurants() {
    const createdCatalogRestaurantIds = [];

    for (const restaurant of catalogRestaurants) {
        const existingRestaurant = await Restaurant.findOne({
            id: restaurant.id
        }).lean();

        if (existingRestaurant) {
            continue;
        }

        await Restaurant.create(restaurant);
        createdCatalogRestaurantIds.push(String(restaurant.id));
    }

    return createdCatalogRestaurantIds;
}

module.exports = { seedRestaurants };
