const productRepository = require('../repositories/productRepository');
const menuCategoryRepository =
    require('../repositories/menuCategoryRepository');
const restaurantRepository = require('../repositories/restaurantRepository');
const userRepository = require('../repositories/userRepository');
const ex2 = require('../services/exercise2Client');
const { generateId } = require('../utilities/idGenerator');
const {
    ok,
    created,
    noContent,
    badRequest,
    notFound
} = require('../utilities/responseHelper');
const {
    validateObject,
    validateRequiredFields
} = require('../utilities/validationHelper');
const {
    canManageRestaurant,
    getRequestUserId
} = require('../services/restaurantAccessService');

function normalizeCategoryId(value) {
    if (typeof value !== 'string') {
        return '';
    }

    return value.trim();
}

async function findRestaurant(req, res) {
    const restaurant = await restaurantRepository.findById(req.params.id);

    if (!restaurant) {
        notFound(res, 'Restaurant not found');
        return null;
    }

    return restaurant;
}


async function requireManagedRestaurant(req, res) {
    const restaurant = await findRestaurant(req, res);

    if (!restaurant) {
        return null;
    }

    if (!canManageRestaurant(
            restaurant,
            getRequestUserId(req),
            req.user?.role
        )) {
        res.status(403).json({
            error: 'Forbidden',
            message:
                'You can manage only restaurants where you are an owner, editor, or administrator'
        });
        return null;
    }

    return restaurant;
}

async function getRecommendationUserId(req) {
    const userId = req.user?.sub || req.user?.id;

    if (!userId) {
        return null;
    }

    const user = await userRepository.findById(userId);

    return user?.recommendationId || null;
}

async function findProductCategory(restaurantId, categoryId) {
    const normalizedCategoryId = normalizeCategoryId(categoryId);

    if (!normalizedCategoryId) {
        return null;
    }

    return menuCategoryRepository.findById(
        restaurantId,
        normalizedCategoryId
    );
}

async function getAllProducts(req, res) {
    const restaurant = await findRestaurant(req, res);

    if (!restaurant) {
        return;
    }

    const products = await productRepository.findAllByRestaurant(
        req.params.id
    );

    return ok(res, products);
}

async function createProduct(req, res) {
    if (!(await requireManagedRestaurant(req, res))) {
        return;
    }

    const bodyError = validateObject(req.body);

    if (bodyError) {
        return badRequest(res, bodyError);
    }

    const fieldError = validateRequiredFields(
        req.body,
        ['name', 'price', 'categoryId']
    );

    if (fieldError) {
        return badRequest(res, fieldError);
    }

    const {
        name,
        price,
        description = '',
        image = ''
    } = req.body;

    if (typeof price !== 'number' || price < 0) {
        return badRequest(res, 'price must be a non-negative number');
    }

    const category = await findProductCategory(
        req.params.id,
        req.body.categoryId
    );

    if (!category) {
        return badRequest(
            res,
            'categoryId must reference an existing category in this restaurant'
        );
    }

    const product = {
        id: generateId(),
        restaurantId: req.params.id,
        name,
        price,
        description,
        categoryId: category.id,
        category: category.name,
        image: typeof image === 'string' ? image.trim() : ''
    };

    const savedProduct = await productRepository.save(
        req.params.id,
        product
    );

    return created(
        res,
        `/api/restaurants/${req.params.id}/products/${savedProduct.id}`
    );
}

async function getProductById(req, res) {
    if (!(await findRestaurant(req, res))) {
        return;
    }

    const product = await productRepository.findById(
        req.params.id,
        req.params.pId
    );

    if (!product) {
        return notFound(res, 'Product not found');
    }

    const recommendationUserId = await getRecommendationUserId(req);

    if (recommendationUserId && product.recommendationId) {
        await ex2.reportProductView(
            recommendationUserId,
            product.recommendationId
        );
    }

    return ok(res, product);
}

async function getProductRecommendations(req, res, next) {
    try {
        if (!(await findRestaurant(req, res))) {
            return;
        }

        const sourceProduct = await productRepository.findById(
            req.params.id,
            req.params.pId
        );

        if (!sourceProduct) {
            return notFound(res, 'Product not found');
        }

        const recommendationUserId = await getRecommendationUserId(req);

        if (!recommendationUserId) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Missing authenticated user'
            });
        }

        const recommendationId = sourceProduct.recommendationId;

        if (!recommendationId) {
            return ok(res, []);
        }

        await ex2.reportProductView(
            recommendationUserId,
            recommendationId
        );

        const recommendationIds = await ex2.getRecommendations(
            recommendationUserId,
            recommendationId
        );

        const recommendedProducts = await Promise.all(
            recommendationIds.map((id) =>
                productRepository.findByRecommendationId(id)
            )
        );

        return ok(
            res,
            recommendedProducts.filter(
                (recommendedProduct) =>
                    recommendedProduct &&
                    String(recommendedProduct.restaurantId) ===
                        String(req.params.id) &&
                    String(recommendedProduct.id) !== String(req.params.pId)
            )
        );
    } catch (err) {
        next(err);
    }
}

async function updateProduct(req, res) {
    if (!(await requireManagedRestaurant(req, res))) {
        return;
    }

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

    const hasCategoryId = Object.prototype.hasOwnProperty.call(
        req.body,
        'categoryId'
    );

    const hasCategoryName = Object.prototype.hasOwnProperty.call(
        req.body,
        'category'
    );

    if (hasCategoryName && !hasCategoryId) {
        return badRequest(
            res,
            'category is managed through categoryId'
        );
    }

    const {
        id: _id,
        restaurantId: _restaurantId,
        recommendationId: _recommendationId,
        category: _category,
        categoryId: requestedCategoryId,
        ...safeUpdates
    } = req.body;

    if (hasCategoryId) {
        const category = await findProductCategory(
            req.params.id,
            requestedCategoryId
        );

        if (!category) {
            return badRequest(
                res,
                'categoryId must reference an existing category in this restaurant'
            );
        }

        safeUpdates.categoryId = category.id;
        safeUpdates.category = category.name;
    }

    if (Object.prototype.hasOwnProperty.call(safeUpdates, 'image')) {
        safeUpdates.image =
            typeof safeUpdates.image === 'string'
                ? safeUpdates.image.trim()
                : '';
    }

    if (Object.keys(safeUpdates).length === 0) {
        return badRequest(res, 'Request body does not contain editable fields');
    }

    const updated = await productRepository.update(
        req.params.id,
        req.params.pId,
        safeUpdates
    );

    if (!updated) {
        return notFound(res, 'Product not found');
    }

    return noContent(res);
}

async function deleteProduct(req, res) {
    if (!(await requireManagedRestaurant(req, res))) {
        return;
    }

    const deleted = await productRepository.remove(
        req.params.id,
        req.params.pId
    );

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
    deleteProduct
};