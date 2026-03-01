const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
    section: {
        type: String,
        required: true,
        unique: true
    },
    text: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Content', contentSchema);
