const mongoose = require('mongoose');

const ViewerSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true,
        lowercase: true
    },
    token: { 
        type: String, 
        required: true, 
        unique: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    visits: [{
        streamId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Stream' 
        },
        streamTitle: { 
            type: String 
        },
        date: { 
            type: Date, 
            default: Date.now 
        }
    }]
});

module.exports = mongoose.model('Viewer', ViewerSchema);
