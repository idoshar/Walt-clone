const Restaurant = require('../models/Restaurant');

const defaultRestaurants = [
    {
        id: '1',
        name: 'Pizza Roma',
        address: 'Herzl 10, Tel Aviv',
        phone: '03-1111111',
        cuisine: 'Italian',
        description: 'Italian pizza restaurant with pasta and fresh tomato sauce',
        latitude: 32.0616,
        longitude: 34.7743,
        isDefault: true,
        isSponsored: true,
        sponsoredRank: 1
    },
    {
        id: '2',
        name: 'Burger House',
        address: 'Dizengoff 50, Tel Aviv',
        phone: '03-2222222',
        cuisine: 'American',
        description: 'American burger restaurant with fries and grilled meat',
        latitude: 32.077,
        longitude: 34.774,
        isDefault: true,
        isSponsored: true,
        sponsoredRank: 2
    },
    {
        id: '3',
        name: 'Sushi Bar',
        address: 'Rothschild 22, Tel Aviv',
        phone: '03-3333333',
        cuisine: 'Japanese',
        description: 'Japanese sushi restaurant with rolls, rice and fish',
        latitude: 32.0627,
        longitude: 34.7726,
        isDefault: true,
        isSponsored: true,
        sponsoredRank: 3
    }
];

async function seedRestaurants() {
    for (const restaurant of defaultRestaurants) {
        await Restaurant.updateOne(
            { id: restaurant.id },
            { $setOnInsert: restaurant },
            { upsert: true }
        );
    }
}

module.exports = { seedRestaurants };