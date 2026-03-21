const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    content: { type: String, required: false }, // Text content
    image: { type: String, required: false },   // Optional image/video URL
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
