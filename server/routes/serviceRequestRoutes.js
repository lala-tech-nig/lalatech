const express = require('express');
const router = express.Router();
const ServiceRequest = require('../models/ServiceRequest');

// Get all service requests
router.get('/', async (req, res) => {
    try {
        const requests = await ServiceRequest.find().sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new service request
router.post('/', async (req, res) => {
    const request = new ServiceRequest({
        serviceId: req.body.serviceId,
        serviceName: req.body.serviceName,
        customerName: req.body.customerName,
        email: req.body.email,
        phone: req.body.phone,
        details: req.body.details
    });

    try {
        const newRequest = await request.save();
        res.status(201).json(newRequest);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a service request
router.delete('/:id', async (req, res) => {
    try {
        await ServiceRequest.findByIdAndDelete(req.params.id);
        res.json({ message: 'Request deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
