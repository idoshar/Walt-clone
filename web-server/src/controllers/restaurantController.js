const restaurantRepository = require('../repositories/restaurantRepository');
const restaurantRepository = require('../repositories/restaurantRepository');
const Restaurant = require('../models/Restaurant');
const { generateId } = require('../utilities/idGenerator');
const { validateObject, validateRequiredFields } = require('../utilities/validationHelper');

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
    createRestaurant(req, res, next) {
        try {
            const objectError = validateObject(req.body);

            if (objectError) {
                return responseHelper.badRequest(res, objectError);
            }

            const requiredError = validateRequiredFields(req.body, ['name']);

            if (requiredError) {
                return responseHelper.badRequest(res, 'Name is required');
            }

            const restaurant = new Restaurant({
                id: generateId(),
                name: req.body.name,
                address: req.body.address || '',
                phone: req.body.phone || '',
                cuisine: req.body.cuisine || '',
                description: req.body.description || ''
            });

            restaurantRepository.create(restaurant);

            return responseHelper.created(res, `/api/restaurants/${restaurant.id}`);
        } catch (err) {
            next(err);
        }
    }
    
}

module.exports = new RestaurantController();