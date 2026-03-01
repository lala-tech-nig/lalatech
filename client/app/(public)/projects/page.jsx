'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Briefcase, Globe, ExternalLink } from 'lucide-react';
import ProjectCard from '@/components/ProjectCard';
import API_BASE_URL from '@/lib/api';

export default function ProjectsPage() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/projects`);
                const data = await res.json();
                setProjects(data);
            } catch (err) {
                console.error('Failed to fetch projects');
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.15, duration: 0.6 } }
    };

    const itemVariants = {
        hidden: { y: 30, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
    };

    return (
        <div className="pt-32 pb-32 min-h-screen bg-white selection:bg-[#f89e35] selection:text-white">
            {/* Ambient Background Element */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#f89e35]/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-4xl mb-20"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-200 text-[#f89e35] bg-slate-50 font-bold text-xs tracking-widest uppercase mb-8 shadow-sm">
                        Our Portfolio
                    </div>
                    <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-tight leading-[0.9] mb-8">
                        Engineering <span className="text-[#f89e35]">Excellence</span> <br />
                        One Project at a Time.
                    </h1>
                    <div className="h-1.5 w-24 bg-[#f89e35] mb-8 rounded-full"></div>
                    <p className="text-xl md:text-2xl text-slate-600 font-medium leading-relaxed max-w-3xl">
                        Explore our collection of bespoke digital solutions. Each project in our portfolio represents our commitment to performance,
                        scalability, and world-class user experience. We don't just build websites; we craft digital legacies for brands that aim higher.
                    </p>
                </motion.div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <Loader2 className="w-12 h-12 animate-spin text-[#f89e35]" />
                        <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Curating Ventures...</p>
                    </div>
                ) : projects.length > 0 ? (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12"
                    >
                        {projects.map((project, index) => (
                            <motion.div key={project._id} variants={itemVariants} className="group">
                                <ProjectCard project={project} index={index} />
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="bg-slate-50 border border-slate-200 p-20 text-center rounded-[40px] shadow-sm">
                        <div className="w-24 h-24 bg-white border border-slate-100 shadow-sm rounded-3xl flex items-center justify-center mx-auto mb-8 text-4xl rotate-3 group-hover:rotate-0 transition-transform">
                            🏗️
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 mb-4">Innovation in Progress</h3>
                        <p className="text-slate-500 text-xl font-medium max-w-md mx-auto">We are currently finalizing some of our biggest launches. Stay tuned for a redefined digital landscape.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
