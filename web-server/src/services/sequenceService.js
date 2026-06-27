const Counter = require('../models/Counter');

async function getNextSequence(key) {
    const counter = await Counter.findOneAndUpdate(
        { key },
        {
            $inc: { value: 1 },
            $setOnInsert: { key }
        },
        {
            returnDocument: 'after',
            upsert: true,
            setDefaultsOnInsert: true
        }
    );

    return counter.value;
}

async function ensureSequenceAtLeast(key, minimumValue) {
    if (
        !Number.isSafeInteger(minimumValue) ||
        minimumValue < 0
    ) {
        throw new Error('minimumValue must be a non-negative integer');
    }

    await Counter.updateOne(
        { key },
        {
            $max: { value: minimumValue },
            $setOnInsert: { key }
        },
        { upsert: true }
    );
}

module.exports = {
    getNextSequence,
    ensureSequenceAtLeast
};