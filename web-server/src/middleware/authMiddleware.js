const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-for-course-project';


function decodeBase64Url(value) {
    return JSON.parse(
        Buffer
            .from(value, 'base64url')
            .toString()
    );
}


function verifyJwt(token) {

    const parts = token.split('.');

    if (parts.length !== 3) {
        return null;
    }


    const [header, payload, signature] = parts;


    const expectedSignature = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(`${header}.${payload}`)
        .digest('base64url');


    if (signature !== expectedSignature) {
        return null;
    }


    const decodedPayload = decodeBase64Url(payload);


    if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
        return null;
    }


    return decodedPayload;
}



function authMiddleware(req, res, next) {

    const authHeader = req.headers.authorization;


    if (!authHeader || !authHeader.startsWith('Bearer ')) {

        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing token'
        });

    }


    const token = authHeader.substring(7);


    const user = verifyJwt(token);


    if (!user) {

        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid token'
        });

    }


    req.user = user;

    next();
}



module.exports = authMiddleware;