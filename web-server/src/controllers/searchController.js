const restaurantRepository = require('../repositories/restaurantRepository');
const productRepository = require('../repositories/productRepository');

function hasMenuItems(restaurant) {
    return productRepository.findAllByRestaurant(restaurant.id).length > 0;
}

function searchRestaurantsAndProducts(req, res) {
    const query = String(req.params.query || '').trim();

    if (!query) {
        return res.status(400).json({
            error: 'Search query is required'
        });
    }

    const restaurants = restaurantRepository
        .search(query)
        .filter(hasMenuItems)
        .map((restaurant) => restaurant.toResponseObject());

    const products = productRepository.search(query);

    return res.status(200).json({
        query,
        restaurants,
        products
    });
}

module.exports = {
    searchRestaurantsAndProducts
};
