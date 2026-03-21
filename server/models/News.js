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
    isNewsOfDay: { type: Boolean, default: false },
}, { timestamps: true });

newsSchema.pre('validate', async function () {
    if (this.title && !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    // Ensure uniqueness if slug was just generated or changed
    if (this.isModified('slug')) {
        const baseSlug = this.slug;
        let slug = baseSlug;
        let count = 0;
        
        while (true) {
            const existing = await mongoose.model('News').findOne({ slug, _id: { $ne: this._id } });
            if (!existing) break;
            count++;
            slug = `${baseSlug}-${count}`;
        }
        this.slug = slug;
    }
});

module.exports = mongoose.model('News', newsSchema);
