const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
    author: { type: String, default: 'Anonymous' },
    content: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    likes: { type: Number, default: 0 },
}, { timestamps: true });

const commentSchema = new mongoose.Schema({
    postId: { type: String, required: true }, // post._id or news slug
    postType: { type: String, enum: ['post', 'news'], default: 'post' },
    author: { type: String, default: 'Anonymous' },
    content: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    likes: { type: Number, default: 0 },
    replies: { type: [replySchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
