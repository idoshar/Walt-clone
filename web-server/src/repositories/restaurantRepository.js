const Restaurant = require('../models/Restaurant');

class RestaurantRepository {
    constructor() {
        this.restaurants = [
            new Restaurant({
                id: 1,
                name: 'Pizza Roma',
                address: 'Herzl 10, Tel Aviv',
                phone: '03-1111111',
                cuisine: 'Italian'
            }),
            new Restaurant({
                id: 2,
                name: 'Burger House',
                address: 'Dizengoff 50, Tel Aviv',
                phone: '03-2222222',
                cuisine: 'American'
            }),
            new Restaurant({
                id: 3,
                name: 'Sushi Bar',
                address: 'Rothschild 22, Tel Aviv',
                phone: '03-3333333',
                cuisine: 'Japanese'
            })
        ];
    }

    findAll() {
        return this.restaurants;
    }

    findById(id) {
        return this.restaurants.find((restaurant) => restaurant.id === Number(id)) || null;
    }
}

module.exports = new RestaurantRepository();