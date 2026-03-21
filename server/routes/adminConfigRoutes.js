const express = require('express');
const router = express.Router();
const AdminConfig = require('../models/AdminConfig');

// Get current config
router.get('/', async (req, res) => {
    try {
        let config = await AdminConfig.findOne({ key: 'global' });
        if (!config) {
            config = new AdminConfig({ key: 'global' });
            await config.save();
        }
        res.json(config);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update config
router.put('/', async (req, res) => {
    try {
        let config = await AdminConfig.findOne({ key: 'global' });
        if (!config) {
            config = new AdminConfig({ key: 'global' });
        }

        config.modalActive = req.body.modalActive;
        config.modalType = req.body.modalType;
        config.modalMediaUrl = req.body.modalMediaUrl;
        config.modalWhatsAppNumber = req.body.modalWhatsAppNumber;

        const updatedConfig = await config.save();
        res.json(updatedConfig);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
