const express = require('express');
const router = express.Router();
const ThreeDPost = require('../models/ThreeDPost');

// Get unique categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await ThreeDPost.distinct('category');
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all 3D Posts
router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.category) filter.category = req.query.category;
        
        const posts = await ThreeDPost.find(filter).sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get a single 3D Post by slug
router.get('/:slug', async (req, res) => {
    try {
        const post = await ThreeDPost.findOne({ slug: req.params.slug });
        if (!post) return res.status(404).json({ message: 'Post not found' });
        
        // Increment views
        post.views += 1;
        await post.save();
        
        res.json(post);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new 3D Post
router.post('/', async (req, res) => {
    // Basic auth check (assuming admin token middleware is optionally applied in server.js or here)
    // For simplicity following existing pattern, we'll just create
    const { title, story, sketchfabUrl, thumbnail } = req.body;
    
    if (!title || !story || !sketchfabUrl || !thumbnail) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        let slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        let existing = await ThreeDPost.findOne({ slug });
        if (existing) {
            slug = `${slug}-${Date.now()}`;
        }

        const newPost = new ThreeDPost({
            title,
            slug,
            story,
            sketchfabUrl,
            thumbnail
        });

        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (err) {
        console.error("Error saving 3D post:", err);
        res.status(400).json({ message: err.message });
    }
});

// Update a 3D Post
router.put('/:id', async (req, res) => {
    try {
        const updatedPost = await ThreeDPost.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { returnDocument: 'after' }
        );
        if (!updatedPost) return res.status(404).json({ message: 'Post not found' });
        res.json(updatedPost);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a 3D Post
router.delete('/:id', async (req, res) => {
    try {
        const post = await ThreeDPost.findByIdAndDelete(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        res.json({ message: 'Post deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
