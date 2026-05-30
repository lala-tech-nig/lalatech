const mongoose = require('mongoose');

const StreamSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        default: '' 
    },
    status: { 
        type: String, 
        enum: ['active', 'ended'], 
        default: 'active' 
    },
    videoUrl: { 
        type: String, 
        default: '' 
    },
    rewatchable: { 
        type: Boolean, 
        default: false 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    endedAt: { 
        type: Date 
    }
});

module.exports = mongoose.model('Stream', StreamSchema);
