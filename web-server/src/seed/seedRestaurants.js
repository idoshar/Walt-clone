const Restaurant = require('../models/Restaurant');
const { catalogRestaurants } = require('./restaurantCatalog');

async function seedRestaurants() {
    for (const restaurant of catalogRestaurants) {
        const existingRestaurant = await Restaurant.findOne({
            id: restaurant.id
        }).lean();

        if (!existingRestaurant) {
            await Restaurant.create(restaurant);
            continue;
        }

        if (!existingRestaurant.isDefault) {
            continue;
        }

        await Restaurant.updateOne(
            { _id: existingRestaurant._id },
            { $set: restaurant }
        );
    }
}

module.exports = { seedRestaurants };
