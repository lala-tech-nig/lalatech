'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, TrendingUp, Send, ChevronDown, X, Search, Link2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '@/lib/api';

const LS_LIKES_KEY = 'lalatech_liked_posts';
const LS_SAVED_KEY = 'lalatech_saved_posts';

function getLSItem(key) {
    try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; }
}
function setLSItem(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export default function FeedPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [likedPosts, setLikedPosts] = useState({});
    const [savedPosts, setSavedPosts] = useState({});
    const [activeCommentPost, setActiveCommentPost] = useState(null);
    const [comments, setComments] = useState({});
    const [commentInputs, setCommentInputs] = useState({});
    const [authorInputs, setAuthorInputs] = useState({});
    const [replyingTo, setReplyingTo] = useState({});
    const [replyInputs, setReplyInputs] = useState({});
    const [replyAuthors, setReplyAuthors] = useState({});
    const [expandedReplies, setExpandedReplies] = useState({});
    const [submittingComments, setSubmittingComments] = useState({});
    const [submittingReplies, setSubmittingReplies] = useState({});
    const [search, setSearch] = useState('');
    const [copiedId, setCopiedId] = useState(null);

    useEffect(() => {
        // Load liked/saved from localStorage
        setLikedPosts(getLSItem(LS_LIKES_KEY));
        setSavedPosts(getLSItem(LS_SAVED_KEY));
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/posts`);
            if (res.ok) setPosts(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const filteredPosts = posts.filter(p =>
        (p.content || '').toLowerCase().includes(search.toLowerCase())
    );

    const fetchComments = async (postId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/comments/${postId}`);
            if (res.ok) {
                const data = await res.json();
                setComments(prev => ({ ...prev, [postId]: data }));
            }
        } catch (e) {}
    };

    const toggleComments = (postId) => {
        if (activeCommentPost === postId) {
            setActiveCommentPost(null);
        } else {
            setActiveCommentPost(postId);
            if (!comments[postId]) fetchComments(postId);
        }
    };

    const handleLike = async (id) => {
        if (likedPosts[id]) return;
        const updated = { ...likedPosts, [id]: true };
        setLikedPosts(updated);
        setLSItem(LS_LIKES_KEY, updated);
        setPosts(posts.map(p => p._id === id ? { ...p, likes: p.likes + 1 } : p));
        await fetch(`${API_BASE_URL}/posts/${id}/like`, { method: 'POST' }).catch(() => {});
    };

    const handleSave = (id) => {
        const updated = { ...savedPosts, [id]: !savedPosts[id] };
        setSavedPosts(updated);
        setLSItem(LS_SAVED_KEY, updated);
    };

    const handleShare = async (id, text) => {
        const postUrl = `${window.location.origin}/feed/${id}`;
        setPosts(posts.map(p => p._id === id ? { ...p, shares: p.shares + 1 } : p));
        await fetch(`${API_BASE_URL}/posts/${id}/share`, { method: 'POST' }).catch(() => {});

        if (navigator.share) {
            navigator.share({ title: 'Lala Tech Feed', text: text?.substring(0, 100) || 'Check this out!', url: postUrl }).catch(() => {});
        } else {
            await navigator.clipboard.writeText(postUrl).catch(() => {});
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        }
    };

    const submitComment = async (postId) => {
        const content = commentInputs[postId]?.trim();
        if (!content || submittingComments[postId]) return;
        setSubmittingComments(p => ({ ...p, [postId]: true }));
        try {
            const res = await fetch(`${API_BASE_URL}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    postId,
                    postType: 'post',
                    author: authorInputs[postId]?.trim() || 'Visitor',
                    content,
                }),
            });
            if (res.ok) {
                const newComment = await res.json();
                setComments(prev => ({ ...prev, [postId]: [newComment, ...(prev[postId] || [])] }));
                setCommentInputs(prev => ({ ...prev, [postId]: '' }));
                setAuthorInputs(prev => ({ ...prev, [postId]: '' }));
            }
        } catch (e) {}
        setSubmittingComments(p => ({ ...p, [postId]: false }));
    };

    const submitReply = async (postId, commentId) => {
        const content = replyInputs[commentId]?.trim();
        if (!content || submittingReplies[commentId]) return;
        setSubmittingReplies(p => ({ ...p, [commentId]: true }));
        try {
            const res = await fetch(`${API_BASE_URL}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    postId,
                    postType: 'post',
                    parentId: commentId,
                    author: replyAuthors[commentId]?.trim() || 'Visitor',
                    content,
                }),
            });
            if (res.ok) {
                const newReply = await res.json();
                setComments(prev => ({ ...prev, [postId]: [newReply, ...(prev[postId] || [])] }));
                setReplyInputs(prev => ({ ...prev, [commentId]: '' }));
                setReplyAuthors(prev => ({ ...prev, [commentId]: '' }));
                setReplyingTo(prev => ({ ...prev, [commentId]: false }));
                setExpandedReplies(prev => ({ ...prev, [commentId]: true }));
            }
        } catch (e) {}
        setSubmittingReplies(p => ({ ...p, [commentId]: false }));
    };

    const likeComment = async (postId, commentId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/comments/${commentId}/like`, { method: 'POST' });
            if (res.ok) {
                const updated = await res.json();
                setComments(prev => ({
                    ...prev,
                    [postId]: (prev[postId] || []).map(c => c._id === commentId ? updated : c)
                }));
            }
        } catch (e) {}
    };

    const formatDate = (d) => {
        const diff = (Date.now() - new Date(d)) / 1000;
        if (diff < 60) return `${Math.floor(diff)}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="feed-page">
            <style>{`
                .feed-page { min-height: 100vh; background: linear-gradient(135deg, #fff7ed 0%, #fff 60%, #fff7f0 100%); padding: 80px 0 60px; }
                .feed-container { max-width: 600px; margin: 0 auto; padding: 0 16px; }
                .feed-header { text-align: center; margin-bottom: 40px; padding-top: 16px; }
                .feed-badge { display: inline-flex; align-items: center; gap: 6px; background: linear-gradient(135deg, #f89e35, #f56e00); color: white; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; padding: 6px 14px; border-radius: 100px; margin-bottom: 14px; }
                .feed-title { font-size: 38px; font-weight: 900; color: #0f172a; line-height: 1.1; letter-spacing: -1px; margin: 0 0 10px; }
                .feed-subtitle { color: #64748b; font-size: 15px; font-weight: 500; }
                .feed-divider { height: 2px; background: linear-gradient(90deg, transparent, #f89e35 40%, transparent); margin: 32px 0; border: none; }
                .post-card { background: white; border-radius: 24px; overflow: hidden; margin-bottom: 24px; box-shadow: 0 2px 16px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.05); transition: box-shadow 0.2s, transform 0.2s; }
                .post-card:hover { box-shadow: 0 8px 40px rgba(248,158,53,0.12); transform: translateY(-2px); }
                .post-header { padding: 18px 20px 14px; display: flex; align-items: center; justify-content: space-between; }
                .post-author { display: flex; align-items: center; gap: 12px; }
                .author-avatar { width: 46px; height: 46px; border-radius: 50%; background: linear-gradient(135deg, #f89e35, #f56e00); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 18px; color: white; flex-shrink: 0; position: relative; }
                .author-avatar::after { content: ''; position: absolute; bottom: 1px; right: 1px; width: 11px; height: 11px; border-radius: 50%; background: #22c55e; border: 2.5px solid white; }
                .author-name { font-weight: 800; font-size: 15px; color: #0f172a; line-height: 1; }
                .author-tag { font-size: 12px; color: #94a3b8; font-weight: 500; margin-top: 2px; }
                .post-content { padding: 0 20px 16px; }
                .post-text { font-size: 16px; line-height: 1.65; color: #1e293b; font-weight: 450; white-space: pre-wrap; }
                .post-media { margin-top: 12px; border-radius: 16px; overflow: hidden; }
                .post-media img, .post-media video { width: 100%; display: block; max-height: 500px; object-fit: cover; }
                .post-actions { padding: 12px 16px; border-top: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; }
                .action-group { display: flex; align-items: center; gap: 4px; }
                .action-btn { display: flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 100px; border: none; background: none; cursor: pointer; font-size: 13px; font-weight: 700; color: #64748b; transition: background 0.15s, color 0.15s; }
                .action-btn:hover { background: #f8fafc; color: #0f172a; }
                .action-btn.liked { color: #ef4444; }
                .action-btn.liked:hover { background: #fef2f2; }
                .action-btn.saved { color: #f89e35; }
                .action-btn.active-comment { color: #f89e35; background: #fff7ed; }
                .action-btn.copied { color: #10b981; background: #f0fdf4; }

                /* Deep link button */
                .post-link-btn { display: block; text-align: center; margin: 0 20px 16px; padding: 8px; border-radius: 12px; background: #f8fafc; border: 1.5px dashed #e2e8f0; color: #94a3b8; font-size: 12px; font-weight: 600; text-decoration: none; transition: all 0.15s; cursor: pointer; }
                .post-link-btn:hover { background: #fff7ed; border-color: #f89e35; color: #f89e35; }

                /* Comments section */
                .comments-panel { border-top: 1px solid #f1f5f9; background: #fafafa; }
                .comment-input-wrap { padding: 16px 18px; border-bottom: 1px solid #f1f5f9; }
                .c-name-input { width: 100%; background: white; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 8px 14px; font-size: 13px; font-weight: 500; outline: none; margin-bottom: 8px; transition: border-color 0.15s; box-sizing: border-box; }
                .c-name-input:focus { border-color: #f89e35; }
                .c-input-row { display: flex; gap: 8px; align-items: flex-end; }
                .c-textarea { flex: 1; background: white; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 10px 14px; font-size: 14px; font-family: inherit; font-weight: 500; color: #0f172a; outline: none; resize: none; min-height: 44px; max-height: 140px; transition: border-color 0.15s; box-sizing: border-box; }
                .c-textarea:focus { border-color: #f89e35; }
                .c-send-btn { padding: 10px 14px; background: linear-gradient(135deg, #f89e35, #f56e00); border: none; border-radius: 12px; color: white; cursor: pointer; transition: transform 0.15s; flex-shrink: 0; display: flex; align-items: center; }
                .c-send-btn:hover { transform: scale(1.08); }
                .c-send-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
                .comments-list { padding: 12px 18px; max-height: 500px; overflow-y: auto; }
                .comment-item { margin-bottom: 14px; display: flex; gap: 10px; }
                .c-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; color: white; flex-shrink: 0; }
                .c-bubble { flex: 1; }
                .c-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; }
                .c-name { font-weight: 800; font-size: 13px; color: #0f172a; }
                .c-time { font-size: 11px; color: #94a3b8; }
                .admin-badge { background: linear-gradient(135deg, #f89e35, #f56e00); color: white; font-size: 9px; font-weight: 800; letter-spacing: 1px; padding: 2px 7px; border-radius: 100px; }
                .c-text { font-size: 14px; color: #334155; line-height: 1.55; background: white; border-radius: 0 14px 14px 14px; padding: 10px 14px; border: 1px solid #f1f5f9; }
                .c-actions { display: flex; gap: 10px; margin-top: 6px; padding-left: 4px; }
                .c-action { background: none; border: none; color: #94a3b8; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: color 0.15s; padding: 0; }
                .c-action:hover { color: #f89e35; }
                .replies-wrap { margin-top: 10px; padding-left: 16px; border-left: 2px solid #f1f5f9; }
                .reply-form { margin-top: 8px; display: flex; flex-direction: column; gap: 6px; }
                .no-comments { text-align: center; padding: 24px 16px; color: #94a3b8; font-size: 14px; font-weight: 600; }

                /* SearchBar */
                .feed-search { max-width: 100%; margin: 24px 0; display: flex; align-items: center; background: white; border-radius: 100px; border: 1.5px solid #e2e8f0; padding: 10px 18px; gap: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); transition: border-color 0.2s; }
                .feed-search:focus-within { border-color: #f89e35; }
                .feed-search input { flex: 1; border: none; outline: none; font-size: 15px; font-weight: 500; color: #0f172a; background: transparent; }

                /* Skeleton */
                .skeleton-card { background: white; border-radius: 24px; padding: 20px; margin-bottom: 24px; border: 1px solid #f1f5f9; }
                .skeleton { background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 8px; }
                @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
            `}</style>

            <div className="feed-container">
                <div className="feed-header">
                    <div className="feed-badge"><TrendingUp size={11} /> Live Feed</div>
                    <h1 className="feed-title">Lala's Feed</h1>
                    <p className="feed-subtitle">Updates, thoughts &amp; moments from Lala Tech</p>

                    <div className="feed-search">
                        <Search size={18} color="#94a3b8" />
                        <input
                            type="text"
                            placeholder="Search the feed..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}><X size={16} /></button>}
                    </div>
                </div>
                <hr className="feed-divider" />

                {loading ? (
                    [1,2,3].map(i => (
                        <div key={i} className="skeleton-card">
                            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                                <div className="skeleton" style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                    <div className="skeleton" style={{ height: 14, width: '55%', marginBottom: 8 }} />
                                    <div className="skeleton" style={{ height: 12, width: '35%' }} />
                                </div>
                            </div>
                            <div className="skeleton" style={{ height: 14, marginBottom: 8 }} />
                            <div className="skeleton" style={{ height: 14, width: '75%', marginBottom: 8 }} />
                            <div className="skeleton" style={{ height: 200, marginTop: 12 }} />
                        </div>
                    ))
                ) : filteredPosts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 24, border: '2px dashed #e2e8f0' }}>
                        <MessageCircle size={40} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
                        <h3 style={{ fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
                            {search ? 'No matches found' : 'No posts yet'}
                        </h3>
                        <p style={{ color: '#94a3b8', fontSize: 14 }}>
                            {search ? 'Try a different keyword' : 'Check back soon!'}
                        </p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {filteredPosts.map((post, idx) => {
                            const postComments = comments[post._id] || [];
                            const isCommenting = activeCommentPost === post._id;
                            const isLiked = !!likedPosts[post._id];
                            const isSaved = !!savedPosts[post._id];
                            const isCopied = copiedId === post._id;
                            return (
                                <motion.div key={post._id} className="post-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                                    {/* Header */}
                                    <div className="post-header">
                                        <div className="post-author">
                                            <div className="author-avatar">L</div>
                                            <div>
                                                <div className="author-name">Lala Tech</div>
                                                <div className="author-tag">@lalatech · {formatDate(post.createdAt)}</div>
                                            </div>
                                        </div>
                                        <a href={`/feed/${post._id}`} title="View post" style={{ color: '#94a3b8', display: 'flex' }} onClick={e => e.stopPropagation()}>
                                            <MoreHorizontal size={18} style={{ cursor: 'pointer' }} />
                                        </a>
                                    </div>

                                    {/* Content */}
                                    <div className="post-content">
                                        {post.content && <p className="post-text">{post.content}</p>}
                                        {post.image && (
                                            <div className="post-media">
                                                {post.image.match(/\.(mp4|webm|ogg)/i) ? (
                                                    <video src={post.image} controls />
                                                ) : (
                                                    <img src={post.image} alt="Post" loading="lazy" />
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="post-actions">
                                        <div className="action-group">
                                            <button
                                                className={`action-btn ${isLiked ? 'liked' : ''}`}
                                                onClick={() => handleLike(post._id)}
                                                title={isLiked ? 'Already liked' : 'Like'}
                                            >
                                                <Heart size={18} fill={isLiked ? '#ef4444' : 'none'} />
                                                {post.likes > 0 && post.likes}
                                            </button>
                                            <button className={`action-btn ${isCommenting ? 'active-comment' : ''}`} onClick={() => toggleComments(post._id)}>
                                                <MessageCircle size={18} />
                                                {postComments.length > 0 && postComments.length}
                                            </button>
                                            <button
                                                className={`action-btn ${isCopied ? 'copied' : ''}`}
                                                onClick={() => handleShare(post._id, post.content)}
                                                title="Share post link"
                                            >
                                                {isCopied ? <Check size={18} /> : <Share2 size={18} />}
                                                {isCopied ? 'Copied!' : (post.shares > 0 ? post.shares : '')}
                                            </button>
                                        </div>
                                        <button className={`action-btn ${isSaved ? 'saved' : ''}`} onClick={() => handleSave(post._id)} title={isSaved ? 'Unsave' : 'Save'}>
                                            <Bookmark size={18} fill={isSaved ? '#f89e35' : 'none'} />
                                        </button>
                                    </div>

                                    {/* Comments Panel */}
                                    <AnimatePresence>
                                        {isCommenting && (
                                            <motion.div className="comments-panel" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                                {/* Comment input */}
                                                <div className="comment-input-wrap">
                                                    <input
                                                        className="c-name-input"
                                                        placeholder="Your name (optional)"
                                                        value={authorInputs[post._id] || ''}
                                                        onChange={e => setAuthorInputs(p => ({ ...p, [post._id]: e.target.value }))}
                                                    />
                                                    <div className="c-input-row">
                                                        <textarea
                                                            className="c-textarea"
                                                            placeholder="Write a comment..."
                                                            value={commentInputs[post._id] || ''}
                                                            onChange={e => setCommentInputs(p => ({ ...p, [post._id]: e.target.value }))}
                                                            rows={2}
                                                        />
                                                        <button
                                                            className="c-send-btn"
                                                            disabled={submittingComments[post._id] || !commentInputs[post._id]?.trim()}
                                                            onClick={() => submitComment(post._id)}
                                                        >
                                                            <Send size={16} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Comments list */}
                                                <div className="comments-list">
                                                    {postComments.length === 0 ? (
                                                        <div className="no-comments">No comments yet. Be the first! 👇</div>
                                                    ) : (
                                                        (() => {
                                                            const all = comments[post._id] || [];
                                                            const renderTree = (parentId = null, depth = 0) => {
                                                                return all.filter(c => c.parentId === parentId).sort((a,b) => {
                                                                    if (parentId === null) return new Date(b.createdAt) - new Date(a.createdAt);
                                                                    return new Date(a.createdAt) - new Date(b.createdAt);
                                                                }).map(comment => (
                                                                    <div key={comment._id} className="mb-4">
                                                                        <div className={`p-4 rounded-2xl ${depth > 0 ? 'ml-6 bg-orange-50/20 border-l-2 border-[#f89e35]/30' : 'bg-white border border-slate-100 shadow-sm'}`}>
                                                                            <div className="flex justify-between items-start mb-2">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${comment.isAdmin ? 'bg-gradient-to-br from-[#f89e35] to-[#f56e00]' : 'bg-slate-400'}`}>
                                                                                        {comment.author ? comment.author[0].toUpperCase() : 'A'}
                                                                                    </div>
                                                                                    <div>
                                                                                        <div className="flex items-center gap-1.5">
                                                                                            <span className="font-bold text-sm text-slate-900">{comment.author || 'Anonymous'}</span>
                                                                                            {comment.isAdmin && <span className="bg-[#f89e35] text-white text-[9px] px-1.5 py-0.5 rounded-full uppercase font-black">Admin</span>}
                                                                                        </div>
                                                                                        <span className="text-[10px] text-slate-400 italic">{formatDate(comment.createdAt)}</span>
                                                                                    </div>
                                                                                </div>
                                                                                <button onClick={() => likeComment(post._id, comment._id)} className="flex items-center gap-1 text-slate-400 hover:text-red-500 transition">
                                                                                    <Heart size={14} /> <span className="text-xs font-bold">{comment.likes || ''}</span>
                                                                                </button>
                                                                            </div>
                                                                            <p className="text-sm text-slate-600 mb-3">{comment.content}</p>
                                                                            <div className="flex gap-4">
                                                                                <button
                                                                                    onClick={() => setReplyingTo(prev => ({ ...prev, [comment._id]: !replyingTo[comment._id] }))}
                                                                                    className="flex items-center gap-1.5 text-xs font-bold text-[#f89e35] hover:opacity-80 transition"
                                                                                >
                                                                                    <MessageCircle size={14} /> Reply
                                                                                </button>
                                                                                {all.some(c => c.parentId === comment._id) && (
                                                                                    <button
                                                                                        onClick={() => setExpandedReplies(prev => ({ ...prev, [comment._id]: !expandedReplies[comment._id] }))}
                                                                                        className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition"
                                                                                    >
                                                                                        <ChevronDown size={14} className={expandedReplies[comment._id] ? "rotate-180 transition" : "transition"} />
                                                                                        {expandedReplies[comment._id] ? 'Hide' : 'View'} Replies
                                                                                    </button>
                                                                                )}
                                                                            </div>

                                                                            {/* Reply form */}
                                                                            <AnimatePresence>
                                                                                {replyingTo[comment._id] && (
                                                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4 overflow-hidden">
                                                                                        <div className="space-y-3 bg-white p-4 rounded-xl border border-orange-100 shadow-sm">
                                                                                            <input
                                                                                                className="c-name-input"
                                                                                                placeholder="Your name (optional)"
                                                                                                value={replyAuthors[comment._id] || ''}
                                                                                                onChange={e => setReplyAuthors({ ...replyAuthors, [comment._id]: e.target.value })}
                                                                                            />
                                                                                            <div className="c-input-row">
                                                                                                <textarea
                                                                                                    className="c-textarea"
                                                                                                    placeholder={`Reply to ${comment.author || 'Anonymous'}...`}
                                                                                                    value={replyInputs[comment._id] || ''}
                                                                                                    onChange={e => setReplyInputs({ ...replyInputs, [comment._id]: e.target.value })}
                                                                                                    rows={2}
                                                                                                />
                                                                                                <button
                                                                                                    className="c-send-btn"
                                                                                                    disabled={submittingReplies[comment._id] || !replyInputs[comment._id]?.trim()}
                                                                                                    onClick={() => submitReply(post._id, comment._id)}
                                                                                                >
                                                                                                    <Send size={14} />
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                    </motion.div>
                                                                                )}
                                                                            </AnimatePresence>
                                                                        </div>
                                                                        {/* Nested tree */}
                                                                        <AnimatePresence>
                                                                            {expandedReplies[comment._id] && renderTree(comment._id, depth + 1)}
                                                                        </AnimatePresence>
                                                                    </div>
                                                                ));
                                                            };
                                                            return renderTree();
                                                        })()
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
