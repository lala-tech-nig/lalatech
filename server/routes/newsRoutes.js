const express = require('express');
const router = express.Router();
const News = require('../models/News');

// GET all news (with optional category filter)
router.get('/', async (req, res) => {
    try {
        const filter = { published: true };
        if (req.query.category && req.query.category !== 'All') {
            filter.category = req.query.category;
        }
        const news = await News.find(filter).sort({ createdAt: -1 });
        res.json(news);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET single article by slug
router.get('/slug/:slug', async (req, res) => {
    try {
        const article = await News.findOneAndUpdate(
            { slug: req.params.slug, published: true },
            { $inc: { views: 1 } },
            { new: true }
        );
        if (!article) return res.status(404).json({ message: 'Not found' });
        res.json(article);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET single article by ID (admin)
router.get('/id/:id', async (req, res) => {
    try {
        const article = await News.findById(req.params.id);
        if (!article) return res.status(404).json({ message: 'Not found' });
        res.json(article);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET all news for admin (including drafts)
router.get('/admin/all', async (req, res) => {
    try {
        const news = await News.find().sort({ createdAt: -1 });
        res.json(news);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create news
router.post('/', async (req, res) => {
    try {
        // Auto-generate slug
        const baseSlug = (req.body.title || '')
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 80);
        
        // Ensure unique slug
        let slug = baseSlug;
        let count = 0;
        while (await News.findOne({ slug })) {
            count++;
            slug = `${baseSlug}-${count}`;
        }

        const article = new News({
            title: req.body.title,
            slug,
            content: req.body.content,
            excerpt: req.body.excerpt || req.body.content.substring(0, 160),
            category: req.body.category || 'General',
            tags: req.body.tags || [],
            coverImage: req.body.coverImage || '',
            author: req.body.author || 'Lala Tech',
            published: req.body.published !== false,
        });
        const saved = await article.save();
        res.status(201).json(saved);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

// PUT update news
router.put('/:id', async (req, res) => {
    try {
        const updated = await News.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST like
router.post('/:id/like', async (req, res) => {
    try {
        const article = await News.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { new: true });
        res.json(article);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST share
router.post('/:id/share', async (req, res) => {
    try {
        const article = await News.findByIdAndUpdate(req.params.id, { $inc: { shares: 1 } }, { new: true });
        res.json(article);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE
router.delete('/:id', async (req, res) => {
    try {
        await News.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
