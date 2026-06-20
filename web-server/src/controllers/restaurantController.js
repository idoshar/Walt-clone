const responseHelper = require('../utilities/responseHelper');
const restaurantRepository = require('../repositories/restaurantRepository');
const Restaurant = require('../models/Restaurant');
const { generateId } = require('../utilities/idGenerator');
const { validateObject, validateRequiredFields } = require('../utilities/validationHelper');

function getLocationFields(body) {
    const hasLatitude = Object.prototype.hasOwnProperty.call(body, 'latitude');
    const hasLongitude = Object.prototype.hasOwnProperty.call(body, 'longitude');

    if (!hasLatitude && !hasLongitude) {
        return {
            coordinates: null
        };
    }

    if (!hasLatitude || !hasLongitude) {
        return {
            error: 'latitude and longitude must be provided together'
        };
    }

    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
        return {
            error: 'latitude must be a valid coordinate'
        };
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        return {
            error: 'longitude must be a valid coordinate'
        };
    }

    return {
        coordinates: {
            latitude,
            longitude
        }
    };
}

class RestaurantController {
    getAllRestaurants(req, res, next) {
        try {
            const restaurants = restaurantRepository.getAll
                ? restaurantRepository.getAll()
                : restaurantRepository.findAll();

            return responseHelper.ok(
                res,
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
                return responseHelper.notFound(res, 'Restaurant not found');
            }

            return responseHelper.ok(res, restaurant.toResponseObject());
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

            const locationResult = getLocationFields(req.body);

            if (locationResult.error) {
                return responseHelper.badRequest(res, locationResult.error);
            }

            const restaurant = new Restaurant({
                id: generateId(),
                name: req.body.name,
                address: req.body.address || '',
                phone: req.body.phone || '',
                cuisine: req.body.cuisine || '',
                description: req.body.description || '',
                ...(locationResult.coordinates || {})
            });

            restaurantRepository.create(restaurant);

            return responseHelper.created(res, `/api/restaurants/${restaurant.id}`);
        } catch (err) {
            next(err);
        }
    }

    updateRestaurant(req, res, next) {
        try {
            const objectError = validateObject(req.body);

            if (objectError) {
                return responseHelper.badRequest(res, objectError);
            }

            const locationResult = getLocationFields(req.body);

            if (locationResult.error) {
                return responseHelper.badRequest(res, locationResult.error);
            }

            const updates = {
                ...req.body,
                ...(locationResult.coordinates || {})
            };

            const restaurant = restaurantRepository.update(req.params.id, updates);

            if (!restaurant) {
                return responseHelper.notFound(res, 'Restaurant not found');
            }

            return responseHelper.noContent(res);
        } catch (err) {
            next(err);
        }
    }

    deleteRestaurant(req, res, next) {
        try {
            const deleted = restaurantRepository.deleteById(req.params.id);

            if (!deleted) {
                return responseHelper.notFound(res, 'Restaurant not found');
            }

            return responseHelper.noContent(res);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new RestaurantController();