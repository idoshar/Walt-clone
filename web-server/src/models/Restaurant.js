class Restaurant {
    constructor({ id, name, address, phone, cuisine, description = '' }) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.phone = phone;
        this.cuisine = cuisine;
        this.description = description;
    }

    toResponseObject() {
        return {
            id: this.id,
            name: this.name,
            address: this.address,
            phone: this.phone,
            cuisine: this.cuisine,
            description: this.description
        };
    }
}

module.exports = Restaurant;
