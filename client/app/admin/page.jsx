'use client';
import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { LayoutDashboard, FileText, MessageSquare, Briefcase, LogOut, Loader2, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({ visitors: 0 });
    const [messages, setMessages] = useState([]);
    const [projects, setProjects] = useState([]);
    const [content, setContent] = useState({ hero: '', about: '' });
    const [loading, setLoading] = useState(true);

    // New Project Form
    const [newProject, setNewProject] = useState({ title: '', description: '', link: '', thumbnailUrl: '' });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'overview') {
                const res = await fetch('http://localhost:5000/api/stats');
                const data = await res.json();
                setStats({ visitors: data.count || 0 });
            } else if (activeTab === 'messages') {
                const res = await fetch('http://localhost:5000/api/contacts');
                setMessages(await res.json());
            } else if (activeTab === 'projects') {
                const res = await fetch('http://localhost:5000/api/projects');
                setProjects(await res.json());
            } else if (activeTab === 'content') {
                const res = await fetch('http://localhost:5000/api/content');
                setContent(await res.json());
            }
        } catch (err) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const deleteMessage = async (id) => {
        if (!confirm('Delete this message?')) return;
        try {
            await fetch(`http://localhost:5000/api/contacts/${id}`, { method: 'DELETE' });
            toast.success('Message deleted');
            fetchData();
        } catch (err) { toast.error('Error deleting message'); }
    };

    const deleteProject = async (id) => {
        if (!confirm('Delete this project?')) return;
        try {
            await fetch(`http://localhost:5000/api/projects/${id}`, { method: 'DELETE' });
            toast.success('Project deleted');
            fetchData();
        } catch (err) { toast.error('Error deleting project'); }
    };

    const addProject = async (e) => {
        e.preventDefault();
        try {
            await fetch('http://localhost:5000/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProject)
            });
            toast.success('Project added');
            setNewProject({ title: '', description: '', link: '', thumbnailUrl: '' });
            fetchData();
        } catch (err) { toast.error('Error adding project'); }
    };

    const saveContent = async (section, text) => {
        try {
            await fetch('http://localhost:5000/api/content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ section, text })
            });
            toast.success('Content updated');
        } catch (err) { toast.error('Error updating content'); }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-white selection:bg-[#f89e35] selection:text-white">
            <Toaster position="top-right" toastOptions={{ style: { background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0' } }} />

            {/* Sidebar */}
            <div className="w-72 bg-slate-50 border-r border-slate-200/60 p-6 flex flex-col justify-between shadow-[2px_0_15px_-3px_rgba(0,0,0,0.05)] z-10 relative">
                <div>
                    <div className="flex items-center gap-3 mb-10">
                        <span className="w-8 h-8 rounded-full bg-[#f89e35] flex items-center justify-center">
                            <span className="w-3 h-3 rounded-full bg-slate-50"></span>
                        </span>
                        <h2 className="text-xl font-black text-slate-900 tracking-wide">
                            LALA TECH <span className="text-slate-400 font-medium text-xs ml-1 bg-slate-200 px-2 py-1 rounded-full">ADMIN</span>
                        </h2>
                    </div>

                    <nav className="space-y-2">
                        {[
                            { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
                            { id: 'content', icon: FileText, label: 'Content Manager' },
                            { id: 'projects', icon: Briefcase, label: 'Ventures' },
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
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50 p-10 lg:p-14 relative">
                {loading && (
                    <div className="absolute top-10 right-10 z-50 bg-white p-3 rounded-full shadow-lg border border-slate-100">
                        <Loader2 className="w-6 h-6 animate-spin text-[#f89e35]" />
                    </div>
                )}

                <div className="max-w-6xl mx-auto">
                    {activeTab === 'overview' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h1 className="text-4xl font-black text-slate-900 mb-2">Welcome Back</h1>
                            <p className="text-slate-500 font-medium mb-10">Here's a quick look at your website's performance.</p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#f89e35]/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                                    <h3 className="text-slate-500 font-bold uppercase tracking-wider text-xs mb-3">Total Visitors</h3>
                                    <p className="text-5xl font-black text-slate-900">{stats.visitors}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'content' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
                            <h1 className="text-4xl font-black text-slate-900 mb-2">Content Manager</h1>
                            <p className="text-slate-500 font-medium mb-10">Update your website's copy directly from here.</p>

                            <div className="space-y-8">
                                <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm transition hover:shadow-md">
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Hero Section Subtitle</h3>
                                    <p className="text-sm text-slate-500 mb-4">This is the text that appears directly beneath the main heading on the home page.</p>
                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-5 text-slate-900 font-medium resize-none h-32 focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20 transition shadow-inner"
                                        value={content.hero || ''}
                                        onChange={(e) => setContent({ ...content, hero: e.target.value })}
                                        placeholder="Welcome text..."
                                    />
                                    <div className="mt-6 flex justify-end">
                                        <button onClick={() => saveContent('hero', content.hero)} className="bg-[#f89e35] hover:bg-[#e08b2c] px-8 py-3 rounded-xl text-white font-bold transition shadow-md shadow-[#f89e35]/20">Update Hero</button>
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm transition hover:shadow-md">
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">About Us Text</h3>
                                    <p className="text-sm text-slate-500 mb-4">This appears in the "Who We Are" section.</p>
                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-5 text-slate-900 font-medium resize-none h-40 focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20 transition shadow-inner"
                                        value={content.about || ''}
                                        onChange={(e) => setContent({ ...content, about: e.target.value })}
                                        placeholder="About us text..."
                                    />
                                    <div className="mt-6 flex justify-end">
                                        <button onClick={() => saveContent('about', content.about)} className="bg-[#f89e35] hover:bg-[#e08b2c] px-8 py-3 rounded-xl text-white font-bold transition shadow-md shadow-[#f89e35]/20">Update About</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'projects' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h1 className="text-4xl font-black text-slate-900 mb-2">Manage Ventures</h1>
                            <p className="text-slate-500 font-medium mb-10">Add, edit, or remove projects from your portfolio.</p>

                            <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm mb-10 max-w-2xl transition hover:shadow-md">
                                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <span className="bg-[#f89e35]/10 p-2 rounded-lg text-[#f89e35]"><Plus className="w-5 h-5" /></span>
                                    Add New Venture
                                </h3>
                                <form onSubmit={addProject} className="space-y-5">
                                    <input type="text" placeholder="Project Title" required value={newProject.title} onChange={e => setNewProject({ ...newProject, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 font-medium rounded-xl p-4 text-slate-900 focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20 transition" />
                                    <textarea placeholder="Small Description" required value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} className="w-full bg-slate-50 border border-slate-200 font-medium rounded-xl p-4 text-slate-900 focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20 transition resize-none" rows="3" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="url" placeholder="Website Link (https://...)" required value={newProject.link} onChange={e => setNewProject({ ...newProject, link: e.target.value })} className="w-full bg-slate-50 border border-slate-200 font-medium rounded-xl p-4 text-slate-900 focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20 transition" />
                                        <input type="url" placeholder="Thumbnail Image URL" required value={newProject.thumbnailUrl} onChange={e => setNewProject({ ...newProject, thumbnailUrl: e.target.value })} className="w-full bg-slate-50 border border-slate-200 font-medium rounded-xl p-4 text-slate-900 focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20 transition" />
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <button type="submit" className="bg-[#110f0e] hover:bg-slate-800 text-white font-bold px-8 py-3 rounded-xl transition shadow-md">Publish Project</button>
                                    </div>
                                </form>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {projects.map(p => (
                                    <div key={p._id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden relative group shadow-sm hover:shadow-xl hover:border-[#f89e35]/30 transition-all duration-300">
                                        <div className="h-48 bg-slate-100 relative">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            {p.thumbnailUrl ? <img src={p.thumbnailUrl} alt={p.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">NO THUMBNAIL</div>}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        </div>
                                        <div className="p-6">
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

                    {activeTab === 'messages' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
                            <h1 className="text-4xl font-black text-slate-900 mb-2">Contact Forms</h1>
                            <p className="text-slate-500 font-medium mb-10">Messages sent directly from your website's contact section.</p>

                            <div className="space-y-4">
                                {messages.map(msg => (
                                    <div key={msg._id} className="bg-white border border-slate-200 p-8 rounded-3xl relative flex justify-between gap-6 group shadow-sm hover:shadow-md transition">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h4 className="font-bold text-slate-900 text-lg">{msg.name}</h4>
                                                    <a href={`mailto:${msg.email}`} className="text-[#f89e35] font-semibold text-sm hover:underline">{msg.email}</a>
                                                </div>
                                                <span className="text-slate-400 font-medium text-xs bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">{new Date(msg.createdAt).toLocaleString()}</span>
                                            </div>
                                            <p className="text-slate-700 bg-slate-50 font-medium p-5 rounded-2xl border border-slate-100 leading-relaxed shadow-inner">{msg.message}</p>
                                        </div>
                                        <button onClick={() => deleteMessage(msg._id)} className="self-start text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-2 bg-white rounded-full hover:bg-red-50 shadow-sm border border-transparent hover:border-red-100">
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
                </div>
            </div>
        </div>
    );
}
