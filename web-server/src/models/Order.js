class Order {
    constructor({
        id,
        userId,
        restaurantId,
        restaurantName,
        items,
        totalPrice,
        status = 'created',
        createdAt
    }) {
        this.id = id;
        this.userId = userId;
        this.restaurantId = restaurantId;
        this.restaurantName = restaurantName || '';
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
            restaurantName: this.restaurantName,
            items: this.items,
            totalPrice: this.totalPrice,
            status: this.status,
            createdAt: this.createdAt
        };
    }
}

module.exports = Order;
