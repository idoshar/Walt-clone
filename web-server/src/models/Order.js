const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
    {
        productId: {
            type: String,
            required: true
        },
        productName: {
            type: String,
            required: true,
            trim: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    },
    {
        _id: false
    }
);

const orderSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        userId: {
            type: String,
            required: true,
            index: true
        },
        restaurantId: {
            type: String,
            required: true,
            index: true
        },
        restaurantName: {
            type: String,
            default: '',
            trim: true
        },
        items: {
            type: [orderItemSchema],
            required: true,
            default: []
        },
        totalPrice: {
            type: Number,
            required: true,
            min: 0
        },
        status: {
            type: String,
            enum: ['created', 'confirmed', 'preparing', 'delivered', 'cancelled'],
            default: 'created',
            index: true
        }
    },
    {
        timestamps: true
    }
);

orderSchema.methods.toResponseObject = function toResponseObject() {
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
};

module.exports = mongoose.model('Order', orderSchema);