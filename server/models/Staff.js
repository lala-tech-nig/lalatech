const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // bcrypt hashed
    role: { type: String, enum: ['admin', 'technician', 'sales', 'accountant'], required: true },
    isActive: { type: Boolean, default: true },
    pin: { type: String }, // optional passcode for quick access/terminal use
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Staff', StaffSchema);
