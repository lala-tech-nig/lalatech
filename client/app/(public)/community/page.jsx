'use client';
import { useState, useEffect, useRef } from 'react';
import { 
    Briefcase, Shield, Search, X, MapPin, Clock, ChevronDown, CheckCircle, Send, Globe, 
    AlertTriangle, MessageCircle, Heart, Eye, Phone, Mail, BadgeCheck, Camera, Image as ImageIcon, Loader2, Link as LinkIcon,
    FileText, Music, Film
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '@/lib/api';
import LoadingButton from '@/components/LoadingButton';

const SCAM_CATEGORIES = ['All', 'SMS Scam', 'Email Phishing', 'Phone Call', 'Crypto Fraud', 'Investment Fraud', 'Romance Scam', 'Job Scam', 'Fake Website', 'Other'];
const JOB_TYPES = ['All', 'Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'];
const JOB_LOCATIONS = ['All', 'Remote', 'Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Hybrid', 'On-site'];

const catColors = {
    'SMS Scam': '#f59e0b', 'Email Phishing': '#ef4444', 'Phone Call': '#8b5cf6',
    'Crypto Fraud': '#f89e35', 'Investment Fraud': '#10b981', 'Romance Scam': '#ec4899',
    'Job Scam': '#3b82f6', 'Fake Website': '#06b6d4', 'Other': '#64748b',
    'Full-time': '#10b981', 'Part-time': '#3b82f6', 'Contract': '#f59e0b',
    'Internship': '#8b5cf6', 'Remote': '#f89e35', 'default': '#64748b'
};

export default function CommunityPage() {
    const [activeTab, setActiveTab] = useState('scam'); // 'scam' or 'jobs'

    // Form States
    const [scamForm, setScamForm] = useState({ title: '', description: '', author: '', category: 'SMS Scam', imageFile: null, imageUrl: '' });
    const [jobForm, setJobForm] = useState({ 
        title: '', company: '', description: '', requirements: '', type: 'Full-time', 
        location: 'Remote', salary: '', posterName: '', contactEmail: '', contactWebsite: '', phone: '',
        companyLogoFile: null, companyLogoUrl: ''
    });
    
    // Shared States
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);

    // Jobs State
    const [jobs, setJobs] = useState([]);
    const [typeFilter, setTypeFilter] = useState('All');
    const [locationFilter, setLocationFilter] = useState('All');
    const [activeJobModal, setActiveJobModal] = useState(null); // stores job object for modal
    const [showApplyMenu, setShowApplyMenu] = useState(false);

    // Scam State
    const [scams, setScams] = useState([]);
    const [scamCategory, setScamCategory] = useState('All');
    const [activeScamModal, setActiveScamModal] = useState(null); // stores scam object for modal
    const [comments, setComments] = useState({});
    const [commentInputs, setCommentInputs] = useState({});
    const [authorInputs, setAuthorInputs] = useState({});
    const [commentImageFiles, setCommentImageFiles] = useState({});
    const [likedScams, setLikedScams] = useState({});

    // Upload Previews
    const [scamImagePreview, setScamImagePreview] = useState('');
    const [jobLogoPreview, setJobLogoPreview] = useState('');
    const [commentImagePreviews, setCommentImagePreviews] = useState({});

    // File Input Refs
    const scamFileRef = useRef(null);
    const jobLogoRef = useRef(null);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'scam') {
                const res = await fetch(`${API_BASE_URL}/scams`);
                if (res.ok) setScams(await res.json());
            } else {
                const res = await fetch(`${API_BASE_URL}/jobs`);
                if (res.ok) {
                    const allJobs = await res.json();
                    setJobs(allJobs.filter(j => j.status === 'approved'));
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (file) => {
        if (!file) return null;
        setImageUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const uploadEndpoint = `${API_BASE_URL.replace('/api', '')}/api/upload`;
            const res = await fetch(uploadEndpoint, { method: 'POST', body: formData });
            if (res.ok) {
                const data = await res.json();
                setImageUploading(false);
                return data.secure_url || data.url; 
            } else {
                console.error("Upload failed", await res.text());
            }
        } catch(e) {
            console.error(e);
        }
        setImageUploading(false);
        return null;
    };

    // --- Scam Logic ---
    const filteredScams = scams.filter(r => {
        const matchSearch = (r.title || '').toLowerCase().includes(search.toLowerCase()) || (r.description || '').toLowerCase().includes(search.toLowerCase());
        const matchCat = scamCategory === 'All' || r.category === scamCategory;
        return matchSearch && matchCat;
    });

    const handleScamLike = async (id) => {
        if (likedScams[id]) return;
        setLikedScams(prev => ({ ...prev, [id]: true }));
        setScams(prev => prev.map(r => r._id === id ? { ...r, likes: r.likes + 1 } : r));
        await fetch(`${API_BASE_URL}/scams/${id}/like`, { method: 'POST' }).catch(() => {});
    };

    const fetchComments = async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/comments/${id}`);
            if (res.ok) {
                const data = await res.json();
                setComments(prev => ({ ...prev, [id]: data }));
            }
        } catch (e) {}
    };

    const openScamModal = (report) => {
        setActiveScamModal(report);
        if (!comments[report._id]) fetchComments(report._id);
    };

    const submitScamReport = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let uploadedUrl = scamForm.imageUrl;
            if (scamForm.imageFile) {
                uploadedUrl = await handleFileUpload(scamForm.imageFile);
            }
            const payload = { ...scamForm, image: uploadedUrl || '' };
            delete payload.imageFile; delete payload.imageUrl;
            
            const res = await fetch(`${API_BASE_URL}/scams`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                setSubmitted(true);
                setScamForm({ title: '', description: '', author: '', category: 'SMS Scam', imageFile: null, imageUrl: '' });
                setScamImagePreview('');
                setTimeout(() => { setShowSubmitModal(false); setSubmitted(false); fetchData(); }, 3500);
            }
        } catch (e) {}
        setSubmitting(false);
    };

    const getFileType = (file) => {
        if (!file) return 'image';
        if (file.type.startsWith('image/')) return 'image';
        if (file.type.startsWith('video/')) return 'video';
        if (file.type.startsWith('audio/')) return 'audio';
        return 'file';
    };

    const submitComment = async (scamId) => {
        const content = commentInputs[scamId]?.trim();
        const file = commentImageFiles[scamId];
        if (!content && !file) return;
        
        let uploadedUrl = '';
        let fileType = 'image';
        if (file) {
            uploadedUrl = await handleFileUpload(file);
            fileType = getFileType(file);
        }

        try {
            const res = await fetch(`${API_BASE_URL}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    postId: scamId, 
                    postType: 'scam', 
                    author: authorInputs[scamId]?.trim() || 'Visitor', 
                    content: content || `Shared a ${fileType}`,
                    image: uploadedUrl,
                    fileType: fileType
                }),
            });
            if (res.ok) {
                const nc = await res.json();
                setComments(prev => ({ ...prev, [scamId]: [...(prev[scamId] || []), nc] }));
                setCommentInputs(prev => ({ ...prev, [scamId]: '' }));
                setAuthorInputs(prev => ({ ...prev, [scamId]: '' }));
                setCommentImageFiles(prev => ({ ...prev, [scamId]: null }));
                setCommentImagePreviews(prev => ({ ...prev, [scamId]: '' }));
            }
        } catch (e) {}
    };

    // --- Job Logic ---
    const filteredJobs = jobs.filter(j => {
        const matchSearch = (j.title || '').toLowerCase().includes(search.toLowerCase()) || (j.description || '').toLowerCase().includes(search.toLowerCase());
        const matchType = typeFilter === 'All' || j.type === typeFilter;
        const matchLoc = locationFilter === 'All' || (j.location || '').includes(locationFilter);
        return matchSearch && matchType && matchLoc;
    });

    const submitJob = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let uploadedLogo = '';
            if (jobForm.companyLogoFile) {
                uploadedLogo = await handleFileUpload(jobForm.companyLogoFile);
            }
            
            const payload = { ...jobForm, companyLogo: uploadedLogo || '' };
            delete payload.companyLogoFile;
            delete payload.companyLogoUrl;

            const res = await fetch(`${API_BASE_URL}/jobs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                setSubmitted(true);
                setJobForm({ 
                    title: '', company: '', description: '', requirements: '', type: 'Full-time', 
                    location: 'Remote', salary: '', posterName: '', contactEmail: '', contactWebsite: '', phone: '',
                    companyLogoFile: null, companyLogoUrl: ''
                });
                setJobLogoPreview('');
                setTimeout(() => { setShowSubmitModal(false); setSubmitted(false); fetchData(); }, 3000);
            }
        } catch (e) {}
        setSubmitting(false);
    };

    const formatDate = (d) => {
        const diff = (Date.now() - new Date(d)) / 1000;
        if (diff < 60) return `${Math.floor(diff)}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const handleApplyClick = (job) => {
        const availableLinks = [];
        if (job.contactWebsite) availableLinks.push('website');
        if (job.phone) availableLinks.push('whatsapp');
        if (job.contactEmail) availableLinks.push('email');
        
        if (availableLinks.length > 1) {
            setShowApplyMenu(!showApplyMenu);
        } else if (availableLinks.length === 1) {
            handleApplyMethod(job, availableLinks[0]);
        } else {
            alert('No application link provided strictly by the poster.');
        }
    };

    const handleApplyMethod = (job, method) => {
        if (method === 'website') {
            let url = job.contactWebsite;
            if (!url.startsWith('http://') && !url.startsWith('https://')) url = `https://${url}`;
            window.open(url, '_blank');
        } else if (method === 'whatsapp') {
            const cleanPhone = job.phone.replace(/[^\d+]/g, '');
            window.open(`https://wa.me/${cleanPhone}`, '_blank');
        } else if (method === 'email') {
            window.open(`mailto:${job.contactEmail}?subject=Application for ${job.title}`, '_blank');
        }
    };

    return (
        <div className="pt-32 pb-32 min-h-screen bg-slate-50">
            <div className="max-w-7xl mx-auto px-6 border-red-500">
                
                {/* Hero Section */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-200 text-[#f89e35] bg-white font-bold text-xs tracking-widest uppercase mb-6 shadow-sm">
                        Community Hub
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-none mb-6">
                        Lala Tech <span className="text-[#f89e35]">Network</span>
                    </h1>
                    <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
                        A collaborative space to find opportunities and protect each other.
                    </p>
                </motion.div>

                {/* Tabs */}
                <div className="flex justify-center mb-12">
                    <div className="bg-white p-1.5 rounded-full shadow-sm border border-slate-200 inline-flex">
                        <button 
                            onClick={() => { setActiveTab('scam'); setSearch(''); }}
                            className={`px-8 py-3 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'scam' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                        >
                            <Shield size={16} /> Scam Watch
                        </button>
                        <button 
                            onClick={() => { setActiveTab('jobs'); setSearch(''); }}
                            className={`px-8 py-3 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'jobs' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                        >
                            <Briefcase size={16} /> Job Board
                        </button>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-3xl border border-slate-200 shadow-sm mb-8">
                    <div className="flex-1 w-full max-w-md relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder={activeTab === 'scam' ? "Search reports..." : "Search jobs..."}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-full py-3.5 pl-12 pr-10 text-slate-900 font-medium focus:outline-none focus:border-[#f89e35] focus:ring-2 focus:ring-[#f89e35]/20 transition"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    
                    <button 
                        onClick={() => setShowSubmitModal(true)}
                        className="w-full md:w-auto px-8 py-3.5 bg-[#f89e35] hover:bg-[#e08b2c] text-white rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#f89e35]/20"
                    >
                        {activeTab === 'scam' ? <><AlertTriangle size={16}/> Report a Scam</> : <><Send size={16}/> Post a Job</>}
                    </button>
                </div>

                {/* SCAM WATCH CONTENT */}
                {activeTab === 'scam' && (
                    <>
                        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
                            {SCAM_CATEGORIES.map(c => (
                                <button key={c}
                                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${scamCategory === c ? 'bg-[#f89e35] text-white border-[#f89e35] shadow-[#f89e35]/20 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-[#f89e35] hover:text-[#f89e35]'}`}
                                    onClick={() => setScamCategory(c)}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[1,2,3,4].map(i => <div key={i} className="aspect-[4/3] bg-slate-200/50 rounded-3xl animate-pulse"/>)}
                            </div>
                        ) : filteredScams.length === 0 ? (
                            <div className="bg-white border border-slate-200 rounded-[32px] p-16 text-center shadow-sm">
                                <Shield size={48} className="mx-auto text-slate-300 mb-4" />
                                <h3 className="text-xl font-bold text-slate-900 mb-2">No reports found</h3>
                                <p className="text-slate-500">The community looks safe. Be the first to report if you see anything suspicious.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                                <AnimatePresence>
                                    {filteredScams.map((report, idx) => {
                                        const color = catColors[report.category] || '#64748b';
                                        return (
                                            <motion.div key={report._id} layout initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.9}} 
                                                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col h-full cursor-pointer"
                                                onClick={() => openScamModal(report)}
                                            >
                                                <div className="p-6 flex-1 flex flex-col">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider" style={{ background: `${color}15`, color }}>
                                                            {report.category || 'General'}
                                                        </div>
                                                        <span className="text-[10px] font-semibold text-slate-400">{formatDate(report.createdAt)}</span>
                                                    </div>
                                                    
                                                    <h3 className="text-base font-black text-slate-900 mb-2 leading-tight line-clamp-2">{report.title}</h3>
                                                    <p className="text-slate-600 text-xs leading-relaxed mb-4 line-clamp-3 flex-1">{report.description}</p>
                                                    
                                                    {report.image && (
                                                        <div className="h-20 w-full rounded-xl overflow-hidden mb-4 bg-slate-100 flex-shrink-0 relative">
                                                            <img src={report.image} alt="Evidence" className="w-full h-full object-cover" />
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                                                        <div className="flex items-center gap-3">
                                                            <button className={`flex items-center gap-1 text-[10px] font-bold transition-colors ${likedScams[report._id] ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`} onClick={e => { e.stopPropagation(); handleScamLike(report._id); }}>
                                                                <Heart size={12} fill={likedScams[report._id] ? 'currentColor' : 'none'} /> {report.likes || 0}
                                                            </button>
                                                        </div>
                                                        <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                            By {report.author || 'Anonymous'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
                    </>
                )}

                {/* JOBS CONTENT */}
                {activeTab === 'jobs' && (
                    <>
                        <div className="flex flex-wrap gap-2 mb-6">
                            <select className="bg-white border border-slate-200 text-slate-600 font-bold text-xs px-4 py-2.5 rounded-full outline-none focus:border-[#f89e35]" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                                {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
                            </select>
                            <select className="bg-white border border-slate-200 text-slate-600 font-bold text-xs px-4 py-2.5 rounded-full outline-none focus:border-[#f89e35]" value={locationFilter} onChange={e => setLocationFilter(e.target.value)}>
                                {JOB_LOCATIONS.map(l => <option key={l}>{l}</option>)}
                            </select>
                            {(typeFilter !== 'All' || locationFilter !== 'All') && (
                                <button onClick={() => { setTypeFilter('All'); setLocationFilter('All'); }} className="text-[#f89e35] text-xs font-bold px-4 py-2 bg-orange-50 rounded-full border border-orange-100 flex items-center gap-1">
                                    <X size={12}/> Clear Filters
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[1,2,3,4].map(i => <div key={i} className="aspect-[4/3] bg-slate-200/50 rounded-3xl animate-pulse"/>)}
                            </div>
                        ) : filteredJobs.length === 0 ? (
                            <div className="bg-white border border-slate-200 rounded-[32px] p-16 text-center shadow-sm">
                                <Briefcase size={48} className="mx-auto text-slate-300 mb-4" />
                                <h3 className="text-xl font-bold text-slate-900 mb-2">No jobs available</h3>
                                <p className="text-slate-500">Check back later or post an opportunity yourself.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                                <AnimatePresence>
                                    {filteredJobs.map((job, idx) => {
                                        return (
                                            <motion.div key={job._id} layout initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.9}} 
                                                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-full cursor-pointer"
                                                onClick={() => { setActiveJobModal(job); setShowApplyMenu(false); }}
                                            >
                                                <div className="p-6 flex-1 flex flex-col">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        {job.companyLogo ? (
                                                            <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-100 flex-shrink-0 bg-white">
                                                                <img src={job.companyLogo} alt={job.company} className="w-full h-full object-cover shrink-0" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f89e35] to-[#f56e00] text-white flex items-center justify-center text-lg font-black shadow-sm flex-shrink-0">
                                                                {(job.company || job.title || 'J')[0].toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-base font-black text-slate-900 leading-tight truncate">{job.title}</h3>
                                                            <p className="text-slate-500 font-bold text-[10px] truncate w-full flex items-center gap-1">
                                                                {job.company}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex flex-wrap gap-1.5 mb-4 flex-1">
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 rounded text-[9px] font-bold uppercase tracking-wider">
                                                            <Clock size={10}/> {job.type || 'Full-time'}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 rounded text-[9px] font-bold uppercase tracking-wider">
                                                            <MapPin size={10}/> {job.location || 'Remote'}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
                                                        <span className="text-[10px] font-semibold text-slate-400">Posted {formatDate(job.createdAt)}</span>
                                                        <div className="p-1.5 rounded-full bg-orange-50 text-[#f89e35] hover:bg-[#f89e35] hover:text-white transition-colors">
                                                            <Eye size={12} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* --- JOBS MODAL --- */}
            <AnimatePresence>
                {activeJobModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveJobModal(null)} />
                        
                        <motion.div initial={{scale:0.95, opacity:0, y:20}} animate={{scale:1, opacity:1, y:0}} exit={{scale:0.95, opacity:0, y:20}} className="bg-white p-8 md:p-10 rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl scrollbar-hide">
                            <button className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors" onClick={() => { setActiveJobModal(null); setShowApplyMenu(false); }}>
                                <X size={20} />
                            </button>


                            <div className="flex items-center gap-6 mb-8">
                                {activeJobModal.companyLogo ? (
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-100 shadow-sm shrink-0">
                                        <img src={activeJobModal.companyLogo} alt={activeJobModal.company} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#f89e35] to-[#f56e00] text-white flex items-center justify-center text-4xl font-black shadow-sm">
                                        {(activeJobModal.company || activeJobModal.title || 'J')[0].toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 mb-1">{activeJobModal.title}</h2>
                                    <p className="text-slate-600 font-bold flex items-center gap-2 text-lg">
                                        {activeJobModal.company}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-8">
                                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-full text-xs font-bold uppercase tracking-wider">
                                    <Clock size={14}/> {activeJobModal.type}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-full text-xs font-bold uppercase tracking-wider">
                                    <MapPin size={14}/> {activeJobModal.location}
                                </span>
                                {activeJobModal.salary && (
                                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">
                                        💰 {activeJobModal.salary}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-8 mb-10">
                                <div>
                                    <h4 className="text-sm font-black uppercase tracking-widest text-[#f89e35] mb-3">About the Role</h4>
                                    <p className="text-slate-600 text-base leading-relaxed whitespace-pre-wrap break-words">{activeJobModal.description}</p>
                                </div>
                                {activeJobModal.requirements && (
                                    <div>
                                        <h4 className="text-sm font-black uppercase tracking-widest text-[#f89e35] mb-3">Requirements</h4>
                                        <p className="text-slate-600 text-base leading-relaxed whitespace-pre-wrap break-words">{activeJobModal.requirements}</p>
                                    </div>
                                )}
                                
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-2">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Company Info</h4>
                                    <p className="text-sm font-medium text-slate-800 flex items-center gap-2"><Briefcase size={14} className="text-slate-400"/> Posted by: {activeJobModal.posterName}</p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                                <button onClick={() => { setActiveJobModal(null); setShowApplyMenu(false); }} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
                                    Cancel
                                </button>
                                <div className="relative">
                                    <button onClick={() => handleApplyClick(activeJobModal)} className="px-8 py-3 bg-[#f89e35] hover:bg-[#e08b2c] text-white rounded-full font-bold transition-all shadow-md flex items-center gap-2">
                                        <Send size={16}/> Apply Now
                                    </button>
                                    
                                    <AnimatePresence>
                                        {showApplyMenu && (
                                            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:10}} className="absolute bottom-[calc(100%+12px)] right-0 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden min-w-[200px] z-50 py-2">
                                                {activeJobModal.contactWebsite && (
                                                    <button onClick={() => handleApplyMethod(activeJobModal, 'website')} className="w-full px-5 py-3 text-left hover:bg-slate-50 text-sm font-bold text-slate-700 flex items-center gap-3 transition-colors">
                                                        <Globe size={16} className="text-[#f89e35]"/> Apply via Website
                                                    </button>
                                                )}
                                                {activeJobModal.phone && (
                                                    <button onClick={() => handleApplyMethod(activeJobModal, 'whatsapp')} className="w-full px-5 py-3 text-left hover:bg-slate-50 text-sm font-bold text-slate-700 flex items-center gap-3 transition-colors">
                                                        <MessageCircle size={16} className="text-emerald-500"/> Apply via WhatsApp
                                                    </button>
                                                )}
                                                {activeJobModal.contactEmail && (
                                                    <button onClick={() => handleApplyMethod(activeJobModal, 'email')} className="w-full px-5 py-3 text-left hover:bg-slate-50 text-sm font-bold text-slate-700 flex items-center gap-3 transition-colors">
                                                        <Mail size={16} className="text-blue-500"/> Apply via Email
                                                    </button>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- SCAM MODAL --- */}
            <AnimatePresence>
                {activeScamModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveScamModal(null)} />
                        
                        <motion.div initial={{scale:0.95, opacity:0, y:20}} animate={{scale:1, opacity:1, y:0}} exit={{scale:0.95, opacity:0, y:20}} className="bg-white p-8 md:p-10 rounded-[32px] w-full max-w-3xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl scrollbar-hide">
                            <button className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors" onClick={() => setActiveScamModal(null)}>
                                <X size={20} />
                            </button>

                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4" style={{ background: `${catColors[activeScamModal.category] || '#64748b'}15`, color: catColors[activeScamModal.category] || '#64748b' }}>
                                {activeScamModal.category || 'General'}
                            </div>

                            <h2 className="text-3xl font-black text-slate-900 mb-4">{activeScamModal.title}</h2>
                            <p className="text-xs font-semibold text-slate-400 mb-8 flex items-center gap-2">
                                By {activeScamModal.author || 'Anonymous'} • {formatDate(activeScamModal.createdAt)}
                            </p>

                            <div className="mb-8">
                                <p className="text-slate-700 text-base leading-relaxed whitespace-pre-wrap">{activeScamModal.description}</p>
                            </div>

                            {activeScamModal.image && (
                                <div className="mb-8 rounded-2xl overflow-hidden border border-slate-200">
                                    <img src={activeScamModal.image} alt="Report Evidence" className="w-full object-contain bg-slate-900 max-h-[400px]" />
                                </div>
                            )}
                            
                            {/* Admin Reply */}
                            {activeScamModal.adminReply && (
                                <div className="bg-orange-50 border border-[#f89e35]/30 rounded-2xl p-6 mb-8 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-[#f89e35]"></div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-full bg-[#f89e35] flex items-center justify-center text-white font-black text-xs">LT</div>
                                        <div>
                                            <div className="font-bold text-slate-900 text-sm flex items-center gap-1">Lala Tech <BadgeCheck size={14} className="text-[#f89e35]"/></div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Official Response</div>
                                        </div>
                                    </div>
                                    <p className="text-slate-800 text-sm leading-relaxed font-medium">{activeScamModal.adminReply}</p>
                                    {activeScamModal.adminReplyImage && (
                                        <div className="mt-4 rounded-xl overflow-hidden border border-[#f89e35]/20 shadow-sm bg-white">
                                            <img src={activeScamModal.adminReplyImage} alt="Official Evidence" className="w-full h-auto max-h-[300px] object-contain mx-auto" />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Comments */}
                            <div className="space-y-6 pt-6 border-t border-slate-100">
                                <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                                    <MessageCircle size={16} className="text-[#f89e35]"/> Community Responses
                                </h4>
                                
                                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                    <input className="w-full text-sm font-medium mb-3 pb-3 border-b border-slate-100 focus:outline-none" placeholder="Your name (optional)" value={authorInputs[activeScamModal._id] || ''} onChange={e => setAuthorInputs(p => ({ ...p, [activeScamModal._id]: e.target.value }))} />
                                    <textarea className="w-full text-sm resize-y min-h-[60px] focus:outline-none pt-1" placeholder="Share what you know or ask a question..." value={commentInputs[activeScamModal._id] || ''} onChange={e => setCommentInputs(p => ({ ...p, [activeScamModal._id]: e.target.value }))} />
                                    
                                    {commentImagePreviews[activeScamModal._id] && (
                                        <div className="mt-2 mb-2 relative inline-block group">
                                            <div className="relative rounded-xl overflow-hidden border-2 border-[#f89e35] bg-white shadow-md">
                                                {commentImageFiles[activeScamModal._id]?.type?.startsWith('image/') ? (
                                                    <img src={commentImagePreviews[activeScamModal._id]} className="h-24 w-auto object-contain" alt="Preview" />
                                                ) : (
                                                    <div className="h-24 px-6 flex items-center gap-3 bg-slate-50 min-w-[200px]">
                                                        {commentImageFiles[activeScamModal._id]?.type?.startsWith('video/') ? <Film className="text-[#f89e35]" size={24}/> :
                                                         commentImageFiles[activeScamModal._id]?.type?.startsWith('audio/') ? <Music className="text-[#f89e35]" size={24}/> :
                                                         <FileText className="text-[#f89e35]" size={24}/>}
                                                        <div className="text-left">
                                                            <div className="text-[10px] font-black uppercase text-slate-400">File Selected</div>
                                                            <div className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{commentImageFiles[activeScamModal._id]?.name}</div>
                                                        </div>
                                                    </div>
                                                )}
                                                <button 
                                                    onClick={() => {
                                                        setCommentImageFiles(p => ({...p, [activeScamModal._id]: null}));
                                                        setCommentImagePreviews(p => ({...p, [activeScamModal._id]: ''}));
                                                    }} 
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                                                >
                                                    <X size={12} strokeWidth={3} />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                                        <div>
                                            <input type="file" id={`comment-img-${activeScamModal._id}`} accept="image/*,video/*,audio/*,application/pdf" className="hidden" onChange={e => { 
                                                const file = e.target.files[0];
                                                if(file) {
                                                    setCommentImageFiles(p => ({...p, [activeScamModal._id]: file}));
                                                    setCommentImagePreviews(p => ({...p, [activeScamModal._id]: URL.createObjectURL(file)}));
                                                }
                                            }} />
                                            <button onClick={() => document.getElementById(`comment-img-${activeScamModal._id}`).click()} className={`text-slate-400 hover:text-[#f89e35] transition-colors p-2 bg-slate-50 rounded-full ${commentImageFiles[activeScamModal._id] ? 'bg-orange-50 text-[#f89e35]' : ''}`}>
                                                <LinkIcon size={16} />
                                            </button>
                                        </div>
                                        <LoadingButton
                                            loading={imageUploading}
                                            onClick={() => submitComment(activeScamModal._id)}
                                            className="bg-slate-900 hover:bg-[#f89e35] text-white px-5 py-2 rounded-full font-bold text-xs flex items-center gap-2"
                                        >
                                            <Send size={12} /> Post Reply
                                        </LoadingButton>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {(comments[activeScamModal._id] || []).map(c => (
                                        <div key={c._id} className={`flex gap-4 p-4 rounded-2xl ${c.isAdmin ? 'bg-orange-50 border border-[#f89e35]/30' : 'bg-slate-50 border border-slate-100'}`}>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0 ${c.isAdmin ? 'bg-[#f89e35]' : 'bg-slate-800'}`}>
                                                {c.isAdmin ? 'LT' : (c.author || 'A')[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-slate-900 text-sm">{c.author || 'Anonymous'}</span>
                                                    {c.isAdmin && <BadgeCheck size={14} className="text-[#f89e35]"/>}
                                                    <span className="text-xs text-slate-400 ml-auto">{formatDate(c.createdAt)}</span>
                                                </div>
                                                <p className="text-slate-700 text-sm leading-relaxed">{c.content}</p>
                                                {c.image && (
                                                    <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 bg-white">
                                                        {c.fileType === 'video' ? (
                                                            <video src={c.image} controls className="w-full max-h-[360px] bg-black" />
                                                        ) : c.fileType === 'audio' ? (
                                                            <audio src={c.image} controls className="w-full mt-2" />
                                                        ) : c.fileType === 'file' ? (
                                                            <a href={c.image} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 transition">
                                                                <FileText size={24} className="text-[#f89e35]" />
                                                                <div className="text-left">
                                                                    <div className="text-xs font-bold text-slate-700">Download Attachment</div>
                                                                    <div className="text-[10px] text-slate-400">Click to open or download file</div>
                                                                </div>
                                                            </a>
                                                        ) : (
                                                            <img src={c.image} alt="Comment Attachment" className="w-full max-h-[320px] object-contain" />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal for Submissions */}
            <AnimatePresence>
                {showSubmitModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !submitting && setShowSubmitModal(false)} />
                        {submitted ? (
                            <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}} className="bg-white p-10 rounded-[32px] w-full max-w-md relative z-10 text-center shadow-xl">
                                <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle size={40} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 mb-2">Success!</h2>
                                <p className="text-slate-500 font-medium">Your {activeTab} post has been submitted and is pending review.</p>
                            </motion.div>
                        ) : (
                            <motion.div initial={{scale:0.95, opacity:0, y:20}} animate={{scale:1, opacity:1, y:0}} exit={{scale:0.95, opacity:0, y:20}} className="bg-white p-8 md:p-10 rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 shadow-xl scrollbar-hide">
                                <button className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 hover:text-slate-800 rounded-full transition-colors" onClick={() => setShowSubmitModal(false)}>
                                    <X size={20} />
                                </button>

                                <h2 className="text-3xl font-black text-slate-900 mb-2">
                                    {activeTab === 'scam' ? 'Report a Scam' : 'Post a Job'}
                                </h2>
                                <p className="text-slate-500 font-medium mb-8">
                                    {activeTab === 'scam' ? 'Help others stay safe by sharing details below.' : 'Share your opportunity with the community.'}
                                </p>

                                {activeTab === 'scam' ? (
                                    <form onSubmit={submitScamReport} className="space-y-5">
                                        <div>
                                            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Report Title *</label>
                                            <input className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-5 py-3.5 rounded-xl font-medium focus:outline-none focus:border-[#f89e35] transition-colors" placeholder="e.g. Fake investment platform" required value={scamForm.title} onChange={e => setScamForm({...scamForm, title: e.target.value})} />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Category</label>
                                                <select className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-5 py-3.5 rounded-xl font-medium focus:outline-none focus:border-[#f89e35] transition-colors" value={scamForm.category} onChange={e => setScamForm({...scamForm, category: e.target.value})}>
                                                    {SCAM_CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Your Name (Optional)</label>
                                                <input className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-5 py-3.5 rounded-xl font-medium focus:outline-none focus:border-[#f89e35]" placeholder="Anonymous by default" value={scamForm.author} onChange={e => setScamForm({...scamForm, author: e.target.value})} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Full Description *</label>
                                            <textarea className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-5 py-3.5 rounded-xl font-medium focus:outline-none focus:border-[#f89e35] min-h-[120px] resize-y" placeholder="Describe the scam in detail..." required value={scamForm.description} onChange={e => setScamForm({...scamForm, description: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Evidence Image (Optional)</label>
                                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-[#f89e35] transition-colors cursor-pointer bg-slate-50 relative group" onClick={() => scamFileRef.current.click()}>
                                                <input type="file" ref={scamFileRef} className="hidden" accept="image/*" onChange={e => { 
                                                    const file = e.target.files[0];
                                                    if(file) {
                                                        setScamForm({...scamForm, imageFile: file});
                                                        setScamImagePreview(URL.createObjectURL(file));
                                                    }
                                                }} />
                                                
                                                {scamImagePreview ? (
                                                    <div className="relative inline-block mx-auto">
                                                        <img src={scamImagePreview} className="max-h-40 rounded-lg shadow-md border-2 border-white" alt="Preview" />
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setScamForm({...scamForm, imageFile: null}); setScamImagePreview(''); }} 
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <X size={14} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Camera className="text-slate-400" size={24} />
                                                        <span className="text-sm font-bold text-slate-500">Click to upload screenshot or photo</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button type="submit" disabled={submitting} className="w-full bg-slate-900 hover:bg-[#f89e35] text-white font-black text-sm py-4 rounded-xl transition-all shadow-md mt-4 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                            {submitting ? <><Loader2 size={16} className="animate-spin"/> Submitting...</> : 'Submit Report'}
                                        </button>
                                    </form>
                                ) : (
                                    <form onSubmit={submitJob} className="space-y-4">
                                        <div>
                                            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Job Title *</label>
                                            <input className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-5 py-3 rounded-xl font-medium focus:outline-none focus:border-[#f89e35]" placeholder="e.g. Senior Developer" required value={jobForm.title} onChange={e => setJobForm({...jobForm, title: e.target.value})} />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Company Name *</label>
                                                <input className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-5 py-3 rounded-xl font-medium focus:outline-none focus:border-[#f89e35]" required value={jobForm.company} onChange={e => setJobForm({...jobForm, company: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Poster Name *</label>
                                                <input className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-5 py-3 rounded-xl font-medium focus:outline-none focus:border-[#f89e35]" placeholder="Your full name" required value={jobForm.posterName} onChange={e => setJobForm({...jobForm, posterName: e.target.value})} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Type *</label>
                                                <select className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-5 py-3 rounded-xl font-medium focus:outline-none focus:border-[#f89e35]" value={jobForm.type} onChange={e => setJobForm({...jobForm, type: e.target.value})}>
                                                    {JOB_TYPES.filter(t=>t!=='All').map(t=><option key={t}>{t}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Location *</label>
                                                <select className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-5 py-3 rounded-xl font-medium focus:outline-none focus:border-[#f89e35]" value={jobForm.location} onChange={e => setJobForm({...jobForm, location: e.target.value})}>
                                                    {JOB_LOCATIONS.filter(l=>l!=='All').map(l=><option key={l}>{l}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Salary Range (Optional)</label>
                                                <input className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-5 py-3 rounded-xl font-medium focus:outline-none focus:border-[#f89e35]" placeholder="e.g. $5k - $10k" value={jobForm.salary} onChange={e => setJobForm({...jobForm, salary: e.target.value})} />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Company Logo (Optional)</label>
                                                <div className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-5 py-2.5 rounded-xl font-medium focus:outline-none hover:border-[#f89e35] cursor-pointer flex items-center justify-between gap-2 overflow-hidden" onClick={() => jobLogoRef.current.click()}>
                                                    <input type="file" ref={jobLogoRef} className="hidden" accept="image/*" onChange={e => { 
                                                        const file = e.target.files[0];
                                                        if(file) {
                                                            setJobForm({...jobForm, companyLogoFile: file});
                                                            setJobLogoPreview(URL.createObjectURL(file));
                                                        }
                                                    }} />
                                                    <div className="flex items-center gap-2 truncate">
                                                        <ImageIcon size={16} className="text-slate-400" />
                                                        <span className="text-sm truncate">{jobForm.companyLogoFile ? jobForm.companyLogoFile.name : 'Choose Logo Image'}</span>
                                                    </div>
                                                    {jobLogoPreview && (
                                                        <div className="relative h-8 w-8 rounded overflow-hidden border border-slate-200 shrink-0">
                                                            <img src={jobLogoPreview} className="w-full h-full object-cover" alt="Logo preview" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Job Description *</label>
                                            <textarea className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-5 py-3 rounded-xl font-medium focus:outline-none focus:border-[#f89e35] min-h-[80px]" required value={jobForm.description} onChange={e => setJobForm({...jobForm, description: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Requirements</label>
                                            <textarea className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-5 py-3 rounded-xl font-medium focus:outline-none focus:border-[#f89e35] min-h-[80px]" value={jobForm.requirements} onChange={e => setJobForm({...jobForm, requirements: e.target.value})} />
                                        </div>
                                        
                                        <div className="pt-4 mt-2 border-t border-slate-100">
                                            <h4 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2"><LinkIcon size={16} className="text-[#f89e35]"/> Application Links (Fill at least one)</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Website URL</label>
                                                    <input type="url" placeholder="https://..." className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-xl font-medium focus:outline-none focus:border-[#f89e35] text-sm" value={jobForm.contactWebsite} onChange={e => setJobForm({...jobForm, contactWebsite: e.target.value})} />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">WhatsApp Number</label>
                                                    <input type="tel" placeholder="+234..." className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-xl font-medium focus:outline-none focus:border-[#f89e35] text-sm" value={jobForm.phone} onChange={e => setJobForm({...jobForm, phone: e.target.value})} />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Contact Email</label>
                                                    <input type="email" placeholder="hr@..." className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-xl font-medium focus:outline-none focus:border-[#f89e35] text-sm" value={jobForm.contactEmail} onChange={e => setJobForm({...jobForm, contactEmail: e.target.value})} />
                                                </div>
                                            </div>
                                        </div>

                                        <button type="submit" disabled={submitting || (!jobForm.contactWebsite && !jobForm.phone && !jobForm.contactEmail)} className="w-full bg-slate-900 hover:bg-[#f89e35] text-white font-black text-sm py-4 rounded-xl transition-all shadow-md mt-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-900">
                                            {submitting ? 'Submitting...' : (!jobForm.contactWebsite && !jobForm.phone && !jobForm.contactEmail) ? 'Provide at least 1 contact info' : 'Post Job'}
                                        </button>
                                    </form>
                                )}
                            </motion.div>
                        )}
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
