const userRepository = require('../repositories/userRepository');

function validateRequiredString(value, fieldName) {
    if (typeof value !== 'string' || value.trim() === '') {
        const error = new Error(`${fieldName} is required`);
        error.statusCode = 400;
        throw error;
    }
}

class UserService {
    createUser(userData) {
        const { username, password, fullName, phone, address } = userData || {};

        validateRequiredString(username, 'username');
        validateRequiredString(password, 'password');
        validateRequiredString(fullName, 'fullName');
        validateRequiredString(phone, 'phone');
        validateRequiredString(address, 'address');

        const existingUser = userRepository.findByUsername(username.trim());
        if (existingUser) {
            const error = new Error('username already exists');
            error.statusCode = 409;
            throw error;
        }

        return userRepository.create({
            username: username.trim(),
            password: password.trim(),
            fullName: fullName.trim(),
            phone: phone.trim(),
            address: address.trim()
        });
    }

    getUserById(id) {
        const user = userRepository.findById(id);

        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        return user;
    }
}

module.exports = new UserService();
