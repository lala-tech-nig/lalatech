const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    youtubeVideoId: { type: String, required: true },
    thumbnailUrl: { type: String, required: false },
    introText: { type: String, required: false, default: '' },
    category: { type: String, default: 'General' },
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
