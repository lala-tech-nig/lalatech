'use client';
import Link from 'next/link';

export default function HeroSection({ content }) {
    const defaultText = "We are a holding company dedicated to empowering the next generation of African innovation. From fintech to logistics, we build the infrastructure for the future.";
    const displayContent = content || defaultText;

    return (
        <section className="relative min-h-[90vh] flex items-center justify-center pt-24 pb-12 overflow-hidden bg-[#110f0e]">

            {/* Subtle background glow effect behind the text */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-[#f89e35]/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 text-center w-full">

                {/* Pill shaped badge */}
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#f89e35]/30 text-[#f89e35] font-semibold text-xs tracking-widest uppercase mb-10 transition-all duration-700 ease-out">
                    <span className="w-2 h-2 rounded-full bg-[#f89e35]"></span>
                    Powering African Innovation
                </div>

                {/* Main large heading matching the image */}
                <h1 className="text-5xl md:text-7xl lg:text-[5rem] font-bold mb-8 tracking-tight text-white leading-[1.1] transition-all duration-700 ease-out">
                    Building Technology That <br className="hidden md:block" />
                    <span className="text-[#f89e35]">Solves Real African<br className="hidden md:block" /> Problems</span>
                </h1>

                {/* Subtitle text */}
                <p className="text-lg md:text-xl text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto font-light transition-all duration-700 ease-out">
                    {displayContent}
                </p>

                {/* Call to action buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-700 ease-out">
                    <Link href="/projects" className="bg-[#f89e35] hover:bg-[#e08b2c] text-slate-950 px-10 py-4 rounded-full font-bold transition">
                        View Projects
                    </Link>
                    <Link href="/contact" className="border border-white/20 hover:border-white/40 text-white px-10 py-4 rounded-full font-bold transition">
                        Learn More
                    </Link>
                </div>
            </div>
        </section>
    );
}
