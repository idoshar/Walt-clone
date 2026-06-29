const orderRepository = require('../repositories/orderRepository');
const restaurantRepository = require('../repositories/restaurantRepository');

const {
    canManageRestaurant,
    getRequestUserId
} = require('../services/restaurantAccessService');

class RestaurantStatisticsController {
    async getRestaurantStatistics(req, res, next) {
        try {
            const restaurant = await restaurantRepository.findById(
                req.params.id
            );

            if (!restaurant) {
                return res.status(404).json({
                    error: 'Restaurant not found'
                });
            }

            if (!canManageRestaurant(restaurant, getRequestUserId(req))) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message:
                        'You can manage only restaurants where you are an owner or editor'
                });
            }

            const statistics =
                await orderRepository.getRestaurantSalesStatistics(
                    restaurant.id
                );

            return res.status(200).json(statistics);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new RestaurantStatisticsController();
