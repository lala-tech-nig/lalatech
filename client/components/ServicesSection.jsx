'use client';
import { motion } from 'framer-motion';
import {
    Globe,
    Smartphone,
    BarChart3,
    Laptop,
    GraduationCap,
    Wrench,
    Cpu,
    ArrowRight
} from 'lucide-react';
import Link from 'next/link';

const services = [
    {
        id: 'web-development',
        title: 'Website Development',
        description: 'Bespoke, high-performance websites built with the latest technologies to help your business stand out.',
        icon: Globe,
        color: 'bg-blue-50 text-blue-600'
    },
    {
        id: 'mobile-app-development',
        title: 'Mobile App Development',
        description: 'Native and cross-platform mobile applications designed for seamless user experience on iOS and Android.',
        icon: Smartphone,
        color: 'bg-purple-50 text-purple-600'
    },
    {
        id: 'digital-marketing',
        title: 'Digital Marketing',
        description: 'Strategic growth marketing, SEO, and social media management to amplify your brands digital presence.',
        icon: BarChart3,
        color: 'bg-green-50 text-green-600'
    },
    {
        id: 'sales-and-supply',
        title: 'Sales & Supply',
        description: 'Direct supply of premium phones, laptops, and specialized computer hardware for individuals and corporate needs.',
        icon: Laptop,
        color: 'bg-orange-50 text-[#f89e35]'
    },
    {
        id: 'training-services',
        title: 'Professional Training',
        description: 'Comprehensive tech training programs covering software development, digital tools, and IT management.',
        icon: GraduationCap,
        color: 'bg-red-50 text-red-600'
    },
    {
        id: 'repairs-and-maintenance',
        title: 'Laptop & Phone Repairs',
        description: 'Expert repair and maintenance services for mobile devices, laptops, and professional computing equipment.',
        icon: Wrench,
        color: 'bg-amber-50 text-amber-600'
    },
    {
        id: 'ai-and-ml',
        title: 'AI & ML Development',
        description: 'Tailored artificial intelligence and machine learning solutions to automate and optimize your business processes.',
        icon: Cpu,
        color: 'bg-cyan-50 text-cyan-600'
    }
];

export default function ServicesSection() {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.5 }
        }
    };

    return (
        <section className="py-24 bg-white" id="services">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-200 text-[#f89e35] bg-slate-50 font-bold text-xs tracking-widest uppercase mb-6 shadow-sm">
                        Our Expertise
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">
                        Tailored <span className="text-[#f89e35]">Services</span> for Your Growth
                    </h2>
                    <p className="text-slate-600 max-w-2xl mx-auto font-medium text-lg">
                        We build customized technology solutions designed to help every business scale,
                        from budding SMEs to multinational organizations.
                    </p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {services.map((service) => (
                        <Link
                            key={service.id}
                            href={`/services/${service.id}`}
                            className="group block"
                        >
                            <motion.div
                                variants={itemVariants}
                                className="h-full relative bg-slate-50 border border-slate-100 p-8 rounded-[32px] hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300"
                            >
                                <div className={`w-14 h-14 ${service.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <service.icon className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-3 leading-tight">{service.title}</h3>
                                <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
                                    {service.description}
                                </p>
                                <div className="inline-flex items-center gap-2 text-sm font-black text-slate-900 group-hover:text-[#f89e35] transition-colors">
                                    Learn More <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </motion.div>
                        </Link>
                    ))}

                    {/* Final CTA Card */}
                    <motion.div
                        variants={itemVariants}
                        className="lg:col-span-1 bg-[#110f0e] p-8 rounded-[32px] text-white flex flex-col justify-center relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#f89e35]/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <h3 className="text-2xl font-black mb-4 relative z-10">Need a Custom Solution?</h3>
                        <p className="text-slate-400 text-sm font-medium mb-8 relative z-10">
                            We specialize in building unique technologies tailored specifically to your business model.
                        </p>
                        <Link
                            href="/#contact"
                            className="bg-[#f89e35] text-white px-6 py-3 rounded-full font-black text-sm text-center hover:bg-white hover:text-slate-900 transition-all shadow-lg shadow-[#f89e35]/20"
                        >
                            Get Started
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
