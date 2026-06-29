const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        address: {
            type: String,
            default: '',
            trim: true
        },
        phone: {
            type: String,
            default: '',
            trim: true
        },
        cuisine: {
            type: String,
            default: '',
            trim: true,
            index: true
        },
        description: {
            type: String,
            default: '',
            trim: true
        },
        image: {
            type: String,
            default: '',
            trim: true
        },
        latitude: {
            type: Number,
            default: null
        },
        longitude: {
            type: Number,
            default: null
        },
        ownerId: {
            type: String,
            default: null,
            index: true
        },
        isDefault: {
            type: Boolean,
            default: false,
            index: true
        },
        isSponsored: {
            type: Boolean,
            default: false,
            index: true
        },
        sponsoredRank: {
            type: Number,
            default: null,
            min: 1
        }
    },
    {
        timestamps: true
    }
);

restaurantSchema.index({ name: 'text', description: 'text', cuisine: 'text' });
restaurantSchema.index({ isSponsored: 1, sponsoredRank: 1 });

restaurantSchema.methods.toResponseObject = function toResponseObject() {
    return {
        id: this.id,
        name: this.name,
        address: this.address,
        phone: this.phone,
        cuisine: this.cuisine,
        description: this.description,
        image: this.image,
        latitude: this.latitude,
        longitude: this.longitude,
        ownerId: this.ownerId,
        isDefault: this.isDefault,
        isSponsored: this.isSponsored,
        sponsoredRank: this.sponsoredRank
    };
};

module.exports = mongoose.model('Restaurant', restaurantSchema);