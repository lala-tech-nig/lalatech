const mongoose = require('mongoose');

const DailyReportSchema = new mongoose.Schema({
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    morningTodos: [{ type: String }],
    completedTodos: [{ type: String }],
    challenges: { type: String },
    summary: { type: String },
    submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DailyReport', DailyReportSchema);
