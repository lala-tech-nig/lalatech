const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'RepairJob', required: true },
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    isSubmitted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    submittedAt: { type: Date }
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
