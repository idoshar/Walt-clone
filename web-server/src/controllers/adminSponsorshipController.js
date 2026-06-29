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

class AdminSponsorshipController {
    async getRestaurants(req, res, next) {
        try {
            const restaurants = await restaurantRepository.getAll();

            const response = restaurants
                .map((restaurant) => restaurant.toResponseObject())
                .sort(compareRestaurantsForAdmin);

            return res.status(200).json(response);
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
