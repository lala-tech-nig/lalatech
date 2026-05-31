const mongoose = require('mongoose');

const SocialAccountSchema = new mongoose.Schema({
    platform: { type: String, enum: ['facebook', 'instagram', 'twitter'], required: true },
    accountName: { type: String, required: true },
    accessToken: { type: String }, // Stored page token or user OAuth token
    pageId: { type: String }, // Facebook page ID or Instagram ID or Twitter screen name
    isConnected: { type: Boolean, default: true },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SocialAccount', SocialAccountSchema);
