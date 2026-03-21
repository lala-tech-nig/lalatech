const mongoose = require('mongoose');

const analyticSchema = new mongoose.Schema({
    ip: { type: String, required: true },
    page: { type: String, required: true },
    timeSpent: { type: Number, default: 0 }, // in seconds
    clicks: [{ 
        x: Number, 
        y: Number, 
        element: String, 
        timestamp: { type: Date, default: Date.now }
    }],
    userAgent: { type: String },
    sessionId: { type: String, required: true }, // uniquely identifies a browse session on a page
}, { timestamps: true });

module.exports = mongoose.model('Analytic', analyticSchema);
