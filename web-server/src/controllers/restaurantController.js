const responseHelper = require('../utilities/responseHelper');
const restaurantRepository = require('../repositories/restaurantRepository');
const productRepository = require('../repositories/productRepository');
const menuCategoryRepository =
    require('../repositories/menuCategoryRepository');const Restaurant = require('../models/Restaurant');
const { generateId } = require('../utilities/idGenerator');
const {
    validateObject,
    validateRequiredFields
} = require('../utilities/validationHelper');

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

async function getProductCount(restaurantId) {
    const products = await productRepository.findAllByRestaurant(restaurantId);
    return products.length;
}

async function isPublicRestaurant(restaurant) {
    return (await getProductCount(restaurant.id)) > 0;
}

async function toManagementResponseObject(restaurant) {
    return {
        ...restaurant.toResponseObject(),
        productCount: await getProductCount(restaurant.id)
    };
}

function canManageRestaurant(req, restaurant) {
    const userId = req.user?.sub || req.user?.id;

    if (!restaurant.ownerId || !userId) {
        return false;
    }

    return String(restaurant.ownerId) === String(userId);
}

function normalizeImage(value) {
    return typeof value === 'string' ? value.trim() : '';
}

class RestaurantController {
    async getAllRestaurants(req, res, next) {
        try {
            const restaurants = restaurantRepository.getAll
                ? await restaurantRepository.getAll()
                : await restaurantRepository.findAll();

            const visibility = await Promise.all(
                restaurants.map(async (restaurant) => ({
                    restaurant,
                    visible: await isPublicRestaurant(restaurant)
                }))
            );

            const publicRestaurants = visibility
                .filter(({ visible }) => visible)
                .map(({ restaurant }) => restaurant.toResponseObject());

            return responseHelper.ok(res, publicRestaurants);
        } catch (err) {
            next(err);
        }
    }

    async getMyRestaurants(req, res, next) {
        try {
            const userId = req.user?.sub || req.user?.id;
            const restaurants = restaurantRepository.getAll
                ? await restaurantRepository.getAll()
                : await restaurantRepository.findAll();

            const managedRestaurants = restaurants.filter(
                (restaurant) =>
                    !restaurant.isDefault &&
                    String(restaurant.ownerId) === String(userId)
            );

            const myRestaurants = await Promise.all(
                managedRestaurants.map(toManagementResponseObject)
            );

            return responseHelper.ok(res, myRestaurants);
        } catch (err) {
            next(err);
        }
    }

    async getRestaurantById(req, res, next) {
        try {
            const restaurant = await restaurantRepository.findById(req.params.id);

            if (!restaurant || !(await isPublicRestaurant(restaurant))) {
                return responseHelper.notFound(res, 'Restaurant not found');
            }

            return responseHelper.ok(res, restaurant.toResponseObject());
        } catch (err) {
            next(err);
        }
    }

    async createRestaurant(req, res, next) {
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
                image: normalizeImage(req.body.image),
                ...(locationResult.coordinates || {}),
                ownerId: String(req.user?.sub || req.user?.id || ''),
                isDefault: false
            });

            await restaurantRepository.create(restaurant);

            return res
                .status(201)
                .location(`/api/restaurants/${restaurant.id}`)
                .json(await toManagementResponseObject(restaurant));
        } catch (err) {
            next(err);
        }
    }

    async updateRestaurant(req, res, next) {
        try {
            const existingRestaurant = await restaurantRepository.findById(req.params.id);

            if (!existingRestaurant) {
                return responseHelper.notFound(res, 'Restaurant not found');
            }

            if (!canManageRestaurant(req, existingRestaurant)) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You can manage only your own restaurants'
                });
            }

            const objectError = validateObject(req.body);

            if (objectError) {
                return responseHelper.badRequest(res, objectError);
            }

            const locationResult = getLocationFields(req.body);

            if (locationResult.error) {
                return responseHelper.badRequest(res, locationResult.error);
            }

            const {
                id: _id,
                ownerId: _ownerId,
                isDefault: _isDefault,
                ...safeUpdates
            } = req.body;

            if (Object.prototype.hasOwnProperty.call(safeUpdates, 'image')) {
                safeUpdates.image = normalizeImage(safeUpdates.image);
            }

            const updates = {
                ...safeUpdates,
                ...(locationResult.coordinates || {})
            };

            await restaurantRepository.update(req.params.id, updates);

            return responseHelper.noContent(res);
        } catch (err) {
            next(err);
        }
    }

    async deleteRestaurant(req, res, next) {
        try {
            const restaurant = await restaurantRepository.findById(req.params.id);

            if (!restaurant) {
                return responseHelper.notFound(res, 'Restaurant not found');
            }

            if (!canManageRestaurant(req, restaurant)) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You can manage only your own restaurants'
                });
            }

            await Promise.all([
                productRepository.removeAllByRestaurant(req.params.id),
                menuCategoryRepository.removeAllByRestaurant(req.params.id)
            ]);
            await restaurantRepository.deleteById(req.params.id);

            return responseHelper.noContent(res);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new RestaurantController();