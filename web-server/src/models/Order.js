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

const deliveryLocationSchema = new mongoose.Schema(
    {
        latitude: {
            type: Number,
            required: true,
            min: -90,
            max: 90
        },
        longitude: {
            type: Number,
            required: true,
            min: -180,
            max: 180
        },
        source: {
            type: String,
            required: true,
            enum: ['profile', 'shared']
        }
    },
    {
        _id: false
    }
);

const deliveryDetailsSchema = new mongoose.Schema(
    {
        recipientName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        phone: {
            type: String,
            required: true,
            trim: true,
            maxlength: 40
        },
        address: {
            type: String,
            required: true,
            trim: true,
            maxlength: 240
        },
        dinerCount: {
            type: Number,
            required: true,
            min: 1,
            max: 99
        },
        notes: {
            type: String,
            default: '',
            trim: true,
            maxlength: 500
        },
        location: {
            type: deliveryLocationSchema,
            default: null
        }
    },
    {
        _id: false
    }
);

function toDeliveryDetailsResponse(deliveryDetails) {
    if (!deliveryDetails) {
        return null;
    }

    return {
        recipientName: deliveryDetails.recipientName,
        phone: deliveryDetails.phone,
        address: deliveryDetails.address,
        dinerCount: deliveryDetails.dinerCount,
        notes: deliveryDetails.notes || '',
        location: deliveryDetails.location
            ? {
                latitude: deliveryDetails.location.latitude,
                longitude: deliveryDetails.location.longitude,
                source: deliveryDetails.location.source
            }
            : null
    };
}

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
        deliveryDetails: {
            type: deliveryDetailsSchema,
            default: null
        },
        totalPrice: {
            type: Number,
            required: true,
            min: 0
        },
        status: {
            type: String,
            enum: [
                'created',
                'confirmed',
                'preparing',
                'delivered',
                'cancelled'
            ],
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
        deliveryDetails: toDeliveryDetailsResponse(
            this.deliveryDetails
        ),
        totalPrice: this.totalPrice,
        status: this.status,
        createdAt: this.createdAt
    };
};

module.exports = mongoose.model('Order', orderSchema);