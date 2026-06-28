const mongoose = require('mongoose');

const MENU_TYPES = Object.freeze([
    'main',
    'side',
    'dessert',
    'drink',
    'other'
]);

const DEFAULT_MENU_TYPE_SORT_ORDERS = Object.freeze({
    main: 100,
    side: 200,
    dessert: 300,
    drink: 400,
    other: 500
});

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
        },
        sortOrder: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
            index: true
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
    sortOrder: 1,
    name: 1
});

menuCategorySchema.methods.toResponseObject = function toResponseObject() {
    return {
        id: this.id,
        restaurantId: this.restaurantId,
        name: this.name,
        menuType: this.menuType,
        sortOrder: this.sortOrder
    };
};

const MenuCategory = mongoose.model('MenuCategory', menuCategorySchema);

module.exports = MenuCategory;
module.exports.MENU_TYPES = MENU_TYPES;
module.exports.DEFAULT_MENU_TYPE_SORT_ORDERS =
    DEFAULT_MENU_TYPE_SORT_ORDERS;