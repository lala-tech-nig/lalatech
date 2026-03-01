'use client';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';

export default function ProjectCard({ project, index }) {
    return (
        <div
            className="bg-white rounded-3xl overflow-hidden group border border-slate-200 hover:border-[#f89e35] transition duration-500 cursor-pointer shadow-md hover:shadow-xl shadow-slate-200/50"
            onClick={() => window.open(project.link, '_blank')}
        >
            <div className="relative h-64 w-full overflow-hidden bg-slate-100">
                {project.thumbnailUrl ? (
                    <Image
                        src={project.thumbnailUrl}
                        alt={project.title}
                        fill
                        className="object-cover group-hover:scale-110 transition duration-700 ease-in-out"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100">
                        <span className="text-slate-400 font-bold tracking-wide">NO PREVIEW</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-[#f89e35] text-white p-4 rounded-full translate-y-4 group-hover:translate-y-0 transition duration-300 shadow-lg shadow-[#f89e35]/30">
                        <ExternalLink className="w-6 h-6" />
                    </div>
                </div>
            </div>
            <div className="p-8 border-t border-slate-100">
                <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-[#f89e35] transition tracking-tight">{project.title}</h3>
                <p className="text-slate-600 line-clamp-3 leading-relaxed font-medium">{project.description}</p>
            </div>
        </div>
    );
}
