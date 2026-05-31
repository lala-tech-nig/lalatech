const mongoose = require('mongoose');

const RepairJobSchema = new mongoose.Schema({
    jobId: { type: String, required: true, unique: true }, // e.g. JOB-1001
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    device: { type: String, required: true }, // e.g. iPhone 13 Pro
    serialNumber: { type: String },
    issue: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['intake', 'diagnosis', 'repairing', 'waiting_parts', 'ready', 'delivered'], 
        default: 'intake' 
    },
    partsNeeded: [{ type: String }],
    price: { type: Number, default: 0 },
    technician: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    notes: [{
        content: String,
        author: String,
        date: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RepairJob', RepairJobSchema);
