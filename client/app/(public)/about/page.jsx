'use client';
import { motion } from 'framer-motion';
import { Target, Eye, Shield, Zap, CheckCircle2, Award, Users, Rocket } from 'lucide-react';
import Image from 'next/image';

export default function AboutPage() {
    const fadeIn = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    return (
        <div className="pt-32 pb-32 min-h-screen bg-white overflow-hidden selection:bg-[#f89e35] selection:text-white">
            {/* Hero Section */}
            <section className="mb-32 relative">
                <div className="absolute top-0 right-[-10%] w-[600px] h-[600px] bg-[#f89e35]/5 rounded-full blur-[120px] -z-10"></div>

                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeIn}
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-200 text-[#f89e35] bg-slate-50 font-bold text-xs tracking-widest uppercase mb-8 shadow-sm">
                                Since 2024
                            </div>
                            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-tight leading-[0.9] mb-8">
                                Redefining the <span className="text-[#f89e35]">Digital</span> <br />
                                Frontier.
                            </h1>
                            <p className="text-xl md:text-2xl text-slate-600 font-medium leading-relaxed max-w-xl mb-10">
                                Lala Tech is a premier technology partner dedicated to empowering businesses with cutting-edge software solutions.
                                We blend creative design with technical mastery to build products that scale and inspire.
                            </p>
                            <div className="flex gap-12 mt-12 items-center">
                                <div>
                                    <p className="text-4xl font-black text-slate-900 mb-1">50+</p>
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Projects Delivered</p>
                                </div>
                                <div className="w-px h-12 bg-slate-200"></div>
                                <div>
                                    <p className="text-4xl font-black text-slate-900 mb-1">99%</p>
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Client Satisfaction</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
                            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="relative"
                        >
                            <div className="relative z-10 rounded-[40px] overflow-hidden shadow-2xl border-8 border-white">
                                <Image
                                    src="/lalatechlogo.png"
                                    alt="Lala Tech Excellence"
                                    width={600}
                                    height={600}
                                    className="w-full h-auto bg-slate-50 p-20"
                                />
                            </div>
                            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-[#f89e35] rounded-[40px] -z-10 animate-pulse opacity-20"></div>
                            <div className="absolute -top-10 -left-10 w-40 h-40 border-4 border-[#f89e35] rounded-[40px] -z-10 opacity-30"></div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="py-32 bg-slate-50 relative">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid md:grid-cols-2 gap-12">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeIn}
                            className="bg-white p-12 rounded-[40px] shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 group"
                        >
                            <div className="w-16 h-16 bg-[#f89e35]/10 rounded-2xl flex items-center justify-center mb-8 text-[#f89e35] group-hover:scale-110 transition-transform">
                                <Target className="w-8 h-8" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 mb-6">Our Mission</h2>
                            <p className="text-lg text-slate-600 font-medium leading-relaxed">
                                To provide elite, customized tech solutions that bridge the gap between complex problems and elegant experiences.
                                We aim to be the catalyst for digital transformation for organizations worldwide.
                            </p>
                        </motion.div>

                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            variants={fadeIn}
                            className="bg-white p-12 rounded-[40px] shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 group"
                        >
                            <div className="w-16 h-16 bg-[#f89e35]/10 rounded-2xl flex items-center justify-center mb-8 text-[#f89e35] group-hover:scale-110 transition-transform">
                                <Eye className="w-8 h-8" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 mb-6">Our Vision</h2>
                            <p className="text-lg text-slate-600 font-medium leading-relaxed">
                                To become the the world's most trusted partner for businesses seeking to build the future through scalable technology,
                                human-centric design, and relentless innovation.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Core Values */}
            <section className="py-32">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeIn}
                        className="text-center mb-20"
                    >
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">The Values That <span className="text-[#f89e35]">Drive Us</span></h2>
                        <p className="text-slate-500 font-medium text-lg max-w-2xl mx-auto">Foundational principles that guide every line of code we write and every decision we make.</p>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                    >
                        {[
                            { icon: Shield, title: "Integrity", desc: "Unwavering commitment to honesty and transparency." },
                            { icon: Zap, title: "Innovation", desc: "Constantly pushing boundaries of what's possible." },
                            { icon: Award, title: "Quality", desc: "Rigorous standards for every pixel and function." },
                            { icon: Users, title: "Collaboration", desc: "Growing together with our clients and partners." }
                        ].map((value, i) => (
                            <motion.div
                                key={i}
                                variants={fadeIn}
                                className="p-8 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all"
                            >
                                <value.icon className="w-10 h-10 text-[#f89e35] mb-6" />
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{value.title}</h3>
                                <p className="text-slate-500 font-medium leading-relaxed">{value.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-20 max-w-7xl mx-auto px-6">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeIn}
                    className="bg-[#110f0e] rounded-[50px] p-16 md:p-24 text-center text-white relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-full bg-[#f89e35]/10 pointer-events-none"></div>
                    <div className="relative z-10">
                        <Rocket className="w-16 h-16 text-[#f89e35] mx-auto mb-8" />
                        <h2 className="text-4xl md:text-6xl font-black mb-8">Ready to Scale Your Vision?</h2>
                        <div className="flex flex-wrap justify-center gap-6">
                            <a href="/#contact" className="bg-[#f89e35] hover:bg-white hover:text-slate-900 text-white px-10 py-4 rounded-full font-black transition-all shadow-xl shadow-[#f89e35]/20">
                                Start a Conversation
                            </a>
                            <a href="/projects" className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-10 py-4 rounded-full font-black transition-all">
                                View Our Work
                            </a>
                        </div>
                    </div>
                </motion.div>
            </section>
        </div>
    );
}
