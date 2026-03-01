'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Briefcase, MapPin, X, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import API_BASE_URL from '@/lib/api';

export default function CareerPage() {
    const [careerText, setCareerText] = useState('');
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedJob, setSelectedJob] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', coverLetter: '', resumeLink: '' });

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const [contentRes, jobsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/content`),
                    fetch(`${API_BASE_URL}/jobs`)
                ]);
                const contentData = await contentRes.json();
                const jobsData = await jobsRes.json();

                setCareerText(contentData.career || "We are always looking for talented individuals who share our passion for creating wonderful software solutions. Build the future with Lala Tech.");
                setJobs(jobsData);
            } catch (err) {
                console.error("Failed to load career data");
                setCareerText("We are always looking for talented individuals who share our passion for creating wonderful software solutions. Build the future with Lala Tech.");
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, []);

    const handleApply = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE_URL}/applications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, jobId: selectedJob._id })
            });
            if (!res.ok) throw new Error('Failed to submit application');
            toast.success('Application submitted successfully!', {
                style: { background: '#f89e35', color: '#ffffff', fontWeight: 'bold' }
            });
            setSelectedJob(null);
            setFormData({ name: '', email: '', phone: '', coverLetter: '', resumeLink: '' });
        } catch (err) {
            toast.error('Failed to submit. Please try again.', {
                style: { background: '#ef4444', color: '#fff' }
            });
        } finally {
            setSubmitting(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.2, duration: 0.5 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
    };

    return (
        <div className="pt-32 pb-24 min-h-screen relative overflow-hidden bg-white">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#f89e35]/15 rounded-full blur-[120px]"></div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="relative z-10 max-w-5xl mx-auto px-6"
            >
                <div className="text-center mb-16">
                    <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-200 text-slate-500 font-bold text-xs tracking-widest uppercase mb-8 bg-slate-50 shadow-sm transition-all duration-500">
                        Careers
                    </motion.div>

                    <motion.h1 variants={itemVariants} className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tight text-slate-900 leading-tight transition-all duration-500">
                        Join <span className="text-[#f89e35]">Our Team</span>
                    </motion.h1>

                    <motion.div variants={itemVariants} className="min-h-[60px] flex justify-center items-center">
                        {loading ? <Loader2 className="w-6 h-6 animate-spin text-[#f89e35]" /> : (
                            <p className="text-xl text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
                                {careerText}
                            </p>
                        )}
                    </motion.div>
                </div>

                <motion.div variants={itemVariants}>
                    {loading ? null : jobs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {jobs.map(job => (
                                <motion.div key={job._id} whileHover={{ y: -5 }} className="bg-slate-50 border border-slate-200 p-8 rounded-3xl shadow-sm hover:shadow-md transition">
                                    <h3 className="text-2xl font-black text-slate-900 mb-2">{job.title}</h3>
                                    <div className="flex flex-wrap gap-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">
                                        <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                            <Briefcase className="w-3.5 h-3.5" /> {job.type}
                                        </span>
                                        <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5" /> {job.location}
                                        </span>
                                    </div>
                                    <p className="text-slate-600 font-medium leading-relaxed mb-8 whitespace-pre-wrap line-clamp-4">
                                        {job.description}
                                    </p>
                                    <button
                                        onClick={() => setSelectedJob(job)}
                                        className="w-full bg-[#f89e35] hover:bg-[#e08b2c] text-white py-3 rounded-xl font-bold transition shadow-md shadow-[#f89e35]/20"
                                    >
                                        Apply Now
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-slate-50 p-12 text-center rounded-3xl border border-slate-200 shadow-xl">
                            <div className="w-20 h-20 bg-white border border-slate-100 shadow-sm rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-3xl">🚀</span>
                            </div>
                            <h3 className="text-2xl font-black mb-4 text-slate-900 tracking-tight">No Open Roles</h3>
                            <p className="text-slate-600 mb-10 leading-relaxed max-w-lg mx-auto font-medium">
                                Currently, we don't have any open positions. However, we're always eager to meet driven professionals. Send us your resume and we'll keep you in mind for future opportunities.
                            </p>
                            <motion.a
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                href="mailto:careers@lalatech.com"
                                className="inline-block bg-[#f89e35] hover:bg-[#e08b2c] text-white px-10 py-4 rounded-full font-bold transition shadow-md shadow-[#f89e35]/20"
                            >
                                Send Resume
                            </motion.a>
                        </div>
                    )}
                </motion.div>
            </motion.div>

            {/* Application Modal */}
            <AnimatePresence>
                {selectedJob && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-2xl rounded-3xl p-8 md:p-10 shadow-2xl relative my-8"
                        >
                            <button
                                onClick={() => setSelectedJob(null)}
                                className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <h2 className="text-3xl font-black text-slate-900 mb-2">Apply for {selectedJob.title}</h2>
                            <p className="text-slate-500 font-medium mb-8">Please fill out the form below to submit your application.</p>

                            <form onSubmit={handleApply} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                                        <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 focus:outline-none focus:border-[#f89e35] focus:ring-1 focus:ring-[#f89e35] transition shadow-sm" placeholder="John Doe" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                                        <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 focus:outline-none focus:border-[#f89e35] focus:ring-1 focus:ring-[#f89e35] transition shadow-sm" placeholder="john@example.com" />
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number (Optional)</label>
                                        <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 focus:outline-none focus:border-[#f89e35] focus:ring-1 focus:ring-[#f89e35] transition shadow-sm" placeholder="+234 XXX XXXX" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Portfolio / Resume Link</label>
                                        <input type="url" required value={formData.resumeLink} onChange={e => setFormData({ ...formData, resumeLink: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 focus:outline-none focus:border-[#f89e35] focus:ring-1 focus:ring-[#f89e35] transition shadow-sm" placeholder="https://..." />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Cover Letter</label>
                                    <textarea required rows="5" value={formData.coverLetter} onChange={e => setFormData({ ...formData, coverLetter: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 focus:outline-none focus:border-[#f89e35] focus:ring-1 focus:ring-[#f89e35] transition resize-none shadow-sm" placeholder="Tell us why you are a great fit..."></textarea>
                                </div>
                                <button type="submit" disabled={submitting} className="w-full bg-[#f89e35] hover:bg-[#e08b2c] text-white font-black py-4 rounded-xl transition flex justify-center items-center gap-2 group disabled:opacity-50 shadow-md shadow-[#f89e35]/20 mt-4">
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Submit Application <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition" /></>}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
