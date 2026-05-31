const mongoose = require('mongoose');

const AccountingEntrySchema = new mongoose.Schema({
    type: { type: String, enum: ['inflow', 'outflow'], required: true },
    category: { type: String, required: true }, // e.g., 'Repair Payment', 'Part Purchase', 'Utility', 'Salary', 'Rent'
    amount: { type: Number, required: true },
    description: { type: String },
    date: { type: Date, default: Date.now },
    recordedBy: { type: String, required: true } // Name or email of staff
});

module.exports = mongoose.model('AccountingEntry', AccountingEntrySchema);
