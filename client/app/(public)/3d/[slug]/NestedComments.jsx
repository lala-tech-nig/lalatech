'use client';
import { useState, useEffect } from 'react';
import { MessageCircle, Heart, Share2, Reply, Send, Loader2, User } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

export default function NestedComments({ postId, postType }) {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);

    const [newComment, setNewComment] = useState('');
    const [authorName, setAuthorName] = useState('');
    
    // Tracks which comment ID we are replying to. null = top level.
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [replyAuthor, setReplyAuthor] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchComments();
    }, [postId]);

    const fetchComments = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/comments/${postId}`);
            if (res.ok) {
                const data = await res.json();
                setComments(data);
            }
        } catch (err) {
            console.error('Failed to load comments');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e, parentId = null) => {
        e.preventDefault();
        
        const content = parentId ? replyText : newComment;
        const author = parentId ? replyAuthor : authorName;

        if (!content.trim()) return;

        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE_URL}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    postId,
                    postType,
                    parentId,
                    author: author.trim() || 'Anonymous',
                    content
                })
            });

            if (res.ok) {
                const saved = await res.json();
                setComments(prev => [saved, ...prev]);
                if (parentId) {
                    setReplyingTo(null);
                    setReplyText('');
                } else {
                    setNewComment('');
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleLike = async (commentId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/comments/${commentId}/like`, { method: 'POST' });
            if (res.ok) {
                setComments(comments.map(c => c._id === commentId ? { ...c, likes: c.likes + 1 } : c));
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Organize comments into a tree structure
    const getReplies = (parentId) => {
        return comments
            .filter(c => c.parentId === parentId)
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // Oldest replies first
    };

    const topLevelComments = comments
        .filter(c => !c.parentId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Newest top-level first

    const renderCommentThread = (comment, depth = 0) => {
        const replies = getReplies(comment._id);
        const isReplying = replyingTo === comment._id;
        const maxDepthReached = depth > 6; 

        return (
            <div key={comment._id} className={`flex gap-4 ${depth > 0 ? 'mt-6' : 'mb-8'}`}>
                {/* Avatar */}
                <div className="flex-shrink-0">
                    <div className={`
                        flex items-center justify-center rounded-full font-bold text-white shadow-inner
                        ${comment.isAdmin ? 'bg-[#110f0e] w-12 h-12' : 'bg-slate-200 text-slate-500 w-10 h-10'}
                        ${depth > 0 && !comment.isAdmin ? 'w-8 h-8 text-xs' : ''}
                    `}>
                        {comment.isAdmin ? <span className="text-[#f89e35]">LT</span> : <User className="w-1/2 h-1/2" />}
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                    <div className={`p-5 rounded-3xl border border-slate-100 shadow-sm ${comment.isAdmin ? 'bg-[#fff7ed]/50' : 'bg-slate-50'} relative group`}>
                        
                        {/* Admin Badge */}
                        {comment.isAdmin && (
                            <div className="absolute -top-3 right-6 bg-[#f89e35] text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full shadow-md">
                                Official Answer
                            </div>
                        )}

                        <div className="flex items-center gap-3 mb-2">
                            <span className="font-bold text-slate-900">{comment.author}</span>
                            <span className="text-xs font-semibold text-slate-400">
                                {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                        
                        <p className="text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">{comment.content}</p>

                        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-200/50">
                            <button onClick={() => handleLike(comment._id)} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-red-500 transition">
                                <Heart className={`w-3.5 h-3.5 ${comment.likes > 0 ? 'fill-red-500 text-red-500' : ''}`} /> {comment.likes > 0 && comment.likes}
                            </button>
                            {!maxDepthReached && (
                                <button onClick={() => setReplyingTo(isReplying ? null : comment._id)} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#f89e35] transition">
                                    <Reply className="w-3.5 h-3.5" /> Reply
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Reply Form Injection */}
                    {isReplying && (
                        <div className="mt-4 mb-6 relative z-10 animate-in slide-in-from-top-2 duration-300">
                            <div className="p-4 bg-white rounded-2xl border-2 border-[#f89e35]/30 shadow-lg shadow-[#f89e35]/5 flex flex-col gap-3">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Replying to {comment.author}</span>
                                    <button onClick={() => setReplyingTo(null)} className="text-xs text-slate-400 hover:text-red-500 font-bold">Cancel</button>
                                </div>
                                <div className="flex gap-3">
                                    <input 
                                        type="text" 
                                        placeholder="Name (Optional)" 
                                        value={replyAuthor}
                                        onChange={(e) => setReplyAuthor(e.target.value)}
                                        className="w-1/3 min-w-[100px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-[#f89e35] focus:ring-1 focus:ring-[#f89e35]"
                                    />
                                    <input 
                                        type="text" 
                                        placeholder="Write a reply..." 
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        autoFocus
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-[#f89e35] focus:ring-1 focus:ring-[#f89e35]"
                                    />
                                    <button 
                                        onClick={(e) => handleSubmit(e, comment._id)}
                                        disabled={submitting || !replyText.trim()}
                                        className="bg-[#110f0e] hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl px-4 flex items-center justify-center transition"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recursive Replies Container */}
                    {replies.length > 0 && (
                        <div className="relative mt-2 pl-4 md:pl-8 border-l-2 border-slate-100">
                            {replies.map(reply => renderCommentThread(reply, depth + 1))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 text-[#f89e35]">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-12">
            
            {/* Top Level Comment Form */}
            <div className="bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-200/60 shadow-inner">
                <form onSubmit={(e) => handleSubmit(e, null)} className="flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="Your Name (Optional)"
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        className="w-full md:w-1/3 bg-white border border-slate-200 rounded-xl px-5 py-3 text-slate-900 font-medium focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20 transition shadow-sm"
                    />
                    <div className="relative">
                        <textarea
                            placeholder="Share your thoughts about this model..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 min-h-[120px] resize-none text-slate-900 font-medium focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20 transition shadow-sm pb-16"
                        />
                        <div className="absolute bottom-4 right-4 flex items-center justify-end">
                            <button 
                                type="submit" 
                                disabled={submitting || !newComment.trim()}
                                className="bg-[#f89e35] hover:bg-[#e08b2c] disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl transition shadow-md shadow-[#f89e35]/20 flex items-center gap-2"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Post Comment
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Comments List */}
            <div className="pt-8">
                <div className="flex items-center gap-3 mb-8">
                    <MessageCircle className="w-5 h-5 text-slate-400" />
                    <h4 className="font-black text-slate-900 text-xl">{postType === 'threed' ? comments.length + ' Reactions' : 'Discussion'}</h4>
                </div>

                {topLevelComments.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                        <MessageCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium tracking-wide">Be the first to share your thoughts!</p>
                    </div>
                ) : (
                    <div className="space-y-2 relative">
                        {topLevelComments.map(comment => renderCommentThread(comment, 0))}
                    </div>
                )}
            </div>

        </div>
    );
}
