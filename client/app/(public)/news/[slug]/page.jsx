'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Share2, MessageCircle, ArrowLeft, Clock, Eye, Send, ChevronDown, Tag, Bookmark } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

export default function NewsArticlePage() {
    const { slug } = useParams();
    const router = useRouter();
    const [article, setArticle] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [liked, setLiked] = useState(false);
    const [saved, setSaved] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [commentAuthor, setCommentAuthor] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [replyAuthor, setReplyAuthor] = useState('');
    const [expandedReplies, setExpandedReplies] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const commentBoxRef = useRef(null);

    useEffect(() => {
        if (slug) {
            fetchArticle();
            fetchComments();
        }
    }, [slug]);

    const fetchArticle = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/news/slug/${slug}`);
            if (res.ok) setArticle(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchComments = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/comments/${slug}`);
            if (res.ok) setComments(await res.json());
        } catch (e) {}
    };

    const handleLike = async () => {
        if (liked || !article) return;
        setLiked(true);
        setArticle(prev => ({ ...prev, likes: prev.likes + 1 }));
        await fetch(`${API_BASE_URL}/news/${article._id}/like`, { method: 'POST' }).catch(() => {});
    };

    const handleShare = async () => {
        if (!article) return;
        await fetch(`${API_BASE_URL}/news/${article._id}/share`, { method: 'POST' }).catch(() => {});
        const url = window.location.href;
        const text = `📰 ${article.title} — Read on Lala Tech\n\n${url}`;
        if (navigator.share) {
            navigator.share({ title: article.title, text, url }).catch(() => {});
        } else {
            await navigator.clipboard.writeText(url);
        }
    };

    const submitComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE_URL}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    postId: slug,
                    postType: 'news',
                    author: commentAuthor.trim() || 'Anonymous',
                    content: commentText.trim(),
                }),
            });
            if (res.ok) {
                const newComment = await res.json();
                setComments(prev => [newComment, ...prev]);
                setCommentText('');
                setCommentAuthor('');
            }
        } catch (e) {}
        setSubmitting(false);
    };

    const submitReply = async (commentId) => {
        if (!replyText.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE_URL}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    postId: slug,
                    postType: 'news',
                    parentId: commentId,
                    author: replyAuthor.trim() || 'Anonymous',
                    content: replyText.trim(),
                }),
            });
            if (res.ok) {
                const newReply = await res.json();
                setComments(prev => [newReply, ...prev]);
                setReplyingTo(null);
                setReplyText('');
                setReplyAuthor('');
                setExpandedReplies(prev => ({ ...prev, [commentId]: true }));
            }
        } catch (e) {}
        setSubmitting(false);
    };

    const likeComment = async (commentId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/comments/${commentId}/like`, { method: 'POST' });
            if (res.ok) {
                const updated = await res.json();
                setComments(prev => prev.map(c => c._id === commentId ? updated : c));
            }
        } catch (e) {}
    };

    const formatDate = (d) => {
        const diff = (Date.now() - new Date(d)) / 1000;
        if (diff < 60) return `${Math.floor(diff)}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const readTime = (c) => `${Math.max(1, Math.ceil((c || '').split(' ').length / 200))} min read`;

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff7ed' }}>
                <div style={{ width: 44, height: 44, border: '3px solid #f89e35', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!article) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <h2 style={{ fontWeight: 900, color: '#0f172a' }}>Article not found</h2>
                <Link href="/news" style={{ color: '#f89e35', fontWeight: 700 }}>← Back to News</Link>
            </div>
        );
    }

    return (
        <div className="article-page">
            <style>{`
                .article-page { min-height: 100vh; background: #fff; padding: 80px 0 80px; }
                .article-container { max-width: 780px; margin: 0 auto; padding: 0 20px; }
                .back-btn { display: inline-flex; align-items: center; gap: 6px; color: #64748b; font-weight: 700; font-size: 14px; text-decoration: none; margin-bottom: 32px; transition: color 0.15s; }
                .back-btn:hover { color: #f89e35; }
                .article-meta-top { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
                .art-cat-badge { background: linear-gradient(135deg, #f89e35, #f56e00); color: white; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; padding: 5px 12px; border-radius: 100px; }
                .art-meta-text { font-size: 13px; color: #94a3b8; font-weight: 600; display: flex; align-items: center; gap: 5px; }
                .article-h1 { font-size: 36px; font-weight: 900; color: #0f172a; line-height: 1.2; letter-spacing: -1px; margin-bottom: 24px; }
                @media (max-width: 600px) { .article-h1 { font-size: 26px; } }
                .article-cover { width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 20px; margin-bottom: 40px; box-shadow: 0 12px 40px rgba(0,0,0,0.1); }
                .article-body { font-size: 17px; line-height: 1.85; color: #334155; white-space: pre-wrap; margin-bottom: 48px; }
                .article-body p { margin-bottom: 20px; }
                .action-bar {
                    display: flex; align-items: center; gap: 16px;
                    padding: 20px 24px; background: #f8fafc; border-radius: 20px;
                    margin-bottom: 48px; border: 1px solid #e2e8f0;
                }
                .action-btn {
                    display: flex; align-items: center; gap: 8px;
                    padding: 10px 18px; border-radius: 100px;
                    border: 1.5px solid #e2e8f0; background: white;
                    font-size: 14px; font-weight: 700; color: #64748b;
                    cursor: pointer; transition: all 0.15s;
                }
                .action-btn:hover { border-color: #f89e35; color: #f89e35; background: #fff7ed; }
                .action-btn.liked { color: #ef4444; border-color: #fecaca; background: #fef2f2; }
                .action-btn.saved { color: #f89e35; border-color: #fed7aa; background: #fff7ed; }
                .stats-bar { display: flex; gap: 20px; margin-left: auto; font-size: 13px; color: #94a3b8; font-weight: 600; }
                .stat-item { display: flex; align-items: center; gap: 5px; }

                /* Comments */
                .comments-section h2 { font-size: 22px; font-weight: 900; color: #0f172a; margin-bottom: 24px; }
                .comment-form { background: #f8fafc; border-radius: 20px; padding: 24px; margin-bottom: 32px; border: 1.5px solid #e2e8f0; }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
                @media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }
                .comment-input { width: 100%; background: white; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; font-size: 14px; font-weight: 500; color: #0f172a; outline: none; transition: border-color 0.15s; box-sizing: border-box; }
                .comment-input:focus { border-color: #f89e35; }
                .comment-textarea { min-height: 100px; resize: vertical; font-family: inherit; }
                .submit-btn { margin-top: 12px; display: flex; align-items: center; gap: 8px; padding: 12px 24px; background: linear-gradient(135deg, #f89e35, #f56e00); color: white; border: none; border-radius: 100px; font-weight: 800; font-size: 14px; cursor: pointer; transition: transform 0.15s; }
                .submit-btn:hover { transform: scale(1.03); }
                .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

                .comment-card { background: white; border: 1px solid #f1f5f9; border-radius: 20px; padding: 20px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
                .comment-author { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
                .comment-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; color: white; flex-shrink: 0; }
                .comment-name { font-weight: 800; font-size: 14px; color: #0f172a; }
                .comment-time { font-size: 12px; color: #94a3b8; font-weight: 500; }
                .comment-text { font-size: 15px; color: #334155; line-height: 1.65; margin-bottom: 12px; }
                .comment-actions { display: flex; align-items: center; gap: 12px; }
                .comment-action-btn { display: flex; align-items: center; gap: 5px; background: none; border: none; color: #94a3b8; font-size: 13px; font-weight: 700; cursor: pointer; transition: color 0.15s; padding: 0; }
                .comment-action-btn:hover { color: #f89e35; }
                .admin-badge { background: linear-gradient(135deg, #f89e35, #f56e00); color: white; font-size: 9px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; padding: 2px 8px; border-radius: 100px; margin-left: 6px; }

                .replies-container { margin-top: 16px; padding-left: 20px; border-left: 2px solid #f1f5f9; }
                .reply-card { background: #f8fafc; border-radius: 14px; padding: 14px 16px; margin-bottom: 10px; }
                .reply-form { margin-top: 12px; padding: 16px; background: #f8fafc; border-radius: 16px; }
            `}</style>

            <div className="article-container">
                <Link href="/news" className="back-btn"><ArrowLeft size={16} /> Back to News</Link>

                {/* Article meta */}
                <div className="article-meta-top">
                    <span className="art-cat-badge">{article.category}</span>
                    <span className="art-meta-text"><Clock size={13} />{readTime(article.content)}</span>
                    <span className="art-meta-text"><Eye size={13} />{article.views} views</span>
                    <span className="art-meta-text">{new Date(article.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>

                <h1 className="article-h1">{article.title}</h1>

                {article.coverImage && <img src={article.coverImage} alt={article.title} className="article-cover" />}

                {/* Article body */}
                <div className="article-body">{article.content}</div>

                {/* Action bar */}
                <div className="action-bar">
                    <button className={`action-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
                        <Heart size={16} fill={liked ? '#ef4444' : 'none'} />
                        {article.likes + (liked ? 1 : 0)}
                    </button>
                    <button className="action-btn" onClick={handleShare}>
                        <Share2 size={16} /> Share
                    </button>
                    <button className={`action-btn ${saved ? 'saved' : ''}`} onClick={() => setSaved(!saved)}>
                        <Bookmark size={16} fill={saved ? '#f89e35' : 'none'} />
                        {saved ? 'Saved' : 'Save'}
                    </button>
                    <div className="stats-bar">
                        <span className="stat-item"><MessageCircle size={13} />{comments.length}</span>
                        <span className="stat-item"><Eye size={13} />{article.views}</span>
                    </div>
                </div>

                {/* Tags */}
                {article.tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 48 }}>
                        {article.tags.map(t => (
                            <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 100, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>
                                <Tag size={11} />{t}
                            </span>
                        ))}
                    </div>
                )}

                {/* ─── Comments ─── */}
                <div className="comments-section" ref={commentBoxRef}>
                    <h2>💬 {comments.length} Comment{comments.length !== 1 ? 's' : ''}</h2>

                    {/* Comment form */}
                    <div className="comment-form">
                        <div className="form-row">
                            <input
                                className="comment-input"
                                placeholder="Your name (optional)"
                                value={commentAuthor}
                                onChange={e => setCommentAuthor(e.target.value)}
                            />
                        </div>
                        <textarea
                            className="comment-input comment-textarea"
                            placeholder="Share your thoughts..."
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submitComment(e); }}
                        />
                        <button className="submit-btn" onClick={submitComment} disabled={submitting || !commentText.trim()}>
                            <Send size={14} />{submitting ? 'Posting...' : 'Post Comment'}
                        </button>
                    </div>

                    {/* Comments list */}
                    <AnimatePresence>
                        {(() => {
                            const renderTree = (parentId = null, depth = 0) => {
                                return comments
                                    .filter(c => c.parentId === parentId)
                                    .sort((a, b) => {
                                        // Top level: newest first. Replies: oldest first.
                                        if (parentId === null) return new Date(b.createdAt) - new Date(a.createdAt);
                                        return new Date(a.createdAt) - new Date(b.createdAt);
                                    })
                                    .map((comment) => (
                                        <motion.div
                                            key={comment._id}
                                            className="comment-card"
                                            style={{ 
                                                marginLeft: depth > 0 ? (depth > 3 ? 0 : 20) : 0, 
                                                borderLeft: depth > 0 ? '2px solid #fff7ed' : '1px solid #f1f5f9',
                                                background: depth % 2 === 1 ? '#fdfcfb' : 'white'
                                            }}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <div className="comment-author">
                                                <div className="comment-avatar" style={{ background: comment.isAdmin ? 'linear-gradient(135deg, #f89e35, #f56e00)' : 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                                                    {(comment.author || 'A')[0].toUpperCase()}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <span className="comment-name">{comment.author || 'Anonymous'}</span>
                                                        {comment.isAdmin && <span className="admin-badge">Admin</span>}
                                                    </div>
                                                    <div className="comment-time">{formatDate(comment.createdAt)}</div>
                                                </div>
                                            </div>
                                            <p className="comment-text">{comment.content}</p>
                                            <div className="comment-actions">
                                                <button className="comment-action-btn" onClick={() => likeComment(comment._id)}>
                                                    <Heart size={14} /> {comment.likes > 0 && comment.likes}
                                                </button>
                                                <button className="comment-action-btn" onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}>
                                                    <MessageCircle size={14} /> Reply
                                                </button>
                                                {comments.some(c => c.parentId === comment._id) && (
                                                    <button className="comment-action-btn" onClick={() => setExpandedReplies(p => ({ ...p, [comment._id]: !p[comment._id] }))}>
                                                        <ChevronDown size={14} style={{ transition: '0.2s', transform: expandedReplies[comment._id] ? 'rotate(180deg)' : '' }} />
                                                        {expandedReplies[comment._id] ? 'Hide' : 'View'} Replies
                                                    </button>
                                                )}
                                            </div>

                                            {/* Reply form */}
                                            <AnimatePresence>
                                                {replyingTo === comment._id && (
                                                    <motion.div className="reply-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                                        <input
                                                            className="comment-input"
                                                            style={{ marginBottom: 8 }}
                                                            placeholder="Your name (optional)"
                                                            value={replyAuthor}
                                                            onChange={e => setReplyAuthor(e.target.value)}
                                                        />
                                                        <textarea
                                                            className="comment-input comment-textarea"
                                                            style={{ minHeight: 70 }}
                                                            placeholder="Write a reply..."
                                                            value={replyText}
                                                            onChange={e => setReplyText(e.target.value)}
                                                        />
                                                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                                            <button className="submit-btn" onClick={() => submitReply(comment._id)} disabled={submitting || !replyText.trim()} style={{ fontSize: 13, padding: '9px 18px' }}>
                                                                <Send size={12} />Reply
                                                            </button>
                                                            <button onClick={() => setReplyingTo(null)} style={{ padding: '9px 16px', borderRadius: 100, border: '1.5px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {/* Recursive children */}
                                            <AnimatePresence>
                                                {expandedReplies[comment._id] && (
                                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                                        {renderTree(comment._id, depth + 1)}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    ));
                            };
                            return renderTree();
                        })()}
                    </AnimatePresence>

                    {comments.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontWeight: 600 }}>
                            Be the first to comment! 👇
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
