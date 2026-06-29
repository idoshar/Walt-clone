const userRepository = require('../repositories/userRepository');
const { verifyJwt } = require('../utilities/tokenHelper');

function unauthorized(res, message) {
    return res.status(401).json({
        error: 'Unauthorized',
        message
    });
}

async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return unauthorized(res, 'Missing token');
        }

        const token = authHeader.substring(7);
        const tokenPayload = verifyJwt(token);

        if (!tokenPayload) {
            return unauthorized(res, 'Invalid token');
        }

        const user = await userRepository.findById(tokenPayload.sub);

        if (
            !user ||
            user.isActive === false ||
            Number(user.tokenVersion || 0) !== tokenPayload.tokenVersion
        ) {
            return unauthorized(res, 'Invalid token');
        }

        req.user = {
            sub: user.id,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
            tokenVersion: Number(user.tokenVersion || 0),
            mustChangePassword: Boolean(user.mustChangePassword)
        };

        const isPasswordChangeRequest =
            req.method === 'PATCH' &&
            req.originalUrl.split('?')[0] === '/api/users/me/password';

        if (user.mustChangePassword && !isPasswordChangeRequest) {
            return res.status(403).json({
                error: 'PasswordChangeRequired',
                message: 'Password change is required before continuing'
            });
        }

        return next();
    } catch (error) {
        return next(error);
    }
}

module.exports = authMiddleware;
