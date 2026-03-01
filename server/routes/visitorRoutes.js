const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');

// Get visitor count
router.get('/', async (req, res) => {
    try {
        let visitor = await Visitor.findOne();
        if (!visitor) {
            visitor = new Visitor({ count: 0 });
            await visitor.save();
        }
        res.json({ count: visitor.count });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Increment visitor count
router.post('/increment', async (req, res) => {
    try {
        let visitor = await Visitor.findOne();
        if (!visitor) {
            visitor = new Visitor({ count: 1 });
        } else {
            visitor.count += 1;
        }
        await visitor.save();
        res.json({ count: visitor.count });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
