const userService = require('../services/userService');

class UserController {
    createUser(req, res, next) {
        try {
            const user = userService.createUser(req.body);

            res.status(201)
                .location(`/api/users/${user.id}`)
                .json(user.toResponseObject());
        } catch (err) {
            next(err);
        }
    }

    getUserById(req, res, next) {
        try {
            const user = userService.getUserById(req.params.id);
            res.status(200).json(user.toResponseObject());
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new UserController();
