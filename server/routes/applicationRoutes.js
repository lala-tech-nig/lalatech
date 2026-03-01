const express = require('express');
const router = express.Router();
const Application = require('../models/Application');

// Get all applications
router.get('/', async (req, res) => {
    try {
        const applications = await Application.find().populate('jobId', 'title').sort({ createdAt: -1 });
        res.json(applications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create an application
router.post('/', async (req, res) => {
    const app = new Application(req.body);
    try {
        const newApp = await app.save();
        res.status(201).json(newApp);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete an application
router.delete('/:id', async (req, res) => {
    try {
        await Application.findByIdAndDelete(req.params.id);
        res.json({ message: 'Application deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
