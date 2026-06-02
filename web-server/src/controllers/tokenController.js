const tokenService = require('../services/tokenService');

class TokenController {

    createToken(req, res, next) {
        try {
            const result = tokenService.login(req.body);
            return res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new TokenController();
