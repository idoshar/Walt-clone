const Restaurant = require('../models/Restaurant');

class RestaurantRepository {
    constructor() {
        this.restaurants = [
            new Restaurant({
                id: 1,
                name: 'Pizza Roma',
                address: 'Herzl 10, Tel Aviv',
                phone: '03-1111111',
                cuisine: 'Italian',
                description: 'Italian pizza restaurant with pasta and fresh tomato sauce'
            }),
            new Restaurant({
                id: 2,
                name: 'Burger House',
                address: 'Dizengoff 50, Tel Aviv',
                phone: '03-2222222',
                cuisine: 'American',
                description: 'American burger restaurant with fries and grilled meat'
            }),
            new Restaurant({
                id: 3,
                name: 'Sushi Bar',
                address: 'Rothschild 22, Tel Aviv',
                phone: '03-3333333',
                cuisine: 'Japanese',
                description: 'Japanese sushi restaurant with rolls, rice and fish'
            })
        ];
    }

    findAll() {
        return this.restaurants;
    }

    getAll() {
        return this.findAll();
    }

    create(restaurant) {
        this.restaurants.push(restaurant);
        return restaurant;
    }

    findById(id) {
        return this.restaurants.find((restaurant) => String(restaurant.id) === String(id)) || null;
    }
    update(id, updatedFields) {
        const restaurant = this.findById(id);

        if (!restaurant) {
            return null;
        }

        Object.assign(restaurant, updatedFields);
        return restaurant;
    }
    
    search(query) {
        const normalizedQuery = String(query || '').trim().toLowerCase();

        if (!normalizedQuery) {
            return [];
        }

        return this.restaurants.filter((restaurant) => {
            const name = String(restaurant.name || '').toLowerCase();
            const description = String(restaurant.description || '').toLowerCase();

            return name.includes(normalizedQuery) || description.includes(normalizedQuery);
        });
    }

    deleteById(id){
        const index = this.restaurants.findIndex(
            (restaurant) => String(restaurant.id) === String(id)
        );

        if(index === -1){
            return false;
        }

        this.restaurants.splice(index, 1);
        return true;
    }
}

module.exports = new RestaurantRepository();
