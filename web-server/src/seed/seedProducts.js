const productRepository = require('../repositories/productRepository');

const defaultProducts = [
    {
        restaurantId: '1',
        id: 'pizza-margherita',
        name: 'Margherita Pizza',
        price: 52,
        description: 'Tomato sauce, mozzarella, basil and olive oil',
        category: 'Pizza'
    },
    {
        restaurantId: '1',
        id: 'pasta-alfredo',
        name: 'Pasta Alfredo',
        price: 48,
        description: 'Creamy parmesan sauce with fresh pasta',
        category: 'Pasta'
    },
    {
        restaurantId: '1',
        id: 'tiramisu',
        name: 'Classic Tiramisu',
        price: 32,
        description: 'Coffee-soaked ladyfingers with mascarpone cream',
        category: 'Dessert'
    },
    {
        restaurantId: '2',
        id: 'classic-burger',
        name: 'Classic Beef Burger',
        price: 58,
        description: 'Grilled beef patty, lettuce, tomato and house sauce',
        category: 'Burger'
    },
    {
        restaurantId: '2',
        id: 'crispy-fries',
        name: 'Crispy Fries',
        price: 18,
        description: 'Golden fries served with ketchup',
        category: 'Side'
    },
    {
        restaurantId: '2',
        id: 'chicken-burger',
        name: 'Crispy Chicken Burger',
        price: 55,
        description: 'Crispy chicken, coleslaw and spicy mayo',
        category: 'Burger'
    },
    {
        restaurantId: '3',
        id: 'salmon-avocado-roll',
        name: 'Salmon Avocado Roll',
        price: 46,
        description: 'Fresh salmon, avocado and sushi rice',
        category: 'Sushi'
    },
    {
        restaurantId: '3',
        id: 'spicy-tuna-roll',
        name: 'Spicy Tuna Roll',
        price: 49,
        description: 'Tuna, cucumber and spicy sauce',
        category: 'Sushi'
    },
    {
        restaurantId: '3',
        id: 'edamame',
        name: 'Edamame',
        price: 16,
        description: 'Steamed soybeans with sea salt',
        category: 'Side'
    }
];

async function seedProducts() {
    for (const { restaurantId, ...product } of defaultProducts) {
        await productRepository.save(restaurantId, product);
    }
}

module.exports = {
    seedProducts
};