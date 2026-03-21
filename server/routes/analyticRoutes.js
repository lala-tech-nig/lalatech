const express = require('express');
const router = express.Router();
const Analytic = require('../models/Analytic');

// Receive tracking tick from client
router.post('/track', async (req, res) => {
    const { sessionId, page, timeSpent, newClicks, userAgent } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    try {
        let analytic = await Analytic.findOne({ sessionId, page });
        
        if (!analytic) {
            analytic = new Analytic({
                sessionId,
                page,
                ip,
                timeSpent,
                clicks: newClicks || [],
                userAgent
            });
        } else {
            analytic.timeSpent = Math.max(analytic.timeSpent, timeSpent);
            if (newClicks && newClicks.length > 0) {
                analytic.clicks.push(...newClicks);
            }
        }
        
        await analytic.save();
        res.json({ success: true });
    } catch (err) {
        console.error('Tracking Error:', err);
        res.status(500).json({ success: false });
    }
});

// Get analytics (for admin dashboard)
router.get('/', async (req, res) => {
    try {
        const stats = await Analytic.find().sort({ updatedAt: -1 }).limit(1000); // last 1000 records
        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
