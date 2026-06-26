const tokenService = require('../services/tokenService');

class TokenController {

    async createToken(req, res, next) {
        try {
            const result = await tokenService.login(req.body);
            return res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new TokenController();
