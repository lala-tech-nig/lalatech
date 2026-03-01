'use client';
import { useEffect, useState } from 'react';
import ProjectCard from './ProjectCard';
import { Loader2 } from 'lucide-react';

export default function ProjectsSection() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/projects');
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
        <section className="py-24 relative bg-[#0a0908]" id="projects">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#f89e35]/30 text-[#f89e35] text-xs tracking-widest uppercase mb-6 bg-[#f89e35]/5">
                        Portfolio
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight">
                        Featured <span className="text-[#f89e35]">Ventures</span>
                    </h2>
                    <p className="text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
                        A showcase of our best work. Modern websites designed to scale.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-[#f89e35]" />
                    </div>
                ) : projects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {projects.map((project, index) => (
                            <ProjectCard key={project._id} project={project} index={index} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white/5 border border-white/10 p-12 text-center rounded-3xl">
                        <p className="text-slate-500 text-lg">More projects being added soon.</p>
                    </div>
                )}
            </div>
        </section>
    );
}
