const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    company: { type: String, required: true },
    companyLogo: { type: String, default: '' },
    description: { type: String, required: true },
    type: { type: String, required: true, default: 'Full-time' },
    location: { type: String, required: true, default: 'Remote' },
    posterName: { type: String, required: true },
    contactEmail: { type: String, default: '' },
    contactWebsite: { type: String, default: '' },
    phone: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    active: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', jobSchema);
