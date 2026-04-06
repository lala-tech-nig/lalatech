const express = require('express');
const router = express.Router();
const Scam = require('../models/Scam');

// Get all approved scams
router.get('/', async (req, res) => {
    try {
        const scams = await Scam.find().sort({ createdAt: -1 });
        res.json(scams);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single scam
router.get('/:id', async (req, res) => {
    try {
        const scam = await Scam.findById(req.params.id);
        if (!scam) return res.status(404).json({ message: 'Not found' });
        scam.views += 1;
        await scam.save();
        res.json(scam);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a scam report (public)
router.post('/', async (req, res) => {
    const scam = new Scam(req.body);
    try {
        const newScam = await scam.save();
        res.status(201).json(newScam);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Like a scam report (public)
router.post('/:id/like', async (req, res) => {
    try {
        const scam = await Scam.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { returnDocument: 'after' });
        res.json(scam);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update a scam (admin – protected by global auth middleware)
router.put('/:id', async (req, res) => {
    try {
        const updated = await Scam.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a scam (admin)
router.delete('/:id', async (req, res) => {
    try {
        await Scam.findByIdAndDelete(req.params.id);
        res.json({ message: 'Scam report deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
