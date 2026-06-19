const crypto = require('crypto');
const userRepository = require('../repositories/userRepository');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-for-course-project';
const JWT_EXPIRES_IN_SECONDS = 60 * 60 * 2;

function base64UrlEncode(value) {
    return Buffer
        .from(JSON.stringify(value))
        .toString('base64url');
}

function createSignature(header, payload) {
    return crypto
        .createHmac('sha256', JWT_SECRET)
        .update(`${header}.${payload}`)
        .digest('base64url');
}

function createJwt(user) {
    const now = Math.floor(Date.now() / 1000);

    const header = {
        alg: 'HS256',
        typ: 'JWT'
    };

    const payload = {
        sub: String(user.id),
        username: user.username,
        fullName: user.fullName,
        iat: now,
        exp: now + JWT_EXPIRES_IN_SECONDS
    };

    const encodedHeader = base64UrlEncode(header);
    const encodedPayload = base64UrlEncode(payload);
    const signature = createSignature(encodedHeader, encodedPayload);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

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

        return {
            token: createJwt(user),
            userId: user.id,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                phone: user.phone,
                address: user.address
            }
        };
    }
}

module.exports = new TokenService();