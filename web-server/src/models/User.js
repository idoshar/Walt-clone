const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        recommendationId: {
            type: Number,
            unique: true,
            sparse: true,
            index: true,
            min: 1
        },
        username: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true
        },
        password: {
            type: String,
            required: true,
            select: false
        },
        mustChangePassword: {
            type: Boolean,
            default: false
        },
        tokenVersion: {
            type: Number,
            default: 0,
            min: 0
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        },
        fullName: {
            type: String,
            required: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        address: {
            type: String,
            required: true,
            trim: true
        },
        image: {
            type: String,
            default: '',
            trim: true
        },
        role: {
            type: String,
            enum: ['customer', 'owner', 'admin'],
            default: 'customer',
            index: true
        },
        latitude: {
            type: Number,
            default: null
        },
        longitude: {
            type: Number,
            default: null
        }
    },
    {
        timestamps: true
    }
);

userSchema.methods.toResponseObject = function toResponseObject() {
    return {
        id: this.id,
        username: this.username,
        fullName: this.fullName,
        phone: this.phone,
        address: this.address,
        image: this.image,
        isActive: this.isActive !== false,
        role: this.role,
        latitude: this.latitude,
        longitude: this.longitude,
        mustChangePassword: Boolean(this.mustChangePassword)
    };
};

module.exports = mongoose.model('User', userSchema);
