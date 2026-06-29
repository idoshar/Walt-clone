const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const MIN_PASSWORD_LENGTH = 8;

function getBcryptRounds() {
    const configuredRounds = Number(process.env.BCRYPT_ROUNDS || 10);

    if (
        Number.isInteger(configuredRounds) &&
        configuredRounds >= 10 &&
        configuredRounds <= 14
    ) {
        return configuredRounds;
    }

    return 10;
}

function createValidationError(message) {
    const error = new Error(message);
    error.statusCode = 400;
    return error;
}

function normalizePassword(value, fieldName = 'password') {
    if (typeof value !== 'string' || value.trim() === '') {
        throw createValidationError(`${fieldName} is required`);
    }

    return value;
}

function validatePasswordPolicy(value, fieldName = 'password') {
    const password = normalizePassword(value, fieldName);

    if (password.length < MIN_PASSWORD_LENGTH) {
        throw createValidationError(
            `${fieldName} must be at least ${MIN_PASSWORD_LENGTH} characters long`
        );
    }

    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        throw createValidationError(
            `${fieldName} must contain both letters and numbers`
        );
    }

    return password;
}

function isBcryptHash(value) {
    return (
        typeof value === 'string' &&
        /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value)
    );
}

function timingSafeStringEquals(left, right) {
    if (typeof left !== 'string' || typeof right !== 'string') {
        return false;
    }

    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);

    if (leftBuffer.length !== rightBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

async function hashPassword(value) {
    const password = validatePasswordPolicy(value);

    return bcrypt.hash(password, getBcryptRounds());
}

async function hashLegacyPassword(value) {
    const password = normalizePassword(value);

    return bcrypt.hash(password, getBcryptRounds());
}

async function verifyPassword(candidatePassword, storedPassword) {
    const password = normalizePassword(candidatePassword);

    if (isBcryptHash(storedPassword)) {
        return {
            matches: await bcrypt.compare(password, storedPassword),
            needsUpgrade: false
        };
    }

    if (typeof storedPassword !== 'string') {
        return {
            matches: false,
            needsUpgrade: false
        };
    }

    return {
        matches: timingSafeStringEquals(password, storedPassword),
        needsUpgrade: true
    };
}

module.exports = {
    hashLegacyPassword,
    hashPassword,
    isBcryptHash,
    normalizePassword,
    validatePasswordPolicy,
    verifyPassword
};
