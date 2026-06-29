const userService = require('../services/userService');

class UserController {
    async createUser(req, res, next) {
        try {
            const user = await userService.createUser(req.body);

            return res
                .status(201)
                .location(`/api/users/${user.id}`)
                .json(user.toResponseObject());
        } catch (err) {
            return next(err);
        }
    }

    async getUserById(req, res, next) {
        try {
            const user = await userService.getUserById(req.params.id);
            return res.status(200).json(user.toResponseObject());
        } catch (err) {
            return next(err);
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

            const user = await userService.updateCurrentUserLocation(
                userId,
                req.body
            );

            return res.status(200).json(user.toResponseObject());
        } catch (err) {
            return next(err);
        }
    }

    async changeCurrentUserPassword(req, res, next) {
        try {
            const userId = req.user?.sub;

            if (!userId) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Missing authenticated user'
                });
            }

            const result = await userService.changeCurrentUserPassword(
                userId,
                req.body
            );

            return res.status(200).json(result);
        } catch (err) {
            return next(err);
        }
    }
}

module.exports = new UserController();
