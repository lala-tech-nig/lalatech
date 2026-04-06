const express = require('express');
const router = express.Router();
const Gallery = require('../models/Gallery');

// Get all gallery items
router.get('/', async (req, res) => {
    try {
        const items = await Gallery.find().sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a gallery item (admin)
router.post('/', async (req, res) => {
    const item = new Gallery(req.body);
    try {
        const newItem = await item.save();
        res.status(201).json(newItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a gallery item (admin)
router.put('/:id', async (req, res) => {
    try {
        const updated = await Gallery.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a gallery item (admin)
router.delete('/:id', async (req, res) => {
    try {
        await Gallery.findByIdAndDelete(req.params.id);
        res.json({ message: 'Gallery item deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
