'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  FileText, Image as ImageIcon, Video, Box, PenTool, LayoutGrid, Cpu, Search, 
  Settings, Zap, ArrowRight, Camera, Wrench
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toolsList } from '@/lib/toolsList';

// Helper to map categories to specific icons and colors
const getCategoryStyle = (category) => {
    switch(category) {
        case 'Pdf Tools': return { icon: FileText, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', gradient: 'from-red-500 to-rose-600' };
        case 'Image Tools': return { icon: ImageIcon, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100', gradient: 'from-indigo-500 to-blue-600' };
        case 'AI Write': return { icon: PenTool, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100', gradient: 'from-purple-500 to-fuchsia-600' };
        case 'Video Tools': return { icon: Video, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', gradient: 'from-emerald-500 to-teal-600' };
        case 'Converter Tools': return { icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', gradient: 'from-amber-500 to-orange-600' };
        case 'Web Tools': return { icon: LayoutGrid, color: 'text-cyan-500', bg: 'bg-cyan-50', border: 'border-cyan-100', gradient: 'from-cyan-500 to-blue-500' };
        case 'Other Tools': return { icon: Box, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', gradient: 'from-gray-500 to-slate-600' };
        default: return { icon: Settings, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100', gradient: 'from-orange-500 to-red-500' };
    }
};

const CATEGORIES = ['All', 'Pdf Tools', 'Image Tools', 'AI Write', 'Video Tools', 'Converter Tools', 'Web Tools', 'Other Tools'];

export default function ToolsPage() {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const filteredTools = useMemo(() => {
        return toolsList.filter(tool => {
            const matchesCategory = activeCategory === 'All' || tool.category === activeCategory;
            const matchesSearch = tool.name.toLowerCase().includes(search.toLowerCase()) || 
                                  tool.desc.toLowerCase().includes(search.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [search, activeCategory]);

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

                .tools-search {
                    max-width: 440px; margin: 0 auto 32px;
                    display: flex; align-items: center;
                    background: white; border-radius: 100px; border: 1.5px solid #e2e8f0;
                    padding: 8px 16px; gap: 10px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .tools-search:focus-within { border-color: #f89e35; box-shadow: 0 4px 20px rgba(248,158,53,0.12); }
                .tools-search input { flex: 1; border: none; outline: none; font-size: 15px; font-weight: 500; color: #0f172a; background: transparent; }
                .tools-search input::placeholder { color: #94a3b8; }

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
                
                {/* Header Phase */}
                <div className="course-header">
                    <div className="course-badge">
                        <Wrench size={14} /> Power Tools
                    </div>
                    <h1 className="course-title">
                        Lala Tech Workspace
                    </h1>
                    <p className="course-subtitle">
                        270+ tools to convert, edit, create, and optimize easily in one place
                    </p>

                    {/* Search Bar */}
                    <div className="tools-search">
                        <Search size={22} color="#94a3b8" />
                        <input
                            type="text"
                            placeholder="e.g. Merge PDF, AI Writer, Compress Image..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                                <ArrowRight size={18} />
                            </button>
                        )}
                    </div>

                    {/* Small always-visible request link */}
                    <a
                        href={`https://wa.me/2348121444306?text=${encodeURIComponent("hey, I can't find a tool on the website")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#f89e35] transition border border-slate-200 bg-white px-3 py-1.5 rounded-full shadow-sm"
                    >
                        <Wrench size={11} /> Can't find a tool? Request it &rarr;
                    </a>
                </div>

                {/* Categories */}
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

                {/* Grid */}
                {filteredTools.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm max-w-2xl mx-auto">
                        <Search size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No tools found matching &quot;{search}&quot;</h3>
                        <p className="text-gray-500">Try using broader search terms or browse by category.</p>
                        <button 
                            onClick={() => { setSearch(''); setActiveCategory('All'); }}
                            className="mt-6 px-6 py-2 bg-orange-50 text-orange-600 font-bold rounded-full hover:bg-orange-100 transition-colors"
                        >
                            Clear filtering
                        </button>
                        {/* CTA when search yields no results */}
                        <a
                            href={`https://wa.me/2348121444306?text=${encodeURIComponent(`hey am can't find the "${search}" tool on the website`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-flex items-center gap-2 bg-[#f89e35] hover:bg-[#e08b2c] text-white px-8 py-3 rounded-full font-black text-sm transition-all hover:-translate-y-0.5 shadow-lg shadow-[#f89e35]/30"
                        >
                            <Wrench size={15} /> Request "{search}" on WhatsApp
                        </a>
                    </div>
                ) : (
                    <motion.div 
                        layout 
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                    >
                        <AnimatePresence>
                            {filteredTools.map((tool) => {
                                const style = getCategoryStyle(tool.category);
                                const Icon = style.icon;
                                return (
                                    <Link href={`/tools/${tool.slug}`} key={tool.slug}>
                                        <motion.div 
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.2 }}
                                            className={`bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl border ${style.border} flex flex-col items-start cursor-pointer group h-full transition-all duration-300`}
                                        >
                                            <div className="flex w-full items-start justify-between mb-4">
                                                <div className={`w-14 h-14 rounded-xl ${style.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                                    <Icon className={`w-7 h-7 ${style.color}`} />
                                                </div>
                                                <div className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded bg-gray-50 text-gray-500 border border-gray-100`}>
                                                    {tool.category}
                                                </div>
                                            </div>
                                            
                                            <h3 className="text-lg font-extrabold text-gray-900 mb-2 leading-tight group-hover:text-orange-600 transition-colors">{tool.name}</h3>
                                            <p className="text-sm text-gray-500 leading-relaxed font-medium mb-4 flex-grow">{tool.desc}</p>
                                            
                                            <div className="flex items-center text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity mt-auto">
                                                <span className={`bg-clip-text text-transparent bg-gradient-to-r ${style.gradient}`}>
                                                    Try it out
                                                </span>
                                                <ArrowRight size={14} className={`ml-1 ${style.color}`} />
                                            </div>
                                        </motion.div>
                                    </Link>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
