const Product = require('../models/Product');
const User = require('../models/User');
const {
    ensureSequenceAtLeast,
    getNextSequence
} = require('./sequenceService');

function getMissingRecommendationIdFilter() {
    return {
        $or: [
            { recommendationId: { $exists: false } },
            { recommendationId: null }
        ]
    };
}

async function getHighestRecommendationId(Model) {
    const document = await Model.findOne({
        recommendationId: { $type: 'number' }
    })
        .sort({ recommendationId: -1 })
        .select({ recommendationId: 1 })
        .lean();

    return Number.isSafeInteger(document?.recommendationId)
        ? document.recommendationId
        : 0;
}

async function backfillModelRecommendationIds(Model, sequenceKey) {
    const highestExistingId = await getHighestRecommendationId(Model);

    await ensureSequenceAtLeast(sequenceKey, highestExistingId);

    const documentsWithoutRecommendationId = await Model.find(
        getMissingRecommendationIdFilter()
    )
        .select({ _id: 1 })
        .lean();

    for (const document of documentsWithoutRecommendationId) {
        const recommendationId = await getNextSequence(sequenceKey);

        await Model.updateOne(
            { _id: document._id },
            { $set: { recommendationId } }
        );
    }
}

async function backfillRecommendationIds() {
    await backfillModelRecommendationIds(User, 'userRecommendationId');
    await backfillModelRecommendationIds(Product, 'productRecommendationId');
}

module.exports = {
    backfillRecommendationIds
};