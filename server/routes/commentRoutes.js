const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');

// GET all comments for a post/news
router.get('/:postId', async (req, res) => {
    try {
        const comments = await Comment.find({ postId: req.params.postId }).sort({ createdAt: -1 });
        res.json(comments);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST a new comment
router.post('/', async (req, res) => {
    try {
        const comment = new Comment({
            postId: req.body.postId,
            postType: req.body.postType || 'post',
            author: req.body.author || 'Anonymous',
            content: req.body.content,
            isAdmin: req.body.isAdmin || false,
        });
        const saved = await comment.save();
        res.status(201).json(saved);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

// POST a reply to a comment
router.post('/:commentId/reply', async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });
        comment.replies.push({
            author: req.body.author || 'Anonymous',
            content: req.body.content,
            isAdmin: req.body.isAdmin || false,
        });
        await comment.save();
        res.json(comment);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Like a comment
router.post('/:commentId/like', async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        if (!comment) return res.status(404).json({ message: 'Not found' });
        comment.likes += 1;
        await comment.save();
        res.json(comment);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE a comment (admin)
router.delete('/:commentId', async (req, res) => {
    try {
        await Comment.findByIdAndDelete(req.params.commentId);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
