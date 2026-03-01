const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
    serviceId: { type: String, required: true },
    serviceName: { type: String, required: true },
    customerName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
