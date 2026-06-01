class User {
    constructor({ id, username, password, fullName, phone, address }) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.fullName = fullName;
        this.phone = phone;
        this.address = address;
    }

    toResponseObject() {
        return {
            id: this.id,
            username: this.username,
            fullName: this.fullName,
            phone: this.phone,
            address: this.address
        };
    }
}

module.exports = User;
