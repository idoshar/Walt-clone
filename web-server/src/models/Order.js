class Order {
    constructor({ id, userId, restaurantId, items, totalPrice, status = 'created', createdAt }) {
        this.id = id;
        this.userId = userId;
        this.restaurantId = restaurantId;
        this.items = items;
        this.totalPrice = totalPrice;
        this.status = status;
        this.createdAt = createdAt || new Date().toISOString();
    }

    toResponseObject() {
        return {
            id: this.id,
            userId: this.userId,
            restaurantId: this.restaurantId,
            items: this.items,
            totalPrice: this.totalPrice,
            status: this.status,
            createdAt: this.createdAt
        };
    }
}

module.exports = Order;
