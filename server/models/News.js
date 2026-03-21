const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    excerpt: { type: String, default: '' },
    category: { type: String, default: 'General' },
    tags: { type: [String], default: [] },
    coverImage: { type: String, default: '' },
    author: { type: String, default: 'Lala Tech' },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
}, { timestamps: true });

// Auto-generate slug from title if not provided
newsSchema.pre('validate', function (next) {
    if (this.title && !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 80);
    }
    next();
});

module.exports = mongoose.model('News', newsSchema);
