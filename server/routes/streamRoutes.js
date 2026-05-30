const express = require('express');
const router = express.Router();
const Stream = require('../models/Stream');
const Viewer = require('../models/Viewer');
const StreamRequest = require('../models/StreamRequest');

// 1. Get all active & rewatchable streams (Public)
router.get('/', async (req, res) => {
    try {
        const streams = await Stream.find({
            $or: [
                { status: 'active' },
                { rewatchable: true }
            ]
        }).sort({ createdAt: -1 });
        res.json(streams);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. Get a single stream (Public)
router.get('/:id', async (req, res) => {
    try {
        const stream = await Stream.findById(req.params.id);
        if (!stream) return res.status(404).json({ message: 'Stream not found' });
        res.json(stream);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 3. Create new stream (Admin protected via global middleware)
router.post('/', async (req, res) => {
    const { title, description } = req.body;
    if (!title) {
        return res.status(400).json({ message: 'Title is required' });
    }

    try {
        // Set all other active streams to ended
        await Stream.updateMany({ status: 'active' }, { status: 'ended', endedAt: new Date() });

        const stream = new Stream({
            title,
            description,
            status: 'active'
        });
        await stream.save();

        // Mark all pending requests as completed when a new stream is started
        await StreamRequest.updateMany({ status: 'pending' }, { status: 'completed' });

        res.status(201).json(stream);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 4. End a stream and save recording URL (Admin protected)
router.post('/:id/end', async (req, res) => {
    const { videoUrl, rewatchable } = req.body;

    try {
        const stream = await Stream.findById(req.params.id);
        if (!stream) return res.status(404).json({ message: 'Stream not found' });

        stream.status = 'ended';
        stream.endedAt = new Date();
        if (rewatchable && videoUrl) {
            stream.rewatchable = true;
            stream.videoUrl = videoUrl;
        } else {
            stream.rewatchable = false;
        }
        await stream.save();

        res.json(stream);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 5. Delete a stream entirely (Admin protected)
router.delete('/:id', async (req, res) => {
    try {
        const stream = await Stream.findByIdAndDelete(req.params.id);
        if (!stream) return res.status(404).json({ message: 'Stream not found' });
        res.json({ message: 'Stream deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 6. Register a visitor by email & return token (Public)
router.post('/register', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    try {
        const trimmedEmail = email.trim().toLowerCase();
        let viewer = await Viewer.findOne({ email: trimmedEmail });

        if (viewer) {
            return res.json({
                message: 'Email already registered',
                token: viewer.token,
                exists: true
            });
        }

        // Generate custom token LT-XXXXXX
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let token = 'LT-';
        for (let i = 0; i < 6; i++) {
            token += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        // Check token uniqueness
        let tokenExists = await Viewer.findOne({ token });
        while (tokenExists) {
            token = 'LT-';
            for (let i = 0; i < 6; i++) {
                token += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            tokenExists = await Viewer.findOne({ token });
        }

        viewer = new Viewer({
            email: trimmedEmail,
            token
        });
        await viewer.save();

        res.status(201).json({
            message: 'Registration successful',
            token: viewer.token,
            exists: false
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 7. Verify email + token and log the visit (Public)
router.post('/verify-and-log', async (req, res) => {
    const { email, token, streamId, streamTitle } = req.body;
    if (!email || !token) {
        return res.status(400).json({ message: 'Email and token are required' });
    }

    try {
        const trimmedEmail = email.trim().toLowerCase();
        const viewer = await Viewer.findOne({ email: trimmedEmail });

        if (!viewer) {
            return res.status(404).json({ success: false, message: 'Email is not registered' });
        }

        if (viewer.token !== token.trim()) {
            return res.status(401).json({ success: false, message: 'Invalid access token' });
        }

        // Record a visit log
        if (streamId && streamTitle) {
            // Avoid logging duplicates if double-clicked
            const hasRecentLog = viewer.visits.some(v => 
                v.streamId && v.streamId.toString() === streamId.toString() && 
                (new Date() - new Date(v.date)) < 1000 * 60 * 5 // 5 minutes window
            );

            if (!hasRecentLog) {
                viewer.visits.push({
                    streamId,
                    streamTitle,
                    date: new Date()
                });
                await viewer.save();
            }
        }

        res.json({ success: true, message: 'Access verified successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 8. Request a new stream when none is live (Public, requires token)
router.post('/request-stream', async (req, res) => {
    const { email, token, title } = req.body;
    if (!email || !token) {
        return res.status(400).json({ message: 'Email and token are required' });
    }

    try {
        const trimmedEmail = email.trim().toLowerCase();
        const viewer = await Viewer.findOne({ email: trimmedEmail });

        if (!viewer || viewer.token !== token.trim()) {
            return res.status(401).json({ message: 'Unauthorized: Invalid email or token' });
        }

        // Check if there is already a pending request from this user
        const existingPending = await StreamRequest.findOne({
            viewerEmail: trimmedEmail,
            status: 'pending'
        });

        if (existingPending) {
            return res.json({ message: 'You have already submitted a pending request.', request: existingPending });
        }

        const request = new StreamRequest({
            viewerEmail: trimmedEmail,
            title: title || 'Requesting a livestream'
        });
        await request.save();

        res.status(201).json({ message: 'Stream request submitted successfully', request });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 9. Admin view registered viewers list (Admin only)
router.get('/admin/viewers', async (req, res) => {
    try {
        const viewers = await Viewer.find().sort({ createdAt: -1 });
        res.json(viewers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 10. Admin view pending stream requests (Admin only)
router.get('/admin/requests', async (req, res) => {
    try {
        const requests = await StreamRequest.find({ status: 'pending' }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 11. Admin complete or delete a request (Admin only)
router.delete('/admin/requests/:id', async (req, res) => {
    try {
        await StreamRequest.findByIdAndDelete(req.params.id);
        res.json({ message: 'Request cleared' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
