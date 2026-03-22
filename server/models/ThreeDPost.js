const mongoose = require('mongoose');

const threeDPostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    story: { type: String, required: true }, // The narration
    sketchfabUrl: { type: String, required: true }, // https://sketchfab.com/3d-models/...
    thumbnail: { type: String, required: true }, // Image URL
    category: { type: String, default: 'General' },
    author: { type: String, default: 'Lala Tech Admin' },
    views: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('ThreeDPost', threeDPostSchema);
