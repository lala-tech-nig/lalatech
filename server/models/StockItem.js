const mongoose = require('mongoose');

const StockItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    quantity: { type: Number, default: 0 },
    unitPrice: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 5 },
    category: { type: String, default: 'General' },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StockItem', StockItemSchema);
