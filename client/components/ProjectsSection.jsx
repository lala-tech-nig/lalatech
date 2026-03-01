'use client';
import { useEffect, useState } from 'react';
import ProjectCard from './ProjectCard';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import API_BASE_URL from '@/lib/api';

export default function ProjectsSection() {
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

    return (
        <section className="py-24 relative bg-slate-50" id="projects">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#f89e35]/30 text-[#f89e35] bg-white font-bold text-xs tracking-widest uppercase mb-6 shadow-sm">
                        Portfolio
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black mb-6 text-slate-900 tracking-tight">
                        Featured <span className="text-[#f89e35]">Ventures</span>
                    </h2>
                    <p className="text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
                        A showcase of our best work. Modern websites designed to scale.
                    </p>
                </motion.div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-[#f89e35]" />
                    </div>
                ) : projects.length > 0 ? (
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        variants={{
                            visible: { transition: { staggerChildren: 0.1 } }
                        }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        {projects.slice(0, 6).map((project, index) => (
                            <motion.div
                                key={project._id}
                                variants={{
                                    hidden: { opacity: 0, y: 30 },
                                    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                                }}
                            >
                                <ProjectCard project={project} index={index} />
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="bg-white border border-slate-200 p-12 text-center rounded-3xl shadow-sm">
                        <p className="text-slate-500 text-lg font-medium">More projects being added soon.</p>
                    </div>
                )}

                {projects.length > 6 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-16 text-center"
                    >
                        <Link
                            href="/projects"
                            className="inline-flex items-center bg-[#f89e35] hover:bg-[#e08b2c] text-white px-10 py-4 rounded-full font-bold transition shadow-md shadow-[#f89e35]/20"
                        >
                            View All Projects
                        </Link>
                    </motion.div>
                )}
            </div>
        </section>
    );
}
