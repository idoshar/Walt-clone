const mongoose = require('mongoose');

const PASSWORD_RESET_REQUEST_STATUSES = Object.freeze([
    'pending',
    'processing',
    'approved',
    'rejected'
]);

const passwordResetRequestSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        userId: {
            type: String,
            required: true,
            index: true
        },
        status: {
            type: String,
            enum: PASSWORD_RESET_REQUEST_STATUSES,
            default: 'pending',
            required: true,
            index: true
        },
        reviewedByUserId: {
            type: String,
            default: null,
            index: true
        },
        reviewedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

passwordResetRequestSchema.index({
    status: 1,
    createdAt: 1,
    _id: 1
});

passwordResetRequestSchema.index({
    userId: 1,
    status: 1,
    createdAt: -1
});

module.exports = mongoose.model(
    'PasswordResetRequest',
    passwordResetRequestSchema
);

module.exports.PASSWORD_RESET_REQUEST_STATUSES =
    PASSWORD_RESET_REQUEST_STATUSES;