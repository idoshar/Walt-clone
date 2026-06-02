const restaurantRepository = require('../repositories/restaurantRepository');

class RestaurantController {
    getAllRestaurants(req, res, next) {
        try {
            const restaurants = restaurantRepository.getAll
                ? restaurantRepository.getAll()
                : restaurantRepository.findAll();

            res.status(200).json(
                restaurants.map((restaurant) => restaurant.toResponseObject())
            );
        } catch (err) {
            next(err);
        }
    }

    getRestaurantById(req, res, next) {
        try {
            const restaurant = restaurantRepository.findById(req.params.id);

            if (!restaurant) {
                return res.status(404).json({
                    error: 'Restaurant not found'
                });
            }

            return res.status(200).json(restaurant.toResponseObject());
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new RestaurantController();