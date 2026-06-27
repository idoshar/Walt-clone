const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        value: {
            type: Number,
            required: true,
            default: 0
        }
    },
    {
        versionKey: false
    }
);

module.exports = mongoose.model('Counter', counterSchema);