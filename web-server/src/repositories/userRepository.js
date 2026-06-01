const User = require('../models/User');

class UserRepository {
    constructor() {
        this.users = [];
        this.nextId = 1;
    }

    create(userData) {
        const user = new User({
            id: this.nextId++,
            ...userData
        });

        this.users.push(user);
        return user;
    }

    findById(id) {
        return this.users.find((user) => user.id === Number(id)) || null;
    }

    findByUsername(username) {
        return this.users.find((user) => user.username === username) || null;
    }

    getAll() {
        return this.users;
    }
}

module.exports = new UserRepository();
