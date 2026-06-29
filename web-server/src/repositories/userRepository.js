const User = require('../models/User');
const { generateId } = require('../utilities/idGenerator');
const { getNextSequence } = require('../services/sequenceService');

class UserRepository {
    async create(userData) {
        return User.create({
            ...userData,
            id: generateId(),
            recommendationId: await getNextSequence('userRecommendationId')
        });
    }

    async findById(id) {
        return User.findOne({ id: String(id) });
    }

    async findByIdWithPassword(id) {
        return User.findOne({ id: String(id) }).select('+password');
    }

    async findByUsername(username) {
        return User.findOne({ username: String(username) });
    }

    async findByUsernameWithPassword(username) {
        return User.findOne({
            username: String(username)
        }).select('+password');
    }

    async update(id, updates) {
        const {
            id: _id,
            username: _username,
            recommendationId: _recommendationId,
            password: _password,
            mustChangePassword: _mustChangePassword,
            tokenVersion: _tokenVersion,
            ...safeUpdates
        } = updates;

        return User.findOneAndUpdate(
            { id: String(id) },
            safeUpdates,
            { new: true, runValidators: true }
        );
    }

    async upgradeLegacyPassword(id, passwordHash) {
        return User.findOneAndUpdate(
            { id: String(id) },
            {
                $set: {
                    password: passwordHash
                }
            },
            {
                new: true,
                runValidators: true
            }
        );
    }

    async updatePasswordAndInvalidateTokens(
        id,
        { passwordHash, mustChangePassword = false }
    ) {
        return User.findOneAndUpdate(
            { id: String(id) },
            {
                $set: {
                    password: passwordHash,
                    mustChangePassword: Boolean(mustChangePassword)
                },
                $inc: {
                    tokenVersion: 1
                }
            },
            {
                new: true,
                runValidators: true
            }
        );
    }

    async getAll() {
        return User.find({});
    }
}

module.exports = new UserRepository();
