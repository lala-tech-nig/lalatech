const express = require('express');
const router = express.Router();
const Content = require('../models/Content');

// Get all content sections
router.get('/', async (req, res) => {
    try {
        const content = await Content.find();
        // Return as a nice key-value object
        const contentMap = {};
        content.forEach(c => {
            contentMap[c.section] = c.text;
        });
        res.json(contentMap);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update or create a content section
router.post('/', async (req, res) => {
    const { section, text } = req.body;

    if (!section || !text) {
        return res.status(400).json({ message: "Section and text are required" });
    }

    try {
        const content = await Content.findOneAndUpdate(
            { section },
            { text },
            { returnDocument: 'after', upsert: true }
        );
        res.json(content);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
