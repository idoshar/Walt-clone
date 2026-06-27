const restaurantRepository = require('../repositories/restaurantRepository');
const productRepository = require('../repositories/productRepository');

async function hasMenuItems(restaurant) {
    const products = await productRepository.findAllByRestaurant(restaurant.id);
    return products.length > 0;
}

async function searchRestaurantsAndProducts(req, res, next) {
    try {
        const query = String(req.params.query || '').trim();

        if (!query) {
            return res.status(400).json({
                error: 'Search query is required'
            });
        }

        const restaurants = restaurantRepository.search(query);
        const restaurantVisibility = await Promise.all(
            restaurants.map(async (restaurant) => ({
                restaurant,
                hasMenuItems: await hasMenuItems(restaurant)
            }))
        );

        const publicRestaurants = restaurantVisibility
            .filter(({ hasMenuItems: visible }) => visible)
            .map(({ restaurant }) => restaurant.toResponseObject());

        const products = await productRepository.search(query);

        return res.status(200).json({
            query,
            restaurants: publicRestaurants,
            products
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    searchRestaurantsAndProducts
};