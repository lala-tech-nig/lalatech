const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true },
    image: { type: String, required: false },
    category: { type: String, default: 'General' },
    youtubeUrl: { type: String, required: false },
}, { timestamps: true });

productSchema.pre('validate', async function () {
    if (this.title && !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    // Ensure uniqueness
    if (this.isModified('slug')) {
        const baseSlug = this.slug;
        let slug = baseSlug;
        let count = 0;
        
        while (true) {
            const existing = await mongoose.model('Product').findOne({ slug, _id: { $ne: this._id } });
            if (!existing) break;
            count++;
            slug = `${baseSlug}-${count}`;
        }
        this.slug = slug;
    }
});

module.exports = mongoose.model('Product', productSchema);

