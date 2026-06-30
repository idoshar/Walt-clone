const mongoose = require('mongoose');

const adminAuditLogSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        actorUserId: {
            type: String,
            required: true,
            index: true
        },
        targetUserId: {
            type: String,
            required: true,
            index: true
        },
        action: {
            type: String,
            required: true,
            enum: [
                'user.deactivated',
                'user.reactivated',
                'user.roleChanged',
                'user.passwordReset',
                'user.deleted',
                'passwordResetRequest.approved',
                'passwordResetRequest.rejected'
            ],
            index: true
        },
        details: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        collection: 'admin_audit_logs',
        timestamps: {
            createdAt: true,
            updatedAt: false
        }
    }
);

module.exports = mongoose.model(
    'AdminAuditLog',
    adminAuditLogSchema
);