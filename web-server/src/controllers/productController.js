const productRepository = require('../repositories/productRepository');
const restaurantRepository = require('../repositories/restaurantRepository');
const ex2 = require('../services/exercise2Client');
const { generateId } = require('../utilities/idGenerator');
const {
    ok,
    created,
    noContent,
    badRequest,
    notFound,
} = require('../utilities/responseHelper');
const {
    validateObject,
    validateRequiredFields,
} = require('../utilities/validationHelper');

function findRestaurant(req, res) {
    const restaurant = restaurantRepository.findById(req.params.id);

    if (!restaurant) {
        notFound(res, 'Restaurant not found');
        return null;
    }

    return restaurant;
}

function canManageRestaurant(req, restaurant) {
    const userId = req.user?.sub || req.user?.id;

    return Boolean(
        restaurant.ownerId &&
        userId &&
        String(restaurant.ownerId) === String(userId)
    );
}

function requireManagedRestaurant(req, res) {
    const restaurant = findRestaurant(req, res);

    if (!restaurant) {
        return null;
    }

    if (!canManageRestaurant(req, restaurant)) {
        res.status(403).json({
            error: 'Forbidden',
            message: 'You can manage only your own restaurants'
        });
        return null;
    }

    return restaurant;
}

function getAllProducts(req, res) {
    const restaurant = findRestaurant(req, res);

    if (!restaurant) {
        return;
    }

    const products = productRepository.findAllByRestaurant(req.params.id);
    return ok(res, products);
}

function createProduct(req, res) {
    if (!requireManagedRestaurant(req, res)) return;

    const bodyError = validateObject(req.body);

    if (bodyError) {
        return badRequest(res, bodyError);
    }

    const fieldError = validateRequiredFields(req.body, ['name', 'price']);

    if (fieldError) {
        return badRequest(res, fieldError);
    }

    const { name, price, description = '', category = '', image = '' } = req.body;

    if (typeof price !== 'number' || price < 0) {
        return badRequest(res, 'price must be a non-negative number');
    }

    const product = {
        id: generateId(),
        restaurantId: req.params.id,
        name,
        price,
        description,
        category,
        image: typeof image === 'string' ? image.trim() : ''
    };

    productRepository.save(req.params.id, product);

    return created(
        res,
        `/api/restaurants/${req.params.id}/products/${product.id}`
    );
}

function getProductById(req, res) {
    if (!findRestaurant(req, res)) return;

    const product = productRepository.findById(req.params.id, req.params.pId);

    if (!product) {
        return notFound(res, 'Product not found');
    }

    const userId = req.user?.sub;
    const recommendationId = productRepository.getRecommendationId(
        req.params.id,
        req.params.pId
    );

    if (userId && recommendationId) {
        ex2.reportProductView(userId, recommendationId);
    }

    return ok(res, product);
}

async function getProductRecommendations(req, res, next) {
    try {
        if (!findRestaurant(req, res)) return;

        const sourceProduct = productRepository.findById(
            req.params.id,
            req.params.pId
        );

        if (!sourceProduct) {
            return notFound(res, 'Product not found');
        }

        const userId = req.user?.sub;

        if (!userId) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Missing authenticated user'
            });
        }

        const recommendationId = productRepository.getRecommendationId(
            req.params.id,
            req.params.pId
        );

        if (!recommendationId) {
            return ok(res, []);
        }

        await ex2.reportProductView(userId, recommendationId);

        const recommendationIds = await ex2.getRecommendations(
            userId,
            recommendationId
        );

        const recommendedProducts = recommendationIds
            .map((id) => productRepository.findByRecommendationId(id))
            .filter((recommendedProduct) =>
                recommendedProduct &&
                String(recommendedProduct.restaurantId) === String(req.params.id) &&
                String(recommendedProduct.id) !== String(req.params.pId)
            );

        return ok(res, recommendedProducts);
    } catch (err) {
        next(err);
    }
}

function updateProduct(req, res) {
    if (!requireManagedRestaurant(req, res)) return;

    const bodyError = validateObject(req.body);

    if (bodyError) {
        return badRequest(res, bodyError);
    }

    if (Object.keys(req.body).length === 0) {
        return badRequest(res, 'Request body must not be empty');
    }

    if (
        req.body.price !== undefined &&
        (typeof req.body.price !== 'number' || req.body.price < 0)
    ) {
        return badRequest(res, 'price must be a non-negative number');
    }

    const {
        id: _id,
        restaurantId: _restaurantId,
        recommendationId: _recommendationId,
        ...safeUpdates
    } = req.body;

    if (Object.prototype.hasOwnProperty.call(safeUpdates, 'image')) {
        safeUpdates.image =
            typeof safeUpdates.image === 'string' ? safeUpdates.image.trim() : '';
    }

    const updated = productRepository.update(
        req.params.id,
        req.params.pId,
        safeUpdates
    );

    if (!updated) {
        return notFound(res, 'Product not found');
    }

    return noContent(res);
}

function deleteProduct(req, res) {
    if (!requireManagedRestaurant(req, res)) return;

    const deleted = productRepository.remove(req.params.id, req.params.pId);

    if (!deleted) {
        return notFound(res, 'Product not found');
    }

    return noContent(res);
}

module.exports = {
    getAllProducts,
    createProduct,
    getProductById,
    getProductRecommendations,
    updateProduct,
    deleteProduct,
};

