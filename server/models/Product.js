const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true },
    image: { type: String, required: false },
    category: { type: String, default: 'General' },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);

