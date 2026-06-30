const adminAuditLogRepository =
    require('../repositories/adminAuditLogRepository');
const orderRepository = require('../repositories/orderRepository');
const restaurantRepository =
    require('../repositories/restaurantRepository');
const userRepository = require('../repositories/userRepository');
const {
    validatePasswordPolicy
} = require('../utilities/passwordHelper');
const {
    issueTemporaryPassword
} = require('../services/temporaryPasswordService');
const responseHelper = require('../utilities/responseHelper');

function isActiveUser(user) {
    return user?.isActive !== false;
}

function getActiveAdminCount(users) {
    return users.filter(
        (user) => isActiveUser(user) && user.role === 'admin'
    ).length;
}

function normalizeSearchQuery(value) {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function matchesSearch(user, query) {
    if (!query) {
        return true;
    }

    return [
        user.username,
        user.fullName,
        user.phone,
        user.address,
        user.role
    ].some((value) => String(value || '').toLowerCase().includes(query));
}

function normalizeAccountStatus(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { error: 'Request body must be an object' };
    }

    const unsupportedFields = Object.keys(body).filter(
        (field) => field !== 'isActive'
    );

    if (unsupportedFields.length > 0) {
        return {
            error:
                'Unsupported status fields: ' +
                unsupportedFields.join(', ')
        };
    }

    if (typeof body.isActive !== 'boolean') {
        return { error: 'isActive must be a boolean' };
    }

    return { value: body.isActive };
}

function normalizeRole(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { error: 'Request body must be an object' };
    }

    const unsupportedFields = Object.keys(body).filter(
        (field) => field !== 'role'
    );

    if (unsupportedFields.length > 0) {
        return {
            error:
                'Unsupported role fields: ' +
                unsupportedFields.join(', ')
        };
    }

    if (body.role !== 'customer' && body.role !== 'admin') {
        return { error: 'role must be either customer or admin' };
    }

    return { value: body.role };
}

function normalizeTemporaryPassword(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { error: 'Request body must be an object' };
    }

    const unsupportedFields = Object.keys(body).filter(
        (field) => field !== 'temporaryPassword'
    );

    if (unsupportedFields.length > 0) {
        return {
            error:
                'Unsupported password-reset fields: ' +
                unsupportedFields.join(', ')
        };
    }

    try {
        return {
            value: validatePasswordPolicy(
                body.temporaryPassword,
                'temporaryPassword'
            )
        };
    } catch (error) {
        return { error: error.message };
    }
}

function normalizeTemporaryPassword(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { error: 'Request body must be an object' };
    }

    const unsupportedFields = Object.keys(body).filter(
        (field) => field !== 'temporaryPassword'
    );

    if (unsupportedFields.length > 0) {
        return {
            error:
                'Unsupported password-reset fields: ' +
                unsupportedFields.join(', ')
        };
    }

    try {
        return {
            value: validatePasswordPolicy(
                body.temporaryPassword,
                'temporaryPassword'
            )
        };
    } catch (error) {
        return { error: error.message };
    }
}

function toAdminUserResponse(user, currentAdminId, activeAdminCount) {
    const isSelf = user.id === currentAdminId;
    const isFinalActiveAdmin =
        isActiveUser(user) &&
        user.role === 'admin' &&
        activeAdminCount === 1;

    return {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        phone: user.phone,
        address: user.address,
        image: user.image || '',
        role: user.role,
        isActive: isActiveUser(user),
        mustChangePassword: Boolean(user.mustChangePassword),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        protection: {
            isSelf,
            isFinalActiveAdmin
        }
    };
}

class AdminUserManagementController {
    async getUsers(req, res, next) {
        try {
            const searchQuery = normalizeSearchQuery(req.query.q);
            const users = await userRepository.getAll();
            const activeAdminCount = getActiveAdminCount(users);

            const response = users
                .filter((user) => matchesSearch(user, searchQuery))
                .sort((left, right) =>
                    String(left.username || '').localeCompare(
                        String(right.username || ''),
                        undefined,
                        { sensitivity: 'base' }
                    )
                )
                .map((user) =>
                    toAdminUserResponse(
                        user,
                        req.user.sub,
                        activeAdminCount
                    )
                );

            return responseHelper.ok(res, response);
        } catch (error) {
            next(error);
        }
    }

    async updateUserStatus(req, res, next) {
        try {
            const status = normalizeAccountStatus(req.body);

            if (status.error) {
                return responseHelper.badRequest(res, status.error);
            }

            const targetUser = await userRepository.findById(req.params.id);

            if (!targetUser) {
                return responseHelper.notFound(res, 'User not found');
            }

            if (targetUser.id === req.user.sub) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Administrators cannot manage their own account'
                });
            }

            const currentStatus = isActiveUser(targetUser);

            if (currentStatus === status.value) {
                const users = await userRepository.getAll();

                return responseHelper.ok(
                    res,
                    toAdminUserResponse(
                        targetUser,
                        req.user.sub,
                        getActiveAdminCount(users)
                    )
                );
            }

            const usersBeforeChange = await userRepository.getAll();

            if (
                !status.value &&
                targetUser.role === 'admin' &&
                getActiveAdminCount(usersBeforeChange) === 1
            ) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'The final active administrator cannot be deactivated'
                });
            }

            const updatedUser =
                await userRepository.updateAccountStatusAndInvalidateTokens(
                    targetUser.id,
                    status.value
                );

            await adminAuditLogRepository.create({
                actorUserId: req.user.sub,
                targetUserId: targetUser.id,
                action: status.value
                    ? 'user.reactivated'
                    : 'user.deactivated',
                details: {
                    previousIsActive: currentStatus,
                    isActive: status.value
                }
            });

            const usersAfterChange = await userRepository.getAll();

            return responseHelper.ok(
                res,
                toAdminUserResponse(
                    updatedUser,
                    req.user.sub,
                    getActiveAdminCount(usersAfterChange)
                )
            );
        } catch (error) {
            next(error);
        }
    }
    async updateUserRole(req, res, next) {
        try {
            const requestedRole = normalizeRole(req.body);

            if (requestedRole.error) {
                return responseHelper.badRequest(res, requestedRole.error);
            }

            const targetUser = await userRepository.findById(req.params.id);

            if (!targetUser) {
                return responseHelper.notFound(res, 'User not found');
            }

            if (targetUser.id === req.user.sub) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Administrators cannot manage their own account'
                });
            }

            if (targetUser.role === 'owner') {
                return res.status(403).json({
                    error: 'Forbidden',
                    message:
                        'Owner role cannot be changed through administrator role management'
                });
            }

            if (targetUser.role === requestedRole.value) {
                const users = await userRepository.getAll();

                return responseHelper.ok(
                    res,
                    toAdminUserResponse(
                        targetUser,
                        req.user.sub,
                        getActiveAdminCount(users)
                    )
                );
            }

            const usersBeforeChange = await userRepository.getAll();

            if (
                isActiveUser(targetUser) &&
                targetUser.role === 'admin' &&
                requestedRole.value === 'customer' &&
                getActiveAdminCount(usersBeforeChange) === 1
            ) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message:
                        'The final active administrator cannot be demoted'
                });
            }

            const updatedUser =
                await userRepository.updateRoleAndInvalidateTokens(
                    targetUser.id,
                    requestedRole.value
                );

            await adminAuditLogRepository.create({
                actorUserId: req.user.sub,
                targetUserId: targetUser.id,
                action: 'user.roleChanged',
                details: {
                    previousRole: targetUser.role,
                    role: requestedRole.value
                }
            });

            const usersAfterChange = await userRepository.getAll();

            return responseHelper.ok(
                res,
                toAdminUserResponse(
                    updatedUser,
                    req.user.sub,
                    getActiveAdminCount(usersAfterChange)
                )
            );
        } catch (error) {
            next(error);
        }
    }
    async deleteUser(req, res, next) {
        try {
            const targetUser = await userRepository.findById(req.params.id);

            if (!targetUser) {
                return responseHelper.notFound(res, 'User not found');
            }

            if (targetUser.id === req.user.sub) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Administrators cannot manage their own account'
                });
            }

            if (targetUser.role === 'admin') {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Administrator accounts cannot be deleted'
                });
            }

            const [orderCount, ownedRestaurantCount] = await Promise.all([
                orderRepository.countByUserId(targetUser.id),
                restaurantRepository.countByOwnerId(targetUser.id)
            ]);

            if (orderCount > 0) {
                return res.status(409).json({
                    error: 'Conflict',
                    message: 'Users with orders cannot be deleted'
                });
            }

            if (ownedRestaurantCount > 0) {
                return res.status(409).json({
                    error: 'Conflict',
                    message:
                        'Users who own restaurants cannot be deleted'
                });
            }

            const wasDeleted = await userRepository.deleteById(targetUser.id);

            if (!wasDeleted) {
                return responseHelper.notFound(res, 'User not found');
            }

            await adminAuditLogRepository.create({
                actorUserId: req.user.sub,
                targetUserId: targetUser.id,
                action: 'user.deleted',
                details: {
                    username: targetUser.username,
                    role: targetUser.role
                }
            });

            return responseHelper.noContent(res);
        } catch (error) {
            next(error);
        }
    }

    async resetUserPassword(req, res, next) {
        try {
            const temporaryPassword = normalizeTemporaryPassword(req.body);

            if (temporaryPassword.error) {
                return responseHelper.badRequest(
                    res,
                    temporaryPassword.error
                );
            }

            const targetUser = await userRepository.findById(req.params.id);

            if (!targetUser) {
                return responseHelper.notFound(res, 'User not found');
            }

            if (targetUser.id === req.user.sub) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Administrators cannot manage their own account'
                });
            }

            const updatedUser = await issueTemporaryPassword({
                actorUserId: req.user.sub,
                targetUser,
                temporaryPassword: temporaryPassword.value,
                source: 'adminUserManagement'
            });

            const users = await userRepository.getAll();

            return responseHelper.ok(
                res,
                toAdminUserResponse(
                    updatedUser,
                    req.user.sub,
                    getActiveAdminCount(users)
                )
            );
        } catch (error) {
            next(error);
        }
    }

}

module.exports = new AdminUserManagementController();
