const userRepository = require('../repositories/userRepository');
const {
    hashLegacyPassword,
    verifyPassword
} = require('../utilities/passwordHelper');
const { createJwt } = require('../utilities/tokenHelper');

function createBadRequestError(message) {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
}

function createInvalidCredentialsError() {
    const error = new Error('Invalid username or password');
    error.statusCode = 401;
    return error;
}

class TokenService {
    async login(body) {
        const { username, password } = body || {};

        if (typeof username !== 'string' || username.trim() === '') {
            throw createBadRequestError('username is required');
        }

        if (typeof password !== 'string' || password.trim() === '') {
            throw createBadRequestError('password is required');
        }

        const user = await userRepository.findByUsernameWithPassword(
            username.trim()
        );

        if (!user || user.isActive === false) {
            throw createInvalidCredentialsError();
        }

        const passwordVerification = await verifyPassword(
            password,
            user.password
        );

        if (!passwordVerification.matches) {
            throw createInvalidCredentialsError();
        }

        let authenticatedUser = user;

        if (passwordVerification.needsUpgrade) {
            const passwordHash = await hashLegacyPassword(password);

            authenticatedUser = await userRepository.upgradeLegacyPassword(
                user.id,
                passwordHash
            );

            if (!authenticatedUser) {
                throw new Error('Unable to upgrade legacy password');
            }
        }

        return {
            token: createJwt(authenticatedUser),
            userId: authenticatedUser.id,
            user: authenticatedUser.toResponseObject()
        };
    }
}

module.exports = new TokenService();
