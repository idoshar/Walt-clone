const userRepository = require('../repositories/userRepository');


class TokenService {

    login(body) {
        const { username, password } = body || {};

        if (typeof username !== 'string' || username.trim() === '') {
            const err = new Error('username is required');
            err.statusCode = 400;
            throw err;
        }

        if (typeof password !== 'string' || password.trim() === '') {
            const err = new Error('password is required');
            err.statusCode = 400;
            throw err;
        }

        const user = userRepository.findByUsername(username.trim());

        if (!user || user.password !== password.trim()) {
            const err = new Error('Invalid username or password');
            err.statusCode = 401;
            throw err;
        }

        return { userId: user.id };
    }
}

module.exports = new TokenService();
