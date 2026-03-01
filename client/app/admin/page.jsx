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
        <div className="flex h-screen overflow-hidden">
            <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#fff' } }} />

            {/* Sidebar */}
            <div className="w-64 bg-slate-900 border-r border-white/5 p-6 flex flex-col justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-8 tracking-tighter">LALA TECH <span className="text-primary text-sm font-normal">ADMIN</span></h2>
                    <nav className="space-y-2">
                        {[
                            { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
                            { id: 'content', icon: FileText, label: 'CMS Manager' },
                            { id: 'projects', icon: Briefcase, label: 'Projects' },
                            { id: 'messages', icon: MessageSquare, label: 'Messages' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === tab.id ? 'bg-primary text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                            >
                                <tab.icon className="w-5 h-5" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
                <Link href="/" className="flex items-center gap-3 text-slate-400 hover:text-white px-4 py-3 rounded-xl hover:bg-white/5 transition">
                    <LogOut className="w-5 h-5" /> Back to Site
                </Link>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-slate-950 overflow-y-auto p-10 relative">
                {loading && <div className="absolute top-10 right-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}

                {activeTab === 'overview' && (
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-8">Dashboard Overview</h1>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-slate-900 p-6 rounded-2xl border border-white/5">
                                <h3 className="text-slate-400 font-medium mb-2">Total Visitors</h3>
                                <p className="text-4xl font-bold text-white">{stats.visitors}</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'content' && (
                    <div className="max-w-3xl">
                        <h1 className="text-3xl font-bold text-white mb-8">Content Manager</h1>
                        <div className="space-y-8">
                            <div className="bg-slate-900 p-6 rounded-2xl border border-white/5">
                                <h3 className="text-xl font-semibold text-white mb-4">Hero Section Text</h3>
                                <textarea
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white resize-none h-32 focus:outline-none focus:border-primary transition"
                                    value={content.hero || ''}
                                    onChange={(e) => setContent({ ...content, hero: e.target.value })}
                                    placeholder="Welcome text..."
                                />
                                <button onClick={() => saveContent('hero', content.hero)} className="mt-4 bg-primary hover:bg-blue-600 px-6 py-2 rounded-lg text-white font-medium transition">Save Hero</button>
                            </div>

                            <div className="bg-slate-900 p-6 rounded-2xl border border-white/5">
                                <h3 className="text-xl font-semibold text-white mb-4">About Us Text</h3>
                                <textarea
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-white resize-none h-40 focus:outline-none focus:border-primary transition"
                                    value={content.about || ''}
                                    onChange={(e) => setContent({ ...content, about: e.target.value })}
                                    placeholder="About us text..."
                                />
                                <button onClick={() => saveContent('about', content.about)} className="mt-4 bg-primary hover:bg-blue-600 px-6 py-2 rounded-lg text-white font-medium transition">Save About</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'projects' && (
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-8">Manage Projects</h1>
                        <div className="bg-slate-900 p-6 rounded-2xl border border-white/5 mb-8 max-w-2xl">
                            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><Plus className="w-5 h-5" /> Add New Project</h3>
                            <form onSubmit={addProject} className="space-y-4">
                                <input type="text" placeholder="Project Title" required value={newProject.title} onChange={e => setNewProject({ ...newProject, title: e.target.value })} className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none" />
                                <textarea placeholder="Small Description" required value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none resize-none" rows="2" />
                                <input type="url" placeholder="Website Link (e.g. https://example.com)" required value={newProject.link} onChange={e => setNewProject({ ...newProject, link: e.target.value })} className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none" />
                                <input type="url" placeholder="Thumbnail Image URL" required value={newProject.thumbnailUrl} onChange={e => setNewProject({ ...newProject, thumbnailUrl: e.target.value })} className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white focus:border-primary outline-none" />
                                <button type="submit" className="bg-green-600 hover:bg-green-500 text-white font-medium px-6 py-2 rounded-lg transition">Add Project</button>
                            </form>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.map(p => (
                                <div key={p._id} className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden relative group">
                                    <div className="h-40 bg-slate-800">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        {p.thumbnailUrl && <img src={p.thumbnailUrl} alt={p.title} className="w-full h-full object-cover opacity-60" />}
                                    </div>
                                    <div className="p-5">
                                        <h4 className="font-semibold text-white mb-1">{p.title}</h4>
                                        <p className="text-slate-400 text-sm line-clamp-2 mb-4">{p.description}</p>
                                        <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">View Site</a>
                                    </div>
                                    <button onClick={() => deleteProject(p._id)} className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition shadow-lg">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {projects.length === 0 && !loading && <p className="text-slate-400">No projects added yet.</p>}
                        </div>
                    </div>
                )}

                {activeTab === 'messages' && (
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-white mb-8">Contact Submissions</h1>
                        <div className="space-y-4">
                            {messages.map(msg => (
                                <div key={msg._id} className="bg-slate-900 border border-white/5 p-6 rounded-2xl relative flex justify-between gap-4 group">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="font-semibold text-white">{msg.name}</h4>
                                            <span className="text-slate-500 text-sm">{new Date(msg.createdAt).toLocaleString()}</span>
                                        </div>
                                        <a href={`mailto:${msg.email}`} className="text-primary text-sm hover:underline block mb-3">{msg.email}</a>
                                        <p className="text-slate-300 bg-slate-950 p-4 rounded-xl border border-white/5">{msg.message}</p>
                                    </div>
                                    <button onClick={() => deleteMessage(msg._id)} className="self-start text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-2">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                            {messages.length === 0 && !loading && <div className="text-slate-400 p-8 text-center bg-slate-900 rounded-2xl">No messages yet.</div>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
