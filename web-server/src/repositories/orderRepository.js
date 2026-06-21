const Order = require('../models/Order');
const { generateId } = require('../utilities/idGenerator');


class OrderRepository {
    constructor() {
        /** @type {Map<string, Order>} */
        this.orders = new Map();
    }

    create({ userId, restaurantId, restaurantName, items }) {
        const totalPrice = items.reduce(
            (sum, item) => sum + Number(item.price) * Number(item.quantity),
            0
        );

        const order = new Order({
            id: generateId(),
            userId: Number(userId),
            restaurantId: Number(restaurantId),
            restaurantName,
            items,
            totalPrice,
            status: 'created'
        });

        this.orders.set(order.id, order);
        return order;
    }


    findById(id) {
        return this.orders.get(String(id)) || null;
    }

    findByUserId(userId) {
        return Array.from(this.orders.values()).filter(
            (order) => String(order.userId) === String(userId)
        );
    }

    findAll() {
        return Array.from(this.orders.values());
    }

    update(id, updates) {
        const order = this.orders.get(String(id));
        if (!order) return null;

        const {
            id: _id,
            userId: _uid,
            restaurantId: _rid,
            restaurantName: _restaurantName,
            createdAt: _ca,
            ...safeUpdates
        } = updates;

        Object.assign(order, safeUpdates);
        return order;
    }

    delete(id) {
        return this.orders.delete(String(id));
    }
}

module.exports = new OrderRepository();
