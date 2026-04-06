const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    postId: { type: String, required: true }, // post._id or news slug or scam string
    postType: { type: String, enum: ['post', 'news', 'threed', 'scam'], default: 'post' },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    author: { type: String, default: 'Anonymous' },
    content: { type: String, required: true },
    image: { type: String, default: '' },
    isAdmin: { type: Boolean, default: false },
    likes: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
