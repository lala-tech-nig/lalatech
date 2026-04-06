const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
    image: { type: String, required: true },
    images: [{ type: String, default: [] }],
    title: { type: String, default: '' },
    description: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Gallery', gallerySchema);
