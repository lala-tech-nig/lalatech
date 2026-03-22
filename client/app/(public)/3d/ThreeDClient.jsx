'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Box, Eye, TrendingUp, Search, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '@/lib/api';

const CATEGORIES = ['All', 'General', 'Programming', 'Design', 'Business', 'Marketing', 'Data Science', 'DevOps', 'Other'];

export default function ThreeDClient() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchPosts();
    }, [activeCategory]);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const params = activeCategory !== 'All' ? `?category=${encodeURIComponent(activeCategory)}` : '';
            const res = await fetch(`${API_BASE_URL}/3d${params}`);
            if (res.ok) {
                setPosts(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filtered = posts.filter(c =>
        c.title?.toLowerCase().includes(search.toLowerCase()) ||
        c.story?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="course-page">
            <style>{`
                .course-page {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #fff7ed 0%, #fff 60%, #fef1f0 100%);
                    padding: 80px 0 60px;
                }
                .course-container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
                .course-header { text-align: center; margin-bottom: 48px; padding-top: 20px; }
                .course-badge {
                    display: inline-flex; align-items: center; gap: 6px;
                    background: linear-gradient(135deg, #f89e35, #f56e00);
                    color: white; font-size: 11px; font-weight: 800;
                    letter-spacing: 1.5px; text-transform: uppercase;
                    padding: 6px 14px; border-radius: 100px; margin-bottom: 16px;
                }
                .course-title { font-size: 48px; font-weight: 900; color: #0f172a; letter-spacing: -1.5px; margin: 0 0 12px; }
                .course-subtitle { color: #64748b; font-size: 17px; font-weight: 500; margin-bottom: 32px; }

                /* Search */
                .course-search {
                    max-width: 440px; margin: 0 auto 32px;
                    display: flex; align-items: center;
                    background: white; border-radius: 100px; border: 1.5px solid #e2e8f0;
                    padding: 8px 16px; gap: 10px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .course-search:focus-within { border-color: #f89e35; box-shadow: 0 4px 20px rgba(248,158,53,0.12); }
                .course-search input { flex: 1; border: none; outline: none; font-size: 15px; font-weight: 500; color: #0f172a; background: transparent; }
                .course-search input::placeholder { color: #94a3b8; }

                /* Category Strip */
                .category-strip {
                    display: flex; gap: 10px; overflow-x: auto; padding-bottom: 8px;
                    margin-bottom: 40px; scrollbar-width: none; justify-content: center;
                }
                @media (max-width: 768px) { .category-strip { justify-content: flex-start; } }
                .category-strip::-webkit-scrollbar { display: none; }
                .cat-btn {
                    padding: 8px 18px; border-radius: 100px; border: 1.5px solid #e2e8f0;
                    font-size: 13px; font-weight: 700; cursor: pointer;
                    white-space: nowrap; transition: all 0.15s;
                    background: white; color: #64748b;
                }
                .cat-btn.active { background: linear-gradient(135deg, #f89e35, #f56e00); color: white; border-color: transparent; box-shadow: 0 4px 16px rgba(248,158,53,0.3); }
                .cat-btn:hover:not(.active) { border-color: #f89e35; color: #f89e35; }
            `}</style>

            <div className="course-container">
                {/* Header that exactly matches user request / course page */}
                <div className="course-header">
                    <div className="course-badge">
                        <Box size={14} /> Learning Hub
                    </div>
                    <h1 className="course-title">Lala Tech 3D Models</h1>
                    <p className="course-subtitle">Handpicked 3D models — interact directly in your browser</p>

                    {/* Small always-visible request link */}
                    <a
                        href={`https://wa.me/2348121444306?text=${encodeURIComponent("hey, I can't find a 3D model on the website")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#f89e35] transition border border-slate-200 bg-white px-3 py-1.5 rounded-full shadow-sm"
                    >
                        <Box size={11} /> Can't find a 3D model? Request it &rarr;
                    </a>
                </div>

                {/* Search */}
                <div className="course-search">
                    <Search size={18} color="#94a3b8" />
                    <input 
                        type="text" 
                        placeholder="Search 3D models..." 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
                            <ArrowRight size={18} />
                        </button>
                    )}
                </div>
                
                {/* Category Strip */}
                <div className="category-strip">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            className={`cat-btn ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Grid Section */}
                <div className="max-w-7xl mx-auto mt-8">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-12 h-12 border-4 border-[#f89e35] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-300 p-20 flex flex-col items-center justify-center text-center shadow-sm">
                            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                <Box className="w-10 h-10 text-slate-400" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-2">No 3D Models Found</h2>
                            <p className="text-slate-500 font-medium">Try checking a different category or clearing your search.</p>
                        </div>
                    ) : (
                        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <AnimatePresence>
                                {filtered.map((post) => (
                                    <Link href={`/3d/${post.slug}`} key={post._id} className="group flex flex-col align-stretch">
                                        <motion.article 
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="bg-white rounded-3xl overflow-hidden border border-slate-200/60 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 h-full flex flex-col"
                                        >
                                            <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                                                <Image
                                                    src={post.thumbnail}
                                                    alt={post.title}
                                                    fill
                                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                    unoptimized
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                                
                                                {/* Badges Overlay */}
                                                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                                                    <div className="flex gap-2 text-white/90 text-[10px] font-black uppercase tracking-widest">
                                                        <span className="flex items-center gap-1.5 backdrop-blur-md bg-black/40 px-3 py-1.5 rounded-full border border-white/10">
                                                            <Box className="w-3 h-3 text-[#f89e35]" /> 3D View
                                                        </span>
                                                        {post.category && post.category !== 'General' && (
                                                            <span className="flex items-center gap-1.5 backdrop-blur-md bg-black/40 px-3 py-1.5 rounded-full border border-white/10">
                                                                {post.category}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 backdrop-blur-md bg-white text-slate-900 px-3 py-1.5 rounded-full shadow-lg font-bold text-xs">
                                                        <Eye className="w-3.5 h-3.5 text-[#f89e35]" /> {post.views}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-8 flex flex-col flex-1 relative">
                                                <div className="absolute -top-6 right-6 w-12 h-12 bg-[#f89e35] rounded-full shadow-lg shadow-[#f89e35]/30 flex items-center justify-center text-white transform group-hover:scale-110 transition-transform duration-300">
                                                    <TrendingUp className="w-5 h-5" />
                                                </div>

                                                <h2 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-[#f89e35] transition-colors leading-tight line-clamp-2">
                                                    {post.title}
                                                </h2>
                                                
                                                <div 
                                                    className="text-slate-500 font-medium mb-6 line-clamp-3 leading-relaxed flex-1 prose-sm prose-slate"
                                                    dangerouslySetInnerHTML={{ __html: post.story }}
                                                />
                                                
                                                <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-auto">
                                                    <span className="text-[11px] font-black uppercase tracking-widest text-[#f89e35]">
                                                        {new Date(post.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year:'numeric' })}
                                                    </span>
                                                    <span className="text-sm font-bold text-slate-900 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                                        Explore <span className="text-[#f89e35]">&rarr;</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.article>
                                    </Link>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Request 3D Model CTA */}
            {(!loading && search && filtered.length === 0) && (
                <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-16 md:mt-24">
                    <div className="bg-[#110f0e] rounded-[2.5rem] p-10 md:p-16 text-center relative overflow-hidden flex flex-col items-center shadow-2xl">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                        <div className="w-20 h-20 bg-[#f89e35] rounded-full flex items-center justify-center mb-6 relative z-10 shadow-[0_0_40px_rgb(248,158,53,0.4)]">
                            <Box className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-6 relative z-10 max-w-3xl leading-tight">Can't find the 3D model you want?</h2>
                        <p className="text-slate-400 font-medium text-lg md:text-xl mb-10 relative z-10 max-w-2xl">
                            We noticed you're looking for "{search}". Request it right away and we might add it just for you!
                        </p>
                        <a 
                            href={`https://wa.me/2348121444306?text=${encodeURIComponent(`hey am can't find the "${search}" 3d model on the website`)}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-[#f89e35] hover:bg-[#e08b2c] text-white px-10 py-5 rounded-full font-black text-lg flex items-center gap-3 transition-all hover:-translate-y-1 shadow-[0_10px_40px_rgb(248,158,53,0.3)] relative z-10"
                        >
                            Request Right Away
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
