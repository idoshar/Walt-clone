const adminAuditLogRepository =
    require('../repositories/adminAuditLogRepository');
const passwordResetRequestRepository =
    require('../repositories/passwordResetRequestRepository');
const userRepository = require('../repositories/userRepository');
const {
    issueTemporaryPassword
} = require('../services/temporaryPasswordService');
const {
    validatePasswordPolicy
} = require('../utilities/passwordHelper');
const responseHelper = require('../utilities/responseHelper');

const GENERIC_SUBMISSION_MESSAGE =
    'If an active account matches the supplied username, an administrator can review the request.';

function isActiveUser(user) {
    return user?.isActive !== false;
}

function normalizePublicUsername(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return {
            error: 'Request body must be an object'
        };
    }

    const unsupportedFields = Object.keys(body).filter(
        (field) => field !== 'username'
    );

    if (unsupportedFields.length > 0) {
        return {
            error:
                'Unsupported password-reset request fields: ' +
                unsupportedFields.join(', ')
        };
    }

    if (
        typeof body.username !== 'string' ||
        body.username.trim() === ''
    ) {
        return {
            error: 'username is required'
        };
    }

    return {
        value: body.username.trim()
    };
}

function normalizeTemporaryPassword(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return {
            error: 'Request body must be an object'
        };
    }

    const unsupportedFields = Object.keys(body).filter(
        (field) => field !== 'temporaryPassword'
    );

    if (unsupportedFields.length > 0) {
        return {
            error:
                'Unsupported approval fields: ' +
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
        return {
            error: error.message
        };
    }
}

function normalizeStatus(value) {
    if (value === undefined || value === null || value === '') {
        return {
            value: 'pending'
        };
    }

    if (
        value !== 'pending' &&
        value !== 'approved' &&
        value !== 'rejected'
    ) {
        return {
            error:
                'status must be pending, approved, or rejected'
        };
    }

    return {
        value
    };
}

function toAdminUserResponse(user) {
    if (!user) {
        return null;
    }

    return {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        image: user.image || '',
        role: user.role,
        isActive: isActiveUser(user),
        mustChangePassword: Boolean(user.mustChangePassword)
    };
}

async function toAdminRequestResponse(request, knownUser = null) {
    const user =
        knownUser || (await userRepository.findById(request.userId));

    return {
        id: request.id,
        status: request.status,
        createdAt: request.createdAt,
        reviewedAt: request.reviewedAt,
        user: toAdminUserResponse(user)
    };
}

async function respondToNoLongerPendingRequest(req, res) {
    const existingRequest =
        await passwordResetRequestRepository.findById(req.params.id);

    if (!existingRequest) {
        return responseHelper.notFound(
            res,
            'Password-reset request not found'
        );
    }

    return res.status(409).json({
        error: 'Conflict',
        message:
            'This password-reset request is no longer pending'
    });
}

class PasswordResetRequestController {
    async submitRequest(req, res, next) {
        try {
            const username = normalizePublicUsername(req.body);

            if (username.error) {
                return responseHelper.badRequest(res, username.error);
            }

            const user = await userRepository.findByUsername(
                username.value
            );

            if (user && isActiveUser(user)) {
                await passwordResetRequestRepository.createPending(user.id);
            }

            return res.status(202).json({
                message: GENERIC_SUBMISSION_MESSAGE
            });
        } catch (error) {
            next(error);
        }
    }

    async getAdminRequests(req, res, next) {
        try {
            const status = normalizeStatus(req.query.status);

            if (status.error) {
                return responseHelper.badRequest(res, status.error);
            }

            const requests =
                await passwordResetRequestRepository.getByStatus(
                    status.value
                );

            const response = await Promise.all(
                requests.map((request) =>
                    toAdminRequestResponse(request)
                )
            );

            return responseHelper.ok(res, response);
        } catch (error) {
            next(error);
        }
    }

    async approveRequest(req, res, next) {
        try {
            const temporaryPassword = normalizeTemporaryPassword(req.body);

            if (temporaryPassword.error) {
                return responseHelper.badRequest(
                    res,
                    temporaryPassword.error
                );
            }

            const request =
                await passwordResetRequestRepository.claimForApproval(
                    req.params.id,
                    req.user.sub
                );

            if (!request) {
                return respondToNoLongerPendingRequest(req, res);
            }

            const targetUser =
                await userRepository.findById(request.userId);

            if (targetUser?.id === req.user.sub) {
                await passwordResetRequestRepository.releaseClaim(
                    request.id,
                    req.user.sub
                );

                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Administrators cannot manage their own account'
                });
            }

            if (!targetUser || !isActiveUser(targetUser)) {
                await passwordResetRequestRepository.releaseClaim(
                    request.id,
                    req.user.sub
                );

                return res.status(409).json({
                    error: 'Conflict',
                    message:
                        'The requested account is no longer active'
                });
            }

            try {
                const updatedUser = await issueTemporaryPassword({
                    actorUserId: req.user.sub,
                    targetUser,
                    temporaryPassword: temporaryPassword.value,
                    source: 'approvedPasswordResetRequest',
                    passwordResetRequestId: request.id
                });

                const approvedRequest =
                    await passwordResetRequestRepository.approveClaimedRequest(
                        request.id,
                        req.user.sub
                    );

                if (!approvedRequest) {
                    throw new Error(
                        'Could not finalize the password-reset request'
                    );
                }

                await adminAuditLogRepository.create({
                    actorUserId: req.user.sub,
                    targetUserId: updatedUser.id,
                    action: 'passwordResetRequest.approved',
                    details: {
                        passwordResetRequestId: approvedRequest.id,
                        mustChangePassword: true
                    }
                });

                return responseHelper.ok(
                    res,
                    await toAdminRequestResponse(
                        approvedRequest,
                        updatedUser
                    )
                );
            } catch (error) {
                await passwordResetRequestRepository.releaseClaim(
                    request.id,
                    req.user.sub
                );

                throw error;
            }
        } catch (error) {
            next(error);
        }
    }

    async rejectRequest(req, res, next) {
        try {
            const body = req.body || {};

            if (
                typeof body !== 'object' ||
                Array.isArray(body) ||
                Object.keys(body).length > 0
            ) {
                return responseHelper.badRequest(
                    res,
                    'Rejecting a password-reset request does not accept request fields'
                );
            }

            const requestToReject =
                await passwordResetRequestRepository.findById(
                    req.params.id
                );

            if (!requestToReject) {
                return responseHelper.notFound(
                    res,
                    'Password-reset request not found'
                );
            }

            if (requestToReject.userId === req.user.sub) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Administrators cannot manage their own account'
                });
            }

            const rejectedRequest =
                await passwordResetRequestRepository.rejectPendingRequest(
                    req.params.id,
                    req.user.sub
                );

            if (!rejectedRequest) {
                return respondToNoLongerPendingRequest(req, res);
            }

            await adminAuditLogRepository.create({
                actorUserId: req.user.sub,
                targetUserId: rejectedRequest.userId,
                action: 'passwordResetRequest.rejected',
                details: {
                    passwordResetRequestId: rejectedRequest.id
                }
            });

            return responseHelper.ok(
                res,
                await toAdminRequestResponse(rejectedRequest)
            );
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new PasswordResetRequestController();