const mongoose = require('mongoose');

const scamSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, default: '' },
    author: { type: String, default: 'Visitor' },
    category: { type: String, default: 'General' },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    adminReply: { type: String, default: '' },
    adminReplyImage: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Scam', scamSchema);
