const userRepository = require('../repositories/userRepository');
const {
    hashPassword,
    verifyPassword
} = require('../utilities/passwordHelper');
const { createJwt } = require('../utilities/tokenHelper');

function createError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

function validateRequiredString(value, fieldName) {
    if (typeof value !== 'string' || value.trim() === '') {
        throw createError(`${fieldName} is required`, 400);
    }
}

function normalizeCoordinate(value, fieldName, minimum, maximum) {
    if (value === null || value === undefined || value === '') {
        throw createError(`${fieldName} is required`, 400);
    }

    const coordinate = Number(value);

    if (!Number.isFinite(coordinate) || coordinate < minimum || coordinate > maximum) {
        throw createError(`${fieldName} must be a valid coordinate`, 400);
    }

    return coordinate;
}

function normalizeProfileImage(value) {
    if (typeof value !== 'string') {
        const error = new Error('image must be a string');
        error.statusCode = 400;
        throw error;
    }

    const image = value.trim();

    if (image === '') {
        return '';
    }

    if (image.length > 4 * 1024 * 1024) {
        const error = new Error('image is too large');
        error.statusCode = 400;
        throw error;
    }

    const supportedDataImage =
        /^data:image\/(png|jpe?g|webp|heic);base64,[a-z0-9+/=\r\n]+$/i;

    if (!supportedDataImage.test(image)) {
        const error = new Error(
            'image must be an image data URI or an empty string'
        );
        error.statusCode = 400;
        throw error;
    }

    return image;
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
        throw createError(
            'latitude and longitude must be provided together',
            400
        );
    }

    return {
        latitude: normalizeCoordinate(userData.latitude, 'latitude', -90, 90),
        longitude: normalizeCoordinate(
            userData.longitude,
            'longitude',
            -180,
            180
        )
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

        const normalizedUsername = username.trim();
        const existingUser = await userRepository.findByUsername(
            normalizedUsername
        );

        if (existingUser) {
            throw createError('username already exists', 409);
        }

        const location = getOptionalLocation(data);
        const passwordHash = await hashPassword(password);

        return userRepository.create({
            username: normalizedUsername,
            password: passwordHash,
            fullName: fullName.trim(),
            phone: phone.trim(),
            address: address.trim(),
            image: typeof data.image === 'string' ? data.image.trim() : '',
            role: 'customer',
            mustChangePassword: false,
            tokenVersion: 0,
            ...location
        });
    }

    async getUserById(id) {
        const user = await userRepository.findById(id);

        if (!user) {
            throw createError('User not found', 404);
        }

        return user;
    }

    async updateCurrentUserImage(userId, imageData) {
        const data = imageData || {};

        if (!Object.prototype.hasOwnProperty.call(data, 'image')) {
            const error = new Error('image is required');
            error.statusCode = 400;
            throw error;
        }

        const user = await userRepository.update(userId, {
            image: normalizeProfileImage(data.image)
        });

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
        const longitude = normalizeCoordinate(
            data.longitude,
            'longitude',
            -180,
            180
        );

        const user = await userRepository.update(userId, {
            latitude,
            longitude
        });

        if (!user) {
            throw createError('User not found', 404);
        }

        return user;
    }

    async changeCurrentUserPassword(userId, passwordData) {
        const data = passwordData || {};
        const user = await userRepository.findByIdWithPassword(userId);

        if (!user) {
            throw createError('User not found', 404);
        }

        const currentPasswordVerification = await verifyPassword(
            data.currentPassword,
            user.password
        );

        if (!currentPasswordVerification.matches) {
            throw createError('Current password is incorrect', 400);
        }

        const passwordHash = await hashPassword(data.newPassword);

        const newPasswordVerification = await verifyPassword(
            data.newPassword,
            user.password
        );

        if (newPasswordVerification.matches) {
            throw createError(
                'newPassword must be different from currentPassword',
                400
            );
        }

        const updatedUser =
            await userRepository.updatePasswordAndInvalidateTokens(userId, {
                passwordHash,
                mustChangePassword: false
            });

        if (!updatedUser) {
            throw createError('User not found', 404);
        }

        return {
            token: createJwt(updatedUser),
            userId: updatedUser.id,
            user: updatedUser.toResponseObject()
        };
    }
}

module.exports = new UserService();
