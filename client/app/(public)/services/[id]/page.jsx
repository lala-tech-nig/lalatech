'use client';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Globe,
    Smartphone,
    BarChart3,
    Laptop,
    GraduationCap,
    Wrench,
    Cpu,
    CheckCircle2,
    ArrowRight,
    Zap,
    Shield,
    Target,
    Send,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import API_BASE_URL from '@/lib/api';

const servicesData = {
    'web-development': {
        title: 'Website Development',
        subtitle: 'Crafting Digital Masterpieces',
        icon: Globe,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        description: 'We build high-performance, responsive websites that convert visitors into customers. From e-commerce platforms to corporate portals, we use the latest tech stacks like Next.js, React, and Node.js.',
        features: [
            'Responsive Design for all devices',
            'SEO Optimization built-in',
            'E-commerce Solutions (Shopify, Custom)',
            'CMS Integration (Headless or Traditional)',
            'Conversion Rate Optimization',
            'Performance & Speed Buffing'
        ],
        process: [
            { title: 'Discovery', desc: 'Understanding your business goals and target audience.' },
            { title: 'Design', desc: 'Creating intuitive UI/UX mockups that resonate with your brand.' },
            { title: 'Development', desc: 'Clean, efficient coding with modern frameworks.' },
            { title: 'Deployment', desc: 'Rigorous testing and seamless launch.' }
        ],
        formFields: [
            { name: 'websiteType', label: 'Type of Website', type: 'select', options: ['Business', 'E-commerce', 'Portfolio', 'Custom Platform'] },
            { name: 'featuresNeeded', label: 'Key Features Needed', type: 'textarea', placeholder: 'e.g. Booking system, Payment gateway, CMS...' }
        ]
    },
    'mobile-app-development': {
        title: 'Mobile App Development',
        subtitle: 'Apps That Users Love',
        icon: Smartphone,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        description: 'Native and hybrid mobile applications built for performance. We create intuitive experiences for both iOS and Android platforms using Flutter, React Native, and Swift.',
        features: [
            'iOS & Android Native Apps',
            'Cross-Platform Development',
            'User-Centric UI/UX Design',
            'App Store Optimization (ASO)',
            'Cloud Synchronization',
            'Push Notification Systems'
        ],
        process: [
            { title: 'Strategy', desc: 'Defining the feature set and user journey.' },
            { title: 'Prototype', desc: 'Building interactive wireframes for testing.' },
            { title: 'Build', desc: 'Agile development with frequent updates.' },
            { title: 'Launch', desc: 'Submitting to stores and initial scaling.' }
        ],
        formFields: [
            { name: 'platform', label: 'Target Platform', type: 'select', options: ['Both iOS & Android', 'iOS only', 'Android only'] },
            { name: 'appGoal', label: 'Goal of the App', type: 'textarea', placeholder: 'What problem does your app solve?' }
        ]
    },
    'digital-marketing': {
        title: 'Digital Marketing',
        subtitle: 'Amplify Your Impact',
        icon: BarChart3,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        description: 'Data-driven marketing strategies to help your brand cut through the noise. We focus on ROI and sustainable growth through multiple digital channels.',
        features: [
            'Search Engine Optimization (SEO)',
            'Social Media Management',
            'Content Marketing Strategy',
            'PPC & Paid Advertising',
            'Email Marketing Campaigns',
            'Analytics & Performance Tracking'
        ],
        process: [
            { title: 'Audit', desc: 'Analyzing your current presence and competitors.' },
            { title: 'Plan', desc: 'Developing a multi-channel growth roadmap.' },
            { title: 'Execute', desc: 'High-impact content and ad management.' },
            { title: 'Optimize', desc: 'Continuous data analysis and refinement.' }
        ],
        formFields: [
            { name: 'serviceInterest', label: 'Primary Interest', type: 'select', options: ['SEO', 'Ads Management', 'Social Media', 'Full Strategy'] },
            { name: 'budgetRange', label: 'Monthly Budget Range', type: 'select', options: ['$500 - $1000', '$1000 - $5000', '$5000+'] }
        ]
    },
    'sales-and-supply': {
        title: 'Sales & Supply',
        subtitle: 'Enterprise-Grade Hardware',
        icon: Laptop,
        color: 'text-[#f89e35]',
        bgColor: 'bg-orange-50',
        description: 'Your trusted partner for authentic computer hardware and mobile devices. We supply individuals and corporate organizations with the best tools for their trade.',
        features: [
            'Premium Laptops (MacBook, Dell, HP)',
            'Flagship Smartphones (iPhone, Samsung)',
            'Networking Equipment',
            'Custom PC Builds for Pros',
            'Bulk Corporate Supply',
            'Authentic Accessories'
        ],
        process: [
            { title: 'Inquiry', desc: 'Consulting on your specific hardware needs.' },
            { title: 'Sourcing', desc: 'Procuring high-quality, authentic units.' },
            { title: 'Delivery', desc: 'Secure and fast logistics to your door.' },
            { title: 'Support', desc: 'Standard warranty and setup assistance.' }
        ],
        formFields: [
            { name: 'itemInterest', label: 'Interested Item', type: 'text', placeholder: 'e.g. MacBook Pro M3, iPhone 15' },
            { name: 'quantity', label: 'Quantity', type: 'number', placeholder: '1' }
        ]
    },
    'training-services': {
        title: 'Professional Training',
        subtitle: 'Empowering Future Innovators',
        icon: GraduationCap,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        description: 'Hands-on technical training for individuals and teams. Our curriculum is designed by industry experts to ensure you gain practical, job-ready skills.',
        features: [
            'Frontend & Backend Development',
            'UI/UX Design Masterclasses',
            'Digital Marketing Workshops',
            'Mobile App Development Training',
            'Data Science & Analytics',
            'Corporate IT Training'
        ],
        process: [
            { title: 'Enroll', desc: 'Choosing a track that fits your career goals.' },
            { title: 'Learn', desc: 'Live projects and expert-led sessions.' },
            { title: 'Build', desc: 'Creating a portfolio of real-world apps.' },
            { title: 'Certify', desc: 'Final assessment and industry certification.' }
        ],
        formFields: [
            { name: 'courseSelection', label: 'Interested Course', type: 'select', options: ['Web Dev', 'Mobile App Dev', 'UI/UX Design', 'Digital Marketing'] },
            { name: 'experienceLevel', label: 'Experience Level', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'] }
        ]
    },
    'repairs-and-maintenance': {
        title: 'Hardware Repairs',
        subtitle: 'Expert Care for Your Tools',
        icon: Wrench,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        description: 'Certified technicians providing fast and reliable repair services. We understand that your devices are your livelihood, and we treat them with expert care.',
        features: [
            'Laptop Screen & Motherboard Repair',
            'Smartphone Screen Replacements',
            'Battery & Charging Port Fixes',
            'System Cleanup & Optimization',
            'Data Recovery Services',
            'Enterprise Tech Maintenance'
        ],
        process: [
            { title: 'Diagnose', desc: 'Identifying the root cause of the issue.' },
            { title: 'Quote', desc: 'Transparent pricing with no hidden fees.' },
            { title: 'Repair', desc: 'Precision work using quality parts.' },
            { title: 'Test', desc: 'Full QC check before handing back.' }
        ],
        formFields: [
            { name: 'deviceName', label: 'Device Name & Model', type: 'text', placeholder: 'e.g. MacBook Pro 2021, iPhone 13' },
            { name: 'faultDescription', label: 'Fault Description', type: 'textarea', placeholder: 'Describe the issue...' }
        ]
    },
    'ai-and-ml': {
        title: 'AI & ML Development',
        subtitle: 'Intelligence for the Modern Business',
        icon: Cpu,
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-50',
        description: 'Leveraging the power of Artificial Intelligence to automate complex tasks. We build smart systems that learn, adapt, and provide predictive insights.',
        features: [
            'Predictive Analytics Systems',
            'Natural Language Processing (NLP)',
            'Computer Vision Solutions',
            'AI Chatbots & Virtual Assistants',
            'Automated Data Processing',
            'Machine Learning Model Training'
        ],
        process: [
            { title: 'Analyze', desc: 'Finding automation opportunities in your data.' },
            { title: 'Model', desc: 'Building and training custom AI models.' },
            { title: 'Integrate', desc: 'Deploying AI into your existing workflow.' },
            { title: 'Monitor', desc: 'Continuous learning and model drift checks.' }
        ],
        formFields: [
            { name: 'aiGoal', label: 'Business Goal for AI', type: 'textarea', placeholder: 'What do you want to achieve with AI?' },
            { name: 'dataAvailable', label: 'Do you have existing data?', type: 'select', options: ['Yes, clean data', 'Yes, but unorganized', 'No, need data collection'] }
        ]
    }
};

export default function ServiceDetailPage() {
    const params = useParams();
    const serviceId = params.id;
    const service = servicesData[serviceId];

    const [formData, setFormData] = useState({
        customerName: '',
        email: '',
        phone: '',
        details: {}
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!service) {
        return (
            <div className="pt-40 pb-24 text-center">
                <h1 className="text-4xl font-black text-slate-900 mb-4">Service Not Found</h1>
                <Link href="/#services" className="text-[#f89e35] font-bold underline">Back to Services</Link>
            </div>
        );
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (['customerName', 'email', 'phone'].includes(name)) {
            setFormData(prev => ({ ...prev, [name]: value }));
        } else {
            setFormData(prev => ({
                ...prev,
                details: { ...prev.details, [name]: value }
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch(`${API_BASE_URL}/service-requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    serviceId,
                    serviceName: service.title
                })
            });

            if (res.ok) {
                toast.success('Your request has been submitted successfully!');
                setFormData({ customerName: '', email: '', phone: '', details: {} });
            } else {
                throw new Error('Failed to submit');
            }
        } catch (err) {
            toast.error('Failed to submit your request. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="pt-32 pb-32 min-h-screen bg-white selection:bg-[#f89e35] selection:text-white">
            <div className="max-w-7xl mx-auto px-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="mb-24"
                >
                    <div className={`w-20 h-20 ${service.bgColor} ${service.color} rounded-3xl flex items-center justify-center mb-10 shadow-sm shadow-slate-100`}>
                        <service.icon className="w-10 h-10" />
                    </div>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-200 text-[#f89e35] bg-slate-50 font-bold text-xs tracking-widest uppercase mb-8 shadow-sm">
                        {service.subtitle}
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tight leading-[0.9] mb-12">
                        {service.title.split(' ').slice(0, -1).join(' ')} <br />
                        <span className="text-[#f89e35]">{service.title.split(' ').slice(-1)}</span>
                    </h1>
                    <p className="text-xl md:text-3xl text-slate-600 font-medium leading-relaxed max-w-4xl">
                        {service.description}
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-20">
                    {/* Features List */}
                    <div className="lg:col-span-2">
                        <section className="mb-20">
                            <h2 className="text-3xl font-black text-slate-900 mb-10">Key Features</h2>
                            <div className="grid md:grid-cols-2 gap-8">
                                {service.features.map((feature, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-start gap-4 p-6 rounded-3xl bg-slate-50 border border-slate-100 group hover:bg-white hover:shadow-xl transition-all"
                                    >
                                        <CheckCircle2 className={`w-6 h-6 ${service.color} shrink-0`} />
                                        <span className="text-slate-800 font-bold">{feature}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </section>

                        {/* Submission Form */}
                        <section className="bg-slate-50 border border-slate-200 p-10 md:p-14 rounded-[40px] shadow-sm">
                            <div className="max-w-xl">
                                <h2 className="text-3xl font-black text-slate-900 mb-4">Request This Service</h2>
                                <p className="text-slate-500 font-medium mb-12">Fill out the form below and our team will get back to you within 24 hours.</p>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-900 ml-1">Full Name</label>
                                            <input
                                                required
                                                name="customerName"
                                                value={formData.customerName}
                                                onChange={handleChange}
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-[#f89e35] transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-900 ml-1">Email Address</label>
                                            <input
                                                required
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-[#f89e35] transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-900 ml-1">Phone Number</label>
                                        <input
                                            required
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-[#f89e35] transition-colors"
                                        />
                                    </div>

                                    {/* Service Specific Fields */}
                                    <div className="space-y-6 pt-4">
                                        {service.formFields.map((field) => (
                                            <div key={field.name} className="space-y-2">
                                                <label className="text-sm font-bold text-slate-900 ml-1">{field.label}</label>
                                                {field.type === 'select' ? (
                                                    <select
                                                        name={field.name}
                                                        onChange={handleChange}
                                                        className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-[#f89e35] transition-colors appearance-none cursor-pointer"
                                                    >
                                                        <option value="">Select option...</option>
                                                        {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                    </select>
                                                ) : field.type === 'textarea' ? (
                                                    <textarea
                                                        name={field.name}
                                                        placeholder={field.placeholder}
                                                        onChange={handleChange}
                                                        className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-[#f89e35] transition-colors min-h-[120px] resize-none"
                                                    />
                                                ) : (
                                                    <input
                                                        type={field.type}
                                                        name={field.name}
                                                        placeholder={field.placeholder}
                                                        onChange={handleChange}
                                                        className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:border-[#f89e35] transition-colors"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        disabled={isSubmitting}
                                        type="submit"
                                        className="w-full bg-[#f89e35] text-white py-5 rounded-[24px] font-black text-lg hover:bg-slate-900 transition-all shadow-xl shadow-[#f89e35]/20 flex items-center justify-center gap-3"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : (
                                            <>Submit Request <Send className="w-5 h-5" /></>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </section>
                    </div>

                    {/* Quick Stats/CTA */}
                    <div className="space-y-8">
                        <div className="bg-[#110f0e] rounded-[40px] p-10 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#f89e35]/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                            <h3 className="text-2xl font-black mb-6 relative z-10">Expert Assistance</h3>
                            <p className="text-slate-400 font-medium mb-10 relative z-10">
                                Need technical advice first? Our lead engineers are ready to help you map out your next move.
                            </p>
                            <a
                                href="https://wa.me/2348121444306"
                                className="block w-full bg-white/10 border border-white/20 text-white py-4 rounded-full font-black text-center hover:bg-white hover:text-slate-900 transition-all"
                            >
                                WhatsApp Chat
                            </a>
                        </div>

                        <div className="p-10 rounded-[40px] border border-slate-100 bg-slate-50">
                            <h3 className="text-xl font-black text-slate-900 mb-6">Why Choose Us?</h3>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <Target className="w-5 h-5 text-[#f89e35]" />
                                    <p className="text-sm font-bold text-slate-600 tracking-tight leading-relaxed">Dedicated expert team for every single project.</p>
                                </div>
                                <div className="flex gap-4">
                                    <Shield className="w-5 h-5 text-[#f89e35]" />
                                    <p className="text-sm font-bold text-slate-600 tracking-tight leading-relaxed">Enterprise-grade security and reliability standards.</p>
                                </div>
                                <div className="flex gap-4">
                                    <Zap className="w-5 h-5 text-[#f89e35]" />
                                    <p className="text-sm font-bold text-slate-600 tracking-tight leading-relaxed">Turbo-charged delivery with zero compromise on quality.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Workflow Section */}
                <motion.section
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-32 py-24 border-t border-slate-100"
                >
                    <h2 className="text-4xl font-black text-slate-900 text-center mb-20">Our <span className="text-[#f89e35]">Strategic</span> Process</h2>
                    <div className="grid md:grid-cols-4 gap-12">
                        {service.process.map((step, i) => (
                            <div key={i} className="relative text-center">
                                <div className="text-8xl font-black text-slate-50 absolute -top-12 left-1/2 -translate-x-1/2 z-0">
                                    0{i + 1}
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-4 ml- relative z-10 uppercase tracking-tighter">{step.title}</h3>
                                <p className="text-slate-500 font-medium relative z-10 px-4">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </motion.section>
            </div>
        </div>
    );
}
