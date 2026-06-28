const mongoose = require('mongoose');

const MENU_TYPES = Object.freeze([
    'main',
    'side',
    'dessert',
    'drink',
    'other'
]);

const menuCategorySchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
            index: true
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
        normalizedName: {
            type: String,
            required: true,
            trim: true
        },
        menuType: {
            type: String,
            required: true,
            enum: MENU_TYPES
        }
    },
    {
        timestamps: true
    }
);

menuCategorySchema.index(
    { restaurantId: 1, normalizedName: 1 },
    { unique: true }
);

menuCategorySchema.index({
    restaurantId: 1,
    menuType: 1,
    name: 1
});

menuCategorySchema.methods.toResponseObject = function toResponseObject() {
    return {
        id: this.id,
        restaurantId: this.restaurantId,
        name: this.name,
        menuType: this.menuType
    };
};

const MenuCategory = mongoose.model('MenuCategory', menuCategorySchema);

module.exports = MenuCategory;
module.exports.MENU_TYPES = MENU_TYPES;