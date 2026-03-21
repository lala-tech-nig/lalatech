const express = require('express');
const router = express.Router();
const Course = require('../models/Course');

// Get all courses
router.get('/', async (req, res) => {
    try {
        const courses = await Course.find().sort({ createdAt: -1 });
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add new course
router.post('/', async (req, res) => {
    const course = new Course({
        title: req.body.title,
        description: req.body.description,
        youtubeVideoId: req.body.youtubeVideoId,
        thumbnailUrl: req.body.thumbnailUrl
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
