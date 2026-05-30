const mongoose = require('mongoose');

const StreamRequestSchema = new mongoose.Schema({
    viewerEmail: { 
        type: String, 
        required: true,
        trim: true,
        lowercase: true
    },
    title: { 
        type: String, 
        default: 'Requesting a livestream' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    status: { 
        type: String, 
        enum: ['pending', 'completed'], 
        default: 'pending' 
    }
});

module.exports = mongoose.model('StreamRequest', StreamRequestSchema);
