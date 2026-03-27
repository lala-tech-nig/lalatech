'use client';
import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { LayoutDashboard, FileText, MessageSquare, Briefcase, LogOut, Loader2, Trash2, Plus, Users, Wrench, Menu, X, Megaphone, Activity, ShoppingBag, Youtube, Rss, Image as ImageIcon, TrendingUp, Tag, Reply, Send, Eye, Heart, Share2, Box, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import API_BASE_URL, { BASE_URL } from '@/lib/api';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

// --- Data Aggregation Helpers ---
const getDailyVisits = (data) => {
    const daily = {};
    const last14Days = [];
    for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        daily[dateStr] = 0;
        last14Days.push(dateStr);
    }

    data.forEach(item => {
        const dateStr = new Date(item.createdAt).toISOString().split('T')[0];
        if (daily[dateStr] !== undefined) {
            daily[dateStr]++;
        }
    });

    return last14Days.map(date => ({
        date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        visits: daily[date]
    }));
};

const getTopPages = (data) => {
    const pages = {};
    data.forEach(item => {
        pages[item.page] = (pages[item.page] || 0) + 1;
    });
    return Object.entries(pages)
        .map(([name, visits]) => ({ name: name.split('/').pop() || 'Home', visits }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 6);
};

const getIPStats = (data) => {
    const ips = {};
    data.forEach(item => {
        if (!ips[item.ip]) {
            ips[item.ip] = {
                ip: item.ip,
                visits: 0,
                pages: new Set(),
                totalTime: 0,
                lastSeen: item.updatedAt
            };
        }
        ips[item.ip].visits++;
        ips[item.ip].pages.add(item.page);
        ips[item.ip].totalTime += item.timeSpent || 0;
        if (new Date(item.updatedAt) > new Date(ips[item.ip].lastSeen)) {
            ips[item.ip].lastSeen = item.updatedAt;
        }
    });

    return Object.values(ips).map(stat => ({
        ...stat,
        uniquePages: stat.pages.size,
        avgTime: Math.round(stat.totalTime / stat.visits),
        pages: Array.from(stat.pages)
    })).sort((a, b) => b.visits - a.visits);
};

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

    const [shopProducts, setShopProducts] = useState([]);
    const [courses, setCourses] = useState([]);
    const [feedPosts, setFeedPosts] = useState([]);
    const [newsArticles, setNewsArticles] = useState([]);
    const [newProduct, setNewProduct] = useState({ title: '', description: '', price: '', image: '', category: 'General', youtubeUrl: '' });
    const [newCourse, setNewCourse] = useState({ title: '', description: '', videoUrl: '', thumbnailUrl: '', introText: '', category: 'General' });
    const [newFeedPost, setNewFeedPost] = useState({ content: '', image: '' });
    const [newArticle, setNewArticle] = useState({ title: '', content: '', excerpt: '', category: 'Technology', tags: '', coverImage: '', author: 'Lala Tech' });
    const [articleCoverPreview, setArticleCoverPreview] = useState('');
    const [feedComments, setFeedComments] = useState({});
    const [adminReplies, setAdminReplies] = useState({});
    const [activeFeedComments, setActiveFeedComments] = useState(null);

    // Dynamic Categories State
    const [categories, setCategories] = useState({
        projects: [],
        news: [],
        courses: [],
        shop: [],
        threed: []
    });

    // 3D Posts
    const [threeDPosts, setThreeDPosts] = useState([]);
    const [newThreeDPost, setNewThreeDPost] = useState({ title: '', story: '', sketchfabUrl: '', thumbnail: '', category: 'General' });
    const [threeDThumbPreview, setThreeDThumbPreview] = useState('');

    // Upload Previews
    const [productImagePreview, setProductImagePreview] = useState('');
    const [courseThumbPreview, setCourseThumbPreview] = useState('');
    const [feedImagePreview, setFeedImagePreview] = useState('');
    const [promoMediaPreview, setPromoMediaPreview] = useState('');

    // --- Authentication State ---
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [authLoading, setAuthLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (token) setIsAuthenticated(true);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        try {
            const res = await window.fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                localStorage.setItem('adminToken', data.token);
                setIsAuthenticated(true);
                setLoginError('');
            } else {
                setLoginError(data.message || 'Invalid credentials');
            }
        } catch (error) {
            setLoginError('Error connecting to server');
        } finally {
            setAuthLoading(false);
        }
    };

    const fetch = async (url, options = {}) => {
        const token = localStorage.getItem('adminToken');
        const headers = { ...options.headers };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const response = await window.fetch(url, { ...options, headers });
        if (response.status === 401 || response.status === 403) {
            setIsAuthenticated(false);
            localStorage.removeItem('adminToken');
            toast.error('Session expired or unauthorized. Please login again.');
        }
        return response;
    };
    // -------------------------

    useEffect(() => {
        if (newThreeDPost.sketchfabUrl && newThreeDPost.sketchfabUrl.includes('sketchfab.com')) {
            const fetchThumb = async () => {
                try {
                    const res = await fetch(`https://sketchfab.com/oembed?url=${newThreeDPost.sketchfabUrl}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.thumbnail_url) {
                            setThreeDThumbPreview(data.thumbnail_url);
                            setNewThreeDPost(prev => ({ ...prev, thumbnail: data.thumbnail_url }));
                        }
                    }
                } catch (err) {
                    console.error('Could not auto-fetch sketchfab thumbnail', err);
                }
            };
            const timer = setTimeout(fetchThumb, 600);
            return () => clearTimeout(timer);
        }
    }, [newThreeDPost.sketchfabUrl]);

    const fetchCategories = async (type) => {
        try {
            // Map the type to the correct endpoint
            const endpointMap = {
                projects: 'projects',
                news: 'news',
                courses: 'courses',
                shop: 'products',
                threed: '3d'
            };
            const endpoint = endpointMap[type];
            if (!endpoint) return;

            const res = await fetch(`${API_BASE_URL}/${endpoint}/categories`);
            if (res.ok) {
                const data = await res.json();
                setCategories(prev => ({ ...prev, [type]: data }));
            }
        } catch (err) {
            console.error(`Failed to fetch categories for ${type}`, err);
        }
    };

    useEffect(() => {
        fetchData();
        // Fetch categories when tab changes if relevant
        if (['projects', 'news', 'courses', 'shop', 'threed'].includes(activeTab)) {
            fetchCategories(activeTab);
        }
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
            } else if (activeTab === 'shop') {
                const res = await fetch(`${API_BASE_URL}/products`);
                if (res.ok) setShopProducts(await res.json());
            } else if (activeTab === 'courses') {
                const res = await fetch(`${API_BASE_URL}/courses`);
                if (res.ok) setCourses(await res.json());
            } else if (activeTab === 'feed') {
                const res = await fetch(`${API_BASE_URL}/posts`);
                if (res.ok) setFeedPosts(await res.json());
            } else if (activeTab === 'news') {
                const res = await fetch(`${API_BASE_URL}/news/admin/all`);
                if (res.ok) setNewsArticles(await res.json());
            } else if (activeTab === 'threed') {
                const res = await fetch(`${API_BASE_URL}/3d`);
                if (res.ok) setThreeDPosts(await res.json());
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

    const deleteProduct = async (id) => {
        if (!confirm('Delete this product?')) return;
        try { await fetch(`${API_BASE_URL}/products/${id}`, { method: 'DELETE' }); toast.success('Product deleted'); fetchData(); } catch (err) { toast.error('Error deleting product'); }
    };
    const addProduct = async (e) => {
        e.preventDefault();
        try { await fetch(`${API_BASE_URL}/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newProduct) }); toast.success('Product added'); setNewProduct({ title: '', description: '', price: '', image: '', category: 'General', youtubeUrl: '' }); setProductImagePreview(''); fetchData(); } catch (err) { toast.error('Error adding product'); }
    };

    const deleteCourse = async (id) => {
        if (!confirm('Delete this course?')) return;
        try { await fetch(`${API_BASE_URL}/courses/${id}`, { method: 'DELETE' }); toast.success('Course deleted'); fetchData(); } catch (err) { toast.error('Error deleting course'); }
    };
    const addCourse = async (e) => {
        e.preventDefault();
        try { await fetch(`${API_BASE_URL}/courses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCourse) }); toast.success('Course added'); setNewCourse({ title: '', description: '', videoUrl: '', thumbnailUrl: '', introText: '', category: 'General' }); setCourseThumbPreview(''); fetchData(); } catch (err) { toast.error('Error adding course'); }
    };

    const deleteFeedPost = async (id) => {
        if (!confirm('Delete this feed post?')) return;
        try { await fetch(`${API_BASE_URL}/posts/${id}`, { method: 'DELETE' }); toast.success('Post deleted'); fetchData(); } catch (err) { toast.error('Error deleting post'); }
    };
    const addFeedPost = async (e) => {
        e.preventDefault();
        try { await fetch(`${API_BASE_URL}/posts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newFeedPost) }); toast.success('Post added'); setNewFeedPost({ content: '', image: '' }); setFeedImagePreview(''); fetchData(); } catch (err) { toast.error('Error adding post'); }
    };

    // News
    const addArticle = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...newArticle, tags: newArticle.tags.split(',').map(t => t.trim()).filter(Boolean) };
            await fetch(`${API_BASE_URL}/news`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            toast.success('Article published');
            setNewArticle({ title: '', content: '', excerpt: '', category: 'Technology', tags: '', coverImage: '', author: 'Lala Tech' });
            setArticleCoverPreview('');
            fetchData();
        } catch (err) { toast.error('Error publishing article'); }
    };
    const deleteArticle = async (id) => {
        if (!confirm('Delete this article?')) return;
        try { await fetch(`${API_BASE_URL}/news/${id}`, { method: 'DELETE' }); toast.success('Article deleted'); setNewsArticles(prev => prev.filter(a => a._id !== id)); } catch (err) { toast.error('Error deleting article'); }
    };

    // 3D Posts
    const deleteThreeDPost = async (id) => {
        if (!confirm('Delete this 3D post?')) return;
        try { await fetch(`${API_BASE_URL}/3d/${id}`, { method: 'DELETE' }); toast.success('3D Post deleted'); fetchData(); } catch (err) { toast.error('Error deleting 3D post'); }
    };
    const addThreeDPost = async (e) => {
        e.preventDefault();
        try { 
            await fetch(`${API_BASE_URL}/3d`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newThreeDPost) }); 
            toast.success('3D Post published'); 
            setNewThreeDPost({ title: '', story: '', sketchfabUrl: '', thumbnail: '' }); 
            setThreeDThumbPreview(''); 
            fetchData(); 
        } catch (err) { toast.error('Error publishing 3D post'); }
    };

    // Feed comment admin reply
    const loadFeedComments = async (postId) => {
        if (activeFeedComments === postId) { setActiveFeedComments(null); return; }
        try {
            const res = await fetch(`${API_BASE_URL}/comments/${postId}`);
            if (res.ok) {
                const data = await res.json();
                setFeedComments(prev => ({ ...prev, [postId]: data }));
            }
        } catch (e) {}
        setActiveFeedComments(postId);
    };

    const setNewsOfDay = async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/news/admin/set-news-of-day/${id}`, { method: 'POST' });
            if (res.ok) {
                toast.success('News of the Day updated');
                // Refresh news list to reflect changes
                const newsRes = await fetch(`${API_BASE_URL}/news/admin/all`);
                if (newsRes.ok) setNewsArticles(await newsRes.json());
            }
        } catch (e) { toast.error('Failed to set News of the Day'); }
    };
    const sendAdminReply = async (commentId, postId, postType = 'post') => {
        const text = adminReplies[commentId]?.trim();
        if (!text) return;
        try {
            const res = await fetch(`${API_BASE_URL}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    postId, 
                    postType, 
                    parentId: commentId,
                    author: 'Lala Tech Admin', 
                    content: text, 
                    isAdmin: true 
                }),
            });
            if (res.ok) {
                const newReply = await res.json();
                setFeedComments(prev => ({ ...prev, [postId]: [...(prev[postId] || []), newReply] }));
                setAdminReplies(prev => ({ ...prev, [commentId]: '' }));
                toast.success('Reply sent');
            }
        } catch (e) { toast.error('Failed to reply'); }
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

    const handleFileUpload = async (e, callback, setPreview) => {
        const file = e.target.files[0];
        if (!file) return;

        // Show local blob preview immediately before upload completes
        if (setPreview) {
            const localUrl = URL.createObjectURL(file);
            setPreview(localUrl);
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const uploadEndpoint = `${API_BASE_URL.replace('/api', '')}/api/upload`;
            const res = await fetch(uploadEndpoint, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            // data.url is already the full Cloudinary https:// URL — do NOT prepend anything
            if (data.url) {
                callback(data.url);
                if (setPreview) setPreview(data.url);
                toast.success('Uploaded to Cloudinary ✓');
            } else {
                toast.error('Upload failed: no URL returned');
            }
        } catch (err) {
            console.error('Upload error:', err);
            toast.error('Upload failed — is the server running?');
        } finally {
            setUploading(false);
        }
    };

    // Extract YouTube video ID and auto-set thumbnail
    const handleVideoUrlChange = (url) => {
        setNewCourse(prev => ({ ...prev, videoUrl: url }));
        const urlMatch = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
        if (urlMatch) {
            const videoId = urlMatch[1];
            const autoThumb = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            if (!newCourse.thumbnailUrl) {
                setCourseThumbPreview(autoThumb);
                // Also set it in newCourse because courses needs it
                setNewCourse(prev => ({ ...prev, thumbnailUrl: autoThumb }));
            }
        }
    };

    const handleProductVideoUrlChange = (url) => {
        setNewProduct(prev => ({ ...prev, youtubeUrl: url }));
        const urlMatch = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
        if (urlMatch) {
            const videoId = urlMatch[1];
            const autoThumb = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            if (!productImagePreview) {
                setProductImagePreview(autoThumb);
                setNewProduct(prev => ({ ...prev, image: autoThumb }));
            }
        }
    };

    useEffect(() => {
        setIsSidebarOpen(false);
    }, [activeTab]);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#f89e35]/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-slate-900/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4"></div>
                </div>

                <div className="relative z-10 w-full max-w-[420px] p-8">
                    <div className="bg-white rounded-[32px] p-10 shadow-2xl border border-slate-100 relative overflow-hidden text-center">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#f89e35] to-[#f56e00] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#f89e35]/30">
                            <span className="text-white font-black text-2xl tracking-tighter">LT</span>
                        </div>
                        
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Admin Portal</h2>
                        <p className="text-slate-500 font-medium mb-8 text-sm">Sign in to manage Lala Tech Platform</p>

                        {loginError && (
                            <div className="bg-red-50 text-red-500 text-sm font-bold p-3 rounded-xl mb-6 border border-red-100 animate-in fade-in slide-in-from-top-2">
                                {loginError}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="relative">
                                <input
                                    type="password"
                                    placeholder="Enter Admin Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-5 py-4 rounded-2xl font-medium focus:outline-none focus:border-[#f89e35] focus:ring-4 focus:ring-[#f89e35]/10 shadow-inner transition-all"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={authLoading}
                                className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white py-4 rounded-2xl font-black text-sm tracking-wide transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
                            >
                                {authLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#f89e35]" /> : 'SECURE LOGIN ➔'}
                            </button>
                        </form>
                    </div>
                    
                    <div className="text-center mt-8">
                        <Link href="/" className="text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors py-2 px-4 rounded-full hover:bg-slate-100 inline-flex items-center gap-2">
                            ← Back to Website
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const logout = () => {
        localStorage.removeItem('adminToken');
        setIsAuthenticated(false);
    };

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
                                fixed lg:static inset-y-0 left-0 w-72 bg-slate-50 border-r border-slate-200/60 flex flex-col
                                shadow-[2px_0_15px_-3px_rgba(0,0,0,0.05)] z-50 lg:z-10
                            `}
                        >
                            {/* Sidebar Header - Sticky */}
                            <div className="p-6 pb-4 flex-shrink-0">
                                <div className="flex items-center justify-between mb-6">
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
                            </div>

                            {/* Scrollable Nav */}
                            <div className="flex-1 overflow-y-auto px-6 pb-4">
                                <nav className="space-y-2">
                                    {[
                                        { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
                                        { id: 'analytics', icon: Activity, label: 'Full Analytics' },
                                        { id: 'content', icon: FileText, label: 'Content Manager' },
                                        { id: 'projects', icon: Briefcase, label: 'Ventures' },
                                        { id: 'promotion', icon: Megaphone, label: 'Promotion Modal' },
                                        { id: 'shop', icon: ShoppingBag, label: 'Shop Manager' },
                                        { id: 'courses', icon: Youtube, label: 'Course Manager' },
                                        { id: 'feed', icon: Rss, label: 'Feed Manager' },
                                        { id: 'news', icon: TrendingUp, label: 'News Manager' },
                                        { id: 'threed', icon: Box, label: '3D Models' },
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

                            {/* Footer - sticky at bottom */}
                            <div className="p-6 pt-4 flex-shrink-0 border-t border-slate-200/60">
                                <button onClick={logout} className="w-full flex items-center gap-3 font-semibold text-slate-500 hover:text-red-500 px-4 py-3 rounded-xl hover:bg-red-50 hover:shadow-sm transition-all">
                                    <LogOut className="w-5 h-5" /> Logout
                                </button>
                                <Link href="/" className="mt-2 w-full flex items-center gap-3 font-semibold text-slate-500 hover:text-slate-900 px-4 py-3 rounded-xl hover:bg-white hover:shadow-sm transition-all">
                                    <ArrowRight className="w-5 h-5" /> Live Site
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
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">Full Analytics</h1>
                            <p className="text-slate-500 font-medium mb-8">Detailed monitoring of user activity, path popularity, and visitor retention.</p>

                            {/* Stats Summary */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm transition hover:shadow-md">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Hits</h4>
                                    <p className="text-2xl font-black text-slate-900">{analyticsData.length}</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm transition hover:shadow-md">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Unique IPs</h4>
                                    <p className="text-2xl font-black text-slate-900">{getIPStats(analyticsData).length}</p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm transition hover:shadow-md">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Avg. Time</h4>
                                    <p className="text-2xl font-black text-slate-900">
                                        {analyticsData.length > 0 
                                            ? Math.round(analyticsData.reduce((acc, curr) => acc + (curr.timeSpent || 0), 0) / analyticsData.length) 
                                            : 0}s
                                    </p>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm transition hover:shadow-md border-l-4 border-l-[#f89e35]">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#f89e35] mb-1">Top Page</h4>
                                    <p className="text-lg font-black text-slate-900 truncate">
                                        {getTopPages(analyticsData)[0]?.name || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Charts Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                                <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm h-[380px] transition hover:shadow-lg">
                                    <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-[#f89e35]" /> Daily Visits (Active Trend)
                                    </h3>
                                    <div className="h-[280px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={getDailyVisits(analyticsData)}>
                                                <defs>
                                                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#f89e35" stopOpacity={0.15}/>
                                                        <stop offset="95%" stopColor="#f89e35" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                                                <Tooltip 
                                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                                                    cursor={{ stroke: '#f89e35', strokeWidth: 1 }}
                                                />
                                                <Area type="monotone" dataKey="visits" stroke="#f89e35" strokeWidth={4} fillOpacity={1} fill="url(#colorVisits)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm h-[380px] transition hover:shadow-lg">
                                    <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-[#f89e35]" /> Content Performance
                                    </h3>
                                    <div className="h-[280px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart layout="vertical" data={getTopPages(analyticsData)}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#334155'}} width={100} />
                                                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                                                <Bar dataKey="visits" fill="#f89e35" radius={[0, 12, 12, 0]} barSize={24}>
                                                    {getTopPages(analyticsData).map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#f89e35' : '#cbd5e1'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* IP Activity Table */}
                            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden transition hover:shadow-lg">
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                        <Users className="w-5 h-5 text-[#f89e35]" /> Visitor Analysis by IP
                                    </h3>
                                    <span className="bg-white px-3 py-1 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-200 shadow-sm">{getIPStats(analyticsData).length} Unique Visitors Found</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100">
                                                <th className="p-6">IP Details (Hover for Pages)</th>
                                                <th className="p-6 text-center">Visit Count</th>
                                                <th className="p-6">Uniq. Pages</th>
                                                <th className="p-6">Avg Retention</th>
                                                <th className="p-6">Last Activity</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {getIPStats(analyticsData).map((stat) => (
                                                <tr key={stat.ip} className="border-b border-slate-50 hover:bg-[#fff7ed]/50 transition-colors group">
                                                    <td className="p-6">
                                                        <span className="font-black text-slate-900 text-base block mb-0.5 group-hover:text-[#f89e35] transition-colors">{stat.ip}</span>
                                                        <div className="flex flex-wrap gap-1 mt-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                                            {stat.pages.map(p => (
                                                                <span key={p} className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase">{p.split('/').pop() || 'Home'}</span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="p-6 text-center">
                                                        <span className="bg-[#110f0e] text-white px-3 py-1 rounded-xl text-xs font-black shadow-lg shadow-black/10 inline-block min-w-[32px]">{stat.visits}</span>
                                                    </td>
                                                    <td className="p-6 font-bold text-slate-600 text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                                            {stat.uniquePages} pages explored
                                                        </div>
                                                    </td>
                                                    <td className="p-6 font-bold text-slate-600 text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                                            {stat.avgTime}s avg. time
                                                        </div>
                                                    </td>
                                                    <td className="p-6 text-sm font-bold text-slate-400">
                                                        <span className="text-slate-900 block">{new Date(stat.lastSeen).toLocaleDateString()}</span>
                                                        <span className="text-[10px] font-black uppercase tracking-tighter opacity-70">{new Date(stat.lastSeen).toLocaleTimeString()}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {analyticsData.length === 0 && !loading && (
                                    <div className="text-center py-20">
                                        <Activity className="w-12 h-12 text-slate-200 mx-auto mb-4 animate-pulse" />
                                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Awaiting visitor traffic...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'threed' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">Manage 3D Models</h1>
                            <p className="text-slate-500 font-medium mb-6 md:mb-10">Publish interactive Sketchfab 3D models with stories.</p>

                            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-sm mb-10 transition hover:shadow-md">
                                <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <span className="bg-[#f89e35]/10 p-2 rounded-lg text-[#f89e35]"><Plus className="w-5 h-5" /></span>
                                    Add New 3D Post
                                </h3>
                                <form onSubmit={addThreeDPost} className="space-y-6">
                                    <input type="text" placeholder="Title" required value={newThreeDPost.title} onChange={e => setNewThreeDPost({ ...newThreeDPost, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 font-medium rounded-xl p-4 text-slate-900 focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20 transition" />
                                    <input type="url" placeholder="Sketchfab URL (e.g. https://sketchfab.com/3d-models/...)" required value={newThreeDPost.sketchfabUrl} onChange={e => setNewThreeDPost({ ...newThreeDPost, sketchfabUrl: e.target.value })} className="w-full bg-slate-50 border border-slate-200 font-medium rounded-xl p-4 text-slate-900 focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20 transition" />
                                    
                                    <div className="relative">
                                        <input
                                            list="threed-categories"
                                            placeholder="Category (e.g. General, Programming)"
                                            value={newThreeDPost.category || ''}
                                            onChange={e => setNewThreeDPost({ ...newThreeDPost, category: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 font-medium rounded-xl p-4 text-slate-900 focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20 transition"
                                        />
                                        <datalist id="threed-categories">
                                            {categories.threed.map(cat => (
                                                <option key={cat} value={cat} />
                                            ))}
                                        </datalist>
                                    </div>
                                    
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Thumbnail Upload</label>
                                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileUpload(e, (url) => setNewThreeDPost({ ...newThreeDPost, thumbnail: url }), setThreeDThumbPreview)}
                                                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#f89e35]/10 file:text-[#f89e35] hover:file:bg-[#f89e35]/20"
                                            />
                                            {uploading && <Loader2 className="w-5 h-5 animate-spin text-[#f89e35]" />}
                                            {threeDThumbPreview && <img src={threeDThumbPreview} alt="Preview" className="h-12 w-auto object-cover rounded shadow-sm border border-slate-200" />}
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white border text-black border-slate-200 rounded-xl overflow-hidden pb-12 w-full max-w-full">
                                        <ReactQuill theme="snow" value={newThreeDPost.story} onChange={(val) => setNewThreeDPost({ ...newThreeDPost, story: val })} className="h-64 mb-4" placeholder="Write the full narrative for this 3D model..." />
                                    </div>

                                    <div className="flex justify-end pt-4 border-t border-slate-100">
                                        <button type="submit" disabled={uploading} className="w-full md:w-auto bg-[#110f0e] hover:bg-slate-800 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-xl transition shadow-md">Publish 3D Model</button>
                                    </div>
                                </form>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                                {threeDPosts.map(p => (
                                    <div key={p._id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden relative group shadow-sm hover:shadow-xl hover:border-[#f89e35]/30 transition-all duration-300">
                                        <div className="h-48 bg-slate-100 relative">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            {p.thumbnail ? <img src={p.thumbnail} alt={p.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">NO THUMBNAIL</div>}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Box className="w-10 h-10 text-white" />
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <h4 className="font-black text-slate-900 text-lg mb-2 truncate">{p.title}</h4>
                                            <p className="text-slate-500 font-medium text-sm mb-4">Views: {p.views}</p>
                                        </div>
                                        <button onClick={() => deleteThreeDPost(p._id)} className="absolute top-4 right-4 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg transform translate-y-2 group-hover:translate-y-0">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {threeDPosts.length === 0 && !loading && (
                                    <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-slate-200 border-dashed">
                                        <p className="text-slate-500 font-medium">No 3D models published yet.</p>
                                    </div>
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
                                        <div className="relative">
                                            <input
                                                list="project-categories"
                                                placeholder="Category (e.g. Web Development)"
                                                value={newProject.category || ''}
                                                onChange={e => setNewProject({ ...newProject, category: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 font-medium rounded-xl p-4 text-slate-900 focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20 transition"
                                            />
                                            <datalist id="project-categories">
                                                {categories.projects.map(cat => (
                                                    <option key={cat} value={cat} />
                                                ))}
                                            </datalist>
                                        </div>
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
                    {activeTab === 'shop' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">Shop Manager</h1>
                            <p className="text-slate-500 font-medium mb-6 md:mb-10">Manage products available in your shop.</p>
                            
                            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-sm mb-10 max-w-2xl transition hover:shadow-md">
                                <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <span className="bg-[#f89e35]/10 p-2 rounded-lg text-[#f89e35]"><Plus className="w-5 h-5" /></span>
                                    Add New Product
                                </h3>
                                <form onSubmit={addProduct} className="space-y-5">
                                    <input type="text" placeholder="Product Title" required value={newProduct.title} onChange={e => setNewProduct({ ...newProduct, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 font-medium rounded-xl p-4 text-slate-900 focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20" />
                                    <textarea placeholder="Product Description" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} className="w-full bg-slate-50 border border-slate-200 font-medium rounded-xl p-4 text-slate-900 focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20 resize-none" rows={2} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="number" placeholder="Price (e.g. 15000)" required value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} className="w-full bg-slate-50 border border-slate-200 font-medium rounded-xl p-4 text-slate-900 focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20" />
                                        <div className="relative">
                                            <input
                                                list="shop-categories"
                                                placeholder="Category (e.g. Electronics)"
                                                value={newProduct.category || ''}
                                                onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 font-medium rounded-xl p-4 text-slate-900 focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20"
                                            />
                                            <datalist id="shop-categories">
                                                {categories.shop.map(cat => <option key={cat} value={cat} />)}
                                            </datalist>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <input type="url" placeholder="YouTube Video URL (Optional)" value={newProduct.youtubeUrl || ''} onChange={e => handleProductVideoUrlChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 font-medium rounded-xl p-4 text-slate-900 focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20" />
                                        <p className="text-[11px] text-slate-400 mt-1 font-medium">Auto-fills the product main image with video thumbnail.</p>
                                    </div>
                                    <div className="relative group">
                                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, (url) => setNewProduct({ ...newProduct, image: url }), setProductImagePreview)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                        {productImagePreview ? (
                                            <div className="relative">
                                                <img src={productImagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-slate-200" />
                                                <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                                                    {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : '✓ Click to change'}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-full py-8 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 font-bold group-hover:border-[#f89e35] group-hover:text-[#f89e35] bg-white transition-all">
                                                {uploading ? <Loader2 className="w-6 h-6 animate-spin text-[#f89e35]" /> : <ImageIcon className="w-7 h-7" />}
                                                <span>Upload Product Image</span>
                                                <span className="text-[11px] font-normal text-slate-400">JPG, PNG, WEBP</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-end pt-2">
                                        <button type="submit" disabled={uploading} className="w-full md:w-auto bg-[#110f0e] text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition disabled:opacity-50">Add Product</button>
                                    </div>
                                </form>
                            </div>

                            <div className="flex items-center gap-4 mb-6 overflow-x-auto pb-2 scrollbar-none">
                                {['All', ...categories.shop].map(cat => (
                                    <button 
                                        key={cat}
                                        onClick={() => {
                                            const params = cat === 'All' ? '' : `?category=${cat}`;
                                            fetch(`${API_BASE_URL}/products${params}`).then(r => r.json()).then(setShopProducts);
                                        }}
                                        className="px-4 py-2 rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:border-[#f89e35] hover:text-[#f89e35] transition whitespace-nowrap"
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {shopProducts.map(p => (
                                    <div key={p._id} className="bg-white border rounded-3xl overflow-hidden relative group shadow-sm hover:shadow-md transition">
                                        <div className="absolute top-4 left-4 z-10 flex gap-2">
                                            <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-black text-[#f89e35] shadow-sm uppercase">{p.category || 'General'}</span>
                                        </div>
                                        <img src={p.image || null} className="w-full h-48 object-cover bg-slate-100" />
                                        <div className="p-5">
                                            <h4 className="font-bold text-slate-900 mb-1 truncate">{p.title}</h4>
                                            <p className="text-[#f89e35] font-black text-lg">₦{p.price}</p>
                                        </div>
                                        <button onClick={() => deleteProduct(p._id)} className="absolute top-4 right-4 bg-white text-slate-300 hover:text-red-500 p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'courses' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h1 className="text-3xl font-black text-slate-900 mb-2">Course Manager</h1>
                            <p className="text-slate-500 mb-6">Manage educational courses.</p>
                            
                            <div className="bg-white p-6 md:p-8 rounded-3xl border mb-10 max-w-2xl transition hover:shadow-md shadow-sm">
                                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2"><Plus className="w-5 h-5 text-[#f89e35]" /> Add New Course</h3>
                                <form onSubmit={addCourse} className="space-y-4">
                                    <input type="text" placeholder="Course Title" required value={newCourse.title} onChange={e => setNewCourse({ ...newCourse, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20" />
                                    <textarea placeholder="Course Description" required value={newCourse.description} onChange={e => setNewCourse({ ...newCourse, description: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl resize-none focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20" />
                                    <div className="relative">
                                        <input
                                            list="course-categories"
                                            placeholder="Category (e.g. Programming)"
                                            value={newCourse.category || ''}
                                            onChange={e => setNewCourse({ ...newCourse, category: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20"
                                        />
                                        <datalist id="course-categories">
                                            {categories.courses.map(cat => <option key={cat} value={cat} />)}
                                        </datalist>
                                    </div>

                                    
                                    {/* YouTube URL - auto-fills thumbnail */}
                                    <div>
                                        <input type="url" placeholder="YouTube Video URL (e.g. https://youtu.be/...)" required value={newCourse.videoUrl} onChange={e => handleVideoUrlChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20" />
                                        <p className="text-[11px] text-slate-400 mt-1 font-medium">Thumbnail will be auto-generated from the video link</p>
                                    </div>

                                    {/* Intro Text (TTS) */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Intro Script <span className="text-slate-400 font-normal">(optional — played as audio before video)</span></label>
                                        <textarea
                                            placeholder="e.g. Welcome to this course! Lala Tech recommends this video because..."
                                            value={newCourse.introText}
                                            onChange={e => setNewCourse({ ...newCourse, introText: e.target.value })}
                                            rows={3}
                                            className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl resize-none focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20"
                                        />
                                    </div>

                                    {/* Thumbnail preview + optional override */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Custom Thumbnail <span className="text-slate-400 font-normal">(optional — overrides auto-generated)</span></label>
                                        <div className="relative group">
                                            <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, (url) => { setNewCourse({ ...newCourse, thumbnailUrl: url }); }, setCourseThumbPreview)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                            {courseThumbPreview ? (
                                                <div className="relative">
                                                    <img src={courseThumbPreview} alt="Thumbnail preview" className="w-full h-44 object-cover rounded-xl border border-slate-200" />
                                                    <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                                                        {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : '✓ Click to change'}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-full py-8 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center gap-2 justify-center text-slate-400 font-bold bg-white group-hover:text-[#f89e35] group-hover:border-[#f89e35] transition-all">
                                                    {uploading ? <Loader2 className="w-6 h-6 animate-spin text-[#f89e35]" /> : <ImageIcon className="w-7 h-7" />}
                                                    <span>Upload Custom Thumbnail</span>
                                                    <span className="text-[11px] font-normal text-slate-400">Leave empty to use YouTube's thumbnail</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button type="submit" disabled={uploading} className="bg-[#110f0e] disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold w-full md:w-auto hover:bg-slate-800 transition">Add Course</button>
                                </form>
                            </div>

                            <div className="flex items-center gap-4 mb-6 overflow-x-auto pb-2 scrollbar-none">
                                {['All', ...categories.courses].map(cat => (
                                    <button 
                                        key={cat}
                                        onClick={() => {
                                            const params = cat === 'All' ? '' : `?category=${cat}`;
                                            fetch(`${API_BASE_URL}/courses${params}`).then(r => r.json()).then(setCourses);
                                        }}
                                        className="px-4 py-2 rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:border-[#f89e35] hover:text-[#f89e35] transition whitespace-nowrap"
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {courses.map(c => (
                                    <div key={c._id} className="bg-white border rounded-3xl overflow-hidden relative group shadow-sm hover:shadow-md transition">
                                        <div className="absolute top-4 left-4 z-10 flex gap-2">
                                            <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-black text-[#f89e35] shadow-sm uppercase">{c.category || 'General'}</span>
                                        </div>
                                        <img src={c.thumbnailUrl || null} className="w-full h-40 object-cover bg-slate-100" />
                                        <div className="p-4">
                                            <h4 className="font-bold truncate text-slate-900">{c.title}</h4>
                                        </div>
                                        <button onClick={() => deleteCourse(c._id)} className="absolute top-4 right-4 bg-white p-2.5 rounded-full text-slate-300 hover:text-red-500 shadow-lg opacity-0 group-hover:opacity-100 transition group-hover:translate-y-0 translate-y-2"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'feed' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h1 className="text-3xl font-black text-slate-900 mb-2">Feed Manager</h1>
                            <p className="text-slate-500 mb-6">Manage posts for the public feed.</p>
                            
                            <div className="bg-white p-6 md:p-8 rounded-3xl border mb-10 max-w-2xl shadow-sm hover:shadow-md transition">
                                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2"><Plus className="w-5 h-5 text-[#f89e35]" /> Create Feed Post</h3>
                                <form onSubmit={addFeedPost} className="space-y-4">
                                    <textarea placeholder="What's on your mind?" value={newFeedPost.content} onChange={e => setNewFeedPost({ ...newFeedPost, content: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl min-h-[120px] resize-none focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20" />
                                    <div className="relative group">
                                        <input type="file" accept="image/*,video/*" onChange={(e) => handleFileUpload(e, (url) => setNewFeedPost({ ...newFeedPost, image: url }), setFeedImagePreview)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                        {feedImagePreview ? (
                                            <div className="relative">
                                                {feedImagePreview.includes('.mp4') || feedImagePreview.startsWith('blob') ? (
                                                    <video src={feedImagePreview} className="w-full max-h-64 rounded-xl border border-slate-200 object-cover bg-black" />
                                                ) : (
                                                    <img src={feedImagePreview} alt="Preview" className="w-full max-h-64 object-cover rounded-xl border border-slate-200" />
                                                )}
                                                <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                                                    {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : '✓ Click to change'}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-full py-8 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center gap-2 justify-center text-slate-400 font-bold bg-white group-hover:text-[#f89e35] group-hover:border-[#f89e35] transition-all">
                                                {uploading ? <Loader2 className="w-6 h-6 animate-spin text-[#f89e35]" /> : <ImageIcon className="w-7 h-7" />}
                                                <span>Attach Image or Video</span>
                                                <span className="text-[11px] font-normal text-slate-400">JPG, PNG, MP4</span>
                                            </div>
                                        )}
                                    </div>
                                    <button type="submit" disabled={uploading || (!newFeedPost.content && !newFeedPost.image)} className="bg-[#110f0e] disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold w-full md:w-auto hover:bg-slate-800 transition">Post to Feed</button>
                                </form>
                            </div>

                            <div className="grid gap-6 max-w-2xl">
                                {feedPosts.map(p => (
                                    <div key={p._id} className="bg-white border text-left rounded-3xl p-6 relative group shadow-sm hover:shadow-md transition">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-600">L</div>
                                            <div>
                                                <div className="font-bold text-slate-900">Lala Tech</div>
                                                <div className="text-xs font-semibold text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        {p.content && <p className="mb-4 text-slate-700 whitespace-pre-wrap">{p.content}</p>}
                                        {p.image && (
                                            p.image.includes('.mp4') ? <video src={p.image} className="w-full rounded-2xl max-h-80 object-cover bg-black" controls /> : <img src={p.image} className="w-full rounded-2xl max-h-80 object-cover border border-slate-100" />
                                        )}

                                        <div className="mt-4 pt-4 border-t border-slate-100">
                                            <button 
                                                onClick={() => loadFeedComments(p._id)}
                                                className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#f89e35] transition"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                                {activeFeedComments === p._id ? 'Hide Comments' : 'Manage Comments'}
                                            </button>

                                            <AnimatePresence>
                                                {activeFeedComments === p._id && (
                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4 space-y-4 overflow-hidden">
                                                        {(feedComments[p._id] || []).length === 0 ? (
                                                            <p className="text-xs text-slate-400 italic">No comments yet.</p>
                                                        ) : (
                                                            // Recursive comment renderer
                                                            (() => {
                                                                const all = feedComments[p._id] || [];
                                                                const renderTree = (parentId = null, depth = 0) => {
                                                                    return all.filter(c => c.parentId === parentId).sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)).map(comment => (
                                                                        <div key={comment._id} className={`${depth > 0 ? 'ml-6 mt-3 border-l-2 border-orange-100 pl-4' : 'bg-slate-50 rounded-2xl p-4 border border-slate-100'}`}>
                                                                            <div className="flex justify-between items-start mb-2">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="font-bold text-xs text-slate-900">{comment.author}</span>
                                                                                    {comment.isAdmin && <span className="bg-[#f89e35] text-white text-[9px] px-1.5 py-0.5 rounded-full uppercase font-black">Admin</span>}
                                                                                </div>
                                                                                <span className="text-[10px] text-slate-400 italic">{new Date(comment.createdAt).toLocaleString()}</span>
                                                                            </div>
                                                                            <p className="text-xs text-slate-600 mb-3">{comment.content}</p>
                                                                            
                                                                            <div className="flex gap-2">
                                                                                <input 
                                                                                    type="text" 
                                                                                    placeholder={`Reply to ${comment.author}...`} 
                                                                                    value={adminReplies[comment._id] || ''} 
                                                                                    onChange={e => setAdminReplies({ ...adminReplies, [comment._id]: e.target.value })}
                                                                                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#f89e35]"
                                                                                />
                                                                                <button 
                                                                                    onClick={() => sendAdminReply(comment._id, p._id)}
                                                                                    className="bg-[#f89e35] text-white p-1.5 rounded-lg hover:bg-orange-600 transition"
                                                                                >
                                                                                    <Reply className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            </div>

                                                                            {/* Recursive children */}
                                                                            {renderTree(comment._id, depth + 1)}
                                                                        </div>
                                                                    ));
                                                                };
                                                                return renderTree();
                                                            })()
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <button onClick={() => deleteFeedPost(p._id)} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 className="w-5 h-5" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'news' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                            <h1 className="text-3xl font-black text-slate-900 mb-2">News Manager</h1>
                            <p className="text-slate-500 mb-6">Create and manage blog articles and news updates.</p>

                            <div className="bg-white p-6 md:p-8 rounded-3xl border mb-10 max-w-3xl shadow-sm hover:shadow-md transition">
                                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2"><Plus className="w-5 h-5 text-[#f89e35]" /> Publish New Article</h3>
                                <form onSubmit={addArticle} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input type="text" placeholder="Article Title" required value={newArticle.title} onChange={e => setNewArticle({ ...newArticle, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl focus:outline-none focus:border-[#f89e35]" />
                                        <div className="relative">
                                            <input
                                                list="news-categories"
                                                placeholder="Category (e.g. Technology)"
                                                value={newArticle.category || ''}
                                                onChange={e => setNewArticle({ ...newArticle, category: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl focus:outline-none focus:border-[#f89e35]"
                                            />
                                            <datalist id="news-categories">
                                                {categories.news.map(cat => <option key={cat} value={cat} />)}
                                            </datalist>
                                        </div>
                                    </div>
                                    
                                    <input type="text" placeholder="Excerpt (Short summary)" required value={newArticle.excerpt} onChange={e => setNewArticle({ ...newArticle, excerpt: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl focus:outline-none focus:border-[#f89e35]" />
                                    
                                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                        <ReactQuill 
                                            theme="snow"
                                            value={newArticle.content}
                                            onChange={(val) => setNewArticle({ ...newArticle, content: val })}
                                            placeholder="Article Content..."
                                            modules={{
                                                toolbar: [
                                                    [{ 'header': [1, 2, 3, false] }],
                                                    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                                                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                    [{ 'color': [] }, { 'background': [] }],
                                                    ['link', 'clean']
                                                ]
                                            }}
                                            className="h-[350px] mb-12"
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input type="text" placeholder="Tags (comma separated: tech, coding)" value={newArticle.tags} onChange={e => setNewArticle({ ...newArticle, tags: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl focus:outline-none focus:border-[#f89e35]" />
                                        <input type="text" placeholder="Author Name" value={newArticle.author} onChange={e => setNewArticle({ ...newArticle, author: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl focus:outline-none focus:border-[#f89e35]" />
                                    </div>

                                    <div className="relative group">
                                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, (url) => setNewArticle({ ...newArticle, coverImage: url }), setArticleCoverPreview)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                        {articleCoverPreview ? (
                                            <div className="relative">
                                                <img src={articleCoverPreview} alt="Cover Preview" className="w-full h-56 object-cover rounded-xl border border-slate-200" />
                                                <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center text-white font-bold">
                                                    {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Change Cover Image'}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-full py-12 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center gap-2 justify-center text-slate-400 font-bold bg-white group-hover:text-[#f89e35] group-hover:border-[#f89e35] transition-all">
                                                {uploading ? <Loader2 className="w-6 h-6 animate-spin text-[#f89e35]" /> : <ImageIcon className="w-8 h-8" />}
                                                <span>Upload Cover Image</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <button type="submit" disabled={uploading} className="bg-[#110f0e] text-white px-10 py-4 rounded-xl font-bold hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5" /> Publish Article
                                    </button>
                                </form>
                            </div>

                            <div className="space-y-6">
                                {newsArticles.map(article => (
                                    <div key={article._id} className="bg-white border rounded-3xl p-6 flex flex-col md:flex-row gap-6 relative group hover:shadow-md transition">
                                        {article.coverImage && <img src={article.coverImage} className="w-full md:w-48 h-32 object-cover rounded-2xl bg-slate-100" />}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{article.category}</span>
                                                <span className="text-[11px] text-slate-400">{new Date(article.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <h4 className="font-bold text-slate-900 text-lg mb-2">{article.title}</h4>
                                            <p className="text-sm text-slate-500 line-clamp-2 mb-3">{article.excerpt}</p>
                                            <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                                                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {article.views}</span>
                                                <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {article.likes}</span>
                                                <span className="flex items-center gap-1"><Share2 className="w-3.5 h-3.5" /> {article.shares}</span>
                                                <button 
                                                    onClick={() => setNewsOfDay(article._id)}
                                                    className={`ml-4 flex items-center gap-1 px-3 py-1 rounded-full transition ${article.isNewsOfDay ? 'bg-[#f89e35] text-white' : 'bg-slate-100 text-slate-500 hover:bg-orange-100/50'}`}
                                                >
                                                    <TrendingUp className="w-3.5 h-3.5" />
                                                    {article.isNewsOfDay ? 'News of the Day' : 'Set as News of the Day'}
                                                </button>
                                            </div>
                                        </div>
                                        <button onClick={() => deleteArticle(article._id)} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 className="w-5 h-5" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
