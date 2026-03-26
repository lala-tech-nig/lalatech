const express = require('express');
const router = express.Router();
const Course = require('../models/Course');

// Get unique categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await Course.distinct('category');
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all courses (with optional category filter)
router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.category && req.query.category !== 'All') {
            filter.category = req.query.category;
        }
        const courses = await Course.find(filter).sort({ createdAt: -1 });
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add new course
router.post('/', async (req, res) => {
    let youtubeVideoId = req.body.youtubeVideoId || req.body.videoUrl || '';
    const urlMatch = youtubeVideoId.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
    if (urlMatch) youtubeVideoId = urlMatch[1];

    const course = new Course({
        title: req.body.title,
        description: req.body.description,
        youtubeVideoId,
        thumbnailUrl: req.body.thumbnailUrl,
        introText: req.body.introText || '',
        category: req.body.category || 'General',
    });
    try {
        const newCourse = await course.save();
        res.status(201).json(newCourse);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete course
router.delete('/:id', async (req, res) => {
    try {
        await Course.findByIdAndDelete(req.params.id);
        res.json({ message: 'Course deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
