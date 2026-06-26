const Order = require('../models/Order');
const { generateId } = require('../utilities/idGenerator');

class OrderRepository {
    async create({ userId, restaurantId, restaurantName, items }) {
        const totalPrice = items.reduce(
            (sum, item) => sum + Number(item.price) * Number(item.quantity),
            0
        );

        return Order.create({
            id: generateId(),
            userId: String(userId),
            restaurantId: String(restaurantId),
            restaurantName,
            items,
            totalPrice,
            status: 'created'
        });
    }

    async findById(id) {
        return Order.findOne({ id: String(id) });
    }

    async findByUserId(userId) {
        return Order.find({ userId: String(userId) }).sort({ createdAt: -1 });
    }

    async findAll() {
        return Order.find({}).sort({ createdAt: -1 });
    }

    async update(id, updates) {
        const {
            id: _id,
            userId: _uid,
            restaurantId: _rid,
            restaurantName: _restaurantName,
            createdAt: _ca,
            ...safeUpdates
        } = updates;

        return Order.findOneAndUpdate(
            { id: String(id) },
            safeUpdates,
            { new: true, runValidators: true }
        );
    }

    async delete(id) {
        const result = await Order.deleteOne({ id: String(id) });
        return result.deletedCount > 0;
    }
}

module.exports = new OrderRepository();