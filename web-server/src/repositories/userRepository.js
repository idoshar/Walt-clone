const User = require('../models/User');
const { generateId } = require('../utilities/idGenerator');

class UserRepository {
    async create(userData) {
        const user = await User.create({
            id: generateId(),
            ...userData
        });

        return user;
    }

    async findById(id) {
        return User.findOne({ id: String(id) });
    }

    async findByUsername(username) {
        return User.findOne({ username: String(username) });
    }

    async update(id, updates) {
        const { id: _id, username: _username, ...safeUpdates } = updates;

        return User.findOneAndUpdate(
            { id: String(id) },
            safeUpdates,
            { new: true, runValidators: true }
        );
    }

    async getAll() {
        return User.find({});
    }
}

module.exports = new UserRepository();