const userRepository = require('../repositories/userRepository');

function validateRequiredString(value, fieldName) {
    if (typeof value !== 'string' || value.trim() === '') {
        const error = new Error(`${fieldName} is required`);
        error.statusCode = 400;
        throw error;
    }
}

function normalizeCoordinate(value, fieldName, minimum, maximum) {
    if (value === null || value === undefined || value === '') {
        const error = new Error(`${fieldName} is required`);
        error.statusCode = 400;
        throw error;
    }

    const coordinate = Number(value);

    if (!Number.isFinite(coordinate) || coordinate < minimum || coordinate > maximum) {
        const error = new Error(`${fieldName} must be a valid coordinate`);
        error.statusCode = 400;
        throw error;
    }

    return coordinate;
}

function getOptionalLocation(userData) {
    const hasLatitude =
        Object.prototype.hasOwnProperty.call(userData, 'latitude') &&
        userData.latitude !== null &&
        userData.latitude !== undefined;

    const hasLongitude =
        Object.prototype.hasOwnProperty.call(userData, 'longitude') &&
        userData.longitude !== null &&
        userData.longitude !== undefined;

    if (!hasLatitude && !hasLongitude) {
        return {
            latitude: null,
            longitude: null
        };
    }

    if (!hasLatitude || !hasLongitude) {
        const error = new Error('latitude and longitude must be provided together');
        error.statusCode = 400;
        throw error;
    }

    return {
        latitude: normalizeCoordinate(userData.latitude, 'latitude', -90, 90),
        longitude: normalizeCoordinate(userData.longitude, 'longitude', -180, 180)
    };
}

class UserService {
    async createUser(userData) {
        const data = userData || {};
        const { username, password, fullName, phone, address } = data;

        validateRequiredString(username, 'username');
        validateRequiredString(password, 'password');
        validateRequiredString(fullName, 'fullName');
        validateRequiredString(phone, 'phone');
        validateRequiredString(address, 'address');

        const existingUser = await userRepository.findByUsername(username.trim());

        if (existingUser) {
            const error = new Error('username already exists');
            error.statusCode = 409;
            throw error;
        }

        const location = getOptionalLocation(data);

        return await userRepository.create({
            username: data.username.trim(),
            password: data.password,
            fullName: data.fullName.trim(),
            phone: data.phone.trim(),
            address: data.address.trim(),
            image: data.image || '',
            role: data.role || 'customer',
            latitude: data.latitude || null,
            longitude: data.longitude || null
        });
    }

    async getUserById(id) {
        const user = await userRepository.findById(id);

        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        return user;
    }

    async updateCurrentUserLocation(userId, locationData) {
        const data = locationData || {};

        const latitude = normalizeCoordinate(data.latitude, 'latitude', -90, 90);
        const longitude = normalizeCoordinate(data.longitude, 'longitude', -180, 180);

        const user = await userRepository.update(userId, {
            latitude,
            longitude
        });

        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        return user;
    }
}

module.exports = new UserService();