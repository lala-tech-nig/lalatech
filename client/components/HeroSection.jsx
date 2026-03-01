'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function HeroSection({ content }) {
    const defaultText = "We are a holding company dedicated to empowering the next generation of African innovation. From fintech to logistics, we build the infrastructure for the future.";
    const displayContent = content || defaultText;

    return (
        <section className="relative min-h-[90vh] flex items-center justify-center pt-24 pb-12 overflow-hidden bg-white">

            {/* Subtle background glow effect behind the text */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-[#f89e35]/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 text-center w-full">

                {/* Pill shaped badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#f89e35]/30 text-[#f89e35] bg-[#f89e35]/5 font-bold text-xs tracking-widest uppercase mb-10 transition-all duration-700 ease-out"
                >
                    <span className="w-2 h-2 rounded-full bg-[#f89e35] animate-pulse"></span>
                    Powering African Innovation
                </motion.div>

                {/* Main large heading */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-5xl md:text-7xl lg:text-[5rem] font-black mb-8 tracking-tight text-slate-900 leading-[1.1] transition-all duration-700 ease-out"
                >
                    Building Technology That <br className="hidden md:block" />
                    <span className="text-[#f89e35]">Solves Real African<br className="hidden md:block" /> Problems</span>
                </motion.h1>

                {/* Subtitle text */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-lg md:text-xl text-slate-600 mb-12 leading-relaxed max-w-2xl mx-auto font-medium transition-all duration-700 ease-out"
                >
                    {displayContent}
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-700 ease-out"
                >
                    <Link href="/projects" className="bg-[#f89e35] hover:bg-[#e08b2c] text-white shadow-xl shadow-[#f89e35]/20 px-10 py-4 rounded-full font-bold transition">
                        View Projects
                    </Link>
                    <Link href="/contact" className="border-2 border-slate-200 hover:border-slate-300 text-slate-900 hover:bg-slate-50 px-10 py-4 rounded-full font-bold transition">
                        Learn More
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
