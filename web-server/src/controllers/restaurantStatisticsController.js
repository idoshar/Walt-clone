const orderRepository = require('../repositories/orderRepository');
const restaurantRepository = require('../repositories/restaurantRepository');

function canManageRestaurant(req, restaurant) {
    const userId = req.user?.sub || req.user?.id;

    if (!restaurant.ownerId || !userId) {
        return false;
    }

    return String(restaurant.ownerId) === String(userId);
}

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

            if (!canManageRestaurant(req, restaurant)) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You can manage only your own restaurants'
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
