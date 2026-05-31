'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
    LayoutDashboard, Users, Wrench, BarChart2, ShoppingBag, 
    FileText, Video, Share2, LogOut, Loader2, Plus, 
    TrendingUp, TrendingDown, DollarSign, Box, ShieldAlert,
    CheckSquare, ArrowRight, Star, Heart, Calendar, Clock,
    Trash2, Edit, CheckCircle, RefreshCw, Smartphone, AlertTriangle
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { API_BASE_URL, BASE_URL } from '@/lib/api';

export default function StaffCrm() {
    const router = useRouter();
    const [staffUser, setStaffUser] = useState(null);
    const [token, setToken] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);

    // --- State variables for CRM data ---
    const [customers, setCustomers] = useState([]);
    const [repairs, setRepairs] = useState([]);
    const [stock, setStock] = useState([]);
    const [accounting, setAccounting] = useState({ entries: [], totalInflow: 0, totalOutflow: 0, cashRegister: 0 });
    const [reports, setReports] = useState([]);
    const [socialAccounts, setSocialAccounts] = useState([]);
    const [feedbackLogs, setFeedbackLogs] = useState([]);

    // --- Form Inputs state ---
    // Customers
    const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', address: '', notes: '' });
    // Repairs
    const [newRepair, setNewRepair] = useState({ customerId: '', device: '', serialNumber: '', issue: '', price: 0, technicianId: '', partsNeeded: '' });
    // Stock
    const [newStock, setNewStock] = useState({ name: '', sku: '', quantity: 0, unitPrice: 0, reorderLevel: 5, category: 'General' });
    // Accounting
    const [newLedger, setNewLedger] = useState({ type: 'inflow', category: 'Repair Payment', amount: 0, description: '' });
    // Daily Report
    const [morningTodoText, setMorningTodoText] = useState('');
    const [morningTodos, setMorningTodos] = useState([]);
    const [eveningReport, setEveningReport] = useState({ challenges: '', summary: '' });
    const [completedTodos, setCompletedTodos] = useState({});
    
    // Social Poster
    const [postContent, setPostContent] = useState('');
    const [postMediaUrl, setPostMediaUrl] = useState('');
    const [selectedSocials, setSelectedSocials] = useState({});
    const [socialForm, setSocialForm] = useState({ platform: 'facebook', accountName: '', accessToken: '', pageId: '' });
    const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
    const [postingLoading, setPostingLoading] = useState(false);

    // Video Remixing
    const [videoUrl, setVideoUrl] = useState('');
    const [remixResult, setRemixResult] = useState(null);
    const [remixLoading, setRemixLoading] = useState(false);

    // UI helper modals
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);

    useEffect(() => {
        const storedToken = localStorage.getItem('staffToken');
        const storedUser = localStorage.getItem('staffUser');
        
        if (!storedToken || !storedUser) {
            toast.error('Session expired. Please log in.');
            router.push('/crm-login');
            return;
        }

        setToken(storedToken);
        setStaffUser(JSON.parse(storedUser));
        setLoading(false);
    }, [router]);

    // Fetch CRM data helper
    const fetchCrmData = async (targetTab) => {
        if (!token) return;
        setLoading(true);
        try {
            const headers = { 'Authorization': `Bearer ${token}` };

            if (targetTab === 'overview') {
                const [repRes, custRes, stockRes, acctRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/crm/repairs`, { headers }),
                    fetch(`${API_BASE_URL}/crm/customers`, { headers }),
                    fetch(`${API_BASE_URL}/crm/stock`, { headers }),
                    fetch(`${API_BASE_URL}/crm/accounting`, { headers })
                ]);
                if (repRes.ok) setRepairs(await repRes.json());
                if (custRes.ok) setCustomers(await custRes.json());
                if (stockRes.ok) setStock(await stockRes.json());
                if (acctRes.ok) setAccounting(await acctRes.json());
            } 
            else if (targetTab === 'customers') {
                const res = await fetch(`${API_BASE_URL}/crm/customers`, { headers });
                if (res.ok) setCustomers(await res.json());
            } 
            else if (targetTab === 'repairs' || targetTab === 'kanban') {
                const [repRes, custRes, stockRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/crm/repairs`, { headers }),
                    fetch(`${API_BASE_URL}/crm/customers`, { headers }),
                    fetch(`${API_BASE_URL}/crm/stock`, { headers })
                ]);
                if (repRes.ok) setRepairs(await repRes.json());
                if (custRes.ok) setCustomers(await custRes.json());
                if (stockRes.ok) setStock(await stockRes.json());
            } 
            else if (targetTab === 'stock') {
                const res = await fetch(`${API_BASE_URL}/crm/stock`, { headers });
                if (res.ok) setStock(await res.json());
            } 
            else if (targetTab === 'accounting') {
                const res = await fetch(`${API_BASE_URL}/crm/accounting`, { headers });
                if (res.ok) setAccounting(await res.json());
                
                const feedRes = await fetch(`${API_BASE_URL}/crm/feedback/all`, { headers });
                if (feedRes.ok) setFeedbackLogs(await feedRes.json());
            } 
            else if (targetTab === 'reports') {
                const repListRes = await fetch(`${API_BASE_URL}/crm/reports`, { headers });
                if (repListRes.ok) {
                    const list = await repListRes.json();
                    setReports(list);
                    
                    // Prepopulate today's report if exists
                    const todayStr = new Date().toISOString().split('T')[0];
                    const todayReport = list.find(r => r.date === todayStr && r.staff?._id === staffUser?.id);
                    if (todayReport) {
                        setMorningTodos(todayReport.morningTodos || []);
                        const complObj = {};
                        todayReport.completedTodos?.forEach(t => complObj[t] = true);
                        setCompletedTodos(complObj);
                        setEveningReport({
                            challenges: todayReport.challenges || '',
                            summary: todayReport.summary || ''
                        });
                    }
                }
            } 
            else if (targetTab === 'social') {
                const res = await fetch(`${API_BASE_URL}/crm/social/accounts`, { headers });
                if (res.ok) setSocialAccounts(await res.json());
            }
        } catch (err) {
            toast.error('Failed to load CRM data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token && staffUser) {
            fetchCrmData(activeTab);
        }
    }, [activeTab, token]);

    // Handle logout
    const handleLogout = () => {
        localStorage.removeItem('staffToken');
        localStorage.removeItem('staffUser');
        toast.success('Logged out successfully');
        router.push('/crm-login');
    };

    // Role-based permissions checks
    const hasAccess = (section) => {
        if (!staffUser) return false;
        const role = staffUser.role;
        if (role === 'admin') return true;

        switch (section) {
            case 'customers': return ['sales', 'admin'].includes(role);
            case 'repairs': return ['technician', 'sales', 'admin'].includes(role);
            case 'kanban': return ['technician', 'sales', 'admin'].includes(role);
            case 'stock': return ['technician', 'sales', 'admin'].includes(role);
            case 'accounting': return ['accountant', 'admin'].includes(role);
            case 'reports': return true; // all submit, admin views
            case 'social': return ['sales', 'admin'].includes(role);
            case 'remix': return true;
            default: return false;
        }
    };

    // --- CRUD Actions ---

    // Save Customer
    const handleCreateCustomer = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE_URL}/crm/customers`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newCustomer)
            });
            if (res.ok) {
                toast.success('Customer registered successfully');
                setNewCustomer({ name: '', email: '', phone: '', address: '', notes: '' });
                setIsCustomerModalOpen(false);
                fetchCrmData('customers');
            } else {
                toast.error('Failed to add customer');
            }
        } catch (err) { toast.error('API Error'); }
    };

    // Save Repair Job
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
                technician: staffUser.role === 'technician' ? staffUser.id : undefined,
                status: 'intake'
            };

            const res = await fetch(`${API_BASE_URL}/crm/repairs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success('Job Intake recorded successfully!');
                setNewRepair({ customerId: '', device: '', serialNumber: '', issue: '', price: 0, technicianId: '', partsNeeded: '' });
                setIsJobModalOpen(false);
                fetchCrmData('repairs');
            } else {
                toast.error('Failed to create repair job');
            }
        } catch (err) { toast.error('API Error'); }
    };

    // Update Repair Job Status (Drag and Drop / Button)
    const updateRepairStatus = async (jobId, nextStatus) => {
        try {
            const res = await fetch(`${API_BASE_URL}/crm/repairs/${jobId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: nextStatus })
            });

            if (res.ok) {
                toast.success(`Job status updated to ${nextStatus}`);
                fetchCrmData(activeTab);
            } else {
                const data = await res.json();
                toast.error(data.message || 'Status update failed');
            }
        } catch (err) { toast.error('API Error'); }
    };

    // Generate Feedback Token & Link
    const generateFeedbackLink = async (jobId, customerId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/crm/feedback/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
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
        } catch (err) { toast.error('API Error'); }
    };

    // Save Stock/Inventory Part
    const handleCreateStock = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE_URL}/crm/stock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newStock)
            });
            if (res.ok) {
                toast.success('Inventory stock added');
                setNewStock({ name: '', sku: '', quantity: 0, unitPrice: 0, reorderLevel: 5, category: 'General' });
                setIsStockModalOpen(false);
                fetchCrmData('stock');
            } else {
                const data = await res.json();
                toast.error(data.message || 'Failed to add stock item');
            }
        } catch (err) { toast.error('API Error'); }
    };

    // Save Accounting Entry
    const handleCreateLedger = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE_URL}/crm/accounting`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newLedger)
            });
            if (res.ok) {
                toast.success('Transaction logged in ledger');
                setNewLedger({ type: 'inflow', category: 'Repair Payment', amount: 0, description: '' });
                setIsLedgerModalOpen(false);
                fetchCrmData('accounting');
            } else {
                toast.error('Failed to register transaction');
            }
        } catch (err) { toast.error('API Error'); }
    };

    // Daily Report: Add Morning Todo
    const addMorningTodo = () => {
        if (!morningTodoText.trim()) return;
        const list = [...morningTodos, morningTodoText.trim()];
        setMorningTodos(list);
        setMorningTodoText('');
        saveMorningTodos(list);
    };

    const saveMorningTodos = async (list) => {
        try {
            const dateStr = new Date().toISOString().split('T')[0];
            await fetch(`${API_BASE_URL}/crm/reports/todo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ date: dateStr, todos: list })
            });
            toast.success('Morning todos updated');
        } catch (e) {}
    };

    // Toggling todo check status
    const toggleTodoStatus = (todoText) => {
        const updated = { ...completedTodos, [todoText]: !completedTodos[todoText] };
        setCompletedTodos(updated);
    };

    // Submit Daily Checkout Report
    const handleCheckoutReport = async (e) => {
        e.preventDefault();
        try {
            const dateStr = new Date().toISOString().split('T')[0];
            const completedList = morningTodos.filter(t => completedTodos[t]);

            const res = await fetch(`${API_BASE_URL}/crm/reports/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    date: dateStr,
                    completedTodos: completedList,
                    challenges: eveningReport.challenges,
                    summary: eveningReport.summary
                })
            });

            if (res.ok) {
                toast.success('End of day report submitted successfully! Good job today.');
                fetchCrmData('reports');
            } else {
                toast.error('Checkout failed');
            }
        } catch (e) { toast.error('API error during checkout'); }
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

    // --- VIDEO REMIXING TOOL ---
    const handleVideoRemix = async (e) => {
        e.preventDefault();
        if (!videoUrl) return toast.error('Enter a social media URL first');

        setRemixLoading(true);
        setRemixResult(null);
        toast.loading('Downloading video, blurring watermarks, and stamping logo...', { id: 'remix' });

        try {
            const res = await fetch(`${API_BASE_URL}/crm/video-remix`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
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

    // --- SOCIAL NETWORKS posting & dynamic UI connections ---
    const handleConnectSocial = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE_URL}/crm/social/accounts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(socialForm)
            });
            if (res.ok) {
                toast.success(`Connected to ${socialForm.platform}!`);
                setSocialForm({ platform: 'facebook', accountName: '', accessToken: '', pageId: '' });
                setIsSocialModalOpen(false);
                fetchCrmData('social');
            } else {
                toast.error('Failed to link social account');
            }
        } catch (e) { toast.error('Connection API Error'); }
    };

    const handleDisconnectSocial = async (id) => {
        if (!confirm('Disconnect this account?')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/crm/social/accounts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Social account removed');
                fetchCrmData('social');
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
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
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

    // Render loading indicator
    if (loading && !staffUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[#f89e35] mx-auto" />
                    <p className="text-slate-500 font-semibold">Validating session...</p>
                </div>
            </div>
        );
    }

    if (!staffUser) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans selection:bg-[#f89e35] selection:text-white relative">
            <Toaster position="top-right" />

            {/* Sidebar navigation */}
            <aside className="w-72 bg-[#0f172a] text-slate-400 p-6 flex flex-col justify-between hidden lg:flex">
                <div className="space-y-8">
                    <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-[#f89e35] flex items-center justify-center">
                            <span className="w-3 h-3 rounded-full bg-[#0f172a]"></span>
                        </span>
                        <div>
                            <h2 className="text-white text-lg font-black tracking-wide">LALA CRM</h2>
                            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">{staffUser.role} panel</p>
                        </div>
                    </div>

                    <nav className="space-y-1">
                        {[
                            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                            { id: 'customers', label: 'Customers', icon: Users },
                            { id: 'repairs', label: 'Repairs Ledger', icon: Wrench },
                            { id: 'kanban', label: 'Repairs Kanban', icon: CheckSquare },
                            { id: 'stock', label: 'Stock Inventory', icon: Box },
                            { id: 'accounting', label: 'Accounts & Review', icon: BarChart2 },
                            { id: 'reports', label: 'Daily Todo Report', icon: FileText },
                            { id: 'remix', label: 'Video Branding', icon: Video },
                            { id: 'social', label: 'Social Poster', icon: Share2 }
                        ].map((menu) => {
                            if (!hasAccess(menu.id)) return null;
                            const isAct = activeTab === menu.id;
                            return (
                                <button
                                    key={menu.id}
                                    onClick={() => setActiveTab(menu.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                                        isAct 
                                            ? 'bg-[#f89e35] text-white shadow-md' 
                                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                                    }`}
                                >
                                    <menu.icon className="w-5 h-5" />
                                    {menu.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="border-t border-slate-800 pt-6">
                    <div className="bg-slate-900 rounded-2xl p-4 mb-4 border border-slate-800/60 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#f89e35]/10 text-[#f89e35] font-black flex items-center justify-center">
                            {staffUser.name[0]}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-white font-bold truncate text-sm">{staffUser.name}</p>
                            <p className="text-slate-500 font-medium truncate text-xs">{staffUser.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full bg-slate-900 hover:bg-red-950/40 hover:text-red-400 text-slate-400 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer border border-slate-800"
                    >
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Header / Layout */}
            <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
                <header className="lg:hidden bg-[#0f172a] text-white p-5 flex items-center justify-between border-b border-slate-800">
                    <span className="font-black tracking-tight text-md">LALA CRM ({staffUser.role.toUpperCase()})</span>
                    <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-400 transition">
                        <LogOut className="w-5 h-5" />
                    </button>
                </header>

                <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
                    {/* Header line */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-5 border-b border-slate-200">
                        <div>
                            <span className="text-xs font-black tracking-widest text-[#f89e35] uppercase">{activeTab} module</span>
                            <h1 className="text-3xl font-black text-slate-900 capitalize tracking-tight mt-1">{activeTab === 'threed' ? '3D Editor' : activeTab.replace('-', ' ')}</h1>
                        </div>
                        
                        {/* Quick action buttons based on tab */}
                        <div className="mt-4 md:mt-0 flex gap-3">
                            {activeTab === 'customers' && hasAccess('customers') && (
                                <button onClick={() => setIsCustomerModalOpen(true)} className="bg-[#0f172a] hover:bg-[#f89e35] text-white px-5 py-3 rounded-2xl font-black text-sm tracking-wide shadow-md transition flex items-center gap-2 cursor-pointer">
                                    <Plus className="w-4 h-4" /> Add Customer
                                </button>
                            )}
                            {activeTab === 'repairs' && hasAccess('repairs') && (
                                <button onClick={() => setIsJobModalOpen(true)} className="bg-[#0f172a] hover:bg-[#f89e35] text-white px-5 py-3 rounded-2xl font-black text-sm tracking-wide shadow-md transition flex items-center gap-2 cursor-pointer">
                                    <Plus className="w-4 h-4" /> Log New Repair
                                </button>
                            )}
                            {activeTab === 'stock' && hasAccess('stock') && (
                                <button onClick={() => setIsStockModalOpen(true)} className="bg-[#0f172a] hover:bg-[#f89e35] text-white px-5 py-3 rounded-2xl font-black text-sm tracking-wide shadow-md transition flex items-center gap-2 cursor-pointer">
                                    <Plus className="w-4 h-4" /> Add Inventory
                                </button>
                            )}
                            {activeTab === 'accounting' && hasAccess('accounting') && (
                                <button onClick={() => setIsLedgerModalOpen(true)} className="bg-[#0f172a] hover:bg-[#f89e35] text-white px-5 py-3 rounded-2xl font-black text-sm tracking-wide shadow-md transition flex items-center gap-2 cursor-pointer">
                                    <Plus className="w-4 h-4" /> Log Entry
                                </button>
                            )}
                        </div>
                    </div>

                    {/* --- TAB CONTENT RENDER --- */}

                    {/* 1. OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Summary Metrics */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className="absolute -right-3 -top-3 w-16 h-16 bg-[#f89e35]/10 rounded-full"></div>
                                    <h4 className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Total Registered Customers</h4>
                                    <p className="text-4xl font-black text-slate-900 mt-2">{customers.length}</p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className="absolute -right-3 -top-3 w-16 h-16 bg-blue-500/10 rounded-full"></div>
                                    <h4 className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Active Repair Jobs</h4>
                                    <p className="text-4xl font-black text-slate-900 mt-2">
                                        {repairs.filter(r => !['ready', 'delivered'].includes(r.status)).length}
                                    </p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className="absolute -right-3 -top-3 w-16 h-16 bg-green-500/10 rounded-full"></div>
                                    <h4 className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Net Cash on Hand</h4>
                                    <p className="text-4xl font-black text-slate-900 mt-2">${accounting.cashRegister || 0}</p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className="absolute -right-3 -top-3 w-16 h-16 bg-red-500/10 rounded-full"></div>
                                    <h4 className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Low Inventory Warnings</h4>
                                    <p className="text-4xl font-black text-slate-900 mt-2">
                                        {stock.filter(s => s.quantity <= s.reorderLevel).length}
                                    </p>
                                </div>
                            </div>

                            {/* Main overview logs */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
                                    <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-[#f89e35]" /> Recent Intake & Active Repairs
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="text-slate-400 font-bold border-b border-slate-100">
                                                    <th className="py-2">Job ID</th>
                                                    <th className="py-2">Device</th>
                                                    <th className="py-2">Issue</th>
                                                    <th className="py-2">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {repairs.slice(0, 5).map(job => (
                                                    <tr key={job._id} className="border-b border-slate-50 hover:bg-slate-50">
                                                        <td className="py-3 font-bold text-slate-800">{job.jobId}</td>
                                                        <td className="py-3 font-semibold">{job.device}</td>
                                                        <td className="py-3 text-slate-500 truncate max-w-[120px]">{job.issue}</td>
                                                        <td className="py-3">
                                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${
                                                                job.status === 'ready' ? 'bg-green-100 text-green-700' :
                                                                job.status === 'repairing' ? 'bg-blue-100 text-blue-700' :
                                                                job.status === 'waiting_parts' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-slate-100 text-slate-600'
                                                            }`}>
                                                                {job.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                                    <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-red-500" /> Low Stock Alerts
                                    </h3>
                                    <div className="space-y-3">
                                        {stock.filter(s => s.quantity <= s.reorderLevel).slice(0, 6).map(item => (
                                            <div key={item._id} className="flex justify-between items-center bg-red-50/50 p-3 rounded-2xl border border-red-100">
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-semibold uppercase">SKU: {item.sku}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-red-600 font-bold">Qty: {item.quantity}</p>
                                                    <p className="text-[9px] text-slate-400">Reorder limit: {item.reorderLevel}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {stock.filter(s => s.quantity <= s.reorderLevel).length === 0 && (
                                            <p className="text-slate-400 text-xs font-semibold text-center py-6">All stock levels are optimal! 👍</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. CUSTOMERS TAB */}
                    {activeTab === 'customers' && hasAccess('customers') && (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
                            <div className="p-6 border-b border-slate-100">
                                <h3 className="text-lg font-black text-slate-900">All Registered Clients</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-xs tracking-wider border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-4">Client Name</th>
                                            <th className="px-6 py-4">Phone Number</th>
                                            <th className="px-6 py-4">Email</th>
                                            <th className="px-6 py-4">Address</th>
                                            <th className="px-6 py-4">Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customers.map(cust => (
                                            <tr key={cust._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                                <td className="px-6 py-4 font-bold text-slate-900">{cust.name}</td>
                                                <td className="px-6 py-4 font-medium text-slate-600">{cust.phone}</td>
                                                <td className="px-6 py-4 text-slate-500">{cust.email || 'N/A'}</td>
                                                <td className="px-6 py-4 text-slate-500 truncate max-w-[150px]">{cust.address || 'N/A'}</td>
                                                <td className="px-6 py-4 text-slate-400 text-xs truncate max-w-[200px]">{cust.notes || 'No extra notes'}</td>
                                            </tr>
                                        ))}
                                        {customers.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="text-center py-8 text-slate-400 font-semibold">No customers registered yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 3. REPAIRS TAB */}
                    {activeTab === 'repairs' && hasAccess('repairs') && (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-lg font-black text-slate-900">Repair Job Register</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-xs tracking-wider border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-4">Job ID</th>
                                            <th className="px-6 py-4">Client</th>
                                            <th className="px-6 py-4">Device Model</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Price</th>
                                            <th className="px-6 py-4">Parts Needed</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {repairs.map(job => (
                                            <tr key={job._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                                <td className="px-6 py-4 font-black text-[#f89e35]">{job.jobId}</td>
                                                <td className="px-6 py-4 font-bold text-slate-900">{job.customer?.name}</td>
                                                <td className="px-6 py-4 font-semibold text-slate-700">{job.device}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                                                        job.status === 'ready' ? 'bg-green-100 text-green-700' :
                                                        job.status === 'delivered' ? 'bg-slate-900 text-white' :
                                                        job.status === 'repairing' ? 'bg-blue-100 text-blue-700' :
                                                        job.status === 'waiting_parts' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {job.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-slate-800">${job.price || 0}</td>
                                                <td className="px-6 py-4 text-slate-500 font-medium">
                                                    {job.partsNeeded && job.partsNeeded.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {job.partsNeeded.map((p, idx) => (
                                                                <span key={idx} className="bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-600">{p}</span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        'None'
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => generateFeedbackLink(job._id, job.customer?._id)} 
                                                            className="text-xs font-bold text-[#f89e35] hover:underline flex items-center gap-1 cursor-pointer"
                                                            title="Generate feedback link"
                                                        >
                                                            Feedback Link
                                                        </button>
                                                        {['ready', 'intake', 'diagnosis', 'repairing', 'waiting_parts'].includes(job.status) && (
                                                            <button 
                                                                onClick={() => updateRepairStatus(job._id, 'delivered')} 
                                                                className="bg-slate-900 hover:bg-[#f89e35] text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                                                            >
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
                        </div>
                    )}

                    {/* 4. KANBAN TAB */}
                    {activeTab === 'kanban' && hasAccess('kanban') && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            <p className="text-slate-400 font-semibold text-xs bg-white/60 p-3 rounded-2xl border border-slate-200/50 inline-block">
                                💡 Tip: You can drag and drop jobs between columns to update their repair status.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 min-h-[600px] items-start">
                                {[
                                    { status: 'intake', label: 'New Intake', bg: 'bg-slate-100 border-slate-200' },
                                    { status: 'diagnosis', label: 'Diagnosis', bg: 'bg-indigo-50 border-indigo-100' },
                                    { status: 'repairing', label: 'In Repair', bg: 'bg-blue-50 border-blue-100' },
                                    { status: 'waiting_parts', label: 'Waiting for Parts', bg: 'bg-yellow-50 border-yellow-100' },
                                    { status: 'ready', label: 'Ready for Pickup', bg: 'bg-green-50 border-green-100' },
                                    { status: 'delivered', label: 'Delivered', bg: 'bg-slate-800 text-white' }
                                ].map((col) => {
                                    const colJobs = repairs.filter(r => r.status === col.status);
                                    return (
                                        <div
                                            key={col.status}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, col.status)}
                                            className={`p-4 rounded-3xl border-2 border-dashed ${col.bg} min-h-[500px] flex flex-col space-y-4`}
                                        >
                                            <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                                                <h4 className="font-black text-sm uppercase tracking-wide truncate">{col.label}</h4>
                                                <span className="bg-[#f89e35] text-white px-2 py-0.5 rounded-full text-xs font-bold">{colJobs.length}</span>
                                            </div>

                                            <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-1">
                                                {colJobs.map((job) => (
                                                    <div
                                                        key={job._id}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, job._id)}
                                                        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition duration-150 space-y-2 group"
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <span className="text-[10px] font-black text-[#f89e35] tracking-wide">{job.jobId}</span>
                                                            <span className="text-[9px] text-slate-400 font-bold">{new Date(job.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="font-bold text-slate-800 text-xs group-hover:text-[#f89e35] transition truncate">{job.device}</p>
                                                        <p className="text-[11px] text-slate-400 truncate leading-tight">{job.issue}</p>
                                                        <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                                                            <span className="text-[10px] font-black text-slate-700">${job.price}</span>
                                                            <span className="text-[9px] font-medium text-slate-400 truncate max-w-[60px]">{job.customer?.name}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {colJobs.length === 0 && (
                                                    <p className="text-[10px] text-slate-400 text-center py-10 font-bold">Column empty</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 5. STOCK TAB */}
                    {activeTab === 'stock' && hasAccess('stock') && (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
                            <div className="p-6 border-b border-slate-100">
                                <h3 className="text-lg font-black text-slate-900">Inventory Stock & Spare Parts</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-xs tracking-wider border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-4">Part Name</th>
                                            <th className="px-6 py-4">SKU</th>
                                            <th className="px-6 py-4">Category</th>
                                            <th className="px-6 py-4">Quantity</th>
                                            <th className="px-6 py-4">Unit Price</th>
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
                                                        <span className="bg-red-100 text-red-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">Out of Stock</span>
                                                    ) : item.quantity <= item.reorderLevel ? (
                                                        <span className="bg-yellow-100 text-yellow-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">Reorder Warning</span>
                                                    ) : (
                                                        <span className="bg-green-100 text-green-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">Optimal</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 6. ACCOUNTING TAB */}
                    {activeTab === 'accounting' && hasAccess('accounting') && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            {/* Summary cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-green-50 p-6 rounded-3xl border border-green-100 text-green-800 flex items-center justify-between">
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-wider text-green-500">Total Inflow (Revenue)</h4>
                                        <p className="text-3xl font-black mt-1">${accounting.totalInflow || 0}</p>
                                    </div>
                                    <TrendingUp className="w-8 h-8 text-green-400" />
                                </div>
                                <div className="bg-red-50 p-6 rounded-3xl border border-red-100 text-red-800 flex items-center justify-between">
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-wider text-red-500">Total Outflow (Expense)</h4>
                                        <p className="text-3xl font-black mt-1">${accounting.totalOutflow || 0}</p>
                                    </div>
                                    <TrendingDown className="w-8 h-8 text-red-400" />
                                </div>
                                <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 text-white flex items-center justify-between">
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-wider text-[#f89e35]">Net Surplus Register</h4>
                                        <p className="text-3xl font-black mt-1">${accounting.cashRegister || 0}</p>
                                    </div>
                                    <DollarSign className="w-8 h-8 text-[#f89e35]" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Ledger logs */}
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
                                    <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3">Financial Transaction Ledger</h3>
                                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="text-slate-400 font-bold border-b border-slate-100">
                                                <tr>
                                                    <th className="py-2">Date</th>
                                                    <th className="py-2">Type</th>
                                                    <th className="py-2">Category</th>
                                                    <th className="py-2">Amount</th>
                                                    <th className="py-2">Description</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {accounting.entries.map((entry) => (
                                                    <tr key={entry._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                                                        <td className="py-3 text-xs text-slate-400 font-medium">
                                                            {new Date(entry.date).toLocaleDateString()}
                                                        </td>
                                                        <td className="py-3">
                                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                                                entry.type === 'inflow' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                            }`}>
                                                                {entry.type}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 font-bold text-slate-800">{entry.category}</td>
                                                        <td className={`py-3 font-black ${entry.type === 'inflow' ? 'text-green-600' : 'text-red-600'}`}>
                                                            {entry.type === 'inflow' ? '+' : '-'}${entry.amount}
                                                        </td>
                                                        <td className="py-3 text-xs text-slate-500 truncate max-w-[150px]">{entry.description || 'N/A'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Customer Feedbacks */}
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                                    <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                                        <Star className="w-5 h-5 text-[#f89e35] fill-[#f89e35]" /> Customer Reviews
                                    </h3>
                                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                                        {feedbackLogs.map((fb) => (
                                            <div key={fb._id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <p className="font-bold text-xs text-slate-800">{fb.customer?.name}</p>
                                                    <div className="flex text-[#f89e35]">
                                                        {Array.from({ length: fb.rating }).map((_, i) => (
                                                            <Star key={i} className="w-3.5 h-3.5 fill-[#f89e35]" />
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Device: {fb.job?.device} ({fb.job?.jobId})</p>
                                                <p className="text-xs text-slate-500 italic leading-relaxed">"{fb.comment || 'No review comment left.'}"</p>
                                            </div>
                                        ))}
                                        {feedbackLogs.length === 0 && (
                                            <p className="text-slate-400 text-xs font-semibold text-center py-8">No customer reviews submitted yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 7. REPORTS TAB */}
                    {activeTab === 'reports' && hasAccess('reports') && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
                            {/* Submit daily report */}
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 lg:col-span-1">
                                <div className="border-b border-slate-100 pb-3">
                                    <h3 className="text-lg font-black text-slate-900">Submit Daily Report</h3>
                                    <p className="text-slate-400 text-xs font-medium">Record your daily todos and checkout report</p>
                                </div>

                                {/* Morning todos section */}
                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-wider text-slate-400">Morning Todos Input</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="E.g., Diagnose iPhone 11 repair"
                                            value={morningTodoText}
                                            onChange={(e) => setMorningTodoText(e.target.value)}
                                            className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl font-medium focus:outline-none focus:border-[#f89e35] text-xs"
                                        />
                                        <button onClick={addMorningTodo} className="bg-slate-900 hover:bg-[#f89e35] text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition">
                                            Add
                                        </button>
                                    </div>
                                    <div className="space-y-2 pt-2">
                                        {morningTodos.map((todo, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                                <input
                                                    type="checkbox"
                                                    checked={!!completedTodos[todo]}
                                                    onChange={() => toggleTodoStatus(todo)}
                                                    className="w-4 h-4 rounded text-[#f89e35] focus:ring-[#f89e35]"
                                                />
                                                <span className={`text-xs font-medium ${completedTodos[todo] ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                                    {todo}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Evening Checkout Form */}
                                <form onSubmit={handleCheckoutReport} className="space-y-4 pt-4 border-t border-slate-100">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-wider text-slate-400">Daily Summary</label>
                                        <textarea
                                            rows="3"
                                            placeholder="E.g., Completed all diagnosis, waiting for parts on JOB-1002."
                                            value={eveningReport.summary}
                                            onChange={(e) => setEveningReport(prev => ({ ...prev, summary: e.target.value }))}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl focus:outline-none focus:border-[#f89e35] text-xs resize-none"
                                        ></textarea>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-wider text-slate-400">Challenges / Notes</label>
                                        <textarea
                                            rows="2"
                                            placeholder="E.g., Power outage delayed testing"
                                            value={eveningReport.challenges}
                                            onChange={(e) => setEveningReport(prev => ({ ...prev, challenges: e.target.value }))}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 p-3 rounded-xl focus:outline-none focus:border-[#f89e35] text-xs resize-none"
                                        ></textarea>
                                    </div>
                                    <button type="submit" className="w-full bg-slate-900 hover:bg-[#f89e35] text-white py-3 rounded-xl text-xs font-black tracking-wide shadow transition cursor-pointer">
                                        SUBMIT CHECKOUT REPORT ➔
                                    </button>
                                </form>
                            </div>

                            {/* Reports List */}
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
                                <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-[#f89e35]" /> Saved Staff Daily Reports
                                </h3>
                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                                    {reports.map((rep) => (
                                        <div key={rep._id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                                            <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
                                                <div>
                                                    <p className="font-bold text-xs text-slate-800">{rep.staff?.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-semibold uppercase">{rep.staff?.role}</p>
                                                </div>
                                                <p className="text-xs text-[#f89e35] font-bold">{rep.date}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase text-slate-400">Task Performance</p>
                                                <p className="text-xs font-medium text-slate-600">
                                                    Completed <strong className="text-slate-800">{rep.completedTodos?.length}</strong> out of <strong className="text-slate-800">{rep.morningTodos?.length}</strong> morning tasks.
                                                </p>
                                            </div>
                                            {rep.summary && (
                                                <div className="space-y-0.5">
                                                    <p className="text-[9px] font-black uppercase text-slate-400">Checkout Summary</p>
                                                    <p className="text-xs text-slate-600 leading-relaxed font-medium">"{rep.summary}"</p>
                                                </div>
                                            )}
                                            {rep.challenges && (
                                                <div className="space-y-0.5">
                                                    <p className="text-[9px] font-black uppercase text-red-400">Challenges Faced</p>
                                                    <p className="text-xs text-red-600 leading-relaxed font-medium">"{rep.challenges}"</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {reports.length === 0 && (
                                        <p className="text-slate-400 text-xs font-semibold text-center py-10">No daily reports recorded yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 8. REMIX TAB */}
                    {activeTab === 'remix' && hasAccess('remix') && (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-12 space-y-8 max-w-2xl mx-auto animate-in fade-in duration-300">
                            <div className="text-center space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#f89e35] bg-[#f89e35]/10 px-4 py-1.5 rounded-full">Branding Tool</span>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-3">Video Remixing & Watermark Remover</h2>
                                <p className="text-slate-400 text-sm font-semibold max-w-md mx-auto">
                                    Paste any social media video link. The server will download the video, remove any watermarks, overlay the Lala Tech branding logo, and output a direct download link.
                                </p>
                            </div>

                            <form onSubmit={handleVideoRemix} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase tracking-wider text-slate-400">Social Media Video URL</label>
                                    <input
                                        type="url"
                                        placeholder="https://www.tiktok.com/@username/video/..."
                                        value={videoUrl}
                                        onChange={(e) => setVideoUrl(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-950 px-5 py-4 rounded-2xl font-semibold focus:outline-none focus:border-[#f89e35] focus:ring-4 focus:ring-[#f89e35]/10 shadow-inner placeholder:text-slate-400 text-sm transition-all"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={remixLoading}
                                    className="w-full bg-slate-950 hover:bg-[#f89e35] text-white py-4 rounded-2xl font-black text-sm tracking-wide transition-all shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {remixLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin text-white" /> PROCESSING REMIX...
                                        </>
                                    ) : (
                                        'REMOVE WATERMARK & BRAND VIDEO ➔'
                                    )}
                                </button>
                            </form>

                            {remixResult && (
                                <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="w-6 h-6 text-green-500" />
                                        <h3 className="font-bold text-sm">Branding Completed Successfully!</h3>
                                    </div>
                                    <p className="text-slate-400 text-xs">
                                        Watermarks have been boxblurred in typical corner locations, and the Lala Tech logo has been stamped at the bottom-center of the video layout.
                                    </p>
                                    
                                    <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800 relative">
                                        <video src={remixResult.previewUrl} controls className="w-full h-full object-cover"></video>
                                    </div>

                                    <a
                                        href={remixResult.downloadUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full bg-[#f89e35] hover:bg-[#e08922] text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 text-xs"
                                    >
                                        Download Processed Video File
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 9. SOCIAL TAB */}
                    {activeTab === 'social' && hasAccess('social') && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
                            {/* Left Side: Post Composer */}
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 lg:col-span-2">
                                <div className="border-b border-slate-100 pb-3">
                                    <h3 className="text-lg font-black text-slate-900">Compose Social Update</h3>
                                    <p className="text-slate-400 text-xs font-semibold">Post text & media directly to your linked profiles</p>
                                </div>

                                <form onSubmit={handlePublishPost} className="space-y-6">
                                    {/* Platform Selection */}
                                    <div className="space-y-3">
                                        <label className="text-xs font-black uppercase tracking-wider text-slate-400 block">Select Target Accounts</label>
                                        <div className="flex flex-wrap gap-3">
                                            {socialAccounts.map((acc) => (
                                                <button
                                                    key={acc._id}
                                                    type="button"
                                                    onClick={() => setSelectedSocials(prev => ({ ...prev, [acc._id]: !prev[acc._id] }))}
                                                    className={`px-4 py-3 rounded-2xl font-bold text-xs transition border flex items-center gap-2 cursor-pointer ${
                                                        selectedSocials[acc._id]
                                                            ? 'bg-[#f89e35]/10 border-[#f89e35] text-[#f89e35]'
                                                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    <span className="capitalize font-black text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded">
                                                        {acc.platform}
                                                    </span>
                                                    {acc.accountName}
                                                </button>
                                            ))}
                                            {socialAccounts.length === 0 && (
                                                <p className="text-xs text-slate-400 font-semibold bg-yellow-50 border border-yellow-100 p-3 rounded-xl">
                                                    ⚠️ No accounts connected. Connect an account on the right sidebar first.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Textarea content */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-wider text-slate-400">Post Message</label>
                                        <textarea
                                            rows="5"
                                            placeholder="Write your announcement or caption here..."
                                            value={postContent}
                                            onChange={(e) => setPostContent(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-950 p-4 rounded-2xl text-xs font-semibold focus:outline-none focus:border-[#f89e35] resize-none leading-relaxed"
                                            required
                                        ></textarea>
                                    </div>

                                    {/* Optional media link */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-wider text-slate-400">Media URL (Optional)</label>
                                        <input
                                            type="url"
                                            placeholder="https://cloudinary.com/example-image.jpg"
                                            value={postMediaUrl}
                                            onChange={(e) => setPostMediaUrl(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-xl font-medium focus:outline-none focus:border-[#f89e35] text-xs"
                                        />
                                        <p className="text-[10px] text-slate-400 font-medium">Recommended for Instagram posts</p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={postingLoading || socialAccounts.length === 0}
                                        className="w-full bg-slate-950 hover:bg-[#f89e35] text-white py-4 rounded-2xl font-black text-sm tracking-wide transition-all shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 cursor-pointer flex items-center justify-center gap-2"
                                    >
                                        {postingLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin text-white" />
                                        ) : (
                                            'PUBLISH SOCIAL POST ➔'
                                        )}
                                    </button>
                                </form>
                            </div>

                            {/* Right Side: Account Connections */}
                            <div className="space-y-6 lg:col-span-1">
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                        <h3 className="font-black text-slate-900 text-sm">Linked Social Profiles</h3>
                                        <button onClick={() => setIsSocialModalOpen(true)} className="text-xs font-bold text-[#f89e35] hover:underline flex items-center gap-1 cursor-pointer">
                                            + Connect
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {socialAccounts.map((acc) => (
                                            <div key={acc._id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-150">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="capitalize font-black text-[9px] bg-slate-800 text-white px-1.5 py-0.5 rounded">
                                                            {acc.platform}
                                                        </span>
                                                        <span className="font-bold text-xs text-slate-900">{acc.accountName}</span>
                                                    </div>
                                                    <p className="text-[9px] text-slate-400 font-bold mt-1">
                                                        {acc.pageId ? `Page ID: ${acc.pageId}` : 'OAuth Connection'}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleDisconnectSocial(acc._id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 transition cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        {socialAccounts.length === 0 && (
                                            <p className="text-slate-400 text-xs font-semibold text-center py-8">No social accounts connected yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* --- FORM OVERLAY MODALS --- */}

            {/* 1. Add Customer Modal */}
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
                                <input type="text" required value={newCustomer.name} onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35]" placeholder="E.g., John Doe" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Phone Number</label>
                                <input type="tel" required value={newCustomer.phone} onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35]" placeholder="E.g., +234800000000" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Email Address</label>
                                <input type="email" value={newCustomer.email} onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35]" placeholder="E.g., john@gmail.com" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Address</label>
                                <input type="text" value={newCustomer.address} onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35]" placeholder="Client home/work address" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Internal Notes</label>
                                <input type="text" value={newCustomer.notes} onChange={(e) => setNewCustomer(prev => ({ ...prev, notes: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35]" placeholder="E.g., Preferred weekend deliveries" />
                            </div>
                            
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl text-xs font-bold transition">Cancel</button>
                                <button type="submit" className="flex-1 bg-[#0f172a] hover:bg-[#f89e35] text-white py-3 rounded-2xl text-xs font-black transition">Create Profile</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 2. Add Repair Job Modal */}
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
                                <select required value={newRepair.customerId} onChange={(e) => setNewRepair(prev => ({ ...prev, customerId: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35]">
                                    <option value="">-- Choose Customer --</option>
                                    {customers.map(c => (
                                        <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Device Name</label>
                                    <input type="text" required value={newRepair.device} onChange={(e) => setNewRepair(prev => ({ ...prev, device: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35]" placeholder="E.g., iPhone 13" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Serial / IMEI</label>
                                    <input type="text" value={newRepair.serialNumber} onChange={(e) => setNewRepair(prev => ({ ...prev, serialNumber: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35]" placeholder="Optional" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Issue Description</label>
                                <input type="text" required value={newRepair.issue} onChange={(e) => setNewRepair(prev => ({ ...prev, issue: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35]" placeholder="E.g., Cracked screen, doesn't power on" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Required Spare Parts (Comma separated SKU/Names)</label>
                                <input type="text" value={newRepair.partsNeeded} onChange={(e) => setNewRepair(prev => ({ ...prev, partsNeeded: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35]" placeholder="E.g., iPhone 13 Screen, Glue" />
                                <p className="text-[9px] text-slate-400 font-medium">If parts match inventory name, quantity is auto-deducted on completion!</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Estimated Repair Cost ($)</label>
                                <input type="number" required value={newRepair.price} onChange={(e) => setNewRepair(prev => ({ ...prev, price: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35]" placeholder="Price in USD" />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsJobModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl text-xs font-bold transition">Cancel</button>
                                <button type="submit" className="flex-1 bg-[#0f172a] hover:bg-[#f89e35] text-white py-3 rounded-2xl text-xs font-black transition">Intake Device</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 3. Add Stock Modal */}
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
                                <input type="text" required value={newStock.name} onChange={(e) => setNewStock(prev => ({ ...prev, name: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35]" placeholder="E.g., iPhone 13 Screen" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">SKU Code</label>
                                <input type="text" required value={newStock.sku} onChange={(e) => setNewStock(prev => ({ ...prev, sku: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35]" placeholder="E.g., IP13-SCR-01" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Quantity</label>
                                    <input type="number" required value={newStock.quantity} onChange={(e) => setNewStock(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35]" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Cost Price ($)</label>
                                    <input type="number" required value={newStock.unitPrice} onChange={(e) => setNewStock(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35]" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Reorder Alert Level</label>
                                    <input type="number" required value={newStock.reorderLevel} onChange={(e) => setNewStock(prev => ({ ...prev, reorderLevel: parseInt(e.target.value) || 5 }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35]" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Category</label>
                                    <input type="text" value={newStock.category} onChange={(e) => setNewStock(prev => ({ ...prev, category: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none focus:border-[#f89e35]" placeholder="E.g., Screens, Batteries" />
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

            {/* 4. Add Ledger Entry Modal */}
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
                                    <select value={newLedger.type} onChange={(e) => setNewLedger(prev => ({ ...prev, type: e.target.value, category: e.target.value === 'inflow' ? 'Repair Payment' : 'Part Purchase' }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none">
                                        <option value="inflow">Inflow (Income)</option>
                                        <option value="outflow">Outflow (Expense)</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Category</label>
                                    {newLedger.type === 'inflow' ? (
                                        <select value={newLedger.category} onChange={(e) => setNewLedger(prev => ({ ...prev, category: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none">
                                            <option value="Repair Payment">Repair Payment</option>
                                            <option value="Course Sale">Course Sale</option>
                                            <option value="Investment">Investment</option>
                                            <option value="Other Inflow">Other Inflow</option>
                                        </select>
                                    ) : (
                                        <select value={newLedger.category} onChange={(e) => setNewLedger(prev => ({ ...prev, category: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none">
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
                                <input type="number" required value={newLedger.amount} onChange={(e) => setNewLedger(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none" placeholder="0.00" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Description</label>
                                <input type="text" value={newLedger.description} onChange={(e) => setNewLedger(prev => ({ ...prev, description: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none" placeholder="Notes explaining the ledger transaction" />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsLedgerModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl text-xs font-bold transition">Cancel</button>
                                <button type="submit" className="flex-1 bg-[#0f172a] hover:bg-[#f89e35] text-white py-3 rounded-2xl text-xs font-black transition">Log Ledger</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 5. Connect Social Account Modal */}
            {isSocialModalOpen && (
                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] p-8 max-w-md w-full border border-slate-100 shadow-2xl relative space-y-6">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Connect Social Profile</h3>
                            <p className="text-slate-400 text-xs font-semibold">Integrate and store access details for dynamic posting</p>
                        </div>
                        <form onSubmit={handleConnectSocial} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Platform Network</label>
                                <select value={socialForm.platform} onChange={(e) => setSocialForm(prev => ({ ...prev, platform: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none">
                                    <option value="facebook">Facebook Page</option>
                                    <option value="instagram">Instagram Business</option>
                                    <option value="twitter">Twitter / X Profile</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Account / Page Name</label>
                                <input type="text" required value={socialForm.accountName} onChange={(e) => setSocialForm(prev => ({ ...prev, accountName: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none" placeholder="E.g., Lala Tech Page" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Page ID / Username (Optional)</label>
                                <input type="text" value={socialForm.pageId} onChange={(e) => setSocialForm(prev => ({ ...prev, pageId: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs focus:outline-none" placeholder="E.g., 1002384759902 or screen_name" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Developer Access Token (Optional)</label>
                                <textarea rows="3" value={socialForm.accessToken} onChange={(e) => setSocialForm(prev => ({ ...prev, accessToken: e.target.value }))} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs focus:outline-none" placeholder="Paste access token. Leave empty to connect in Demo/Simulation Mode!"></textarea>
                                <p className="text-[9px] text-slate-400 font-semibold">Tokens are securely stored in the Lala Tech Database.</p>
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
    );
}
