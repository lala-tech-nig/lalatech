const express = require('express');
const router = express.Router();
const Job = require('../models/Job');

// Get all APPROVED jobs (public)
router.get('/', async (req, res) => {
    try {
        const query = req.query.all === 'true' ? {} : { status: 'approved' };
        const jobs = await Job.find(query).sort({ createdAt: -1 });
        res.json(jobs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single job
router.get('/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Not found' });
        res.json(job);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a job (public submission - starts as pending)
router.post('/', async (req, res) => {
    const job = new Job({ ...req.body, status: 'pending' });
    try {
        const newJob = await job.save();
        res.status(201).json(newJob);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update a job (admin – approve/reject)
router.put('/:id', async (req, res) => {
    try {
        const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
        res.json(updatedJob);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a job (admin)
router.delete('/:id', async (req, res) => {
    try {
        await Job.findByIdAndDelete(req.params.id);
        res.json({ message: 'Job deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
