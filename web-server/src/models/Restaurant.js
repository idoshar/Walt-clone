class Restaurant {
    constructor({ id, name, address, phone, cuisine }) {
        this.id = id;
        this.name = name;
        this.address = address;
        this.phone = phone;
        this.cuisine = cuisine;
    }

    toResponseObject() {
        return {
            id: this.id,
            name: this.name,
            address: this.address,
            phone: this.phone,
            cuisine: this.cuisine
        };
    }
}

module.exports = Restaurant;