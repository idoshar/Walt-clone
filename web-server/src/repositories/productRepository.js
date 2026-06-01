// Map<restaurantId -> Map<productId -> product>>
const store = new Map();


function _getRestaurantMap(restaurantId) {
    return store.get(restaurantId) || null;
}


function _getOrCreateRestaurantMap(restaurantId) {
    if (!store.has(restaurantId)) {
        store.set(restaurantId, new Map());
    }
    return store.get(restaurantId);
}


function findAllByRestaurant(restaurantId) {
    const map = _getRestaurantMap(restaurantId);
    if (!map) return [];
    return Array.from(map.values());
}


function findById(restaurantId, productId) {
    const map = _getRestaurantMap(restaurantId);
    if (!map) return null;
    return map.get(productId) || null;
}


function save(restaurantId, product) {
    const map = _getOrCreateRestaurantMap(restaurantId);
    map.set(product.id, product);
    return product;
}


function update(restaurantId, productId, updates) {
    const map = _getRestaurantMap(restaurantId);
    if (!map) return null;
    const product = map.get(productId);
    if (!product) return null;

    const updated = { ...product, ...updates, id: product.id };
    map.set(productId, updated);
    return updated;
}


function remove(restaurantId, productId) {
    const map = _getRestaurantMap(restaurantId);
    if (!map) return false;
    return map.delete(productId);
}


function removeAllByRestaurant(restaurantId) {
    store.delete(restaurantId);
}

module.exports = {
    findAllByRestaurant,
    findById,
    save,
    update,
    remove,
    removeAllByRestaurant,
};
