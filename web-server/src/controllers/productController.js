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


function requireRestaurant(req, res) {
    const restaurant = restaurantRepository.findById(req.params.id);
    if (!restaurant) {
        notFound(res, 'Restaurant not found');
        return false;
    }
    return true;
}

function getAllProducts(req, res) {
    if (!requireRestaurant(req, res)) return;

    const products = productRepository.findAllByRestaurant(req.params.id);
    return ok(res, products);
}

function createProduct(req, res) {
    if (!requireRestaurant(req, res)) return;

    const bodyError = validateObject(req.body);
    if (bodyError) return badRequest(res, bodyError);

    const fieldError = validateRequiredFields(req.body, ['name', 'price']);
    if (fieldError) return badRequest(res, fieldError);

    const { name, price, description = '', category = '' } = req.body;

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
    };

    productRepository.save(req.params.id, product);
    return created(res, `/api/restaurants/${req.params.id}/products/${product.id}`);
}


function getProductById(req, res) {
    if (!requireRestaurant(req, res)) return;

    const product = productRepository.findById(req.params.id, req.params.pId);
    if (!product) return notFound(res, 'Product not found');


    const userId = req.headers['x-user-id'];
    if (userId) {
        ex2.reportProductView(userId, req.params.pId);
    }
    // ─────────────────────────────────────────────────────────────────────────

    return ok(res, product);
}


function updateProduct(req, res) {
    if (!requireRestaurant(req, res)) return;

    const bodyError = validateObject(req.body);
    if (bodyError) return badRequest(res, bodyError);

    if (Object.keys(req.body).length === 0) {
        return badRequest(res, 'Request body must not be empty');
    }

    // Validate price if provided
    if (req.body.price !== undefined) {
        if (typeof req.body.price !== 'number' || req.body.price < 0) {
            return badRequest(res, 'price must be a non-negative number');
        }
    }

    // Prevent overwriting the product id or restaurantId via the body
    const { id: _id, restaurantId: _rid, ...safeUpdates } = req.body;

    const updated = productRepository.update(req.params.id, req.params.pId, safeUpdates);
    if (!updated) return notFound(res, 'Product not found');

    return noContent(res);
}


function deleteProduct(req, res) {
    if (!requireRestaurant(req, res)) return;

    const deleted = productRepository.remove(req.params.id, req.params.pId);
    if (!deleted) return notFound(res, 'Product not found');

    return noContent(res);
}

module.exports = {
    getAllProducts,
    createProduct,
    getProductById,
    updateProduct,
    deleteProduct,
};
