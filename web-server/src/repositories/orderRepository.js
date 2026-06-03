const Order = require('../models/Order');
const { generateId } = require('../utilities/idGenerator');

class OrderRepository {
    constructor() {
        this.orders = new Map();
    }

    create({ userId, restaurantId, items }) {
        const totalPrice = items.reduce((sum, item) => {
            return sum + Number(item.price) * Number(item.quantity);
        }, 0);

        const order = new Order({
            id: generateId(),
            userId: Number(userId),
            restaurantId: Number(restaurantId),
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
    
}

module.exports = new OrderRepository();
