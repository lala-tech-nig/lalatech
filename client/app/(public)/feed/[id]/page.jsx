'use client';
import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, ArrowLeft, TrendingUp, Send, ChevronDown, Check, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';
import LoadingButton from '@/components/LoadingButton';
import { Camera, Image as ImageIcon, X as XIcon, FileText, Music, Film, Link as LinkIcon, Send, MessageCircle } from 'lucide-react';

const LS_LIKES_KEY = 'lalatech_liked_posts';
const LS_SAVED_KEY = 'lalatech_saved_posts';
function getLSItem(key) { try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; } }
function setLSItem(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

export default function SingleFeedPost() {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentInput, setCommentInput] = useState('');
    const [authorInput, setAuthorInput] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [liked, setLiked] = useState(false);
    const [saved, setSaved] = useState(false);
    const [copied, setCopied] = useState(false);
    const [replyingTo, setReplyingTo] = useState({});
    const [replyInputs, setReplyInputs] = useState({});
    const [replyAuthors, setReplyAuthors] = useState({});
    const [expandedReplies, setExpandedReplies] = useState({});
    const [commentImageFile, setCommentImageFile] = useState(null);
    const [commentImagePreview, setCommentImagePreview] = useState('');
    const [imageUploading, setImageUploading] = useState(false);

    useEffect(() => {
        if (!id) return;
        fetchPost();
        fetchComments();
        const likes = getLSItem(LS_LIKES_KEY);
        const saved_ = getLSItem(LS_SAVED_KEY);
        setLiked(!!likes[id]);
        setSaved(!!saved_[id]);
    }, [id]);

    const fetchPost = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/posts/${id}`);
            if (res.ok) setPost(await res.json());
            else setNotFound(true);
        } catch { setNotFound(true); }
        finally { setLoading(false); }
    };

    const fetchComments = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/comments/${id}`);
            if (res.ok) setComments(await res.json());
        } catch {}
    };

    const handleLike = async () => {
        if (liked || !post) return;
        setLiked(true);
        setPost(p => ({ ...p, likes: p.likes + 1 }));
        const prev = getLSItem(LS_LIKES_KEY);
        setLSItem(LS_LIKES_KEY, { ...prev, [id]: true });
        await fetch(`${API_BASE_URL}/posts/${id}/like`, { method: 'POST' }).catch(() => {});
    };

    const handleSave = () => {
        const prev = getLSItem(LS_SAVED_KEY);
        const next = { ...prev, [id]: !saved };
        setSaved(!saved);
        setLSItem(LS_SAVED_KEY, next);
    };

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({ title: 'Lala Tech Feed', text: post?.content?.substring(0, 100), url }).catch(() => {});
        } else {
            await navigator.clipboard.writeText(url).catch(() => {});
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
        await fetch(`${API_BASE_URL}/posts/${id}/share`, { method: 'POST' }).catch(() => {});
        setPost(p => ({ ...p, shares: (p.shares || 0) + 1 }));
    };

    const getFileType = (file) => {
        if (!file) return 'image';
        if (file.type.startsWith('image/')) return 'image';
        if (file.type.startsWith('video/')) return 'video';
        if (file.type.startsWith('audio/')) return 'audio';
        return 'file';
    };

    const handleFileUpload = async (file) => {
        if (!file) return null;
        setImageUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const uploadEndpoint = `${API_BASE_URL.replace('/api', '')}/api/upload`;
            const res = await fetch(uploadEndpoint, { method: 'POST', body: formData });
            if (res.ok) {
                const data = await res.json();
                setImageUploading(false);
                return data.secure_url || data.url; 
            }
        } catch(e) { console.error(e); }
        setImageUploading(false);
        return null;
    };

    const submitComment = async () => {
        const content = commentInput.trim();
        if (!content && !commentImageFile) return;
        setSubmitting(true);
        
        let uploadedUrl = '';
        let fileType = 'image';
        if (commentImageFile) {
            uploadedUrl = await handleFileUpload(commentImageFile);
            fileType = getFileType(commentImageFile);
        }

        try {
            const res = await fetch(`${API_BASE_URL}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    postId: id, 
                    postType: 'post', 
                    author: authorInput.trim() || 'Visitor', 
                    content: content || (uploadedUrl ? `Shared a ${fileType}` : ''),
                    image: uploadedUrl,
                    fileType: fileType
                }),
            });
            if (res.ok) {
                const nc = await res.json();
                setComments(prev => [nc, ...prev]);
                setCommentInput('');
                setAuthorInput('');
                setCommentImageFile(null);
                setCommentImagePreview('');
            }
        } catch {}
        setSubmitting(false);
    };

    const submitReply = async (commentId) => {
        const content = replyInputs[commentId]?.trim();
        const file = commentImageFile; // For simplicity, using same state for now, but usually should be per-comment
        if (!content && !file) return;
        
        setSubmitting(true);
        let uploadedUrl = '';
        let fileType = 'image';
        
        if (file) {
            uploadedUrl = await handleFileUpload(file);
            fileType = getFileType(file);
        }

        try {
            const res = await fetch(`${API_BASE_URL}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    postId: id, 
                    postType: 'post', 
                    parentId: commentId, 
                    author: replyAuthors[commentId]?.trim() || 'Visitor', 
                    content: content || `Shared a ${fileType}`,
                    image: uploadedUrl,
                    fileType: fileType
                }),
            });
            if (res.ok) {
                const nr = await res.json();
                setComments(prev => [nr, ...prev]);
                setReplyInputs(p => ({ ...p, [commentId]: '' }));
                setReplyingTo(p => ({ ...p, [commentId]: false }));
                setExpandedReplies(p => ({ ...p, [commentId]: true }));
                setCommentImageFile(null);
                setCommentImagePreview('');
            }
        } catch {}
        setSubmitting(false);
    };

    const formatDate = (d) => {
        const diff = (Date.now() - new Date(d)) / 1000;
        if (diff < 60) return `${Math.floor(diff)}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="sp-page">
            <style>{`
                .sp-page { min-height: 100vh; background: linear-gradient(135deg, #fff7ed 0%, #fff 60%, #fff7f0 100%); padding: 80px 0 60px; }
                .sp-container { max-width: 600px; margin: 0 auto; padding: 0 16px; }
                .sp-back { display: inline-flex; align-items: center; gap: 8px; color: #64748b; font-weight: 700; font-size: 14px; text-decoration: none; margin-bottom: 24px; margin-top: 16px; padding: 8px 16px; background: white; border-radius: 100px; border: 1px solid #e2e8f0; transition: all 0.15s; }
                .sp-back:hover { color: #f89e35; border-color: #f89e35; }
                .post-card { background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 32px rgba(0,0,0,0.08); border: 1px solid rgba(0,0,0,0.05); }
                .post-header { padding: 22px 24px 16px; display: flex; align-items: center; justify-content: space-between; }
                .author-avatar { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #f89e35, #f56e00); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 20px; color: white; position: relative; flex-shrink: 0; }
                .author-avatar::after { content: ''; position: absolute; bottom: 1px; right: 1px; width: 12px; height: 12px; border-radius: 50%; background: #22c55e; border: 2.5px solid white; }
                .post-content { padding: 0 24px 20px; }
                .post-text { font-size: 17px; line-height: 1.7; color: #1e293b; font-weight: 450; white-space: pre-wrap; }
                .post-media { margin-top: 14px; border-radius: 18px; overflow: hidden; }
                .post-media img, .post-media video { width: 100%; display: block; max-height: 520px; object-fit: cover; }
                .post-actions { padding: 14px 20px; border-top: 1px solid #f1f5f9; display: flex; align-items: center; gap: 8px; }
                .action-btn { display: flex; align-items: center; gap: 7px; padding: 9px 14px; border-radius: 100px; border: none; background: none; cursor: pointer; font-size: 14px; font-weight: 700; color: #64748b; transition: background 0.15s, color 0.15s; }
                .action-btn:hover { background: #f8fafc; color: #0f172a; }
                .action-btn.liked { color: #ef4444; }
                .action-btn.saved { color: #f89e35; }
                .action-btn.copied { color: #10b981; }
                .sp-divider { height: 1px; background: #f1f5f9; margin: 28px 0 20px; }
                .comments-title { font-size: 14px; font-weight: 800; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 18px; }
                .c-input-section { background: #f8fafc; border-radius: 18px; padding: 18px; margin-bottom: 24px; border: 1px solid #f1f5f9; }
                .c-name { width: 100%; background: white; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 9px 14px; font-size: 13px; font-weight: 500; outline: none; margin-bottom: 10px; transition: border-color 0.15s; box-sizing: border-box; }
                .c-name:focus { border-color: #f89e35; }
                .c-row { display: flex; gap: 10px; }
                .c-text { flex: 1; background: white; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 11px 14px; font-size: 14px; font-family: inherit; font-weight: 500; color: #0f172a; outline: none; resize: none; min-height: 48px; max-height: 140px; transition: border-color 0.15s; box-sizing: border-box; }
                .c-text:focus { border-color: #f89e35; }
                .c-send { padding: 11px 16px; background: linear-gradient(135deg, #f89e35, #f56e00); border: none; border-radius: 12px; color: white; cursor: pointer; transition: transform 0.15s; flex-shrink: 0; display: flex; align-items: center; }
                .c-send:hover { transform: scale(1.06); }
                .c-send:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
                .c-preview-box { margin-top: 10px; position: relative; display: inline-block; }
                .c-preview-img { height: 100px; width: auto; border-radius: 12px; border: 2px solid #f89e35; object-fit: contain; background: white; box-shadow: 0 4px 12px rgba(248,158,53,0.15); }
                .c-preview-remove { position: absolute; -top: 8px; -right: 8px; background: #ef4444; color: white; border-radius: 50%; width: 22px; height: 22px; display: flex; items-center; justify-content: center; cursor: pointer; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.2); }
                .comment-img-display { margin-top: 10px; border-radius: 12px; overflow: hidden; border: 1px solid #f1f5f9; background: white; max-width: 100%; display: flex; justify-content: center; }
                .comment-img-display img { max-height: 320px; width: auto; max-width: 100%; object-fit: contain; }
                .comment-item { display: flex; gap: 12px; margin-bottom: 18px; }
                .c-av { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; color: white; }
                .c-body-wrap { flex: 1; }
                .c-bubble { background: #f8fafc; border-radius: 6px 18px 18px 18px; padding: 14px 16px; border: 1px solid #f1f5f9; }
                .c-author { font-weight: 800; font-size: 13px; color: #0f172a; }
                .c-time { font-size: 11px; color: #94a3b8; margin-left: 8px; }
                .c-admin-badge { background: linear-gradient(135deg, #f89e35, #f56e00); color: white; font-size: 9px; font-weight: 800; letter-spacing: 1px; padding: 2px 8px; border-radius: 100px; margin-left: 6px; }
                .c-text-body { font-size: 14px; color: #334155; line-height: 1.6; margin-top: 6px; }
                .c-reply-btn { background: none; border: none; color: #f89e35; font-size: 12px; font-weight: 700; cursor: pointer; padding: 4px 0; margin-top: 6px; display: flex; align-items: center; gap: 4px; }
                .c-reply-btn:hover { opacity: 0.7; }
                .reply-form { margin-top: 10px; background: white; border-radius: 12px; padding: 12px; border: 1px solid #f1f5f9; }
                .replies-wrap { margin-top: 10px; padding-left: 20px; border-left: 2px solid #f1f5f9; }
                .no-comments { text-align: center; padding: 32px; color: #94a3b8; font-size: 14px; font-weight: 600; }
                .highlight-frame { border: 2px solid #f89e35; border-radius: 24px; animation: glow 2s ease-in-out 3; }
                @keyframes glow { 0%,100%{box-shadow:0 0 0 0 rgba(248,158,53,0)} 50%{box-shadow:0 0 0 8px rgba(248,158,53,0.15)} }
            `}</style>

            <div className="sp-container">
                <Link href="/feed" className="sp-back">
                    <ArrowLeft size={16} /> Back to Feed
                </Link>

                {loading ? (
                    <div style={{ background: 'white', borderRadius: 24, padding: 28, border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
                            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f1f5f9', animation: 'pulse 1.5s infinite' }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ height: 14, background: '#f1f5f9', borderRadius: 8, marginBottom: 8, width: '40%' }} />
                                <div style={{ height: 12, background: '#f8fafc', borderRadius: 8, width: '25%' }} />
                            </div>
                        </div>
                        <div style={{ height: 14, background: '#f1f5f9', borderRadius: 8, marginBottom: 8 }} />
                        <div style={{ height: 14, background: '#f1f5f9', borderRadius: 8, marginBottom: 8, width: '80%' }} />
                        <div style={{ height: 280, background: '#f8fafc', borderRadius: 16, marginTop: 16 }} />
                    </div>
                ) : notFound ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: 24, border: '2px dashed #e2e8f0' }}>
                        <TrendingUp size={44} color="#e2e8f0" style={{ margin: '0 auto 16px' }} />
                        <h2 style={{ fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Post not found</h2>
                        <p style={{ color: '#94a3b8', fontSize: 14 }}>This post may have been removed.</p>
                        <Link href="/feed" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 20, background: 'linear-gradient(135deg,#f89e35,#f56e00)', color: 'white', fontWeight: 800, padding: '12px 24px', borderRadius: 100, fontSize: 14, textDecoration: 'none' }}>
                            <ArrowLeft size={14} /> Go to Feed
                        </Link>
                    </div>
                ) : post && (
                    <>
                        <motion.div className="post-card highlight-frame" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            {/* Header */}
                            <div className="post-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div className="author-avatar">L</div>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>Lala Tech</div>
                                        <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>@lalatech · {formatDate(post.createdAt)}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#f89e35,#f56e00)', color: 'white', fontSize: 10, fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 100 }}>
                                    <TrendingUp size={10} /> Live
                                </div>
                            </div>

                            {/* Content */}
                            <div className="post-content">
                                {post.content && <p className="post-text">{post.content}</p>}
                                {post.image && (
                                    <div className="post-media">
                                        {post.image.match(/\.(mp4|webm|ogg)/i) ? (
                                            <video src={post.image} controls />
                                        ) : (
                                            <img src={post.image} alt="Post" />
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="post-actions">
                                <button className={`action-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
                                    <Heart size={18} fill={liked ? '#ef4444' : 'none'} /> {post.likes > 0 ? post.likes : 'Like'}
                                </button>
                                <button className={`action-btn ${copied ? 'copied' : ''}`} onClick={handleShare}>
                                    {copied ? <Check size={18} /> : <Share2 size={18} />} {copied ? 'Copied!' : `Share${post.shares > 0 ? ` (${post.shares})` : ''}`}
                                </button>
                                <button className={`action-btn ${saved ? 'saved' : ''}`} onClick={handleSave}>
                                    <Bookmark size={18} fill={saved ? '#f89e35' : 'none'} /> {saved ? 'Saved' : 'Save'}
                                </button>
                            </div>
                        </motion.div>

                        {/* Comments */}
                        <div style={{ marginTop: 32 }}>
                            <div className="comments-title">💬 {comments.length} Comment{comments.length !== 1 ? 's' : ''}</div>

                            <div className="c-input-section">
                                <input className="c-name" placeholder="Your name (optional)" value={authorInput} onChange={e => setAuthorInput(e.target.value)} />
                                <div className="c-row">
                                    <textarea className="c-text" placeholder="Share your thoughts..." rows={2} value={commentInput} onChange={e => setCommentInput(e.target.value)} />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <input type="file" id="comment-file" accept="image/*,video/*,audio/*,application/pdf" className="hidden" onChange={e => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setCommentImageFile(file);
                                                setCommentImagePreview(URL.createObjectURL(file));
                                            }
                                        }} />
                                        <button className={`c-send ${commentImageFile ? 'bg-orange-50 text-[#f89e35]' : ''}`} style={{ background: 'white', border: '1.5px solid #e2e8f0', color: '#64748b' }} onClick={() => document.getElementById('comment-file').click()}>
                                            <LinkIcon size={16} />
                                        </button>
                                        <LoadingButton 
                                            loading={submitting || imageUploading} 
                                            disabled={!commentInput.trim() && !commentImageFile} 
                                            onClick={submitComment}
                                            className="c-send"
                                        >
                                            <Send size={16} />
                                        </LoadingButton>
                                    </div>
                                </div>
                                {commentImagePreview && (
                                    <div className="c-preview-box">
                                        {commentImageFile?.type?.startsWith('image/') ? (
                                            <img src={commentImagePreview} className="c-preview-img" alt="Preview" />
                                        ) : (
                                            <div className="h-[100px] px-6 flex items-center gap-3 bg-slate-50 min-w-[200px] border-2 border-[#f89e35] rounded-xl shadow-sm">
                                                {commentImageFile?.type?.startsWith('video/') ? <Film className="text-[#f89e35]" size={24}/> :
                                                 commentImageFile?.type?.startsWith('audio/') ? <Music className="text-[#f89e35]" size={24}/> :
                                                 <FileText className="text-[#f89e35]" size={24}/>}
                                                <div className="text-left">
                                                    <div className="text-[10px] font-black uppercase text-slate-400">File Selected</div>
                                                    <div className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{commentImageFile?.name}</div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="c-preview-remove" onClick={() => { setCommentImageFile(null); setCommentImagePreview(''); }}>
                                            <XIcon size={12} strokeWidth={3} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {comments.length === 0 ? (
                                <div className="no-comments">No comments yet. Start the conversation! 👇</div>
                            ) : (
                                (() => {
                                    const renderTree = (parentId = null, depth = 0) =>
                                        comments.filter(c => (c.parentId || null) === parentId)
                                            .sort((a, b) => parentId ? new Date(a.createdAt) - new Date(b.createdAt) : new Date(b.createdAt) - new Date(a.createdAt))
                                            .map(comment => (
                                                <div key={comment._id} style={{ marginLeft: depth * 16 }}>
                                                    <div className="comment-item">
                                                        <div className="c-av" style={{ background: comment.isAdmin ? 'linear-gradient(135deg,#f89e35,#f56e00)' : `hsl(${((comment.author||'x').charCodeAt(0)*13)%360},55%,50%)` }}>
                                                            {(comment.author || 'A')[0].toUpperCase()}
                                                        </div>
                                                        <div className="c-body-wrap">
                                                            <div className="c-bubble">
                                                                <div>
                                                                    <span className="c-author">{comment.author || 'Anonymous'}</span>
                                                                    {comment.isAdmin && <span className="c-admin-badge">Admin</span>}
                                                                    <span className="c-time">{formatDate(comment.createdAt)}</span>
                                                                </div>
                                                                <p className="c-text-body">{comment.content}</p>
                                                                {comment.image && (
                                                                    <div className="comment-img-display">
                                                                        {comment.fileType === 'video' ? (
                                                                            <video src={comment.image} controls className="w-full max-h-[360px] bg-black" />
                                                                        ) : comment.fileType === 'audio' ? (
                                                                            <audio src={comment.image} controls className="w-full mt-2" />
                                                                        ) : comment.fileType === 'file' ? (
                                                                            <a href={comment.image} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 transition rounded-xl w-full">
                                                                                <FileText size={24} className="text-[#f89e35]" />
                                                                                <div className="text-left">
                                                                                    <div className="text-xs font-bold text-slate-700">Download Attachment</div>
                                                                                    <div className="text-[10px] text-slate-400">Click to open or download file</div>
                                                                                </div>
                                                                            </a>
                                                                        ) : (
                                                                            <img src={comment.image} alt="Attachment" />
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <button className="c-reply-btn" onClick={() => setReplyingTo(p => ({ ...p, [comment._id]: !p[comment._id] }))}>
                                                                <MessageCircle size={13} /> Reply
                                                            </button>
                                                            <AnimatePresence>
                                                                {replyingTo[comment._id] && (
                                                                    <motion.div className="reply-form" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                                                        <input className="c-name" style={{ marginBottom: 8 }} placeholder="Your name" value={replyAuthors[comment._id] || ''} onChange={e => setReplyAuthors(p => ({ ...p, [comment._id]: e.target.value }))} />
                                                                        <div className="c-row">
                                                                            <textarea className="c-text" placeholder={`Reply to ${comment.author || 'Anonymous'}...`} rows={2} value={replyInputs[comment._id] || ''} onChange={e => setReplyInputs(p => ({ ...p, [comment._id]: e.target.value }))} />
                                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                                                <button className={`c-send ${commentImageFile ? 'bg-orange-50 text-[#f89e35]' : ''}`} style={{ background: 'white', border: '1.5px solid #e2e8f0', color: '#64748b', padding: '8px 12px' }} onClick={() => document.getElementById('comment-file').click()}>
                                                                                    <LinkIcon size={14} />
                                                                                </button>
                                                                                <LoadingButton 
                                                                                    loading={submitting || imageUploading} 
                                                                                    disabled={!replyInputs[comment._id]?.trim() && !commentImageFile} 
                                                                                    onClick={() => submitReply(comment._id)} 
                                                                                    className="c-send"
                                                                                    style={{ padding: '8px 12px' }}
                                                                                >
                                                                                    <Send size={14} />
                                                                                </LoadingButton>
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                            {comments.some(c => (c.parentId || null) === comment._id) && (
                                                                <button className="c-reply-btn" style={{ color: '#94a3b8' }} onClick={() => setExpandedReplies(p => ({ ...p, [comment._id]: !p[comment._id] }))}>
                                                                    <ChevronDown size={13} style={{ transform: expandedReplies[comment._id] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                                                    {expandedReplies[comment._id] ? 'Hide' : 'View'} replies
                                                                </button>
                                                            )}
                                                            <AnimatePresence>
                                                                {expandedReplies[comment._id] && (
                                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="replies-wrap">
                                                                        {renderTree(comment._id, depth + 1)}
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    </div>
                                                </div>
                                            ));
                                    return renderTree();
                                })()
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
