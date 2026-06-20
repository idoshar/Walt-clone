class Restaurant {
    constructor({
        id,
        name,
        address,
        phone,
        cuisine,
        description = '',
        latitude = null,
        longitude = null
    }) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.phone = phone;
        this.cuisine = cuisine;
        this.description = description;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    toResponseObject() {
        return {
            id: this.id,
            name: this.name,
            address: this.address,
            phone: this.phone,
            cuisine: this.cuisine,
            description: this.description,
            latitude: this.latitude,
            longitude: this.longitude
        };
    }
}

module.exports = Restaurant;