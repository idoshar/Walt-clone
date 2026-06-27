const Product = require('../models/Product');
const { getNextSequence } = require('../services/sequenceService');

function normalizeRestaurantId(restaurantId) {
    return String(restaurantId);
}

function normalizeProductId(productId) {
    return String(productId);
}

function normalizeRecommendationId(recommendationId) {
    const value = Number(recommendationId);

    if (!Number.isSafeInteger(value) || value <= 0) {
        return null;
    }

    return value;
}

function toResponseObject(product) {
    if (!product) {
        return null;
    }

    return {
        id: product.id,
        restaurantId: product.restaurantId,
        name: product.name,
        price: product.price,
        description: product.description,
        category: product.category,
        image: product.image,
        recommendationId: product.recommendationId
    };
}

function escapeRegularExpression(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function findAllByRestaurant(restaurantId) {
    const products = await Product.find({
        restaurantId: normalizeRestaurantId(restaurantId)
    })
        .sort({ createdAt: 1, _id: 1 })
        .lean();

    return products.map(toResponseObject);
}

async function findAll() {
    const products = await Product.find({})
        .sort({ createdAt: 1, _id: 1 })
        .lean();

    return products.map(toResponseObject);
}

async function findById(restaurantId, productId) {
    const product = await Product.findOne({
        restaurantId: normalizeRestaurantId(restaurantId),
        id: normalizeProductId(productId)
    }).lean();

    return toResponseObject(product);
}

async function findByRecommendationId(recommendationId) {
    const normalizedRecommendationId =
        normalizeRecommendationId(recommendationId);

    if (!normalizedRecommendationId) {
        return null;
    }

    const product = await Product.findOne({
        recommendationId: normalizedRecommendationId
    }).lean();

    return toResponseObject(product);
}

async function getRecommendationId(restaurantId, productId) {
    const product = await findById(restaurantId, productId);

    return product ? product.recommendationId : null;
}

async function save(restaurantId, product) {
    const normalizedRestaurantId = normalizeRestaurantId(restaurantId);
    const normalizedProductId = normalizeProductId(product.id);

    const existingProduct = await Product.findOne({
        restaurantId: normalizedRestaurantId,
        id: normalizedProductId
    }).lean();

    if (existingProduct) {
        return toResponseObject(existingProduct);
    }

    const recommendationId = await getNextSequence(
        'productRecommendationId'
    );

    const savedProduct = await Product.create({
        id: normalizedProductId,
        restaurantId: normalizedRestaurantId,
        name: product.name,
        price: product.price,
        description: product.description || '',
        category: product.category || '',
        image: product.image || '',
        recommendationId
    });

    return toResponseObject(savedProduct.toObject());
}

async function update(restaurantId, productId, updates) {
    const {
        id: _id,
        restaurantId: _restaurantId,
        recommendationId: _recommendationId,
        ...safeUpdates
    } = updates;

    const updatedProduct = await Product.findOneAndUpdate(
        {
            restaurantId: normalizeRestaurantId(restaurantId),
            id: normalizeProductId(productId)
        },
        safeUpdates,
        {
            new: true,
            runValidators: true
        }
    ).lean();

    return toResponseObject(updatedProduct);
}

async function remove(restaurantId, productId) {
    const result = await Product.deleteOne({
        restaurantId: normalizeRestaurantId(restaurantId),
        id: normalizeProductId(productId)
    });

    return result.deletedCount > 0;
}

async function removeAllByRestaurant(restaurantId) {
    await Product.deleteMany({
        restaurantId: normalizeRestaurantId(restaurantId)
    });
}

async function search(query) {
    const normalizedQuery = String(query || '').trim();

    if (!normalizedQuery) {
        return [];
    }

    const expression = new RegExp(
        escapeRegularExpression(normalizedQuery),
        'i'
    );

    const products = await Product.find({
        $or: [
            { name: expression },
            { description: expression }
        ]
    })
        .sort({ createdAt: 1, _id: 1 })
        .lean();

    return products.map(toResponseObject);
}

module.exports = {
    findAllByRestaurant,
    findAll,
    findById,
    findByRecommendationId,
    getRecommendationId,
    save,
    update,
    remove,
    removeAllByRestaurant,
    search
};