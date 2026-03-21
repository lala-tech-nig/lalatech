const mongoose = require('mongoose');

const adminConfigSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        default: 'global'
    },
    modalActive: {
        type: Boolean,
        default: false
    },
    modalType: {
        type: String,
        enum: ['image', 'video'],
        default: 'image'
    },
    modalMediaUrl: {
        type: String,
        default: ''
    },
    modalWhatsAppNumber: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('AdminConfig', adminConfigSchema);
