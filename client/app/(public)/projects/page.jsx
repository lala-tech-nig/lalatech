'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Briefcase, Globe, ExternalLink } from 'lucide-react';
import ProjectCard from '@/components/ProjectCard';
import API_BASE_URL from '@/lib/api';

import { Search, Filter, Plus } from 'lucide-react';

export default function ProjectsPage() {
    const [projects, setProjects] = useState([]);
    const [filteredProjects, setFilteredProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [visibleCount, setVisibleCount] = useState(6);
    const [categories, setCategories] = useState(['All']);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/projects/categories`);
                if (res.ok) setCategories(['All', ...(await res.json())]);
            } catch (e) { console.error(e); }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/projects`);
                const data = await res.json();
                setProjects(data);
                setFilteredProjects(data);
            } catch (err) {
                console.error('Failed to fetch projects');
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    // Handle Search and Filter
    useEffect(() => {
        let result = [...projects];

        if (activeCategory !== 'All') {
            result = result.filter(p => {
                const projectCategory = p.category || 'Web Development';
                return projectCategory === activeCategory;
            });
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(p =>
                p.title.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query) ||
                (p.category || 'Web Development').toLowerCase().includes(query)
            );
        }

        setFilteredProjects(result);
        setVisibleCount(6);
    }, [searchQuery, activeCategory, projects]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1, duration: 0.5 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
    };

    return (
        <div className="pt-32 pb-32 min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-200 text-[#f89e35] bg-slate-50 font-bold text-xs tracking-widest uppercase mb-6 shadow-sm">
                        Portfolio Hub
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-none mb-6">
                        Innovating the <span className="text-[#f89e35]">Digital</span> <br />
                        Frontier.
                    </h1>
                    <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed max-w-2xl">
                        A collection of high-performance digital products and experiences we've built for forward-thinking brands.
                    </p>
                </motion.div>

                {/* Search and Filter UI */}
                <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm border ${activeCategory === cat
                                    ? 'bg-[#f89e35] text-white border-[#f89e35] shadow-[#f89e35]/20'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-[#f89e35] hover:text-[#f89e35]'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-full py-3.5 pl-12 pr-6 text-slate-900 font-medium focus:outline-none focus:border-[#f89e35] focus:ring-4 focus:ring-[#f89e35]/10 transition shadow-inner"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-[#f89e35]" />
                        <p className="text-slate-400 font-bold tracking-widest uppercase text-[10px]">Loading Ventures...</p>
                    </div>
                ) : filteredProjects.length > 0 ? (
                    <>
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            <AnimatePresence mode="popLayout">
                                {filteredProjects.slice(0, visibleCount).map((project, index) => (
                                    <motion.div
                                        key={project._id}
                                        layout
                                        variants={itemVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                    >
                                        <ProjectCard project={project} index={index} />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>

                        {visibleCount < filteredProjects.length && (
                            <div className="mt-16 text-center">
                                <button
                                    onClick={() => setVisibleCount(prev => prev + 6)}
                                    className="bg-white border-2 border-slate-900 text-slate-900 px-12 py-4 rounded-full font-black text-sm hover:bg-slate-900 hover:text-white transition-all transform active:scale-95 shadow-lg"
                                >
                                    Load More Ventures
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="bg-slate-50 border border-slate-200 p-20 text-center rounded-[40px] shadow-sm">
                        <h3 className="text-2xl font-black text-slate-900 mb-2">No Projects Found</h3>
                        <p className="text-slate-500 font-medium whitespace-pre-line">We couldn't find any projects matching your criteria. Try adjusting your search or filters.</p>
                        <button
                            onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                            className="mt-6 text-[#f89e35] font-bold hover:underline"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
