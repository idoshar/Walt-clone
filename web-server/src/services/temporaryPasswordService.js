const adminAuditLogRepository =
    require('../repositories/adminAuditLogRepository');
const userRepository = require('../repositories/userRepository');
const { hashPassword } =
    require('../utilities/passwordHelper');

async function issueTemporaryPassword({
    actorUserId,
    targetUser,
    temporaryPassword,
    source,
    passwordResetRequestId = null
}) {
    const passwordHash = await hashPassword(temporaryPassword);

    const updatedUser =
        await userRepository.updatePasswordAndInvalidateTokens(
            targetUser.id,
            {
                passwordHash,
                mustChangePassword: true
            }
        );

    await adminAuditLogRepository.create({
        actorUserId,
        targetUserId: targetUser.id,
        action: 'user.passwordReset',
        details: {
            mustChangePassword: true,
            source,
            ...(passwordResetRequestId
                ? { passwordResetRequestId }
                : {})
        }
    });

    return updatedUser;
}

module.exports = {
    issueTemporaryPassword
};