const store = new Map();

// Product IDs in the web server are strings, while Exercise 2 requires
// positive numeric product IDs. These maps keep the translation internal.
const recommendationIdByProductKey = new Map();
const productLocationByRecommendationId = new Map();
let nextRecommendationId = 1;

// Map<restaurantId -> Map<productId -> product>>
function _normalizeRestaurantId(restaurantId) {
    return Number(restaurantId);
}

function _normalizeProductId(productId) {
    return String(productId);
}

function _getProductKey(restaurantId, productId) {
    return `${_normalizeRestaurantId(restaurantId)}:${_normalizeProductId(productId)}`;
}

function _getRestaurantMap(restaurantId) {
    return store.get(_normalizeRestaurantId(restaurantId)) || null;
}

function _getOrCreateRestaurantMap(restaurantId) {
    const normalizedRestaurantId = _normalizeRestaurantId(restaurantId);

    if (!store.has(normalizedRestaurantId)) {
        store.set(normalizedRestaurantId, new Map());
    }

    return store.get(normalizedRestaurantId);
}

function _assignRecommendationId(restaurantId, productId) {
    const normalizedRestaurantId = _normalizeRestaurantId(restaurantId);
    const normalizedProductId = _normalizeProductId(productId);
    const productKey = _getProductKey(normalizedRestaurantId, normalizedProductId);

    const existingRecommendationId = recommendationIdByProductKey.get(productKey);

    if (existingRecommendationId) {
        return existingRecommendationId;
    }

    const recommendationId = nextRecommendationId++;

    recommendationIdByProductKey.set(productKey, recommendationId);
    productLocationByRecommendationId.set(recommendationId, {
        restaurantId: normalizedRestaurantId,
        productId: normalizedProductId
    });

    return recommendationId;
}

function _removeRecommendationId(restaurantId, productId) {
    const productKey = _getProductKey(restaurantId, productId);
    const recommendationId = recommendationIdByProductKey.get(productKey);

    if (!recommendationId) {
        return;
    }

    recommendationIdByProductKey.delete(productKey);
    productLocationByRecommendationId.delete(recommendationId);
}

function findAllByRestaurant(restaurantId) {
    const map = _getRestaurantMap(restaurantId);

    if (!map) {
        return [];
    }

    return Array.from(map.values());
}

function findAll() {
    const products = [];

    for (const restaurantProducts of store.values()) {
        products.push(...restaurantProducts.values());
    }

    return products;
}

function findById(restaurantId, productId) {
    const map = _getRestaurantMap(restaurantId);

    if (!map) {
        return null;
    }

    return map.get(_normalizeProductId(productId)) || null;
}

function findByRecommendationId(recommendationId) {
    const normalizedRecommendationId = Number(recommendationId);

    if (
        !Number.isSafeInteger(normalizedRecommendationId) ||
        normalizedRecommendationId <= 0
    ) {
        return null;
    }

    const location = productLocationByRecommendationId.get(
        normalizedRecommendationId
    );

    if (!location) {
        return null;
    }

    return findById(location.restaurantId, location.productId);
}

function getRecommendationId(restaurantId, productId) {
    const product = findById(restaurantId, productId);

    if (!product) {
        return null;
    }

    return _assignRecommendationId(restaurantId, productId);
}

function save(restaurantId, product) {
    const map = _getOrCreateRestaurantMap(restaurantId);
    const productId = _normalizeProductId(product.id);

    const productToSave = {
        ...product,
        id: productId,
        restaurantId: _normalizeRestaurantId(restaurantId)
    };

    map.set(productId, productToSave);
    _assignRecommendationId(restaurantId, productId);

    return productToSave;
}

function update(restaurantId, productId, updates) {
    const map = _getRestaurantMap(restaurantId);

    if (!map) {
        return null;
    }

    const normalizedProductId = _normalizeProductId(productId);
    const product = map.get(normalizedProductId);

    if (!product) {
        return null;
    }

    const updated = {
        ...product,
        ...updates,
        id: product.id,
        restaurantId: product.restaurantId
    };

    map.set(normalizedProductId, updated);

    return updated;
}

function remove(restaurantId, productId) {
    const map = _getRestaurantMap(restaurantId);

    if (!map) {
        return false;
    }

    const normalizedProductId = _normalizeProductId(productId);
    const deleted = map.delete(normalizedProductId);

    if (deleted) {
        _removeRecommendationId(restaurantId, normalizedProductId);
    }

    return deleted;
}

function removeAllByRestaurant(restaurantId) {
    const map = _getRestaurantMap(restaurantId);

    if (map) {
        for (const productId of map.keys()) {
            _removeRecommendationId(restaurantId, productId);
        }
    }

    store.delete(_normalizeRestaurantId(restaurantId));
}

function search(query) {
    const normalizedQuery = String(query || '').trim().toLowerCase();

    if (!normalizedQuery) {
        return [];
    }

    return findAll().filter((product) => {
        const name = String(product.name || '').toLowerCase();
        const description = String(product.description || '').toLowerCase();

        return name.includes(normalizedQuery) || description.includes(normalizedQuery);
    });
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
