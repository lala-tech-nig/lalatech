const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    postId: { type: String, required: true }, // post._id or news slug
    postType: { type: String, enum: ['post', 'news'], default: 'post' },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    author: { type: String, default: 'Anonymous' },
    content: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    likes: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
