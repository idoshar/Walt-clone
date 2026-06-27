const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true
        },
        restaurantId: {
            type: String,
            required: true,
            index: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        description: {
            type: String,
            default: '',
            trim: true
        },
        category: {
            type: String,
            default: '',
            trim: true
        },
        image: {
            type: String,
            default: '',
            trim: true
        },
        recommendationId: {
            type: Number,
            index: true
        }
    },
    {
        timestamps: true
    }
);

productSchema.index({ restaurantId: 1, id: 1 }, { unique: true });
productSchema.index({ name: 'text', description: 'text' });

productSchema.methods.toResponseObject = function toResponseObject() {
    return {
        id: this.id,
        restaurantId: this.restaurantId,
        name: this.name,
        price: this.price,
        description: this.description,
        category: this.category,
        image: this.image,
        recommendationId: this.recommendationId
    };
};

module.exports = mongoose.model('Product', productSchema);