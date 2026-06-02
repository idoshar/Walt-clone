// Map<restaurantId -> Map<productId -> product>>
const store = new Map();

function _normalizeRestaurantId(restaurantId) {
    return Number(restaurantId);
}

function _normalizeProductId(productId) {
    return String(productId);
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

function save(restaurantId, product) {
    const map = _getOrCreateRestaurantMap(restaurantId);
    const productId = _normalizeProductId(product.id);

    const productToSave = {
        ...product,
        id: productId,
        restaurantId: _normalizeRestaurantId(restaurantId)
    };

    map.set(productId, productToSave);

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

    return map.delete(_normalizeProductId(productId));
}

function removeAllByRestaurant(restaurantId) {
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
    save,
    update,
    remove,
    removeAllByRestaurant,
    search
};
