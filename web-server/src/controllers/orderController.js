const orderRepository = require('../repositories/orderRepository');
const userRepository = require('../repositories/userRepository');
const restaurantRepository = require('../repositories/restaurantRepository');
const productRepository = require('../repositories/productRepository');

async function resolveUser(userId) {
    return userRepository.findById(userId);
}

function normalizeQuantity(quantity) {
    const value = Number(quantity);

    if (!Number.isSafeInteger(value) || value <= 0) {
        return null;
    }

    return value;
}

function isValidItem(item) {
    if (!item || !item.productId) {
        return false;
    }

    return normalizeQuantity(item.quantity) !== null;
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

async function createItemSnapshots(restaurantId, items) {
    const snapshots = [];

    for (const item of items) {
        const product = await productRepository.findById(
            restaurantId,
            item.productId
        );

        const quantity = normalizeQuantity(item.quantity);
        const price = product ? Number(product.price) : NaN;

        if (
            !product ||
            quantity === null ||
            !Number.isFinite(price) ||
            price < 0
        ) {
            snapshots.push(null);
            continue;
        }

        snapshots.push({
            productId: String(product.id),
            productName: product.name || 'Menu item',
            quantity,
            price
        });
    }

    return snapshots;
}

async function createOrder(req, res) {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const user = await resolveUser(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { restaurantId, items } = req.body || {};

    if (!restaurantId) {
        return res.status(400).json({ error: 'restaurantId is required' });
    }

    const restaurant = await restaurantRepository.findById(restaurantId);
    if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' });
    }

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            error: 'items must be a non-empty array'
        });
    }

    const invalidItem = items.find((item) => !isValidItem(item));
    if (invalidItem) {
        return res.status(400).json({
            error: 'Each item must include productId and a positive whole-number quantity'
        });
    }

    const itemSnapshots = await createItemSnapshots(restaurantId, items);

    if (itemSnapshots.some((item) => item === null)) {
        return res.status(400).json({
            error: 'Each item must reference an existing product in the selected restaurant'
        });
    }

    const order = await orderRepository.create({
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

async function getUserOrders(req, res) {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const orders = await orderRepository.findByUserId(userId);
    return res.status(200).json(orders.map((order) => order.toResponseObject()));
}

async function getOrderById(req, res) {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const order = await orderRepository.findById(req.params.id);

    if (!order || String(order.userId) !== String(userId)) {
        return res.status(404).json({ error: 'Order not found' });
    }

    return res.status(200).json(order.toResponseObject());
}

async function updateOrder(req, res) {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const order = await orderRepository.findById(req.params.id);

    if (!order || String(order.userId) !== String(userId)) {
        return res.status(404).json({ error: 'Order not found' });
    }

    const { status, items } = req.body || {};

    if (status === undefined && items === undefined) {
        return res.status(400).json({
            error: 'Nothing to update. Provide status and/or items'
        });
    }

    const updates = {};

    if (status !== undefined) {
        const allowedStatuses = [
            'created',
            'confirmed',
            'preparing',
            'delivered',
            'cancelled'
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                error: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`
            });
        }

        updates.status = status;
    }

    if (items !== undefined) {
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                error: 'items must be a non-empty array'
            });
        }

        const invalidItem = items.find((item) => !isValidItem(item));
        if (invalidItem) {
            return res.status(400).json({
                error: 'Each item must include productId and a positive whole-number quantity'
            });
        }

        const itemSnapshots = await createItemSnapshots(
            order.restaurantId,
            items
        );

        if (itemSnapshots.some((item) => item === null)) {
            return res.status(400).json({
                error: 'Each item must reference an existing product in the selected restaurant'
            });
        }

        updates.items = itemSnapshots;
        updates.totalPrice = itemSnapshots.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );
    }

    await orderRepository.update(order.id, updates);

    return res.status(204).send();
}

async function deleteOrder(req, res) {
    const userId = requireUserId(req, res);
    if (!userId) return;

    const order = await orderRepository.findById(req.params.id);

    if (!order || String(order.userId) !== String(userId)) {
        return res.status(404).json({ error: 'Order not found' });
    }

    await orderRepository.delete(order.id);

    return res.status(204).send();
}

module.exports = {
    createOrder,
    getUserOrders,
    getOrderById,
    updateOrder,
    deleteOrder
};
