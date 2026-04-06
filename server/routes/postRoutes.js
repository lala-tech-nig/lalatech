const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// Get all posts
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single post by ID
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Not found' });
        res.json(post);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create post
router.post('/', async (req, res) => {
    const post = new Post({
        content: req.body.content,
        image: req.body.image
    });

    try {
        const newPost = await post.save();
        res.status(201).json(newPost);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Like a post
router.post('/:id/like', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if(!post) return res.status(404).json({ message: 'Not found' });
        post.likes += 1;
        await post.save();
        res.json(post);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Share a post
router.post('/:id/share', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if(!post) return res.status(404).json({ message: 'Not found' });
        post.shares += 1;
        await post.save();
        res.json(post);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: 'Post deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
