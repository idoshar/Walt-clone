const orderRepository = require('../repositories/orderRepository');
const userRepository = require('../repositories/userRepository');
const restaurantRepository = require('../repositories/restaurantRepository');
const productRepository = require('../repositories/productRepository');


function resolveUser(userId) {
    return userRepository.findById(userId);
}

function isValidItem(item) {
    if (!item) return false;
    if (!item.productId) return false;
    if (!item.quantity || Number(item.quantity) <= 0) return false;
    if (item.price === undefined || item.price === null || Number(item.price) < 0) return false;
    return true;
}

function requireUserId(req, res) {
    const userId = req.user && req.user.sub;

    if (!userId) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing authenticated user'
        });
        return null;
    }

    return userId;
}

function createItemSnapshots(restaurantId, items) {
    return items.map((item) => {
        const product = productRepository.findById(restaurantId, item.productId);

        if (!product) {
            return null;
        }

        return {
            productId: String(item.productId),
            productName: product.name || 'Menu item',
            quantity: Number(item.quantity),
            price: Number(item.price)
        };
    });
}

function createOrder(req, res) {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const user = resolveUser(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { restaurantId, items } = req.body || {};

    if (!restaurantId) {
        return res.status(400).json({ error: 'restaurantId is required' });
    }

    const restaurant = restaurantRepository.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'items must be a non-empty array' });
    }

    const invalidItem = items.find((item) => !isValidItem(item));
    if (invalidItem) {
        return res.status(400).json({
            error: 'Each item must include productId, positive quantity, and non-negative price'
        });
    }

    const itemSnapshots = createItemSnapshots(restaurantId, items);

    if (itemSnapshots.some((item) => item === null)) {
        return res.status(400).json({
            error: 'Each item must reference an existing product in the selected restaurant'
        });
    }

    const order = orderRepository.create({
        userId,
        restaurantId,
        restaurantName: restaurant.name,
        items: itemSnapshots
    });

    return res
        .status(201)
        .location(`/api/orders/${order.id}`)
        .json(order.toResponseObject());
}


function getUserOrders(req, res) {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const orders = orderRepository.findByUserId(userId);
    return res.status(200).json(orders.map((o) => o.toResponseObject()));
}


function getOrderById(req, res) {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const order = orderRepository.findById(req.params.id);

    if (!order || String(order.userId) !== String(userId)) {
        return res.status(404).json({ error: 'Order not found' });
    }

    return res.status(200).json(order.toResponseObject());
}


function updateOrder(req, res) {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const order = orderRepository.findById(req.params.id);

    if (!order || String(order.userId) !== String(userId)) {
        return res.status(404).json({ error: 'Order not found' });
    }

    const { status, items } = req.body || {};

    if (status === undefined && items === undefined) {
        return res.status(400).json({ error: 'Nothing to update. Provide status and/or items' });
    }

    const updates = {};

    if (status !== undefined) {
        const ALLOWED_STATUSES = ['created', 'confirmed', 'preparing', 'delivered', 'cancelled'];
        if (!ALLOWED_STATUSES.includes(status)) {
            return res.status(400).json({
                error: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}`
            });
        }
        updates.status = status;
    }

    if (items !== undefined) {
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'items must be a non-empty array' });
        }

        const invalidItem = items.find((item) => !isValidItem(item));
        if (invalidItem) {
            return res.status(400).json({
                error: 'Each item must include productId, positive quantity, and non-negative price'
            });
        }

        const itemSnapshots = createItemSnapshots(order.restaurantId, items);

        if (itemSnapshots.some((item) => item === null)) {
            return res.status(400).json({
                error: 'Each item must reference an existing product in the selected restaurant'
            });
        }

        updates.items = itemSnapshots;
        updates.totalPrice = updates.items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );
    }

    orderRepository.update(order.id, updates);

    return res.status(204).send();
}


function deleteOrder(req, res) {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const order = orderRepository.findById(req.params.id);

    if (!order || String(order.userId) !== String(userId)) {
        return res.status(404).json({ error: 'Order not found' });
    }

    orderRepository.delete(order.id);

    return res.status(204).send();
}

module.exports = {
    createOrder,
    getUserOrders,
    getOrderById,
    updateOrder,
    deleteOrder
};
