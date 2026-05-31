'use client';
import { useState, useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { LayoutDashboard, FileText, MessageSquare, Briefcase, LogOut, Loader2, Trash2, Plus, Users, Wrench, Menu, X, Megaphone, Activity, ShoppingBag, Youtube, Rss, Image as ImageIcon, TrendingUp, Tag, Reply, Send, Eye, Heart, Share2, Box, ArrowRight, Shield, Camera, CheckCircle, XCircle, Clock, Video, Tv, Play, Volume2, ShieldAlert, BarChart2, TrendingDown, DollarSign, CheckSquare, Smartphone, Edit, Calendar, AlertTriangle, KeyRound } from 'lucide-react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import API_BASE_URL, { BASE_URL } from '@/lib/api';
import LoadingButton from '@/components/LoadingButton';
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

    // New tabs state
    const [pendingJobs, setPendingJobs] = useState([]);
    const [allJobs, setAllJobs] = useState([]);
    const [activeAdminJobPreview, setActiveAdminJobPreview] = useState(null);
    const [scams, setScams] = useState([]);
    const [galleryItems, setGalleryItems] = useState([]);
    const [newGalleryItem, setNewGalleryItem] = useState({ image: '', images: [], title: '', description: '' });
    const [galleryPreview, setGalleryPreview] = useState('');
    const [scamAdminReplies, setScamAdminReplies] = useState({});
    const [scamComments, setScamComments] = useState({});
    const [activeScamComments, setActiveScamComments] = useState(null);

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
    const [scamReplyImagePreviews, setScamReplyImagePreviews] = useState({});

    // --- Livestream State ---
    const [livestreams, setLivestreams] = useState([]);
    const [streamRequests, setStreamRequests] = useState([]);
    const [registeredViewers, setRegisteredViewers] = useState([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamTitle, setStreamTitle] = useState('');
    const [streamDescription, setStreamDescription] = useState('');
    const [currentStreamId, setCurrentStreamId] = useState(null);
    const [connectedViewers, setConnectedViewers] = useState([]);
    const [uploadingRecording, setUploadingRecording] = useState(false);
    const [isEndModalOpen, setIsEndModalOpen] = useState(false);
    const [localStreamRefState, setLocalStreamRefState] = useState(null);

    // --- CRM Suite State ---
    const [crmTab, setCrmTab] = useState('overview');
    const [staff, setStaff] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [repairs, setRepairs] = useState([]);
    const [stock, setStock] = useState([]);
    const [accounting, setAccounting] = useState({ entries: [], totalInflow: 0, totalOutflow: 0, cashRegister: 0 });
    const [reports, setReports] = useState([]);
    const [socialAccounts, setSocialAccounts] = useState([]);
    const [feedbackLogs, setFeedbackLogs] = useState([]);
    const [videoUrl, setVideoUrl] = useState('');
    const [remixResult, setRemixResult] = useState(null);
    const [remixLoading, setRemixLoading] = useState(false);
    const [postingLoading, setPostingLoading] = useState(false);
    const [postContent, setPostContent] = useState('');
    const [postMediaUrl, setPostMediaUrl] = useState('');
    const [selectedSocials, setSelectedSocials] = useState({});
    const [socialForm, setSocialForm] = useState({ platform: 'facebook', accountName: '', accessToken: '', pageId: '' });
    const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', role: 'technician' });
    const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', address: '', notes: '' });
    const [newRepair, setNewRepair] = useState({ customerId: '', device: '', serialNumber: '', issue: '', price: 0, partsNeeded: '' });
    const [newStock, setNewStock] = useState({ name: '', sku: '', quantity: 0, unitPrice: 0, reorderLevel: 5, category: 'General' });
    const [newLedger, setNewLedger] = useState({ type: 'inflow', category: 'Repair Payment', amount: 0, description: '' });
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
    const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);

    const adminLocalVideoRef = useRef(null);
    const adminLocalStreamRef = useRef(null);
    const adminSocketRef = useRef(null);
    const peerConnectionsRef = useRef({}); // { viewerSocketId: RTCPeerConnection }
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);

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
    
    // --- CRM CRUD Actions ---
    const handleCreateStaff = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE_URL}/crm/staff`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStaff)
            });
            if (res.ok) {
                toast.success('Staff member registered');
                setNewStaff({ name: '', email: '', password: '', role: 'technician' });
                setIsStaffModalOpen(false);
                fetchData();
            } else {
                const data = await res.json();
                toast.error(data.message || 'Error creating staff');
            }
        } catch (err) { toast.error('Error'); }
    };

    const handleDeleteStaff = async (id) => {
        if (!confirm('Delete this staff member?')) return;
        try {
            await fetch(`${API_BASE_URL}/crm/staff/${id}`, { method: 'DELETE' });
            toast.success('Staff deleted');
            fetchData();
        } catch (err) { toast.error('Error'); }
    };

    const handleCreateCustomer = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE_URL}/crm/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCustomer)
            });
            if (res.ok) {
                toast.success('Customer registered');
                setNewCustomer({ name: '', email: '', phone: '', address: '', notes: '' });
                setIsCustomerModalOpen(false);
                fetchData();
            } else {
                toast.error('Error creating customer');
            }
        } catch (err) { toast.error('Error'); }
    };

    const handleCreateRepair = async (e) => {
        e.preventDefault();
        try {
            const partsArr = newRepair.partsNeeded.split(',').map(p => p.trim()).filter(Boolean);
            const payload = {
                customer: newRepair.customerId,
                device: newRepair.device,
                serialNumber: newRepair.serialNumber,
                issue: newRepair.issue,
                price: parseFloat(newRepair.price) || 0,
                partsNeeded: partsArr,
                status: 'intake'
            };
            const res = await fetch(`${API_BASE_URL}/crm/repairs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                toast.success('Repair Job Created');
                setNewRepair({ customerId: '', device: '', serialNumber: '', issue: '', price: 0, partsNeeded: '' });
                setIsJobModalOpen(false);
                fetchData();
            } else {
                toast.error('Error creating job');
            }
        } catch (err) { toast.error('Error'); }
    };

    const updateRepairStatus = async (jobId, nextStatus) => {
        try {
            const res = await fetch(`${API_BASE_URL}/crm/repairs/${jobId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: nextStatus })
            });
            if (res.ok) {
                toast.success(`Job status updated to ${nextStatus}`);
                fetchData();
            } else {
                const data = await res.json();
                toast.error(data.message || 'Status update failed');
            }
        } catch (err) { toast.error('Error'); }
    };

    const generateFeedbackLink = async (jobId, customerId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/crm/feedback/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId, customerId })
            });
            if (res.ok) {
                const data = await res.json();
                const feedbackLink = `${window.location.origin}/feedback/${data.token}`;
                navigator.clipboard.writeText(feedbackLink);
                toast.success('Feedback link generated & copied to clipboard! 📋');
            } else {
                toast.error('Failed to generate feedback link');
            }
        } catch (err) { toast.error('Error'); }
    };

    const handleCreateStock = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE_URL}/crm/stock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStock)
            });
            if (res.ok) {
                toast.success('Inventory stock added');
                setNewStock({ name: '', sku: '', quantity: 0, unitPrice: 0, reorderLevel: 5, category: 'General' });
                setIsStockModalOpen(false);
                fetchData();
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to add stock item');
            }
        } catch (err) { toast.error('Error'); }
    };

    const handleCreateLedger = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE_URL}/crm/accounting`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newLedger)
            });
            if (res.ok) {
                toast.success('Transaction logged in ledger');
                setNewLedger({ type: 'inflow', category: 'Repair Payment', amount: 0, description: '' });
                setIsLedgerModalOpen(false);
                fetchData();
            } else {
                toast.error('Failed to register transaction');
            }
        } catch (err) { toast.error('Error'); }
    };

    const handleVideoRemix = async (e) => {
        e.preventDefault();
        if (!videoUrl) return toast.error('Enter a social media URL first');
        setRemixLoading(true);
        setRemixResult(null);
        toast.loading('Downloading video, blurring watermarks, and stamping logo...', { id: 'remix' });
        try {
            const res = await fetch(`${API_BASE_URL}/crm/video-remix`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: videoUrl })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setRemixResult(data);
                toast.success('Video remixed successfully! Ready to download.', { id: 'remix' });
            } else {
                toast.error(data.message || 'Watermark removal failed', { id: 'remix' });
            }
        } catch (err) {
            toast.error('Failed to process video remixing.', { id: 'remix' });
        } finally {
            setRemixLoading(false);
        }
    };

    const handleConnectSocial = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE_URL}/crm/social/accounts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(socialForm)
            });
            if (res.ok) {
                toast.success(`Connected to ${socialForm.platform}!`);
                setSocialForm({ platform: 'facebook', accountName: '', accessToken: '', pageId: '' });
                setIsSocialModalOpen(false);
                fetchData();
            } else {
                toast.error('Failed to link social account');
            }
        } catch (e) { toast.error('Connection API Error'); }
    };

    const handleDisconnectSocial = async (id) => {
        if (!confirm('Disconnect this account?')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/crm/social/accounts/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success('Social account removed');
                fetchData();
            }
        } catch (e) {}
    };

    const handlePublishPost = async (e) => {
        e.preventDefault();
        const activeAccountIds = Object.keys(selectedSocials).filter(id => selectedSocials[id]);
        if (activeAccountIds.length === 0) return toast.error('Select at least one account to post to');
        if (!postContent.trim()) return toast.error('Write some message first');
        setPostingLoading(true);
        toast.loading('Publishing updates to connected platforms...', { id: 'post' });
        try {
            const res = await fetch(`${API_BASE_URL}/crm/social/post`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountIds: activeAccountIds,
                    content: postContent,
                    mediaUrl: postMediaUrl
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                const fails = data.results.filter(r => r.status === 'failed');
                if (fails.length === 0) {
                    toast.success('Successfully published to all platforms! 🎉', { id: 'post' });
                    setPostContent('');
                    setPostMediaUrl('');
                    setSelectedSocials({});
                } else {
                    toast.error(`Published with ${fails.length} failures. Check log.`, { id: 'post' });
                }
            } else {
                toast.error(data.message || 'Posting failed', { id: 'post' });
            }
        } catch (err) {
            toast.error('Failed to post', { id: 'post' });
        } finally {
            setPostingLoading(false);
        }
    };

    // --- HTML5 KANBAN DRAG & DROP HANDLERS ---
    const handleDragStart = (e, id) => {
        e.dataTransfer.setData('jobId', id);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, columnStatus) => {
        const jobId = e.dataTransfer.getData('jobId');
        if (jobId) {
            updateRepairStatus(jobId, columnStatus);
        }
    };

    const logout = () => {
        localStorage.removeItem('adminToken');
        setIsAuthenticated(false);
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
            } else if (activeTab === 'jobs-review') {
                const [allRes, pendRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/jobs?all=true`),
                    fetch(`${API_BASE_URL}/jobs?all=true`)
                ]);
                if (allRes.ok) {
                    const all = await allRes.json();
                    setAllJobs(all);
                    setPendingJobs(all.filter(j => j.status === 'pending'));
                }
            } else if (activeTab === 'scam-admin') {
                const res = await fetch(`${API_BASE_URL}/scams`);
                if (res.ok) setScams(await res.json());
            } else if (activeTab === 'gallery-admin') {
                const res = await fetch(`${API_BASE_URL}/gallery`);
                if (res.ok) setGalleryItems(await res.json());
            } else if (activeTab === 'livestream-admin') {
                const streamsRes = await fetch(`${API_BASE_URL}/streams`);
                const viewersRes = await fetch(`${API_BASE_URL}/streams/admin/viewers`);
                const requestsRes = await fetch(`${API_BASE_URL}/streams/admin/requests`);
                if (streamsRes.ok) setLivestreams(await streamsRes.json());
                if (viewersRes.ok) setRegisteredViewers(await viewersRes.json());
                if (requestsRes.ok) setStreamRequests(await requestsRes.json());
            } else if (activeTab === 'crm') {
                const [repRes, custRes, stockRes, acctRes, staffRes, repListRes, socRes, feedRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/crm/repairs`),
                    fetch(`${API_BASE_URL}/crm/customers`),
                    fetch(`${API_BASE_URL}/crm/stock`),
                    fetch(`${API_BASE_URL}/crm/accounting`),
                    fetch(`${API_BASE_URL}/crm/staff`),
                    fetch(`${API_BASE_URL}/crm/reports`),
                    fetch(`${API_BASE_URL}/crm/social/accounts`),
                    fetch(`${API_BASE_URL}/crm/feedback/all`)
                ]);
                if (repRes.ok) setRepairs(await repRes.json());
                if (custRes.ok) setCustomers(await custRes.json());
                if (stockRes.ok) setStock(await stockRes.json());
                if (acctRes.ok) setAccounting(await acctRes.json());
                if (staffRes.ok) setStaff(await staffRes.json());
                if (repListRes.ok) setReports(await repListRes.json());
                if (socRes.ok) setSocialAccounts(await socRes.json());
                if (feedRes.ok) setFeedbackLogs(await feedRes.json());
            }
        } catch (err) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    // --- Start screen sharing streaming ---
    const startScreenStream = async (e) => {
        e.preventDefault();
        if (!streamTitle) {
            toast.error('Please enter a title for the stream.');
            return;
        }

        try {
            // Capture screen stream with audio
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    displaySurface: "monitor",
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 30 }
                },
                audio: true
            });

            adminLocalStreamRef.current = displayStream;
            setLocalStreamRefState(displayStream);

            // Create new stream record in MongoDB
            const res = await fetch(`${API_BASE_URL}/streams`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: streamTitle, description: streamDescription })
            });
            const streamData = await res.json();

            if (!res.ok) {
                displayStream.getTracks().forEach(t => t.stop());
                toast.error(streamData.message || 'Failed to initialize database stream.');
                return;
            }

            setCurrentStreamId(streamData._id);
            setIsStreaming(true);
            setConnectedViewers([]);
            toast.success('Livestream successfully initialized!');

            // Bind stream preview to video tag
            setTimeout(() => {
                if (adminLocalVideoRef.current) {
                    adminLocalVideoRef.current.srcObject = displayStream;
                }
            }, 300);

            // Start recording in the background using MediaRecorder
            recordedChunksRef.current = [];
            let options = { mimeType: 'video/webm;codecs=vp9,opus' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options = { mimeType: 'video/webm;codecs=vp8,opus' };
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    options = { mimeType: 'video/webm' };
                }
            }

            const recorder = new MediaRecorder(displayStream, options);
            mediaRecorderRef.current = recorder;
            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };
            recorder.start(1000); // chunk every 1 second

            // Initialize Socket.io Connection
            const socket = io(BASE_URL);
            adminSocketRef.current = socket;

            socket.on('connect', () => {
                console.log('Admin socket signaling connected');
                socket.emit('join-room', { room: `stream_${streamData._id}`, role: 'admin' });
            });

            // Listen for new viewers joining the WebRTC room
            socket.on('viewer-joined', async ({ socketId }) => {
                console.log(`New viewer joined room: ${socketId}`);
                setConnectedViewers(prev => [...new Set([...prev, socketId])]);

                // Establish WebRTC connection for this viewer
                const pc = new RTCPeerConnection({
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' }
                    ]
                });
                peerConnectionsRef.current[socketId] = pc;

                // Add display and audio tracks to peer connection
                displayStream.getTracks().forEach(track => {
                    pc.addTrack(track, displayStream);
                });

                // Listen for local ICE candidates to forward to this viewer
                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        socket.emit('ice-candidate', { candidate: event.candidate, targetSocketId: socketId });
                    }
                };

                // Create offer to send to the viewer
                try {
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socket.emit('offer', { sdp: pc.localDescription, targetSocketId: socketId });
                } catch (err) {
                    console.error('Failed to create/send offer to viewer', err);
                }
            });

            // Receive WebRTC answer from viewer
            socket.on('answer', async ({ sdp, senderSocketId }) => {
                console.log(`Received answer from viewer: ${senderSocketId}`);
                const pc = peerConnectionsRef.current[senderSocketId];
                if (pc) {
                    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                }
            });

            // Receive viewer ICE candidates
            socket.on('ice-candidate', async ({ candidate, senderSocketId }) => {
                const pc = peerConnectionsRef.current[senderSocketId];
                if (pc) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    } catch (e) {
                        console.error('Error adding ICE candidate from viewer', e);
                    }
                }
            });

            // Handle viewer disconnects
            socket.on('peer-disconnected', ({ socketId }) => {
                console.log(`Viewer disconnected socket: ${socketId}`);
                setConnectedViewers(prev => prev.filter(id => id !== socketId));
                if (peerConnectionsRef.current[socketId]) {
                    peerConnectionsRef.current[socketId].close();
                    delete peerConnectionsRef.current[socketId];
                }
            });

            // Handle when screen capture is stopped natively via browser "Stop sharing" bar
            displayStream.getVideoTracks()[0].onended = () => {
                console.log('Screen capture stopped natively by admin.');
                setIsEndModalOpen(true);
            };

        } catch (err) {
            console.error(err);
            toast.error('Screen capture cancelled or permission denied.');
        }
    };

    // End active screen streaming
    const endScreenStream = async (keepRewatchable) => {
        setIsEndModalOpen(false);
        setUploadingRecording(true);

        try {
            // Stop recorder and get video blob
            let videoUrl = '';
            if (keepRewatchable && mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                const blob = await new Promise((resolve) => {
                    mediaRecorderRef.current.onstop = () => {
                        const compiledBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                        resolve(compiledBlob);
                    };
                    mediaRecorderRef.current.stop();
                });

                if (blob && blob.size > 1024) {
                    // Upload to Cloudinary
                    toast.loading('Saving recorded session. Uploading to Cloudinary...', { id: 'upload' });
                    const file = new File([blob], 'stream_record.webm', { type: 'video/webm' });
                    const formData = new FormData();
                    formData.append('file', file);

                    const uploadRes = await fetch(`${API_BASE_URL.replace('/api', '')}/api/upload`, {
                        method: 'POST',
                        body: formData
                    });
                    const uploadData = await uploadRes.json();
                    
                    if (uploadRes.ok && uploadData.url) {
                        videoUrl = uploadData.url;
                        toast.success('Recording saved successfully!', { id: 'upload' });
                    } else {
                        toast.error('Failed to upload recording to server.', { id: 'upload' });
                    }
                } else {
                    toast.error('Recording file is empty or corrupted.');
                }
            } else if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }

            // Cleanup WebRTC connections
            Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
            peerConnectionsRef.current = {};

            // Stop local display stream tracks
            if (adminLocalStreamRef.current) {
                adminLocalStreamRef.current.getTracks().forEach(track => track.stop());
                adminLocalStreamRef.current = null;
                setLocalStreamRefState(null);
            }

            if (adminLocalVideoRef.current) {
                adminLocalVideoRef.current.srcObject = null;
            }

            // Disconnect socket signaling channel
            if (adminSocketRef.current) {
                adminSocketRef.current.disconnect();
                adminSocketRef.current = null;
            }

            if (keepRewatchable && videoUrl) {
                // Call End API with recording URL
                await fetch(`${API_BASE_URL}/streams/${currentStreamId}/end`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ videoUrl, rewatchable: true })
                });
                toast.success('Livestream ended. Recording is now rewatchable.');
            } else {
                // Delete stream entirely
                await fetch(`${API_BASE_URL}/streams/${currentStreamId}`, {
                    method: 'DELETE'
                });
                toast.success('Livestream stopped and deleted entirely.');
            }

            setIsStreaming(false);
            setCurrentStreamId(null);
            setStreamTitle('');
            setStreamDescription('');
            fetchData(); // Refresh list

        } catch (err) {
            console.error('Error ending stream', err);
            toast.error('Error occurred while stopping livestream.');
        } finally {
            setUploadingRecording(false);
        }
    };

    // Dismiss stream request
    const clearStreamRequest = async (id) => {
        try {
            await fetch(`${API_BASE_URL}/streams/admin/requests/${id}`, { method: 'DELETE' });
            toast.success('Stream request dismissed.');
            // Refresh requests list
            const requestsRes = await fetch(`${API_BASE_URL}/streams/admin/requests`);
            if (requestsRes.ok) setStreamRequests(await requestsRes.json());
        } catch (err) {
            toast.error('Failed to dismiss request.');
        }
    };

    // Dismiss stream recording entirely
    const deleteStreamRecord = async (id) => {
        if (!confirm('Delete this livestream recording entirely?')) return;
        try {
            await fetch(`${API_BASE_URL}/streams/${id}`, { method: 'DELETE' });
            toast.success('Recording deleted.');
            // Refresh
            const streamsRes = await fetch(`${API_BASE_URL}/streams`);
            if (streamsRes.ok) setLivestreams(await streamsRes.json());
        } catch (err) {
            toast.error('Failed to delete recording.');
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
                                        { id: 'jobs-review', icon: CheckCircle, label: 'Job Listings' },
                                        { id: 'scam-admin', icon: Shield, label: 'Scam Reports' },
                                        { id: 'gallery-admin', icon: Camera, label: 'Gallery Manager' },
                                        { id: 'service-requests', icon: Wrench, label: 'Service Requests' },
                                        { id: 'careers', icon: Users, label: 'Careers' },
                                        { id: 'messages', icon: MessageSquare, label: 'Messages' },
                                        { id: 'livestream-admin', icon: Video, label: 'Livestream Manager' },
                                        { id: 'crm', icon: BarChart2, label: 'CRM Suite' },
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
                                        <p className="text-[11px] text-slate-400 mt-1 font-medium">Video will be displayed on the product page.</p>
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
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-600">L</div>
                                                <div>
                                                    <div className="font-bold text-slate-900">Lala Tech</div>
                                                    <div className="text-xs font-semibold text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            {/* Engagement stats */}
                                            <div className="flex items-center gap-3 text-xs font-bold">
                                                <span className="flex items-center gap-1 text-red-400 bg-red-50 px-2 py-1 rounded-full">
                                                    <Heart className="w-3.5 h-3.5" fill="currentColor" /> {p.likes || 0}
                                                </span>
                                                <span className="flex items-center gap-1 text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                                                    <Share2 className="w-3.5 h-3.5" /> {p.shares || 0}
                                                </span>
                                                <a href={`/feed/${p._id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#f89e35] bg-orange-50 px-2 py-1 rounded-full hover:bg-orange-100">
                                                    <Eye className="w-3.5 h-3.5" /> View
                                                </a>
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
                                                                                <LoadingButton 
                                                                                    onClick={() => sendAdminReply(comment._id, p._id)}
                                                                                    className="bg-[#f89e35] text-white p-1.5 rounded-lg hover:bg-orange-600"
                                                                                    showSpinner={false}
                                                                                >
                                                                                    <Reply className="w-3.5 h-3.5" />
                                                                                </LoadingButton>
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
                                        <LoadingButton
                                            onClick={() => deleteFeedPost(p._id)}
                                            className="absolute top-6 right-6 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                                            showSpinner={false}
                                        ><Trash2 className="w-5 h-5" /></LoadingButton>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'jobs-review' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">Job Listings</h1>
                            <p className="text-slate-500 font-medium mb-8">Review public job submissions and approve or reject them.</p>

                            <div className="flex gap-4 mb-6">
                                <div className="bg-white border rounded-2xl px-5 py-3 flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-amber-500" />
                                    <div><div className="text-xl font-black text-slate-900">{allJobs.filter(j => j.status === 'pending').length}</div><div className="text-xs text-slate-400 font-bold uppercase tracking-wide">Pending</div></div>
                                </div>
                                <div className="bg-white border rounded-2xl px-5 py-3 flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    <div><div className="text-xl font-black text-slate-900">{allJobs.filter(j => j.status === 'approved').length}</div><div className="text-xs text-slate-400 font-bold uppercase tracking-wide">Approved</div></div>
                                </div>
                                <div className="bg-white border rounded-2xl px-5 py-3 flex items-center gap-3">
                                    <XCircle className="w-5 h-5 text-red-400" />
                                    <div><div className="text-xl font-black text-slate-900">{allJobs.filter(j => j.status === 'rejected').length}</div><div className="text-xs text-slate-400 font-bold uppercase tracking-wide">Rejected</div></div>
                                </div>
                            </div>

                            <div className="space-y-4 max-w-4xl">
                                {allJobs.map(job => (
                                    <div key={job._id} className="bg-white border rounded-3xl p-6 flex flex-col md:flex-row justify-between gap-4 shadow-sm hover:shadow-md transition overflow-hidden">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-4 mt-1">
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                    job.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                    job.status === 'rejected' ? 'bg-red-100 text-red-600' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>{job.status || 'pending'}</span>
                                                <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-bold">{job.type}</span>
                                                <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-bold">{job.location}</span>
                                            </div>
                                            
                                            <div className="flex items-center gap-4 mb-3">
                                                {job.companyLogo ? (
                                                    <img src={job.companyLogo} className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0" alt="logo" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#f89e35] to-[#f56e00] flex items-center justify-center text-white font-black text-lg flex-shrink-0">{(job.company || job.title || 'J')[0].toUpperCase()}</div>
                                                )}
                                                <div className="min-w-0">
                                                    <h4 className="font-black text-slate-900 text-lg leading-tight truncate">{job.title}</h4>
                                                    <p className="text-sm text-slate-500 font-bold truncate">{job.company}</p>
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-600 line-clamp-3 break-words overflow-hidden">{job.description}</p>
                                        </div>
                                        <div className="flex md:flex-col gap-2 items-start md:items-end justify-end flex-shrink-0">
                                            <button onClick={() => setActiveAdminJobPreview(job)} className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black px-4 py-2 rounded-xl transition w-full md:w-auto">
                                                <Eye className="w-3.5 h-3.5" /> Preview Look
                                            </button>
                                            {job.status !== 'approved' && (
                                                <LoadingButton
                                                    onClick={async () => {
                                                        await fetch(`${API_BASE_URL}/jobs/${job._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'approved' }) });
                                                        toast.success('Job approved!');
                                                        fetchData();
                                                    }}
                                                    className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black px-4 py-2 rounded-xl"
                                                ><CheckCircle className="w-3.5 h-3.5" /> Approve</LoadingButton>
                                            )}
                                            {job.status !== 'rejected' && (
                                                <LoadingButton
                                                    onClick={async () => {
                                                        await fetch(`${API_BASE_URL}/jobs/${job._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'rejected' }) });
                                                        toast.success('Job rejected');
                                                        fetchData();
                                                    }}
                                                    className="flex items-center gap-1.5 bg-red-100 hover:bg-red-200 text-red-600 text-xs font-black px-4 py-2 rounded-xl"
                                                ><XCircle className="w-3.5 h-3.5" /> Reject</LoadingButton>
                                            )}
                                            <LoadingButton
                                                onClick={async () => { if (!confirm('Delete this job?')) return; await fetch(`${API_BASE_URL}/jobs/${job._id}`, { method: 'DELETE' }); toast.success('Deleted'); fetchData(); }}
                                                className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50"
                                                showSpinner={false}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </LoadingButton>
                                        </div>
                                    </div>
                                ))}
                                {allJobs.length === 0 && !loading && (
                                    <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
                                        <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-slate-400 font-bold">No job submissions yet.</p>
                                    </div>
                                )}
                            </div>

                            {/* Job Preview Modal */}
                            <AnimatePresence>
                                {activeAdminJobPreview && (
                                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                                        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setActiveAdminJobPreview(null)} />
                                        <motion.div initial={{scale:0.95, opacity:0, y:20}} animate={{scale:1, opacity:1, y:0}} exit={{scale:0.95, opacity:0, y:20}} className="bg-white p-8 md:p-10 rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 shadow-2xl scrollbar-hide text-left">
                                            <button className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors" onClick={() => setActiveAdminJobPreview(null)}>
                                                <X size={20} />
                                            </button>

                                            <div className="flex items-center gap-6 mb-6">
                                                {activeAdminJobPreview.companyLogo ? (
                                                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-100 shadow-sm">
                                                        <img src={activeAdminJobPreview.companyLogo} alt={activeAdminJobPreview.company} className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#f89e35] to-[#f56e00] text-white flex items-center justify-center text-2xl font-black shadow-sm">
                                                        {(activeAdminJobPreview.company || activeAdminJobPreview.title || 'J')[0].toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <h2 className="text-2xl font-black text-slate-900 mb-1">{activeAdminJobPreview.title}</h2>
                                                    <p className="text-slate-600 font-bold flex items-center gap-2">
                                                        {activeAdminJobPreview.company}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-2 mb-6">
                                                <span className="inline-flex items-center bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1 rounded-full text-xs font-bold uppercase">{activeAdminJobPreview.type}</span>
                                                <span className="inline-flex items-center bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1 rounded-full text-xs font-bold uppercase">{activeAdminJobPreview.location}</span>
                                                {activeAdminJobPreview.salary && (
                                                    <span className="inline-flex items-center bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                                        💰 {activeAdminJobPreview.salary}
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap break-words mb-6">{activeAdminJobPreview.description}</p>
                                            
                                            {activeAdminJobPreview.requirements && (
                                                <div className="mb-6">
                                                    <h5 className="font-black text-slate-900 text-sm mb-2">Requirements</h5>
                                                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap break-words">{activeAdminJobPreview.requirements}</p>
                                                </div>
                                            )}

                                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6">
                                                <div className="grid grid-cols-2 gap-4 text-sm font-medium text-slate-600">
                                                    <div><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Posted By</span> {activeAdminJobPreview.posterName || 'Not specified'}</div>
                                                    <div><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Phone</span> {activeAdminJobPreview.phone || 'N/A'}</div>
                                                    <div><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Email</span> {activeAdminJobPreview.contactEmail || 'N/A'}</div>
                                                    <div className="truncate"><span className="text-slate-400 block text-xs uppercase font-bold mb-1">Website</span> {activeAdminJobPreview.contactWebsite || 'N/A'}</div>
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                                <button onClick={() => setActiveAdminJobPreview(null)} className="px-5 py-2 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
                                                    Close Preview
                                                </button>
                                                {activeAdminJobPreview.status !== 'approved' && (
                                                    <LoadingButton
                                                        onClick={async () => {
                                                            await fetch(`${API_BASE_URL}/jobs/${activeAdminJobPreview._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'approved' }) });
                                                            toast.success('Job approved!');
                                                            setActiveAdminJobPreview(null);
                                                            fetchData();
                                                        }}
                                                        className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-sm flex items-center gap-1.5"
                                                    >
                                                        <CheckCircle size={16}/> Approve
                                                    </LoadingButton>
                                                )}
                                            </div>
                                        </motion.div>
                                    </div>
                                )}
                            </AnimatePresence>

                        </div>
                    )}

                    {activeTab === 'scam-admin' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">Scam Reports</h1>
                            <p className="text-slate-500 font-medium mb-8">Review community scam reports and add official Lala Tech responses.</p>

                            <div className="space-y-4">
                                {scams.map(scam => (
                                    <div key={scam._id} className="bg-white border rounded-3xl p-6 shadow-sm hover:shadow-md transition">
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-[10px] font-black uppercase bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{scam.category || 'General'}</span>
                                                    <span className="text-[10px] text-slate-400">By {scam.author || 'Anonymous'}</span>
                                                    <span className="text-[10px] text-slate-300">{new Date(scam.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <h4 className="font-black text-slate-900 text-base mb-1">{scam.title}</h4>
                                                <p className="text-sm text-slate-600 line-clamp-3">{scam.description}</p>
                                                <div className="flex gap-3 mt-2 text-xs font-bold text-slate-400">
                                                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {scam.likes || 0}</span>
                                                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {scam.views || 0}</span>
                                                </div>
                                            </div>
                                            <LoadingButton
                                                onClick={async () => { if (!confirm('Delete this report?')) return; await fetch(`${API_BASE_URL}/scams/${scam._id}`, { method: 'DELETE' }); toast.success('Report deleted'); fetchData(); }}
                                                className="text-slate-200 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 flex-shrink-0"
                                                showSpinner={false}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </LoadingButton>
                                        </div>

                                        {/* Official Reply */}
                                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-4 mt-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#f89e35] to-[#f56e00] flex items-center justify-center text-white text-[10px] font-black">LT</div>
                                                <span className="text-xs font-black text-[#f89e35] uppercase tracking-wide">Official Lala Tech Reply</span>
                                            </div>
                                            {scam.adminReply && (
                                                <p className="text-sm text-slate-700 mb-3 italic">Current: "{scam.adminReply}"</p>
                                            )}
                                            <div className="flex flex-col gap-3">
                                                <div className="flex gap-2">
                                                    <input type="text" placeholder="Add or update official response..." value={scamAdminReplies[scam._id] || ''} onChange={e => setScamAdminReplies(p => ({ ...p, [scam._id]: e.target.value }))} className="flex-1 bg-white border border-orange-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#f89e35]" />
                                                    <LoadingButton
                                                        onClick={async () => {
                                                            const text = scamAdminReplies[scam._id]?.trim();
                                                            const imageUrl = scamReplyImagePreviews[scam._id] || scam.adminReplyImage || '';
                                                            if (!text && !imageUrl) return;
                                                            await fetch(`${API_BASE_URL}/scams/${scam._id}`, { 
                                                                method: 'PUT', 
                                                                headers: { 'Content-Type': 'application/json' }, 
                                                                body: JSON.stringify({ adminReply: text, adminReplyImage: imageUrl }) 
                                                            });
                                                            toast.success('Official response saved!');
                                                            setScamAdminReplies(p => ({ ...p, [scam._id]: '' }));
                                                            fetchData();
                                                        }}
                                                        className="bg-[#f89e35] hover:bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5"
                                                    >
                                                        <Send className="w-3.5 h-3.5" /> Save Response
                                                    </LoadingButton>
                                                </div>
                                                
                                                <div className="flex items-center gap-4">
                                                    <div className="relative group flex-shrink-0">
                                                        <input 
                                                            type="file" 
                                                            accept="image/*" 
                                                            onChange={(e) => handleFileUpload(e, (url) => setScamReplyImagePreviews(p => ({...p, [scam._id]: url})))} 
                                                            className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                                                        />
                                                        {scamReplyImagePreviews[scam._id] || scam.adminReplyImage ? (
                                                            <div className="relative h-16 w-24 rounded-lg overflow-hidden border border-orange-200 shadow-sm">
                                                                <img src={scamReplyImagePreviews[scam._id] || scam.adminReplyImage} className="w-full h-full object-cover" alt="Reply Evidence" />
                                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <Camera className="w-4 h-4 text-white" />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="h-16 w-24 rounded-lg border-2 border-dashed border-orange-200 flex flex-col items-center justify-center text-orange-300 hover:text-[#f89e35] hover:border-[#f89e35] transition-all bg-white/50">
                                                                <Camera className="w-5 h-5" />
                                                                <span className="text-[9px] font-bold">Add Image</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {(scamReplyImagePreviews[scam._id] || scam.adminReplyImage) && (
                                                        <button 
                                                            onClick={() => {
                                                                setScamReplyImagePreviews(p => ({...p, [scam._id]: ''}));
                                                                // If we wanted to clear it on server too, we'd need a separate save or just wait for 'Save'
                                                            }} 
                                                            className="text-[10px] font-bold text-red-500 hover:underline"
                                                        >
                                                            Remove Image
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {scams.length === 0 && !loading && (
                                    <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
                                        <Shield className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-slate-400 font-bold">No scam reports submitted yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'gallery-admin' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">Gallery Manager</h1>
                            <p className="text-slate-500 font-medium mb-8">Upload and manage photos for the public gallery page.</p>

                            <div className="bg-white p-6 md:p-8 rounded-3xl border mb-10 max-w-2xl shadow-sm hover:shadow-md transition">
                                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2"><Plus className="w-5 h-5 text-[#f89e35]" /> Add New Photo</h3>
                                <div className="space-y-4">
                                    <input type="text" placeholder="Photo Title (optional)" value={newGalleryItem.title} onChange={e => setNewGalleryItem({ ...newGalleryItem, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl focus:outline-none focus:border-[#f89e35]" />
                                    <input type="text" placeholder="Description (optional)" value={newGalleryItem.description} onChange={e => setNewGalleryItem({ ...newGalleryItem, description: e.target.value })} className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl focus:outline-none focus:border-[#f89e35]" />
                                    <div className="relative group">
                                        <input type="file" multiple accept="image/*" onChange={async (e) => {
                                            const files = Array.from(e.target.files);
                                            if (!files.length) return;
                                            setUploading(true);
                                            try {
                                                const uploadEndpoint = `${API_BASE_URL.replace('/api', '')}/api/upload`;
                                                const urls = [];
                                                for (const file of files) {
                                                    const formData = new FormData();
                                                    formData.append('file', file);
                                                    const res = await fetch(uploadEndpoint, { method: 'POST', body: formData });
                                                    const data = await res.json();
                                                    if (data.url) urls.push(data.url);
                                                }
                                                if (urls.length > 0) {
                                                    setNewGalleryItem(p => ({ ...p, image: urls[0], images: urls }));
                                                    setGalleryPreview(urls[0]);
                                                    toast.success(`${urls.length} photo(s) uploaded!`);
                                                }
                                            } catch(err) {
                                                toast.error('Upload failed');
                                            } finally {
                                                setUploading(false);
                                            }
                                        }} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                        {galleryPreview ? (
                                            <div className="relative">
                                                <img src={galleryPreview} alt="Preview" className="w-full h-56 object-cover rounded-xl border border-slate-200" />
                                                {newGalleryItem.images?.length > 1 && (
                                                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                                                        + {newGalleryItem.images.length - 1} More
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Click to change'}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-full py-12 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center gap-2 justify-center text-slate-400 font-bold bg-white group-hover:text-[#f89e35] group-hover:border-[#f89e35] transition-all">
                                                {uploading ? <Loader2 className="w-6 h-6 animate-spin text-[#f89e35]" /> : <Camera className="w-8 h-8" />}
                                                <span>Upload Photo(s)</span>
                                                <span className="text-[11px] font-normal">JPG, PNG, WebP</span>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        disabled={uploading || !newGalleryItem.image}
                                        onClick={async () => {
                                            if (!newGalleryItem.image) return;
                                            await fetch(`${API_BASE_URL}/gallery`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newGalleryItem) });
                                            toast.success('Added to gallery!');
                                            setNewGalleryItem({ image: '', images: [], title: '', description: '' });
                                            setGalleryPreview('');
                                            fetchData();
                                        }}
                                        className="w-full bg-[#110f0e] disabled:opacity-50 text-white py-3 rounded-xl font-black hover:bg-slate-800 transition"
                                    >Add to Gallery</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {galleryItems.map(item => (
                                    <div key={item._id} className="relative group rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition">
                                        <img src={item.image} alt={item.title || 'Gallery'} className="w-full aspect-square object-cover" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex flex-col justify-end p-3">
                                            {item.title && <p className="text-white font-bold text-xs opacity-0 group-hover:opacity-100 transition mb-1">{item.title}</p>}
                                            <button onClick={async () => { if (!confirm('Delete photo?')) return; await fetch(`${API_BASE_URL}/gallery/${item._id}`, { method: 'DELETE' }); toast.success('Photo deleted'); fetchData(); }} className="opacity-0 group-hover:opacity-100 w-full bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1.5 rounded-lg transition flex items-center justify-center gap-1">
                                                <Trash2 className="w-3 h-3" /> Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {galleryItems.length === 0 && !loading && (
                                    <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
                                        <Camera className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                        <p className="text-slate-400 font-bold">Gallery is empty. Upload your first photo!</p>
                                    </div>
                                )}
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

                    {activeTab === 'livestream-admin' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">Livestream Manager</h1>
                            <p className="text-slate-500 font-medium mb-8">Manage real-time WebRTC screen sharing sessions, active stream requests, and registered friends access logs.</p>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                                {/* Left/Middle Column: Screen Share Controller */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm relative overflow-hidden transition hover:shadow-lg">
                                        <h3 className="font-bold text-slate-900 text-xl mb-6 flex items-center gap-2">
                                            <Tv className="w-5 h-5 text-[#f89e35]" /> Broadcast Control Panel
                                        </h3>

                                        {isStreaming ? (
                                            <div className="space-y-6">
                                                {/* Active Streaming Stats */}
                                                <div className="bg-[#fff7ed] border border-[#ffedd5] rounded-2xl p-5 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
                                                        <span className="text-sm font-black text-[#ea580c] uppercase tracking-wider">Currently Live</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xs font-bold text-slate-400 block uppercase">Viewers Syncing</span>
                                                        <span className="text-lg font-black text-[#110f0e]">{connectedViewers.length} friends connected</span>
                                                    </div>
                                                </div>

                                                {/* Local Screen Video Preview */}
                                                <div className="aspect-video bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative shadow-inner">
                                                    <video 
                                                        ref={adminLocalVideoRef} 
                                                        autoPlay 
                                                        muted 
                                                        playsInline 
                                                        className="w-full h-full object-contain"
                                                    />
                                                    <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1.5 rounded-lg text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-sm">
                                                        <Volume2 className="w-3.5 h-3.5 text-[#f89e35]" /> System Audio Captured
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => setIsEndModalOpen(true)}
                                                    disabled={uploadingRecording}
                                                    className="w-full bg-red-500 hover:bg-red-650 text-white font-black py-4 rounded-2xl transition shadow-lg shadow-red-500/10 flex items-center justify-center gap-2"
                                                >
                                                    {uploadingRecording ? 'Finalizing Stream...' : '✕ Stop Screen Share'}
                                                </button>
                                            </div>
                                        ) : (
                                            <form onSubmit={startScreenStream} className="space-y-5">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Stream Title</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="What are you sharing? (e.g. Anime Night)" 
                                                        value={streamTitle}
                                                        onChange={(e) => setStreamTitle(e.target.value)}
                                                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl focus:outline-none focus:border-[#f89e35] text-slate-900 font-bold"
                                                        required
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Description (Optional)</label>
                                                    <textarea 
                                                        placeholder="Add a custom description for your friends..." 
                                                        value={streamDescription}
                                                        onChange={(e) => setStreamDescription(e.target.value)}
                                                        className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl focus:outline-none focus:border-[#f89e35] min-h-[100px] text-slate-900 font-medium"
                                                    />
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={uploadingRecording}
                                                    className="w-full bg-[#110f0e] hover:bg-slate-800 text-white font-black py-4 rounded-2xl transition shadow-xl flex items-center justify-center gap-2"
                                                >
                                                    <Tv className="w-5 h-5 text-[#f89e35]" /> Start Screen Broadcast ➔
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </div>

                                {/* Right Column: Pending Requests from Friends */}
                                <div className="space-y-6">
                                    <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm transition hover:shadow-lg">
                                        <h3 className="font-bold text-slate-900 text-lg mb-6 flex items-center gap-2">
                                            <ShieldAlert className="w-5 h-5 text-[#f89e35]" /> Livestream Requests ({streamRequests.length})
                                        </h3>

                                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                            {streamRequests.length > 0 ? (
                                                streamRequests.map(request => (
                                                    <div key={request._id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between gap-3 relative group">
                                                        <div>
                                                            <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded border text-slate-450 uppercase tracking-widest">{request.viewerEmail}</span>
                                                            <h4 className="font-black text-slate-850 text-xs mt-1.5">{request.title}</h4>
                                                            <p className="text-[10px] text-slate-400 font-semibold mt-1">{new Date(request.createdAt).toLocaleString()}</p>
                                                        </div>
                                                        <div className="flex gap-2 mt-1">
                                                            <button
                                                                onClick={() => {
                                                                    setStreamTitle(`Stream for ${request.viewerEmail.split('@')[0]}`);
                                                                    setStreamDescription(`Livestream requested by ${request.viewerEmail}.`);
                                                                    toast.success('Pre-filled stream info! Start capture above.');
                                                                }}
                                                                className="flex-1 bg-[#110f0e] hover:bg-slate-850 text-white font-black text-[10px] uppercase tracking-wider py-2 rounded-xl transition cursor-pointer"
                                                            >
                                                                Accept
                                                            </button>
                                                            <button
                                                                onClick={() => clearStreamRequest(request._id)}
                                                                className="bg-slate-200 hover:bg-red-50 hover:text-red-505 text-slate-650 font-black text-[10px] uppercase tracking-wider px-3 py-2 rounded-xl transition cursor-pointer"
                                                            >
                                                                Dismiss
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-10 text-slate-450 text-sm font-medium">
                                                    No pending livestream requests.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Registered Friends Logs & Tokens */}
                            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden transition hover:shadow-lg mb-10">
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                        <Users className="w-5 h-5 text-[#f89e35]" /> Registered Friends Access Portal ({registeredViewers.length})
                                    </h3>
                                    <span className="bg-white px-3 py-1 rounded-full text-[10px] font-black text-slate-450 uppercase tracking-widest border border-slate-200 shadow-sm">Lifetime tokens issued</span>
                                </div>
                                <div className="overflow-x-auto">
                                    {registeredViewers.length > 0 ? (
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/50 text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100">
                                                    <th className="p-6">Friend Email</th>
                                                    <th className="p-6">Access Token</th>
                                                    <th className="p-6 text-center">Visit Count</th>
                                                    <th className="p-6">Visit History logs</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {registeredViewers.map(viewer => (
                                                    <tr key={viewer._id} className="border-b border-slate-50 hover:bg-[#fff7ed]/30 transition-colors">
                                                        <td className="p-6">
                                                            <span className="font-black text-slate-900 text-sm block">{viewer.email}</span>
                                                            <span className="text-[10px] text-slate-400 font-bold">Issued {new Date(viewer.createdAt).toLocaleDateString()}</span>
                                                        </td>
                                                        <td className="p-6 font-mono text-sm font-bold text-slate-800 uppercase tracking-wider">
                                                            {viewer.token}
                                                        </td>
                                                        <td className="p-6 text-center">
                                                            <span className="bg-[#110f0e] text-white px-3 py-1 rounded-xl text-xs font-black shadow-md">{viewer.visits?.length || 0} visits</span>
                                                        </td>
                                                        <td className="p-6 text-xs text-slate-500 max-w-[300px]">
                                                            {viewer.visits && viewer.visits.length > 0 ? (
                                                                <div className="space-y-1 max-h-[80px] overflow-y-auto pr-1">
                                                                    {viewer.visits.map((visit, idx) => (
                                                                        <div key={idx} className="flex justify-between gap-4 font-medium border-b border-slate-50 pb-0.5 last:border-0">
                                                                            <span className="font-bold text-slate-700 truncate">{visit.streamTitle || 'Stream'}</span>
                                                                            <span className="text-[9px] text-slate-400 whitespace-nowrap">{new Date(visit.date).toLocaleDateString()}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-400 italic">No streams watched yet.</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="text-center py-12 text-slate-400 text-sm font-medium">
                                            No registered friends found. Tokens will be created when they input their emails.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Saved Rewatchable Stream Recordings Grid (Admin Delete Control) */}
                            <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm transition hover:shadow-lg">
                                <h3 className="font-bold text-slate-900 text-lg mb-6 flex items-center gap-2">
                                    <Play className="w-5 h-5 text-[#f89e35]" /> Past Livestreams & Saved Recordings ({livestreams.length})
                                </h3>
                                <div className="space-y-4">
                                    {livestreams.length > 0 ? (
                                        livestreams.map(stream => (
                                            <div key={stream._id} className="border border-slate-100 hover:border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition bg-slate-50/50">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-black text-slate-900 text-base">{stream.title}</h4>
                                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${stream.status === 'active' ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 text-slate-500'}`}>
                                                            {stream.status === 'active' ? 'LIVE' : 'ENDED'}
                                                        </span>
                                                        {stream.rewatchable && (
                                                            <span className="text-[9px] font-black uppercase bg-emerald-500 text-white px-2 py-0.5 rounded">
                                                                REWATCHABLE
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-slate-500 text-xs mt-1.5 line-clamp-2 max-w-xl">{stream.description || 'No description provided.'}</p>
                                                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Session date: {new Date(stream.createdAt).toLocaleString()}</p>
                                                </div>
                                                <button 
                                                    onClick={() => deleteStreamRecord(stream._id)}
                                                    className="bg-white hover:bg-red-550 border border-slate-200 hover:border-red-500 hover:text-white text-slate-500 p-3 rounded-xl transition flex items-center gap-1.5 text-xs font-black cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Delete Entirely
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 text-slate-450 text-sm font-medium">
                                            No stream sessions recorded in the database.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* End Stream Prompt Modal Overlay */}
                            <AnimatePresence>
                                {isEndModalOpen && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6 animate-in fade-in duration-200">
                                        <motion.div 
                                            initial={{ scale: 0.95, y: 15 }}
                                            animate={{ scale: 1, y: 0 }}
                                            exit={{ scale: 0.95, y: 15 }}
                                            className="bg-white rounded-[32px] p-8 md:p-10 shadow-2xl border border-slate-100 max-w-[450px] w-full text-center relative overflow-hidden"
                                        >
                                            <div className="w-16 h-16 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-6">
                                                <Tv className="w-8 h-8 text-[#f89e35]" />
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-900">Finish Screen Broadcasting?</h3>
                                            <p className="text-slate-500 font-medium text-xs md:text-sm mt-3 leading-relaxed">
                                                You are stopping the screen sharing broadcast session. What would you like to do with the background recording?
                                            </p>

                                            <div className="space-y-3 mt-6">
                                                <button
                                                    onClick={() => endScreenStream(true)}
                                                    className="w-full bg-[#f89e35] hover:bg-[#e08b2c] text-white font-black py-4 rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                                                >
                                                    Save & Make Rewatchable
                                                </button>
                                                <button
                                                    onClick={() => endScreenStream(false)}
                                                    className="w-full bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-700 font-black py-4 rounded-2xl text-xs uppercase tracking-wider transition cursor-pointer"
                                                >
                                                    Discard & Delete Session Entirely
                                                </button>
                                                <button
                                                    onClick={() => setIsEndModalOpen(false)}
                                                    className="w-full bg-white hover:bg-slate-100 text-slate-400 font-black py-3 rounded-2xl text-xs uppercase tracking-wider transition border border-slate-100 cursor-pointer"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </motion.div>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {activeTab === 'crm' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            {/* CRM Sub-navigation header */}
                            <div className="bg-slate-900 text-white rounded-3xl p-6 flex flex-wrap gap-2 items-center justify-between shadow-lg">
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { id: 'overview', label: 'Overview' },
                                        { id: 'staff', label: 'Staff' },
                                        { id: 'customers', label: 'Customers' },
                                        { id: 'repairs', label: 'Repairs' },
                                        { id: 'kanban', label: 'Kanban' },
                                        { id: 'stock', label: 'Inventory' },
                                        { id: 'accounting', label: 'Ledger & Reviews' },
                                        { id: 'reports', label: 'Staff Reports' },
                                        { id: 'remix', label: 'Video Remix' },
                                        { id: 'social', label: 'Social Poster' }
                                    ].map(sub => (
                                        <button
                                            key={sub.id}
                                            onClick={() => setCrmTab(sub.id)}
                                            className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                                                crmTab === sub.id 
                                                    ? 'bg-[#f89e35] text-white shadow' 
                                                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                            }`}
                                        >
                                            {sub.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    {crmTab === 'staff' && (
                                        <button onClick={() => setIsStaffModalOpen(true)} className="bg-[#f89e35] hover:bg-[#e08922] text-white px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer">
                                            + Add Staff
                                        </button>
                                    )}
                                    {crmTab === 'customers' && (
                                        <button onClick={() => setIsCustomerModalOpen(true)} className="bg-[#f89e35] hover:bg-[#e08922] text-white px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer">
                                            + Add Client
                                        </button>
                                    )}
                                    {crmTab === 'repairs' && (
                                        <button onClick={() => setIsJobModalOpen(true)} className="bg-[#f89e35] hover:bg-[#e08922] text-white px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer">
                                            + Log Repair
                                        </button>
                                    )}
                                    {crmTab === 'stock' && (
                                        <button onClick={() => setIsStockModalOpen(true)} className="bg-[#f89e35] hover:bg-[#e08922] text-white px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer">
                                            + Add Inventory
                                        </button>
                                    )}
                                    {crmTab === 'accounting' && (
                                        <button onClick={() => setIsLedgerModalOpen(true)} className="bg-[#f89e35] hover:bg-[#e08922] text-white px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer">
                                            + Log Ledger
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Sub-tab: Overview */}
                            {crmTab === 'overview' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                            <div className="absolute -right-3 -top-3 w-16 h-16 bg-[#f89e35]/10 rounded-full"></div>
                                            <h4 className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Active Technicians</h4>
                                            <p className="text-3xl font-black text-slate-900 mt-1">{staff.filter(s => s.role === 'technician' && s.isActive).length}</p>
                                        </div>
                                        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                            <div className="absolute -right-3 -top-3 w-16 h-16 bg-blue-500/10 rounded-full"></div>
                                            <h4 className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Active Repair Jobs</h4>
                                            <p className="text-3xl font-black text-slate-900 mt-1">{repairs.filter(r => !['ready', 'delivered'].includes(r.status)).length}</p>
                                        </div>
                                        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                            <div className="absolute -right-3 -top-3 w-16 h-16 bg-green-500/10 rounded-full"></div>
                                            <h4 className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Net Cash surplus</h4>
                                            <p className="text-3xl font-black text-slate-900 mt-1">${accounting.cashRegister || 0}</p>
                                        </div>
                                        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                            <div className="absolute -right-3 -top-3 w-16 h-16 bg-red-500/10 rounded-full"></div>
                                            <h4 className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Low Inventory Items</h4>
                                            <p className="text-3xl font-black text-slate-900 mt-1">{stock.filter(s => s.quantity <= s.reorderLevel).length}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm lg:col-span-2 space-y-4">
                                            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                                <Clock className="w-5 h-5 text-[#f89e35]" /> Recent Active Repairs
                                            </h3>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs">
                                                    <thead>
                                                        <tr className="text-slate-400 font-bold border-b border-slate-100 pb-2">
                                                            <th className="py-2">Job ID</th>
                                                            <th className="py-2">Client</th>
                                                            <th className="py-2">Device</th>
                                                            <th className="py-2">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {repairs.slice(0, 5).map(job => (
                                                            <tr key={job._id} className="border-b border-slate-50 hover:bg-slate-50">
                                                                <td className="py-3 font-bold text-slate-800">{job.jobId}</td>
                                                                <td className="py-3 font-semibold">{job.customer?.name}</td>
                                                                <td className="py-3">{job.device}</td>
                                                                <td className="py-3">
                                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                                                        job.status === 'ready' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                                                                    }`}>{job.status}</span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
                                            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                                <AlertTriangle className="w-5 h-5 text-red-500" /> Low Stock Warning
                                            </h3>
                                            <div className="space-y-3">
                                                {stock.filter(s => s.quantity <= s.reorderLevel).slice(0, 5).map(item => (
                                                    <div key={item._id} className="flex justify-between items-center bg-red-50/50 p-3 rounded-2xl border border-red-100 text-xs">
                                                        <div>
                                                            <p className="font-bold text-slate-900">{item.name}</p>
                                                            <p className="text-[9px] text-slate-400 uppercase font-black">SKU: {item.sku}</p>
                                                        </div>
                                                        <p className="font-bold text-red-650">Qty: {item.quantity}</p>
                                                    </div>
                                                ))}
                                                {stock.filter(s => s.quantity <= s.reorderLevel).length === 0 && (
                                                    <p className="text-xs text-slate-400 font-semibold text-center py-6">All stock levels are optimal!</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Sub-tab: Staff */}
                            {crmTab === 'staff' && (
                                <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 text-slate-400 font-bold uppercase">
                                            <tr>
                                                <th className="px-6 py-4">Name</th>
                                                <th className="px-6 py-4">Email</th>
                                                <th className="px-6 py-4">Role</th>
                                                <th className="px-6 py-4">PIN Code</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {staff.map(s => (
                                                <tr key={s._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                                    <td className="px-6 py-4 font-bold text-slate-900">{s.name}</td>
                                                    <td className="px-6 py-4 font-medium text-slate-600">{s.email}</td>
                                                    <td className="px-6 py-4 capitalize font-bold text-slate-700">{s.role}</td>
                                                    <td className="px-6 py-4 text-slate-400">{s.pin || 'N/A'}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                                            s.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                        }`}>{s.isActive ? 'Active' : 'Inactive'}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button onClick={() => handleDeleteStaff(s._id)} className="text-red-500 hover:text-red-700 font-bold cursor-pointer">Delete</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Sub-tab: Customers */}
                            {crmTab === 'customers' && (
                                <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 text-slate-400 font-bold uppercase">
                                            <tr>
                                                <th className="px-6 py-4">Client Name</th>
                                                <th className="px-6 py-4">Phone</th>
                                                <th className="px-6 py-4">Email</th>
                                                <th className="px-6 py-4">Address</th>
                                                <th className="px-6 py-4">Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {customers.map(c => (
                                                <tr key={c._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                                    <td className="px-6 py-4 font-bold text-slate-900">{c.name}</td>
                                                    <td className="px-6 py-4 font-semibold text-slate-700">{c.phone}</td>
                                                    <td className="px-6 py-4 text-slate-500">{c.email || 'N/A'}</td>
                                                    <td className="px-6 py-4 text-slate-500 truncate max-w-[150px]">{c.address || 'N/A'}</td>
                                                    <td className="px-6 py-4 text-slate-400 truncate max-w-[150px]">{c.notes || 'N/A'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Sub-tab: Repairs */}
                            {crmTab === 'repairs' && (
                                <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 text-slate-400 font-bold uppercase">
                                            <tr>
                                                <th className="px-6 py-4">Job ID</th>
                                                <th className="px-6 py-4">Client</th>
                                                <th className="px-6 py-4">Device</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 font-bold">Price</th>
                                                <th className="px-6 py-4">Parts Needed</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {repairs.map(job => (
                                                <tr key={job._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                                    <td className="px-6 py-4 font-bold text-[#f89e35]">{job.jobId}</td>
                                                    <td className="px-6 py-4 font-bold text-slate-900">{job.customer?.name}</td>
                                                    <td className="px-6 py-4 font-semibold text-slate-700">{job.device}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider ${
                                                            job.status === 'ready' ? 'bg-green-100 text-green-700' :
                                                            job.status === 'delivered' ? 'bg-slate-950 text-white' :
                                                            job.status === 'repairing' ? 'bg-blue-100 text-blue-700' :
                                                            job.status === 'waiting_parts' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-slate-100 text-slate-600'
                                                        }`}>{job.status}</span>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-slate-900">${job.price || 0}</td>
                                                    <td className="px-6 py-4 text-slate-500">
                                                        {job.partsNeeded?.join(', ') || 'None'}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={() => generateFeedbackLink(job._id, job.customer?._id)} className="text-xs font-bold text-[#f89e35] hover:underline cursor-pointer">
                                                                Feedback Link
                                                            </button>
                                                            {['ready', 'intake', 'diagnosis', 'repairing', 'waiting_parts'].includes(job.status) && (
                                                                <button onClick={() => updateRepairStatus(job._id, 'delivered')} className="bg-slate-900 hover:bg-[#f89e35] text-white px-3 py-1 rounded text-[10px] font-bold cursor-pointer">
                                                                    Mark Delivered
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Sub-tab: Kanban */}
                            {crmTab === 'kanban' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 min-h-[500px]">
                                    {[
                                        { status: 'intake', label: 'New Intake', bg: 'bg-slate-50 border-slate-200' },
                                        { status: 'diagnosis', label: 'Diagnosis', bg: 'bg-indigo-50 border-indigo-100' },
                                        { status: 'repairing', label: 'In Repair', bg: 'bg-blue-50 border-blue-100' },
                                        { status: 'waiting_parts', label: 'Waiting parts', bg: 'bg-yellow-50 border-yellow-100' },
                                        { status: 'ready', label: 'Ready', bg: 'bg-green-50 border-green-100' },
                                        { status: 'delivered', label: 'Delivered', bg: 'bg-slate-800 text-white' }
                                    ].map(col => {
                                        const colJobs = repairs.filter(r => r.status === col.status);
                                        return (
                                            <div
                                                key={col.status}
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, col.status)}
                                                className={`p-3 rounded-2xl border border-dashed ${col.bg} min-h-[400px] flex flex-col space-y-3`}
                                            >
                                                <div className="flex justify-between items-center pb-2 border-b border-slate-200/55">
                                                    <h4 className="font-bold text-xs uppercase tracking-wide truncate">{col.label}</h4>
                                                    <span className="bg-[#f89e35] text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold">{colJobs.length}</span>
                                                </div>
                                                <div className="flex-1 space-y-2 overflow-y-auto max-h-[400px] pr-1">
                                                    {colJobs.map(job => (
                                                        <div
                                                            key={job._id}
                                                            draggable
                                                            onDragStart={(e) => handleDragStart(e, job._id)}
                                                            className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:shadow transition duration-150 space-y-1 text-slate-800"
                                                        >
                                                            <div className="flex justify-between items-start text-[9px] text-slate-400 font-bold">
                                                                <span>{job.jobId}</span>
                                                                <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                            <p className="font-bold text-xs truncate">{job.device}</p>
                                                            <p className="text-[10px] text-slate-400 truncate">{job.issue}</p>
                                                            <div className="pt-1.5 border-t border-slate-50 flex items-center justify-between text-[9px]">
                                                                <span className="font-bold">${job.price}</span>
                                                                <span className="text-slate-400 truncate max-w-[50px]">{job.customer?.name}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Sub-tab: Stock */}
                            {crmTab === 'stock' && (
                                <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 text-slate-400 font-bold uppercase">
                                            <tr>
                                                <th className="px-6 py-4">Part Name</th>
                                                <th className="px-6 py-4">SKU</th>
                                                <th className="px-6 py-4">Category</th>
                                                <th className="px-6 py-4">Quantity</th>
                                                <th className="px-6 py-4">Unit Cost</th>
                                                <th className="px-6 py-4">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stock.map(item => (
                                                <tr key={item._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                                    <td className="px-6 py-4 font-bold text-slate-900">{item.name}</td>
                                                    <td className="px-6 py-4 font-medium text-slate-500">{item.sku}</td>
                                                    <td className="px-6 py-4 text-slate-500">{item.category}</td>
                                                    <td className="px-6 py-4 font-bold text-slate-800">{item.quantity}</td>
                                                    <td className="px-6 py-4 font-bold text-slate-700">${item.unitPrice}</td>
                                                    <td className="px-6 py-4">
                                                        {item.quantity <= 0 ? (
                                                            <span className="bg-red-100 text-red-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">Out of Stock</span>
                                                        ) : item.quantity <= item.reorderLevel ? (
                                                            <span className="bg-yellow-100 text-yellow-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">Low Stock</span>
                                                        ) : (
                                                            <span className="bg-green-100 text-green-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">Optimal</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Sub-tab: Accounting */}
                            {crmTab === 'accounting' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-green-50 p-6 rounded-3xl border border-green-100 text-green-800 flex items-center justify-between">
                                            <div>
                                                <h4 className="text-[10px] font-black uppercase tracking-wider text-green-500">Revenue (Inflows)</h4>
                                                <p className="text-3xl font-black mt-1">${accounting.totalInflow || 0}</p>
                                            </div>
                                            <TrendingUp className="w-8 h-8 text-green-400" />
                                        </div>
                                        <div className="bg-red-50 p-6 rounded-3xl border border-red-100 text-red-800 flex items-center justify-between">
                                            <div>
                                                <h4 className="text-[10px] font-black uppercase tracking-wider text-red-500">Expenses (Outflows)</h4>
                                                <p className="text-3xl font-black mt-1">${accounting.totalOutflow || 0}</p>
                                            </div>
                                            <TrendingDown className="w-8 h-8 text-red-400" />
                                        </div>
                                        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 text-white flex items-center justify-between">
                                            <div>
                                                <h4 className="text-[10px] font-black uppercase tracking-wider text-[#f89e35]">Net Register Balance</h4>
                                                <p className="text-3xl font-black mt-1">${accounting.cashRegister || 0}</p>
                                            </div>
                                            <DollarSign className="w-8 h-8 text-[#f89e35]" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm lg:col-span-2 space-y-4">
                                            <h3 className="font-bold text-slate-900 text-base">Transactions Journal Ledger</h3>
                                            <div className="overflow-x-auto max-h-[350px] overflow-y-auto pr-1">
                                                <table className="w-full text-left text-xs">
                                                    <thead>
                                                        <tr className="text-slate-400 font-bold border-b border-slate-100">
                                                            <th className="py-2">Date</th>
                                                            <th className="py-2">Type</th>
                                                            <th className="py-2">Category</th>
                                                            <th className="py-2">Amount</th>
                                                            <th className="py-2">Description</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {accounting.entries?.map(entry => (
                                                            <tr key={entry._id} className="border-b border-slate-50">
                                                                <td className="py-3 text-slate-400 font-semibold">{new Date(entry.date).toLocaleDateString()}</td>
                                                                <td className="py-3">
                                                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                                                                        entry.type === 'inflow' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                                    }`}>{entry.type}</span>
                                                                </td>
                                                                <td className="py-3 font-bold text-slate-700">{entry.category}</td>
                                                                <td className={`py-3 font-bold ${entry.type === 'inflow' ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {entry.type === 'inflow' ? '+' : '-'}${entry.amount}
                                                                </td>
                                                                <td className="py-3 text-slate-500 truncate max-w-[150px]">{entry.description || 'N/A'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
                                            <h3 className="font-bold text-slate-900 text-base">Customer Feedback Logs</h3>
                                            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                                                {feedbackLogs.map(fb => (
                                                    <div key={fb._id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1 text-xs">
                                                        <div className="flex justify-between items-center">
                                                            <p className="font-bold text-slate-800">{fb.customer?.name}</p>
                                                            <div className="flex text-[#f89e35]">
                                                                {Array.from({ length: fb.rating }).map((_, i) => (
                                                                    <Star key={i} className="w-3 h-3 fill-[#f89e35]" />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase">{fb.job?.device} ({fb.job?.jobId})</p>
                                                        <p className="text-slate-500 italic mt-1 leading-relaxed">"{fb.comment || 'No review comment left.'}"</p>
                                                    </div>
                                                ))}
                                                {feedbackLogs.length === 0 && (
                                                    <p className="text-slate-400 text-xs font-semibold text-center py-8">No feedback logs found.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Sub-tab: Reports */}
                            {crmTab === 'reports' && (
                                <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
                                    <h3 className="font-bold text-slate-900 text-base">Staff Performance & Checklist Reports</h3>
                                    <div className="space-y-4">
                                        {reports.map(rep => (
                                            <div key={rep._id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-xs space-y-2">
                                                <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                                                    <div>
                                                        <p className="font-bold text-slate-800">{rep.staff?.name}</p>
                                                        <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider">{rep.staff?.role}</p>
                                                    </div>
                                                    <p className="text-[#f89e35] font-black">{rep.date}</p>
                                                </div>
                                                <div className="text-slate-600 font-medium">
                                                    Completed <strong className="text-slate-800">{rep.completedTodos?.length}</strong> out of <strong className="text-slate-800">{rep.morningTodos?.length}</strong> morning tasks.
                                                </div>
                                                {rep.summary && (
                                                    <div className="space-y-0.5">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase">Checkout summary</p>
                                                        <p className="text-slate-650 leading-relaxed font-semibold">"{rep.summary}"</p>
                                                    </div>
                                                )}
                                                {rep.challenges && (
                                                    <div className="space-y-0.5">
                                                        <p className="text-[9px] font-black text-red-400 uppercase">Challenges Faced</p>
                                                        <p className="text-red-650 leading-relaxed font-semibold">"{rep.challenges}"</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {reports.length === 0 && (
                                            <p className="text-slate-400 text-center py-8 font-semibold">No staff check-in reports recorded yet.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Sub-tab: Video Remix */}
                            {crmTab === 'remix' && (
                                <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-8 max-w-xl mx-auto space-y-6">
                                    <div className="text-center space-y-2">
                                        <h3 className="text-xl font-black text-slate-900">Branding Video Remix Tool</h3>
                                        <p className="text-slate-400 text-xs font-semibold">Blur social media watermarks and overlay logo watermarks automatically</p>
                                    </div>
                                    <form onSubmit={handleVideoRemix} className="space-y-4">
                                        <input
                                            type="url"
                                            placeholder="Paste TikTok/YouTube Shorts Link"
                                            value={videoUrl}
                                            onChange={(e) => setVideoUrl(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs focus:outline-none focus:border-[#f89e35] text-slate-900"
                                            required
                                        />
                                        <button
                                            type="submit"
                                            disabled={remixLoading}
                                            className="w-full bg-[#0f172a] hover:bg-[#f89e35] text-white py-3.5 rounded-xl text-xs font-black shadow transition flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            {remixLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'REMIX WATERMARK & BRAND VIDEO ➔'}
                                        </button>
                                    </form>

                                    {remixResult && (
                                        <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3">
                                            <p className="text-xs font-bold text-green-500">✓ Video Branded Successfully!</p>
                                            <video src={remixResult.previewUrl} controls className="w-full rounded-lg bg-black aspect-video object-contain"></video>
                                            <a href={remixResult.downloadUrl} target="_blank" rel="noopener noreferrer" className="w-full bg-[#f89e35] text-white py-2.5 rounded-lg text-xs font-black flex items-center justify-center">
                                                Download Video
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Sub-tab: Social Posting */}
                            {crmTab === 'social' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm lg:col-span-2 space-y-6">
                                        <h3 className="font-bold text-slate-900 text-base">Write Update Post</h3>
                                        <form onSubmit={handlePublishPost} className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-slate-400 block">Select Target Connected Accounts</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {socialAccounts.map(acc => (
                                                        <button
                                                            key={acc._id}
                                                            type="button"
                                                            onClick={() => setSelectedSocials(prev => ({ ...prev, [acc._id]: !prev[acc._id] }))}
                                                            className={`px-3 py-2 rounded-xl text-xs font-bold transition border flex items-center gap-1.5 cursor-pointer ${
                                                                selectedSocials[acc._id]
                                                                    ? 'bg-[#f89e35]/10 border-[#f89e35] text-[#f89e35]'
                                                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                                            }`}
                                                        >
                                                            <span className="uppercase text-[8px] bg-slate-800 text-white px-1.5 py-0.5 rounded font-black mr-1">{acc.platform}</span>
                                                            {acc.accountName}
                                                        </button>
                                                    ))}
                                                    {socialAccounts.length === 0 && (
                                                        <p className="text-xs text-slate-400 font-semibold bg-yellow-50 border border-yellow-100 p-3 rounded-xl w-full">
                                                            ⚠️ Connect an account in the right sidebar list first.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 block">Message Content</label>
                                                <textarea
                                                    rows="4"
                                                    placeholder="Post description or caption..."
                                                    value={postContent}
                                                    onChange={(e) => setPostContent(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs focus:outline-none focus:border-[#f89e35] text-slate-900 leading-relaxed"
                                                    required
                                                ></textarea>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 block">Media URL (Optional)</label>
                                                <input
                                                    type="url"
                                                    placeholder="Image link for Instagram posting"
                                                    value={postMediaUrl}
                                                    onChange={(e) => setPostMediaUrl(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#f89e35]"
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={postingLoading || socialAccounts.length === 0}
                                                className="w-full bg-slate-900 hover:bg-[#f89e35] text-white py-3 rounded-xl text-xs font-black shadow transition cursor-pointer"
                                            >
                                                {postingLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto text-white" /> : 'PUBLISH POST NOW ➔'}
                                            </button>
                                        </form>
                                    </div>

                                    <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4 lg:col-span-1">
                                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                            <h3 className="font-bold text-slate-900 text-xs">Linked Profiles</h3>
                                            <button onClick={() => setIsSocialModalOpen(true)} className="text-xs text-[#f89e35] hover:underline font-bold cursor-pointer">+ Connect</button>
                                        </div>
                                        <div className="space-y-3">
                                            {socialAccounts.map(acc => (
                                                <div key={acc._id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                                                    <div>
                                                        <span className="uppercase text-[8px] bg-slate-800 text-white px-1.5 py-0.5 rounded font-black mr-2">{acc.platform}</span>
                                                        <strong className="text-slate-850 text-xs">{acc.accountName}</strong>
                                                        <p className="text-[8px] text-slate-400 mt-1">ID: {acc.pageId || 'Linked'}</p>
                                                    </div>
                                                    <button onClick={() => handleDisconnectSocial(acc._id)} className="p-1 text-slate-400 hover:text-red-500 cursor-pointer">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            {socialAccounts.length === 0 && (
                                                <p className="text-slate-400 text-xs text-center py-6">No social channels linked yet.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- FORM OVERLAY MODALS --- */}
                            {isStaffModalOpen && (
                                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
                                    <div className="bg-white rounded-[32px] p-8 max-w-md w-full border border-slate-100 shadow-2xl relative space-y-6">
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Create Staff Account</h3>
                                            <p className="text-slate-400 text-xs font-semibold">Define role and access credentials</p>
                                        </div>
                                        <form onSubmit={handleCreateStaff} className="space-y-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Staff Name</label>
                                                <input type="text" required value={newStaff.name} onChange={(e) => setNewStaff(prev => ({ ...prev, name: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35] text-slate-900" placeholder="E.g., David Obi" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Email Address</label>
                                                <input type="email" required value={newStaff.email} onChange={(e) => setNewStaff(prev => ({ ...prev, email: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35] text-slate-900" placeholder="E.g., david@lalatech.ng" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Default Password</label>
                                                <input type="password" required value={newStaff.password} onChange={(e) => setNewStaff(prev => ({ ...prev, password: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35] text-slate-900" placeholder="Password for login" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Role Access Level</label>
                                                <select value={newStaff.role} onChange={(e) => setNewStaff(prev => ({ ...prev, role: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none text-slate-900">
                                                    <option value="technician">Technician (Repairs & Inventory)</option>
                                                    <option value="sales">Sales (Intake & Customers)</option>
                                                    <option value="accountant">Accountant (Ledger & Reports)</option>
                                                    <option value="admin">System Admin (Full Access)</option>
                                                </select>
                                            </div>
                                            <div className="flex gap-3 pt-2">
                                                <button type="button" onClick={() => setIsStaffModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl text-xs font-bold transition">Cancel</button>
                                                <button type="submit" className="flex-1 bg-[#0f172a] hover:bg-[#f89e35] text-white py-3 rounded-2xl text-xs font-black transition">Create Account</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {isCustomerModalOpen && (
                                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
                                    <div className="bg-white rounded-[32px] p-8 max-w-md w-full border border-slate-100 shadow-2xl relative space-y-6">
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Add New Customer</h3>
                                            <p className="text-slate-400 text-xs font-semibold">Register a client to log repairs and generate reviews</p>
                                        </div>
                                        <form onSubmit={handleCreateCustomer} className="space-y-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Client Name</label>
                                                <input type="text" required value={newCustomer.name} onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35] text-slate-900" placeholder="E.g., John Doe" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Phone Number</label>
                                                <input type="tel" required value={newCustomer.phone} onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35] text-slate-900" placeholder="E.g., +234800000000" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Email Address</label>
                                                <input type="email" value={newCustomer.email} onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35] text-slate-900" placeholder="E.g., john@gmail.com" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Address</label>
                                                <input type="text" value={newCustomer.address} onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35] text-slate-900" placeholder="Client home/work address" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Internal Notes</label>
                                                <input type="text" value={newCustomer.notes} onChange={(e) => setNewCustomer(prev => ({ ...prev, notes: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35] text-slate-900" placeholder="E.g., Preferred weekend deliveries" />
                                            </div>
                                            <div className="flex gap-3 pt-2">
                                                <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl text-xs font-bold transition">Cancel</button>
                                                <button type="submit" className="flex-1 bg-[#0f172a] hover:bg-[#f89e35] text-white py-3 rounded-2xl text-xs font-black transition">Create Profile</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {isJobModalOpen && (
                                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
                                    <div className="bg-white rounded-[32px] p-8 max-w-md w-full border border-slate-100 shadow-2xl relative space-y-6">
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Log New Repair Job</h3>
                                            <p className="text-slate-400 text-xs font-semibold">Intake a customer device and define issue description</p>
                                        </div>
                                        <form onSubmit={handleCreateRepair} className="space-y-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Select Client</label>
                                                <select required value={newRepair.customerId} onChange={(e) => setNewRepair(prev => ({ ...prev, customerId: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35] text-slate-900">
                                                    <option value="">-- Choose Customer --</option>
                                                    {customers.map(c => (
                                                        <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Device Name</label>
                                                    <input type="text" required value={newRepair.device} onChange={(e) => setNewRepair(prev => ({ ...prev, device: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35] text-slate-900" placeholder="E.g., iPhone 13" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Serial / IMEI</label>
                                                    <input type="text" value={newRepair.serialNumber} onChange={(e) => setNewRepair(prev => ({ ...prev, serialNumber: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35] text-slate-900" placeholder="Optional" />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Issue Description</label>
                                                <input type="text" required value={newRepair.issue} onChange={(e) => setNewRepair(prev => ({ ...prev, issue: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35] text-slate-900" placeholder="E.g., Cracked screen, doesn't power on" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Required Spare Parts (Comma separated SKU/Names)</label>
                                                <input type="text" value={newRepair.partsNeeded} onChange={(e) => setNewRepair(prev => ({ ...prev, partsNeeded: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35] text-slate-900" placeholder="E.g., iPhone 13 Screen, Glue" />
                                                <p className="text-[9px] text-slate-400 font-medium">If parts match inventory name, quantity is auto-deducted on completion!</p>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Estimated Repair Cost ($)</label>
                                                <input type="number" required value={newRepair.price} onChange={(e) => setNewRepair(prev => ({ ...prev, price: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35] text-slate-900" placeholder="Price in USD" />
                                            </div>
                                            <div className="flex gap-3 pt-2">
                                                <button type="button" onClick={() => setIsJobModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl text-xs font-bold transition">Cancel</button>
                                                <button type="submit" className="flex-1 bg-[#0f172a] hover:bg-[#f89e35] text-white py-3 rounded-2xl text-xs font-black transition">Intake Device</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {isStockModalOpen && (
                                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
                                    <div className="bg-white rounded-[32px] p-8 max-w-md w-full border border-slate-100 shadow-2xl relative space-y-6">
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Add Part to Stock</h3>
                                            <p className="text-slate-400 text-xs font-semibold">Insert components into inventory levels</p>
                                        </div>
                                        <form onSubmit={handleCreateStock} className="space-y-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Part Name</label>
                                                <input type="text" required value={newStock.name} onChange={(e) => setNewStock(prev => ({ ...prev, name: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35] text-slate-900" placeholder="E.g., iPhone 13 Screen" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">SKU Code</label>
                                                <input type="text" required value={newStock.sku} onChange={(e) => setNewStock(prev => ({ ...prev, sku: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35] text-slate-900" placeholder="E.g., IP13-SCR-01" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Quantity</label>
                                                    <input type="number" required value={newStock.quantity} onChange={(e) => setNewStock(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35] text-slate-900" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Cost Price ($)</label>
                                                    <input type="number" required value={newStock.unitPrice} onChange={(e) => setNewStock(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35] text-slate-900" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Reorder Alert Level</label>
                                                    <input type="number" required value={newStock.reorderLevel} onChange={(e) => setNewStock(prev => ({ ...prev, reorderLevel: parseInt(e.target.value) || 5 }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35] text-slate-900" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Category</label>
                                                    <input type="text" value={newStock.category} onChange={(e) => setNewStock(prev => ({ ...prev, category: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35] text-slate-900" placeholder="E.g., Screens, Batteries" />
                                                </div>
                                            </div>
                                            <div className="flex gap-3 pt-2">
                                                <button type="button" onClick={() => setIsStockModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl text-xs font-bold transition">Cancel</button>
                                                <button type="submit" className="flex-1 bg-[#0f172a] hover:bg-[#f89e35] text-white py-3 rounded-2xl text-xs font-black transition">Add Part</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {isLedgerModalOpen && (
                                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
                                    <div className="bg-white rounded-[32px] p-8 max-w-md w-full border border-slate-100 shadow-2xl relative space-y-6">
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Log Ledger Transaction</h3>
                                            <p className="text-slate-400 text-xs font-semibold">Record a manual outflow or inflow entry</p>
                                        </div>
                                        <form onSubmit={handleCreateLedger} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Transaction Type</label>
                                                    <select value={newLedger.type} onChange={(e) => setNewLedger(prev => ({ ...prev, type: e.target.value, category: e.target.value === 'inflow' ? 'Repair Payment' : 'Part Purchase' }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none text-slate-900">
                                                        <option value="inflow">Inflow (Income)</option>
                                                        <option value="outflow">Outflow (Expense)</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Category</label>
                                                    {newLedger.type === 'inflow' ? (
                                                        <select value={newLedger.category} onChange={(e) => setNewLedger(prev => ({ ...prev, category: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none text-slate-900">
                                                            <option value="Repair Payment">Repair Payment</option>
                                                            <option value="Course Sale">Course Sale</option>
                                                            <option value="Investment">Investment</option>
                                                            <option value="Other Inflow">Other Inflow</option>
                                                        </select>
                                                    ) : (
                                                        <select value={newLedger.category} onChange={(e) => setNewLedger(prev => ({ ...prev, category: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none text-slate-900">
                                                            <option value="Part Purchase">Part Purchase</option>
                                                            <option value="Salary">Salary</option>
                                                            <option value="Rent">Rent</option>
                                                            <option value="Utilities">Utilities</option>
                                                            <option value="Other Expense">Other Expense</option>
                                                        </select>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Amount ($)</label>
                                                <input type="number" required value={newLedger.amount} onChange={(e) => setNewLedger(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none text-slate-900" placeholder="0.00" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Description</label>
                                                <input type="text" value={newLedger.description} onChange={(e) => setNewLedger(prev => ({ ...prev, description: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none text-slate-900" placeholder="Notes explaining the ledger transaction" />
                                            </div>
                                            <div className="flex gap-3 pt-2">
                                                <button type="button" onClick={() => setIsLedgerModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl text-xs font-bold transition">Cancel</button>
                                                <button type="submit" className="flex-1 bg-[#0f172a] hover:bg-[#f89e35] text-white py-3 rounded-2xl text-xs font-black transition">Log Ledger</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {isSocialModalOpen && (
                                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
                                    <div className="bg-white rounded-[32px] p-8 max-w-md w-full border border-slate-100 shadow-2xl relative space-y-6">
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Connect Social Profile</h3>
                                            <p className="text-slate-400 text-xs font-semibold">Link dynamic accounts for posting</p>
                                        </div>
                                        <form onSubmit={handleConnectSocial} className="space-y-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Platform Network</label>
                                                <select value={socialForm.platform} onChange={(e) => setSocialForm(prev => ({ ...prev, platform: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none text-slate-900">
                                                    <option value="facebook">Facebook Page</option>
                                                    <option value="instagram">Instagram Business</option>
                                                    <option value="twitter">Twitter / X Profile</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Account Name</label>
                                                <input type="text" required value={socialForm.accountName} onChange={(e) => setSocialForm(prev => ({ ...prev, accountName: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none text-slate-900" placeholder="E.g., Lala Tech Page" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Page ID / Username (Optional)</label>
                                                <input type="text" value={socialForm.pageId} onChange={(e) => setSocialForm(prev => ({ ...prev, pageId: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none text-slate-900" placeholder="E.g., 10029384755" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Access Token / Developer Token (Optional)</label>
                                                <textarea rows="3" value={socialForm.accessToken} onChange={(e) => setSocialForm(prev => ({ ...prev, accessToken: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs focus:outline-none text-slate-900" placeholder="Paste access token. Leave empty to connect in Demo/Simulation Mode!"></textarea>
                                            </div>
                                            <div className="flex gap-3 pt-2">
                                                <button type="button" onClick={() => setIsSocialModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl text-xs font-bold transition">Cancel</button>
                                                <button type="submit" className="flex-1 bg-[#0f172a] hover:bg-[#f89e35] text-white py-3 rounded-2xl text-xs font-black transition">Link Account</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
