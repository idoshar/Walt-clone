const PasswordResetRequest =
    require('../models/PasswordResetRequest');
const { generateId } = require('../utilities/idGenerator');

class PasswordResetRequestRepository {
    async findById(id) {
        return PasswordResetRequest.findOne({ id: String(id) });
    }

    async findOpenByUserId(userId) {
        return PasswordResetRequest.findOne({
            userId: String(userId),
            status: {
                $in: ['pending', 'processing']
            }
        }).sort({
            createdAt: -1,
            _id: -1
        });
    }

    async createPending(userId) {
        const existingRequest = await this.findOpenByUserId(userId);

        if (existingRequest) {
            return existingRequest;
        }

        return PasswordResetRequest.create({
            id: generateId(),
            userId: String(userId),
            status: 'pending'
        });
    }

    async getByStatus(status) {
        return PasswordResetRequest.find({
            status
        }).sort({
            createdAt: 1,
            _id: 1
        });
    }

    async claimForApproval(id, reviewerUserId) {
        return PasswordResetRequest.findOneAndUpdate(
            {
                id: String(id),
                status: 'pending'
            },
            {
                $set: {
                    status: 'processing',
                    reviewedByUserId: String(reviewerUserId),
                    reviewedAt: new Date()
                }
            },
            {
                new: true,
                runValidators: true
            }
        );
    }

    async approveClaimedRequest(id, reviewerUserId) {
        return PasswordResetRequest.findOneAndUpdate(
            {
                id: String(id),
                status: 'processing',
                reviewedByUserId: String(reviewerUserId)
            },
            {
                $set: {
                    status: 'approved',
                    reviewedAt: new Date()
                }
            },
            {
                new: true,
                runValidators: true
            }
        );
    }

    async releaseClaim(id, reviewerUserId) {
        return PasswordResetRequest.findOneAndUpdate(
            {
                id: String(id),
                status: 'processing',
                reviewedByUserId: String(reviewerUserId)
            },
            {
                $set: {
                    status: 'pending',
                    reviewedByUserId: null,
                    reviewedAt: null
                }
            },
            {
                new: true,
                runValidators: true
            }
        );
    }

    async rejectPendingRequest(id, reviewerUserId) {
        return PasswordResetRequest.findOneAndUpdate(
            {
                id: String(id),
                status: 'pending'
            },
            {
                $set: {
                    status: 'rejected',
                    reviewedByUserId: String(reviewerUserId),
                    reviewedAt: new Date()
                }
            },
            {
                new: true,
                runValidators: true
            }
        );
    }
}

module.exports = new PasswordResetRequestRepository();