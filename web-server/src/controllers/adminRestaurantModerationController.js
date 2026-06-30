const responseHelper = require('../utilities/responseHelper');
const { validateObject } = require('../utilities/validationHelper');
const restaurantRepository =
    require('../repositories/restaurantRepository');
const productRepository = require('../repositories/productRepository');
const menuCategoryRepository =
    require('../repositories/menuCategoryRepository');

const EDITABLE_STRING_FIELDS = [
    'name',
    'address',
    'phone',
    'cuisine',
    'description',
    'image'
];

const EDITABLE_FIELDS = new Set([
    ...EDITABLE_STRING_FIELDS,
    'latitude',
    'longitude'
]);

function isSystemRestaurant(restaurant) {
    return Boolean(restaurant?.isDefault);
}

function getOwnershipStatus(restaurant) {
    if (isSystemRestaurant(restaurant)) {
        return 'system-catalog';
    }

    return restaurant?.ownerId ? 'user-owned' : 'unassigned';
}

function compareRestaurantsForModeration(left, right) {
    const protectionDifference =
        Number(Boolean(left.isDefault)) -
        Number(Boolean(right.isDefault));

    if (protectionDifference !== 0) {
        return protectionDifference;
    }

    return String(left.name || '').localeCompare(
        String(right.name || ''),
        undefined,
        {
            sensitivity: 'base'
        }
    );
}

function normalizeCoordinate(value) {
    if (value === null || value === undefined) {
        return null;
    }

    if (typeof value === 'string') {
        const normalizedValue = value.trim();

        if (!normalizedValue) {
            return null;
        }

        return Number(normalizedValue);
    }

    return Number(value);
}

function normalizeUpdates(body) {
    const objectError = validateObject(body);

    if (objectError) {
        return { error: objectError };
    }

    const unsupportedFields = Object.keys(body).filter(
        (field) => !EDITABLE_FIELDS.has(field)
    );

    if (unsupportedFields.length > 0) {
        return {
            error:
                'Unsupported moderation fields: ' +
                unsupportedFields.join(', ')
        };
    }

    const updates = {};

    for (const field of EDITABLE_STRING_FIELDS) {
        if (!Object.prototype.hasOwnProperty.call(body, field)) {
            continue;
        }

        if (typeof body[field] !== 'string') {
            return {
                error: `${field} must be a string`
            };
        }

        const value = body[field].trim();

        if (field === 'name' && !value) {
            return {
                error: 'name cannot be empty'
            };
        }

        updates[field] = value;
    }

    const hasLatitude = Object.prototype.hasOwnProperty.call(body, 'latitude');
    const hasLongitude = Object.prototype.hasOwnProperty.call(
        body,
        'longitude'
    );

    if (hasLatitude !== hasLongitude) {
        return {
            error: 'latitude and longitude must be provided together'
        };
    }

    if (hasLatitude && hasLongitude) {
        const latitude = normalizeCoordinate(body.latitude);
        const longitude = normalizeCoordinate(body.longitude);

        if (latitude === null && longitude === null) {
            updates.latitude = null;
            updates.longitude = null;
        } else {
            if (
                latitude === null ||
                !Number.isFinite(latitude) ||
                latitude < -90 ||
                latitude > 90
            ) {
                return {
                    error: 'latitude must be a valid coordinate'
                };
            }

            if (
                longitude === null ||
                !Number.isFinite(longitude) ||
                longitude < -180 ||
                longitude > 180
            ) {
                return {
                    error: 'longitude must be a valid coordinate'
                };
            }

            updates.latitude = latitude;
            updates.longitude = longitude;
        }
    }

    if (Object.keys(updates).length === 0) {
        return {
            error: 'At least one editable restaurant field is required'
        };
    }

    return { value: updates };
}

async function getProductCount(restaurantId) {
    const products = await productRepository.findAllByRestaurant(restaurantId);
    return products.length;
}

async function toModerationResponse(restaurant) {
    const productCount = await getProductCount(restaurant.id);

    return {
        ...restaurant.toResponseObject(),
        productCount,
        ownershipStatus: getOwnershipStatus(restaurant),
        isModerationProtected: isSystemRestaurant(restaurant)
    };
}

class AdminRestaurantModerationController {
    async getRestaurants(req, res, next) {
        try {
            const restaurants = await restaurantRepository.getAll();

            const response = await Promise.all(
                restaurants
                    .sort(compareRestaurantsForModeration)
                    .map(toModerationResponse)
            );

            return responseHelper.ok(res, response);
        } catch (err) {
            next(err);
        }
    }

    async getRestaurant(req, res, next) {
        try {
            const restaurant = await restaurantRepository.findById(
                req.params.id
            );

            if (!restaurant) {
                return responseHelper.notFound(res, 'Restaurant not found');
            }

            return responseHelper.ok(res, {
                ...(await toModerationResponse(restaurant)),
                accessRole: 'admin'
            });
        } catch (err) {
            next(err);
        }
    }

    async updateRestaurant(req, res, next) {
        try {
            const restaurant = await restaurantRepository.findById(
                req.params.id
            );

            if (!restaurant) {
                return responseHelper.notFound(res, 'Restaurant not found');
            }

            const updates = normalizeUpdates(req.body);

            if (updates.error) {
                return responseHelper.badRequest(res, updates.error);
            }

            const updatedRestaurant = await restaurantRepository.update(
                req.params.id,
                updates.value
            );

            return responseHelper.ok(
                res,
                await toModerationResponse(updatedRestaurant)
            );
        } catch (err) {
            next(err);
        }
    }

    async deleteRestaurant(req, res, next) {
        try {
            const restaurant = await restaurantRepository.findById(
                req.params.id
            );

            if (!restaurant) {
                return responseHelper.notFound(res, 'Restaurant not found');
            }

            if (isSystemRestaurant(restaurant)) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message:
                        'System catalog restaurants cannot be deleted through moderation'
                });
            }

            await Promise.all([
                productRepository.removeAllByRestaurant(req.params.id),
                menuCategoryRepository.removeAllByRestaurant(req.params.id)
            ]);

            const wasDeleted = await restaurantRepository.deleteById(
                req.params.id
            );

            if (!wasDeleted) {
                return responseHelper.notFound(res, 'Restaurant not found');
            }

            return responseHelper.noContent(res);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new AdminRestaurantModerationController();
