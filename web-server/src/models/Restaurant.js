class Restaurant {
    constructor({
        id,
        name,
        address,
        phone,
        cuisine,
        description = '',
        latitude = null,
        longitude = null,
        ownerId = null,
        isDefault = false
    }) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.phone = phone;
        this.cuisine = cuisine;
        this.description = description;
        this.latitude = latitude;
        this.longitude = longitude;
        this.ownerId = ownerId;
        this.isDefault = isDefault;
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
            longitude: this.longitude,
            ownerId: this.ownerId,
            isDefault: this.isDefault,
        };
    }
}

module.exports = Restaurant;