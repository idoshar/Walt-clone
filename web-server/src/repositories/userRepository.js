const InMemoryRepository = require('./InMemoryRepository');
const User = require('../models/User');


class UserRepository extends InMemoryRepository {

    create(userData) {
        const raw = super.create(userData);
        return new User(raw);
    }


    findById(id) {
        const raw = super.findById(id);
        return raw ? new User(raw) : null;
    }

 
    findByUsername(username) {
        const raw = super.findOneBy('username', username);
        return raw ? new User(raw) : null;
    }


    getAll() {
        return super.findAll().map((raw) => new User(raw));
    }
}

module.exports = new UserRepository();
