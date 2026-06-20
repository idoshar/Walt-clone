class User {
    constructor({
        id,
        username,
        password,
        fullName,
        phone,
        address,
        latitude = null,
        longitude = null
    }) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.fullName = fullName;
        this.phone = phone;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    toResponseObject() {
        return {
            id: this.id,
            username: this.username,
            fullName: this.fullName,
            phone: this.phone,
            address: this.address,
            latitude: this.latitude,
            longitude: this.longitude
        };
    }
}

module.exports = User;