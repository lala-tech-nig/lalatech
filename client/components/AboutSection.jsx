'use client';
import { motion } from 'framer-motion';

export default function AboutSection({ content }) {
    const defaultText = "We are an innovative team of developers, designers, and strategists. We build websites, mobile applications, digital marketing and management systems, hotel management softwares, POS softwares, IOT softwares. We turn ideas into wonderful software solutions to guarantee your success in the digital age.";
    const displayContent = content || defaultText;

    return (
        <section className="py-24 relative overflow-hidden bg-[#110f0e]" id="about">
            <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="relative"
                >
                    {/* Dark glowing container */}
                    <div className="aspect-square rounded-3xl overflow-hidden glass p-2 shadow-[0_0_50px_rgba(248,158,53,0.1)] border border-[#f89e35]/20">
                        <div className="w-full h-full rounded-2xl bg-[#110f0e] flex items-center justify-center relative overflow-hidden">
                            {/* Faint image overlay */}
                            <div className="absolute inset-0 bg-cover bg-center opacity-10 mix-blend-overlay" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80')" }}></div>
                            {/* Spinning animation graphic */}
                            <div className="w-48 h-48 rounded-full border border-[#f89e35]/30 flex items-center justify-center animate-[spin_10s_linear_infinite]">
                                <div className="w-32 h-32 rounded-full border border-[#f89e35]/50 flex items-center justify-center animate-[spin_5s_linear_infinite_reverse]">
                                    <div className="w-16 h-16 rounded-full bg-[#f89e35]/40 blur-md"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 text-slate-400 text-xs tracking-widest uppercase mb-6 bg-white/5">
                        Mission
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight">Who <span className="text-[#f89e35]">We Are</span></h2>
                    <p className="text-lg text-slate-400 leading-relaxed mb-8 font-light">
                        {displayContent}
                    </p>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-lg transition hover:bg-white/10">
                            <h4 className="text-4xl font-bold text-[#f89e35] mb-2 tracking-tighter">50+</h4>
                            <p className="text-slate-400 text-sm font-medium">Projects Delivered</p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-lg transition hover:bg-white/10">
                            <h4 className="text-4xl font-bold text-[#f89e35] mb-2 tracking-tighter">100%</h4>
                            <p className="text-slate-400 text-sm font-medium">Client Satisfaction</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
