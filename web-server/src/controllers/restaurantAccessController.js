const restaurantRepository =
    require('../repositories/restaurantRepository');
const userRepository = require('../repositories/userRepository');
const responseHelper = require('../utilities/responseHelper');
const {
    canManageRestaurantAccess,
    getEditorIds,
    getRequestUserId,
    normalizeEditorIds,
    toUserId
} = require('../services/restaurantAccessService');

function toAccessUserResponse(user) {
    return {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        image: user.image || '',
        role: user.role
    };
}

function getTargetUserId(body, fieldName) {
    const value = body?.[fieldName];

    if (typeof value !== 'string' || value.trim() === '') {
        return {
            error: `${fieldName} is required`
        };
    }

    return {
        value: toUserId(value)
    };
}

async function getAccessResponse(restaurant) {
    const owner = restaurant.ownerId
        ? await userRepository.findById(restaurant.ownerId)
        : null;

    const editorIds = getEditorIds(restaurant);

    const editors = (
        await Promise.all(editorIds.map((editorId) => userRepository.findById(editorId)))
    )
        .filter(Boolean)
        .map(toAccessUserResponse);

    return {
        restaurantId: restaurant.id,
        owner: owner ? toAccessUserResponse(owner) : null,
        editors
    };
}

async function getAccessManagedRestaurant(req, res) {
    const restaurant = await restaurantRepository.findById(req.params.id);

    if (!restaurant) {
        responseHelper.notFound(res, 'Restaurant not found');
        return null;
    }

    if (
        !canManageRestaurantAccess(
            restaurant,
            getRequestUserId(req),
            req.user?.role
        )
    ) {
        res.status(403).json({
            error: 'Forbidden',
            message:
                'Only the restaurant owner or an administrator can manage restaurant access'
        });

        return null;
    }

    return restaurant;
}

class RestaurantAccessController {
    async getAccess(req, res, next) {
        try {
            const restaurant = await getAccessManagedRestaurant(req, res);

            if (!restaurant) {
                return;
            }

            return responseHelper.ok(
                res,
                await getAccessResponse(restaurant)
            );
        } catch (error) {
            next(error);
        }
    }

    async addEditor(req, res, next) {
        try {
            const restaurant = await getAccessManagedRestaurant(req, res);

            if (!restaurant) {
                return;
            }

            const targetUserId = getTargetUserId(req.body, 'userId');

            if (targetUserId.error) {
                return responseHelper.badRequest(res, targetUserId.error);
            }

            if (toUserId(restaurant.ownerId) === targetUserId.value) {
                return responseHelper.badRequest(
                    res,
                    'The restaurant owner cannot also be an editor'
                );
            }

            const targetUser = await userRepository.findById(
                targetUserId.value
            );

            if (!targetUser) {
                return responseHelper.notFound(res, 'User not found');
            }

            const currentEditorIds = getEditorIds(restaurant);

            if (currentEditorIds.includes(targetUserId.value)) {
                return res.status(409).json({
                    error: 'Conflict',
                    message: 'This user already has editor access'
                });
            }

            const updatedRestaurant =
                await restaurantRepository.updateAccess(restaurant.id, {
                    ownerId: restaurant.ownerId,
                    editorIds: [
                        ...currentEditorIds,
                        targetUserId.value
                    ]
                });

            return res.status(201).json(
                await getAccessResponse(updatedRestaurant)
            );
        } catch (error) {
            next(error);
        }
    }

    async removeEditor(req, res, next) {
        try {
            const restaurant = await getAccessManagedRestaurant(req, res);

            if (!restaurant) {
                return;
            }

            const editorUserId = toUserId(req.params.userId);
            const currentEditorIds = getEditorIds(restaurant);

            if (!editorUserId || !currentEditorIds.includes(editorUserId)) {
                return responseHelper.notFound(res, 'Editor not found');
            }

            await restaurantRepository.updateAccess(restaurant.id, {
                ownerId: restaurant.ownerId,
                editorIds: currentEditorIds.filter(
                    (editorId) => editorId !== editorUserId
                )
            });

            return responseHelper.noContent(res);
        } catch (error) {
            next(error);
        }
    }

    async transferOwnership(req, res, next) {
        try {
            const restaurant = await getAccessManagedRestaurant(req, res);

            if (!restaurant) {
                return;
            }

            const targetUserId = getTargetUserId(req.body, 'userId');

            if (targetUserId.error) {
                return responseHelper.badRequest(res, targetUserId.error);
            }

            if (toUserId(restaurant.ownerId) === targetUserId.value) {
                return responseHelper.badRequest(
                    res,
                    'The selected user is already the restaurant owner'
                );
            }

            const targetUser = await userRepository.findById(
                targetUserId.value
            );

            if (!targetUser) {
                return responseHelper.notFound(res, 'User not found');
            }

            const updatedRestaurant =
                await restaurantRepository.updateAccess(restaurant.id, {
                    ownerId: targetUser.id,
                    editorIds: normalizeEditorIds(
                        getEditorIds(restaurant).filter(
                            (editorId) => editorId !== targetUser.id
                        ),
                        targetUser.id
                    )
                });

            return responseHelper.ok(
                res,
                await getAccessResponse(updatedRestaurant)
            );
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new RestaurantAccessController();