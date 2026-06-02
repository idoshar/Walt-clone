const orderRepository = require('../repositories/orderRepository');
const userRepository = require('../repositories/userRepository');
const restaurantRepository = require('../repositories/restaurantRepository');

function getUserById(userId) {
    if (typeof userRepository.findById === 'function') {
        return userRepository.findById(userId);
    }

    if (typeof userRepository.getById === 'function') {
        return userRepository.getById(userId);
    }

    if (typeof userRepository.findUserById === 'function') {
        return userRepository.findUserById(userId);
    }

    return null;
}

function isValidItem(item) {
    if (!item) {
        return false;
    }

    if (!item.productId) {
        return false;
    }

    if (!item.quantity || Number(item.quantity) <= 0) {
        return false;
    }

    if (item.price === undefined || item.price === null || Number(item.price) < 0) {
        return false;
    }

    return true;
}

function createOrder(req, res) {
    const userId = req.headers['x-user-id'];

    if (!userId) {
        return res.status(400).json({
            error: 'Missing x-user-id header'
        });
    }

    const user = getUserById(userId);

    if (!user) {
        return res.status(404).json({
            error: 'User not found'
        });
    }

    const { restaurantId, items } = req.body || {};

    if (!restaurantId) {
        return res.status(400).json({
            error: 'restaurantId is required'
        });
    }

    const restaurant = restaurantRepository.findById(restaurantId);

    if (!restaurant) {
        return res.status(404).json({
            error: 'Restaurant not found'
        });
    }

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            error: 'items must be a non-empty array'
        });
    }

    const invalidItem = items.find((item) => !isValidItem(item));

    if (invalidItem) {
        return res.status(400).json({
            error: 'Each item must include productId, positive quantity, and non-negative price'
        });
    }

    const normalizedItems = items.map((item) => ({
        productId: String(item.productId),
        quantity: Number(item.quantity),
        price: Number(item.price)
    }));

    const order = orderRepository.create({
        userId,
        restaurantId,
        items: normalizedItems
    });

    return res
        .status(201)
        .location(`/api/orders/${order.id}`)
        .json(order.toResponseObject());
}

module.exports = {
    createOrder
};
