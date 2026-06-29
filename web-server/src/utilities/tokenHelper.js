const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-for-course-project';
const JWT_EXPIRES_IN_SECONDS = 60 * 60 * 2;
const USER_ROLES = new Set(['customer', 'owner', 'admin']);

function base64UrlEncode(value) {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function decodeBase64Url(value) {
    try {
        return JSON.parse(
            Buffer.from(value, 'base64url').toString()
        );
    } catch {
        return null;
    }
}

function createSignature(header, payload) {
    return crypto
        .createHmac('sha256', JWT_SECRET)
        .update(`${header}.${payload}`)
        .digest('base64url');
}

function signaturesMatch(signature, expectedSignature) {
    const signatureBuffer = Buffer.from(signature || '');
    const expectedBuffer = Buffer.from(expectedSignature || '');

    if (signatureBuffer.length !== expectedBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}

function getTokenVersion(user) {
    return (
        Number.isInteger(user?.tokenVersion) &&
        user.tokenVersion >= 0
    )
        ? user.tokenVersion
        : 0;
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
        role: user.role,
        tokenVersion: getTokenVersion(user),
        iat: now,
        exp: now + JWT_EXPIRES_IN_SECONDS
    };

    const encodedHeader = base64UrlEncode(header);
    const encodedPayload = base64UrlEncode(payload);
    const signature = createSignature(encodedHeader, encodedPayload);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyJwt(token) {
    if (typeof token !== 'string') {
        return null;
    }

    const parts = token.split('.');

    if (parts.length !== 3) {
        return null;
    }

    const [header, payload, signature] = parts;
    const decodedHeader = decodeBase64Url(header);
    const decodedPayload = decodeBase64Url(payload);

    if (
        decodedHeader?.alg !== 'HS256' ||
        decodedHeader?.typ !== 'JWT' ||
        !decodedPayload
    ) {
        return null;
    }

    const expectedSignature = createSignature(header, payload);

    if (!signaturesMatch(signature, expectedSignature)) {
        return null;
    }

    const now = Math.floor(Date.now() / 1000);

    if (
        typeof decodedPayload.sub !== 'string' ||
        !decodedPayload.sub ||
        !USER_ROLES.has(decodedPayload.role) ||
        !Number.isInteger(decodedPayload.tokenVersion) ||
        decodedPayload.tokenVersion < 0 ||
        !Number.isFinite(decodedPayload.exp) ||
        decodedPayload.exp <= now
    ) {
        return null;
    }

    return decodedPayload;
}

module.exports = {
    createJwt,
    verifyJwt
};
