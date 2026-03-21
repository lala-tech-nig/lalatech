'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, Image as ImageIcon, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL, BASE_URL } from '@/lib/api';

export default function FeedPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Create Post State
    const [content, setContent] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [isPosting, setIsPosting] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/posts`);
            if (res.ok) {
                const data = await res.json();
                setPosts(data);
            }
        } catch (error) {
            console.error('Failed to fetch posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const url = URL.createObjectURL(file);
            setImagePreview(url);
        }
    };

    const handleSubmitPost = async () => {
        if (!content && !imageFile) return;
        setIsPosting(true);

        try {
            let imageUrl = null;
            if (imageFile) {
                const formData = new FormData();
                formData.append('file', imageFile);
                const uploadRes = await fetch(`${BASE_URL}/upload`, {
                    method: 'POST',
                    body: formData
                });
                const uploadData = await uploadRes.json();
                imageUrl = uploadData.url;
            }

            const postData = { content, image: imageUrl };
            const res = await fetch(`${API_BASE_URL}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData)
            });

            if (res.ok) {
                const newPost = await res.json();
                setPosts([newPost, ...posts]);
                setContent('');
                setImagePreview(null);
                setImageFile(null);
            }
        } catch (error) {
            console.error('Failed to post:', error);
        } finally {
            setIsPosting(false);
        }
    };

    const handleLike = async (id) => {
        // Optimistic UI update
        setPosts(posts.map(p => p._id === id ? { ...p, likes: p.likes + 1, liked: true } : p));
        try {
            await fetch(`${API_BASE_URL}/posts/${id}/like`, { method: 'POST' });
        } catch (error) {
            console.error('Failed to like:', error);
        }
    };

    const handleShare = async (id, title) => {
        setPosts(posts.map(p => p._id === id ? { ...p, shares: p.shares + 1 } : p));
        try {
            await fetch(`${API_BASE_URL}/posts/${id}/share`, { method: 'POST' });
            if (navigator.share) {
                navigator.share({
                    title: 'Lala Tech Post',
                    text: title,
                    url: window.location.href,
                });
            }
        } catch (error) {
            console.error('Failed to share:', error);
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen pb-20 pt-10">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="bg-white rounded-t-2xl shadow-sm border-b border-gray-100 p-6 flex items-center justify-between sticky top-[72px] z-10">
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Lala's Feed</h1>
                </div>

                {/* Create Post Box */}
                <div className="bg-white rounded-b-2xl shadow-sm p-6 mb-6">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 font-bold text-orange-600 text-lg">
                            L
                        </div>
                        <div className="flex-1">
                            <textarea 
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="What's happening?"
                                className="w-full text-lg outline-none resize-none pt-3 placeholder-gray-500 text-gray-900 min-h-[80px]"
                            />
                            
                            {imagePreview && (
                                <div className="relative mt-2 mb-4">
                                    <img src={imagePreview} alt="Preview" className="rounded-xl max-h-80 w-auto object-cover border border-gray-200" />
                                    <button 
                                        onClick={() => { setImagePreview(null); setImageFile(null); }}
                                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                                    >
                                        &times;
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-orange-600 p-2 hover:bg-orange-50 rounded-full transition cursor-pointer"
                                    >
                                        <ImageIcon className="w-5 h-5" />
                                    </button>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleImageSelect}
                                        accept="image/*,video/*" 
                                        className="hidden" 
                                    />
                                </div>
                                <button 
                                    onClick={handleSubmitPost}
                                    disabled={isPosting || (!content && !imageFile)}
                                    className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-full font-bold transition flex items-center gap-2"
                                >
                                    {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Post
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feed Stream */}
                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600"></div>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-2xl shadow-sm">
                        <p className="text-gray-500 font-medium">No posts yet, be the first to post!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence>
                            {posts.map((post) => (
                                <motion.div 
                                    key={post._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 font-bold text-orange-600 text-lg">
                                            L
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-gray-900">Lala Tech</span>
                                                <span className="text-gray-500 text-sm">
                                                    · {new Date(post.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            
                                            {post.content && (
                                                <p className="text-gray-900 text-[15px] leading-relaxed mb-3 whitespace-pre-wrap">
                                                    {post.content}
                                                </p>
                                            )}

                                            {post.image && (
                                                <div className="mt-3 mb-3 relative rounded-2xl overflow-hidden border border-gray-100">
                                                    {post.image.includes('.mp4') ? (
                                                        <video src={post.image} controls className="w-full max-h-[500px] bg-black" />
                                                    ) : (
                                                        <img src={post.image} alt="Post content" className="w-full h-auto object-cover max-h-[500px]" />
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between text-gray-500 max-w-md mt-4">
                                                <button onClick={() => handleLike(post._id)} className={`flex items-center gap-2 group transition ${post.liked ? 'text-red-500' : 'hover:text-red-500'}`}>
                                                    <div className="p-2 rounded-full group-hover:bg-red-50 transition">
                                                        <Heart className={`w-5 h-5 ${post.liked ? 'fill-red-500' : ''}`} />
                                                    </div>
                                                    <span className="text-sm font-medium">{post.likes}</span>
                                                </button>
                                                
                                                <button className="flex items-center gap-2 group hover:text-orange-500 transition">
                                                    <div className="p-2 rounded-full group-hover:bg-orange-50 transition">
                                                        <MessageCircle className="w-5 h-5" />
                                                    </div>
                                                </button>
                                                
                                                <button onClick={() => handleShare(post._id, post.content)} className="flex items-center gap-2 group hover:text-green-500 transition">
                                                    <div className="p-2 rounded-full group-hover:bg-green-50 transition">
                                                        <Share2 className="w-5 h-5" />
                                                    </div>
                                                    <span className="text-sm font-medium">{post.shares}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

            </div>
        </div>
    );
}
