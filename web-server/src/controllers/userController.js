const userService = require('../services/userService');

class UserController {
    async createUser(req, res, next) {
        try {
            const user = await userService.createUser(req.body);

            res.status(201)
                .location(`/api/users/${user.id}`)
                .json(user.toResponseObject());
        } catch (err) {
            next(err);
        }
    }

    async getUserById(req, res, next) {
        try {
            const user = await userService.getUserById(req.params.id);
            res.status(200).json(user.toResponseObject());
        } catch (err) {
            next(err);
        }
    }

    async updateCurrentUserLocation(req, res, next) {
        try {
            const userId = req.user?.sub;

            if (!userId) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Missing authenticated user'
                });
            }

            const user = await userService.updateCurrentUserLocation(userId, req.body);
            return res.status(200).json(user.toResponseObject());
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new UserController();