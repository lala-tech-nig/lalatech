'use client';
import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { LayoutDashboard, FileText, MessageSquare, Briefcase, LogOut, Loader2, Trash2, Plus, Users, Wrench, Menu, X, Megaphone, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import API_BASE_URL, { BASE_URL } from '@/lib/api';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({ visitors: 0 });
    const [messages, setMessages] = useState([]);
    const [projects, setProjects] = useState([]);
    const [content, setContent] = useState({ hero: '', about: '', career: '' });
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [serviceRequests, setServiceRequests] = useState([]);
    const [config, setConfig] = useState({ modalActive: false, modalType: 'image', modalMediaUrl: '', modalWhatsAppNumber: '' });
    const [analyticsData, setAnalyticsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // New Forms
    const [newProject, setNewProject] = useState({ title: '', description: '', link: '', thumbnailUrl: '', category: 'Web Development' });
    const [newJob, setNewJob] = useState({ title: '', description: '', type: 'Full-time', location: 'Remote' });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'overview') {
                const res = await fetch(`${API_BASE_URL}/stats`);
                const data = await res.json();
                setStats({ visitors: data.count || 0 });
            } else if (activeTab === 'messages') {
                const res = await fetch(`${API_BASE_URL}/contacts`);
                setMessages(await res.json());
            } else if (activeTab === 'projects') {
                const res = await fetch(`${API_BASE_URL}/projects`);
                setProjects(await res.json());
            } else if (activeTab === 'content') {
                const res = await fetch(`${API_BASE_URL}/content`);
                setContent(await res.json());
            } else if (activeTab === 'careers') {
                const jobsRes = await fetch(`${API_BASE_URL}/jobs`);
                const appsRes = await fetch(`${API_BASE_URL}/applications`);
                setJobs(await jobsRes.json());
                setApplications(await appsRes.json());
            } else if (activeTab === 'service-requests') {
                const res = await fetch(`${API_BASE_URL}/service-requests`);
                setServiceRequests(await res.json());
            } else if (activeTab === 'promotion') {
                const res = await fetch(`${API_BASE_URL}/config`);
                setConfig(await res.json());
            } else if (activeTab === 'analytics') {
                const res = await fetch(`${API_BASE_URL}/analytics`);
                setAnalyticsData(await res.json());
            }
        } catch (err) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const deleteServiceRequest = async (id) => {
        if (!confirm('Delete this service request?')) return;
        try {
            await fetch(`${API_BASE_URL}/service-requests/${id}`, { method: 'DELETE' });
            toast.success('Request deleted');
            fetchData();
        } catch (err) { toast.error('Error deleting request'); }
    };

    const deleteMessage = async (id) => {
        if (!confirm('Delete this message?')) return;
        try {
            await fetch(`${API_BASE_URL}/contacts/${id}`, { method: 'DELETE' });
            toast.success('Message deleted');
            fetchData();
        } catch (err) { toast.error('Error deleting message'); }
    };

    const deleteProject = async (id) => {
        if (!confirm('Delete this project?')) return;
        try {
            await fetch(`${API_BASE_URL}/projects/${id}`, { method: 'DELETE' });
            toast.success('Project deleted');
            fetchData();
        } catch (err) { toast.error('Error deleting project'); }
    };

    const addProject = async (e) => {
        e.preventDefault();
        try {
            await fetch(`${API_BASE_URL}/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProject)
            });
            toast.success('Project added');
            setNewProject({ title: '', description: '', link: '', thumbnailUrl: '' });
            fetchData();
        } catch (err) { toast.error('Error adding project'); }
    };

    const deleteJob = async (id) => {
        if (!confirm('Delete this job?')) return;
        try {
            await fetch(`${API_BASE_URL}/jobs/${id}`, { method: 'DELETE' });
            toast.success('Job deleted');
            fetchData();
        } catch (err) { toast.error('Error deleting job'); }
    };

    const addJob = async (e) => {
        e.preventDefault();
        try {
            await fetch(`${API_BASE_URL}/jobs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newJob)
            });
            toast.success('Job posted');
            setNewJob({ title: '', description: '', type: 'Full-time', location: 'Remote' });
            fetchData();
        } catch (err) { toast.error('Error posting job'); }
    };

    const deleteApplication = async (id) => {
        if (!confirm('Delete this application?')) return;
        try {
            await fetch(`${API_BASE_URL}/applications/${id}`, { method: 'DELETE' });
            toast.success('Application deleted');
            fetchData();
        } catch (err) { toast.error('Error deleting application'); }
    };

    const saveContent = async (section, text) => {
        try {
            await fetch(`${API_BASE_URL}/content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ section, text })
            });
            toast.success('Content updated');
        } catch (err) { toast.error('Error updating content'); }
    };

    const saveConfig = async () => {
        try {
            await fetch(`${API_BASE_URL}/config`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            toast.success('Settings updated');
        } catch (err) { toast.error('Error updating settings'); }
    };

    const handleFileUpload = async (e, callback) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${API_BASE_URL.replace('/api', '')}/api/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.url) {
                callback(`${API_BASE_URL.replace('/api', '')}${data.url}`);
                toast.success('File uploaded');
            }
        } catch (err) {
            toast.error('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        setIsSidebarOpen(false);
    }, [activeTab]);

    return (
        <div className="flex h-screen overflow-hidden bg-white selection:bg-[#f89e35] selection:text-white relative">
            <Toaster position="top-right" toastOptions={{ style: { background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0' } }} />

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 w-full z-40 bg-white border-b border-slate-100 p-5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#f89e35] flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-white"></span>
                    </span>
                    <span className="font-black text-slate-900 tracking-tight text-sm uppercase">LALA TECH</span>
                </div>
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 text-slate-500 hover:text-[#f89e35] transition"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Sidebar Desktop & Mobile */}
            <AnimatePresence>
                {(isSidebarOpen || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
                    <>
                        {/* Overlay for mobile */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
                        />

                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className={`
                                fixed lg:static inset-y-0 left-0 w-72 bg-slate-50 border-r border-slate-200/60 p-6 flex flex-col justify-between 
                                shadow-[2px_0_15px_-3px_rgba(0,0,0,0.05)] z-50 lg:z-10
                            `}
                        >
                            <div>
                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-full bg-[#f89e35] flex items-center justify-center">
                                            <span className="w-3 h-3 rounded-full bg-slate-50"></span>
                                        </span>
                                        <h2 className="text-xl font-black text-slate-900 tracking-wide">
                                            LALA TECH <span className="text-slate-400 font-medium text-[10px] ml-1 bg-slate-200 px-2 py-1 rounded-full">ADMIN</span>
                                        </h2>
                                    </div>
                                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <nav className="space-y-2">
                                    {[
                                        { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
                                        { id: 'analytics', icon: Activity, label: 'Full Analytics' },
                                        { id: 'content', icon: FileText, label: 'Content Manager' },
                                        { id: 'projects', icon: Briefcase, label: 'Ventures' },
                                        { id: 'promotion', icon: Megaphone, label: 'Promotion Modal' },
                                        { id: 'service-requests', icon: Wrench, label: 'Service Requests' },
                                        { id: 'careers', icon: Users, label: 'Careers' },
                                        { id: 'messages', icon: MessageSquare, label: 'Messages' },
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all duration-200 ${activeTab === tab.id
                                                ? 'bg-[#f89e35] text-white shadow-md shadow-[#f89e35]/20 transform scale-[1.02]'
                                                : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm'
                                                }`}
                                        >
                                            <tab.icon className="w-5 h-5" />
                                            {tab.label}
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            <div className="pb-4">
                                <Link href="/" className="flex items-center gap-3 font-semibold text-slate-500 hover:text-slate-900 px-4 py-3 rounded-xl hover:bg-white hover:shadow-sm transition-all">
                                    <LogOut className="w-5 h-5" /> Back to Website
                                </Link>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 md:p-10 lg:p-14 pt-24 lg:pt-14 relative w-full">
                {loading && (
                    <div className="absolute top-10 right-10 z-50 bg-white p-3 rounded-full shadow-lg border border-slate-100">
                        <Loader2 className="w-6 h-6 animate-spin text-[#f89e35]" />
                    </div>
                )}

                <div className="max-w-6xl mx-auto">
                    {activeTab === 'overview' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">Welcome Back</h1>
                            <p className="text-slate-500 font-medium mb-6 md:mb-10">Here's a quick look at your website's performance.</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#f89e35]/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                                    <h3 className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-3">Total Visitors</h3>
                                    <p className="text-5xl font-black text-slate-900">{stats.visitors}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'analytics' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">Full Analytics</h1>
                            <p className="text-slate-500 font-medium mb-6 md:mb-10">Monitor user activity, clicks, active IPs, pages, and time spent on your platform.</p>

                            <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                                            <th className="p-4">IP Address</th>
                                            <th className="p-4">Page</th>
                                            <th className="p-4">Time Spent</th>
                                            <th className="p-4">Clicks Recorded</th>
                                            <th className="p-4">Last Updated</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analyticsData.map((d) => (
                                            <tr key={d._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                                <td className="p-4 font-bold text-slate-900">{d.ip}</td>
                                                <td className="p-4 font-medium text-slate-600">{d.page}</td>
                                                <td className="p-4 font-medium text-slate-600">{d.timeSpent} sec</td>
                                                <td className="p-4 font-medium text-slate-600 cursor-help" title={JSON.stringify(d.clicks)}>{d.clicks ? d.clicks.length : 0} clicks</td>
                                                <td className="p-4 font-medium text-slate-500 text-sm whitespace-nowrap">{new Date(d.updatedAt).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {analyticsData.length === 0 && !loading && (
                                    <div className="text-center py-10 text-slate-500 font-medium">No analytics data collected yet.</div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'content' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">Content Manager</h1>
                            <p className="text-slate-500 font-medium mb-6 md:mb-10">Update your website's copy directly from here.</p>

                            <div className="space-y-6 md:space-y-8">
                                <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-sm transition hover:shadow-md">
                                    <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2">Hero Section Subtitle</h3>
                                    <p className="text-xs md:text-sm text-slate-500 mb-4">This is the text that appears directly beneath the main heading on the home page.</p>
                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 md:p-5 text-slate-900 font-medium resize-none h-32 focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20 transition shadow-inner"
                                        value={content.hero || ''}
                                        onChange={(e) => setContent({ ...content, hero: e.target.value })}
                                        placeholder="Welcome text..."
                                    />
                                    <div className="mt-6 flex justify-end">
                                        <button onClick={() => saveContent('hero', content.hero)} className="w-full md:w-auto bg-[#f89e35] hover:bg-[#e08b2c] px-8 py-3 rounded-xl text-white font-bold transition shadow-md shadow-[#f89e35]/20">Update Hero</button>
                                    </div>
                                </div>

                                <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-sm transition hover:shadow-md">
                                    <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2">Career Page Text</h3>
                                    <p className="text-xs md:text-sm text-slate-500 mb-4">This text introduces the open positions on the career impact page.</p>
                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 md:p-5 text-slate-900 font-medium resize-none h-40 focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20 transition shadow-inner"
                                        value={content.career || ''}
                                        onChange={(e) => setContent({ ...content, career: e.target.value })}
                                        placeholder="Career introductory text..."
                                    />
                                    <div className="mt-6 flex justify-end">
                                        <button onClick={() => saveContent('career', content.career)} className="w-full md:w-auto bg-[#f89e35] hover:bg-[#e08b2c] px-8 py-3 rounded-xl text-white font-bold transition shadow-md shadow-[#f89e35]/20">Update Career</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'projects' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">Manage Ventures</h1>
                            <p className="text-slate-500 font-medium mb-6 md:mb-10">Add, edit, or remove projects from your portfolio.</p>

                            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-sm mb-10 max-w-2xl transition hover:shadow-md">
                                <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <span className="bg-[#f89e35]/10 p-2 rounded-lg text-[#f89e35]"><Plus className="w-5 h-5" /></span>
                                    Add New Venture
                                </h3>
                                <form onSubmit={addProject} className="space-y-5">
                                    <input type="text" placeholder="Project Title" required value={newProject.title} onChange={e => setNewProject({ ...newProject, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 font-medium rounded-xl p-4 text-slate-900 focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20 transition border-box" />
                                    <textarea placeholder="Small Description" required value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} className="w-full bg-slate-50 border border-slate-200 font-medium rounded-xl p-4 text-slate-900 focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20 transition resize-none" rows="3" />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <select
                                            value={newProject.category}
                                            onChange={e => setNewProject({ ...newProject, category: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 font-medium rounded-xl p-4 text-slate-900 focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20 transition"
                                        >
                                            <option value="Web Development">Web Development</option>
                                            <option value="Mobile App">Mobile App</option>
                                            <option value="AI & ML">AI & ML</option>
                                            <option value="UI/UX Design">UI/UX Design</option>
                                            <option value="Digital Marketing">Digital Marketing</option>
                                        </select>
                                        <input type="url" placeholder="Website Link (https://...)" required value={newProject.link} onChange={e => setNewProject({ ...newProject, link: e.target.value })} className="w-full bg-slate-50 border border-slate-200 font-medium rounded-xl p-4 text-slate-900 focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20 transition" />
                                        <input type="url" placeholder="Thumbnail Image URL" required value={newProject.thumbnailUrl} onChange={e => setNewProject({ ...newProject, thumbnailUrl: e.target.value })} className="w-full bg-slate-50 border border-slate-200 font-medium rounded-xl p-4 text-slate-900 focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20 transition sm:col-span-2" />
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <button type="submit" className="w-full md:w-auto bg-[#110f0e] hover:bg-slate-800 text-white font-bold px-8 py-3 rounded-xl transition shadow-md">Publish Project</button>
                                    </div>
                                </form>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                                {projects.map(p => (
                                    <div key={p._id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden relative group shadow-sm hover:shadow-xl hover:border-[#f89e35]/30 transition-all duration-300">
                                        <div className="h-48 bg-slate-100 relative">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            {p.thumbnailUrl ? <img src={p.thumbnailUrl} alt={p.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">NO THUMBNAIL</div>}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        </div>
                                        <div className="p-6">
                                            <div className="text-[10px] font-black uppercase text-[#f89e35] tracking-widest mb-2 bg-[#f89e35]/10 w-fit px-2 py-0.5 rounded-full">{p.category || 'Web Development'}</div>
                                            <h4 className="font-black text-slate-900 text-lg mb-2">{p.title}</h4>
                                            <p className="text-slate-500 font-medium text-sm line-clamp-2 mb-4">{p.description}</p>
                                            <a href={p.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-[#f89e35] font-bold text-sm hover:text-[#e08b2c]">Visit Site &rarr;</a>
                                        </div>
                                        <button onClick={() => deleteProject(p._id)} className="absolute top-4 right-4 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg transform translate-y-2 group-hover:translate-y-0">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {projects.length === 0 && !loading && (
                                    <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-slate-200 border-dashed">
                                        <p className="text-slate-500 font-medium">Your portfolio is currently empty.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'careers' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">Career Management</h1>
                            <p className="text-slate-500 font-medium mb-6 md:mb-10">Post new job openings and manage candidate applications.</p>

                            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-sm mb-10 max-w-2xl transition hover:shadow-md">
                                <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <span className="bg-[#f89e35]/10 p-2 rounded-lg text-[#f89e35]"><Plus className="w-5 h-5" /></span>
                                    Post New Job
                                </h3>
                                <form onSubmit={addJob} className="space-y-5">
                                    <input type="text" placeholder="Job Title" required value={newJob.title} onChange={e => setNewJob({ ...newJob, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 font-medium rounded-xl p-4 text-slate-900 focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20 transition" />
                                    <textarea placeholder="Job Description & Requirements" required value={newJob.description} onChange={e => setNewJob({ ...newJob, description: e.target.value })} className="w-full bg-slate-50 border border-slate-200 font-medium rounded-xl p-4 text-slate-900 focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20 transition resize-none" rows="4" />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <select value={newJob.type} onChange={e => setNewJob({ ...newJob, type: e.target.value })} className="w-full bg-slate-50 border border-slate-200 font-medium rounded-xl p-4 text-slate-900 focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20 transition">
                                            <option value="Full-time">Full-time</option>
                                            <option value="Part-time">Part-time</option>
                                            <option value="Contract">Contract</option>
                                            <option value="Internship">Internship</option>
                                        </select>
                                        <input type="text" placeholder="Location (e.g. Remote, Lagos)" required value={newJob.location} onChange={e => setNewJob({ ...newJob, location: e.target.value })} className="w-full bg-slate-50 border border-slate-200 font-medium rounded-xl p-4 text-slate-900 focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20 transition" />
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <button type="submit" className="w-full md:w-auto bg-[#110f0e] hover:bg-slate-800 text-white font-bold px-8 py-3 rounded-xl transition shadow-md">Post Job</button>
                                    </div>
                                </form>
                            </div>

                            <div className="mb-14">
                                <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-6">Active Jobs</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {jobs.map(job => (
                                        <div key={job._id} className="bg-white border border-slate-200 p-6 rounded-3xl relative group shadow-sm hover:shadow-md transition">
                                            <div className="mb-4">
                                                <h4 className="font-bold text-slate-900 text-lg mb-1">{job.title}</h4>
                                                <div className="flex gap-2 text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                                    <span className="bg-slate-100 px-2 py-1 rounded-md">{job.type}</span>
                                                    <span className="bg-slate-100 px-2 py-1 rounded-md">{job.location}</span>
                                                </div>
                                            </div>
                                            <p className="text-slate-600 font-medium text-sm line-clamp-3 mb-4">{job.description}</p>
                                            <button onClick={() => deleteJob(job._id)} className="absolute top-4 right-4 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 p-2.5 rounded-full opacity-0 lg:group-hover:opacity-100 transition shadow border border-slate-100 hover:border-red-100">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {jobs.length === 0 && !loading && (
                                        <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-500 font-medium text-sm md:text-base">
                                            No active jobs posted.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-6">Submitted Applications</h3>
                                <div className="space-y-4 max-w-4xl">
                                    {applications.map(app => (
                                        <div key={app._id} className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl relative flex flex-col md:flex-row justify-between gap-6 group shadow-sm hover:shadow-md transition">
                                            <div className="flex-1">
                                                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
                                                    <h4 className="font-bold text-slate-900 text-lg">{app.name}</h4>
                                                    <span className="hidden md:block text-slate-300">•</span>
                                                    <span className="text-[#f89e35] font-bold text-xs md:text-sm bg-[#f89e35]/10 px-3 py-1 rounded-full w-fit">Applied for: {app.jobId?.title || 'Unknown Job'}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-4 text-xs md:text-sm font-semibold text-slate-500 mb-4">
                                                    <a href={`mailto:${app.email}`} className="hover:text-[#f89e35]">{app.email}</a>
                                                    {app.phone && <span>{app.phone}</span>}
                                                    {app.resumeLink && <a href={app.resumeLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Portfolio/Resume</a>}
                                                </div>
                                                <div className="bg-slate-50 p-4 md:p-5 rounded-2xl border border-slate-100 shadow-inner">
                                                    <p className="text-slate-700 font-medium text-sm whitespace-pre-wrap">{app.coverLetter}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => deleteApplication(app._id)} className="self-end md:self-start text-slate-300 hover:text-red-500 opacity-0 lg:group-hover:opacity-100 transition p-2 bg-white rounded-full hover:bg-red-50 shadow-sm border border-transparent hover:border-red-100">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                    {applications.length === 0 && !loading && (
                                        <div className="py-12 bg-white rounded-3xl border border-slate-200 border-dashed text-center">
                                            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                                <Users className="w-8 h-8" />
                                            </div>
                                            <p className="text-slate-500 font-medium">No applications have been submitted yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'service-requests' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">Service Requests</h1>
                            <p className="text-slate-500 font-medium mb-6 md:mb-10">Manage customized service inquiries from your customers.</p>

                            <div className="space-y-6">
                                {serviceRequests.map(req => (
                                    <div key={req._id} className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl relative flex flex-col md:flex-row justify-between gap-6 group shadow-sm hover:shadow-md transition">
                                        <div className="flex-1">
                                            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
                                                <h4 className="font-bold text-slate-900 text-xl">{req.customerName}</h4>
                                                <span className="hidden md:block text-slate-300">•</span>
                                                <span className="text-[#f89e35] font-black text-xs md:text-sm uppercase tracking-wider bg-[#f89e35]/10 px-4 py-1.5 rounded-full w-fit">{req.serviceName}</span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-4 md:gap-6 text-xs md:text-sm font-bold text-slate-500 mb-6">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-400">Email:</span>
                                                    <a href={`mailto:${req.email}`} className="text-slate-900 hover:text-[#f89e35]">{req.email}</a>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-400">Phone:</span>
                                                    <span className="text-slate-900">{req.phone}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-400">Date:</span>
                                                    <span className="text-slate-900">{new Date(req.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 p-4 md:p-6 rounded-[24px] border border-slate-100 shadow-inner grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                                                {Object.entries(req.details || {}).map(([key, value]) => (
                                                    <div key={key} className="space-y-1">
                                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                        <p className="text-slate-900 font-bold text-sm leading-relaxed">{value}</p>
                                                    </div>
                                                ))}
                                                {Object.keys(req.details || {}).length === 0 && (
                                                    <p className="text-slate-400 text-sm font-medium italic">No additional details provided.</p>
                                                )}
                                            </div>
                                        </div>
                                        <button onClick={() => deleteServiceRequest(req._id)} className="self-end md:self-start text-slate-300 hover:text-red-500 opacity-0 lg:group-hover:opacity-100 transition p-2 md:p-3 bg-white rounded-full hover:bg-red-50 shadow-sm border border-transparent hover:border-red-100">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                                {serviceRequests.length === 0 && !loading && (
                                    <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 border-dashed">
                                        <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                            <Wrench className="w-8 h-8" />
                                        </div>
                                        <p className="text-slate-500 font-medium">No service requests found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'messages' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">Contact Forms</h1>
                            <p className="text-slate-500 font-medium mb-6 md:mb-10">Messages sent directly from your website's contact section.</p>

                            <div className="space-y-4 md:space-y-6">
                                {messages.map(msg => (
                                    <div key={msg._id} className="bg-white border border-slate-200 p-6 md:p-8 rounded-3xl relative flex flex-col md:flex-row justify-between gap-6 group shadow-sm hover:shadow-md transition">
                                        <div className="flex-1">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
                                                <div>
                                                    <h4 className="font-bold text-slate-900 text-lg">{msg.name}</h4>
                                                    <a href={`mailto:${msg.email}`} className="text-[#f89e35] font-semibold text-sm hover:underline">{msg.email}</a>
                                                </div>
                                                <span className="text-slate-400 font-medium text-[10px] md:text-xs bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 w-fit">{new Date(msg.createdAt).toLocaleString()}</span>
                                            </div>
                                            <p className="text-slate-700 bg-slate-50 font-medium p-4 md:p-5 rounded-2xl border border-slate-100 text-sm md:text-base leading-relaxed shadow-inner">{msg.message}</p>
                                        </div>
                                        <button onClick={() => deleteMessage(msg._id)} className="self-end md:self-start text-slate-300 hover:text-red-500 opacity-0 lg:group-hover:opacity-100 transition p-2 bg-white rounded-full hover:bg-red-50 shadow-sm border border-transparent hover:border-red-100">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                                {messages.length === 0 && !loading && (
                                    <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 border-dashed">
                                        <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                            <MessageSquare className="w-8 h-8" />
                                        </div>
                                        <p className="text-slate-500 font-medium">Inbox is empty. No messages yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'promotion' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">Promotion Modal</h1>
                            <p className="text-slate-500 font-medium mb-6 md:mb-10">Configure the promotional popup that appearing on website load.</p>

                            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-sm transition hover:shadow-md space-y-8">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div>
                                        <h3 className="font-bold text-slate-900">Modal Activity</h3>
                                        <p className="text-xs text-slate-500">Enable or disable the popup globally.</p>
                                    </div>
                                    <button
                                        onClick={() => setConfig({ ...config, modalActive: !config.modalActive })}
                                        className={`w-14 h-8 rounded-full transition-all relative ${config.modalActive ? 'bg-[#f89e35]' : 'bg-slate-300'}`}
                                    >
                                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${config.modalActive ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                        Media Type
                                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-400 font-black uppercase">Required</span>
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {['image', 'video'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setConfig({ ...config, modalType: type })}
                                                className={`py-4 rounded-xl font-bold border-2 transition-all capitalize ${config.modalType === type ? 'border-[#f89e35] bg-[#f89e35]/5 text-[#f89e35]' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold text-slate-900 flex items-center justify-between">
                                        Media Content
                                        {uploading && <Loader2 className="w-4 h-4 animate-spin text-[#f89e35]" />}
                                    </h3>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="url"
                                                value={config.modalMediaUrl || ''}
                                                onChange={e => setConfig({ ...config, modalMediaUrl: e.target.value })}
                                                placeholder="Paste media URL or upload below..."
                                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 font-medium focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20 transition"
                                            />
                                        </div>
                                        <div className="relative group">
                                            <input
                                                type="file"
                                                accept={config.modalType === 'image' ? "image/*" : "video/*"}
                                                onChange={(e) => handleFileUpload(e, (url) => setConfig({ ...config, modalMediaUrl: url }))}
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center gap-3 text-slate-400 font-bold group-hover:border-[#f89e35] group-hover:text-[#f89e35] transition-all bg-white">
                                                <Plus className="w-5 h-5" />
                                                Click to Upload {config.modalType === 'image' ? 'Image' : 'Video'}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium italic">Supports JPG, PNG, and MP4. Max size 50MB.</p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold text-slate-900">WhatsApp Redirection</h3>
                                    <input
                                        type="text"
                                        value={config.modalWhatsAppNumber || ''}
                                        onChange={e => setConfig({ ...config, modalWhatsAppNumber: e.target.value })}
                                        placeholder="e.g. 2348123456789"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 font-medium focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20 transition"
                                    />
                                    <p className="text-[10px] text-slate-400 font-medium italic">Enter the number without '+'. User will be redirected on click.</p>
                                </div>

                                <div className="pt-4">
                                    <button
                                        onClick={saveConfig}
                                        className="w-full bg-[#110f0e] hover:bg-slate-800 text-white font-black py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2 group"
                                    >
                                        Save Changes
                                        <div className="w-1.5 h-1.5 bg-[#f89e35] rounded-full group-hover:scale-150 transition-transform"></div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
