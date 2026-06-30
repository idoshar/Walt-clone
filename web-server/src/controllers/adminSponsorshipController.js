const restaurantRepository =
    require('../repositories/restaurantRepository');

function normalizeSponsorship(body) {
    if (!body || Array.isArray(body) || typeof body !== 'object') {
        return {
            error: 'Request body must be a JSON object'
        };
    }

    if (typeof body.isSponsored !== 'boolean') {
        return {
            error: 'isSponsored must be a boolean'
        };
    }

    if (!body.isSponsored) {
        return {
            value: {
                isSponsored: false,
                sponsoredRank: null
            }
        };
    }

    const sponsoredRank = Number(body.sponsoredRank);

    if (!Number.isInteger(sponsoredRank) || sponsoredRank < 1) {
        return {
            error: 'sponsoredRank must be a positive integer when isSponsored is true'
        };
    }

    return {
        value: {
            isSponsored: true,
            sponsoredRank
        }
    };
}

function normalizeOrderedRestaurantIds(value) {
    if (!Array.isArray(value)) {
        return {
            error: 'restaurantIds must be an array'
        };
    }

    const restaurantIds = value.map((restaurantId) =>
        String(restaurantId || '').trim()
    );

    if (restaurantIds.some((restaurantId) => !restaurantId)) {
        return {
            error: 'restaurantIds must contain non-empty restaurant ids'
        };
    }

    if (new Set(restaurantIds).size !== restaurantIds.length) {
        return {
            error: 'restaurantIds must not contain duplicates'
        };
    }

    return {
        value: restaurantIds
    };
}

function compareRestaurantsForAdmin(left, right) {
    if (left.isSponsored !== right.isSponsored) {
        return left.isSponsored ? -1 : 1;
    }

    if (left.isSponsored && right.isSponsored) {
        const rankDifference =
            (left.sponsoredRank || Number.MAX_SAFE_INTEGER) -
            (right.sponsoredRank || Number.MAX_SAFE_INTEGER);

        if (rankDifference !== 0) {
            return rankDifference;
        }
    }

    return left.name.localeCompare(right.name);
}

function toSortedResponse(restaurants) {
    return restaurants
        .map((restaurant) => restaurant.toResponseObject())
        .sort(compareRestaurantsForAdmin);
}

class AdminSponsorshipController {
    async getRestaurants(req, res, next) {
        try {
            const restaurants = await restaurantRepository.getAll();

            return res.status(200).json(toSortedResponse(restaurants));
        } catch (err) {
            next(err);
        }
    }

    async replaceSponsorshipOrder(req, res, next) {
        try {
            const orderInput = normalizeOrderedRestaurantIds(
                req.body?.restaurantIds
            );

            if (orderInput.error) {
                return res.status(400).json({
                    error: orderInput.error
                });
            }

            const restaurants = await restaurantRepository.getAll();
            const existingRestaurantIds = new Set(
                restaurants.map((restaurant) => String(restaurant.id))
            );
            const hasUnknownRestaurant = orderInput.value.some(
                (restaurantId) => !existingRestaurantIds.has(restaurantId)
            );

            if (hasUnknownRestaurant) {
                return res.status(400).json({
                    error: 'restaurantIds must include only existing restaurants'
                });
            }

            const updatedRestaurants =
                await restaurantRepository.updateSponsorshipOrder(
                    orderInput.value
                );

            return res.status(200).json(toSortedResponse(updatedRestaurants));
        } catch (err) {
            next(err);
        }
    }

    async updateRestaurantSponsorship(req, res, next) {
        try {
            const sponsorship = normalizeSponsorship(req.body);

            if (sponsorship.error) {
                return res.status(400).json({
                    error: sponsorship.error
                });
            }

            if (sponsorship.value.isSponsored) {
                const restaurants = await restaurantRepository.getAll();
                const conflictingRestaurant = restaurants.find(
                    (restaurant) =>
                        String(restaurant.id) !== String(req.params.id) &&
                        restaurant.isSponsored === true &&
                        Number(restaurant.sponsoredRank) ===
                            sponsorship.value.sponsoredRank
                );

                if (conflictingRestaurant) {
                    return res.status(409).json({
                        error: 'Conflict',
                        message:
                            `Sponsored rank ${sponsorship.value.sponsoredRank} ` +
                            `is already used by ${conflictingRestaurant.name}`
                    });
                }
            }

            const restaurant = await restaurantRepository.updateSponsorship(
                req.params.id,
                sponsorship.value
            );

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

module.exports = new AdminSponsorshipController();
