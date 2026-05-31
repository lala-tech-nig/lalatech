'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, KeyRound, Mail, ArrowRight } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { API_BASE_URL } from '@/lib/api';

export default function StaffLogin() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // If already logged in, redirect to CRM
        const token = localStorage.getItem('staffToken');
        if (token) {
            router.push('/crm');
        }
    }, [router]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/crm/staff/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                localStorage.setItem('staffToken', data.token);
                localStorage.setItem('staffUser', JSON.stringify(data.user));
                toast.success(`Welcome back, ${data.user.name}!`);
                setTimeout(() => {
                    router.push('/crm');
                }, 1000);
            } else {
                toast.error(data.message || 'Invalid staff credentials');
            }
        } catch (err) {
            toast.error('Server error. Is the server running?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden font-sans selection:bg-[#f89e35] selection:text-white">
            <Toaster position="top-right" toastOptions={{ style: { background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0' } }} />

            {/* Glowing background blobs */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#f89e35]/15 rounded-full blur-[140px] -translate-y-1/3 translate-x-1/4"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4"></div>
            </div>

            <div className="relative z-10 w-full max-w-[440px] p-6">
                <div className="bg-slate-950/80 backdrop-blur-xl rounded-[32px] p-10 shadow-2xl border border-slate-800/80 relative overflow-hidden">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#f89e35] to-[#f56e00] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#f89e35]/30">
                        <span className="text-white font-black text-2xl tracking-tighter">LT</span>
                    </div>

                    <h2 className="text-3xl font-black text-white tracking-tight text-center mb-2">Staff Portal</h2>
                    <p className="text-slate-400 font-medium text-center mb-8 text-sm">Sign in to access the CRM Dashboard</p>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                    <Mail className="w-5 h-5" />
                                </span>
                                <input
                                    type="email"
                                    placeholder="name@lalatech.ng"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 text-white pl-12 pr-5 py-4 rounded-2xl font-medium focus:outline-none focus:border-[#f89e35] focus:ring-4 focus:ring-[#f89e35]/15 transition-all placeholder:text-slate-600"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Password</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                    <KeyRound className="w-5 h-5" />
                                </span>
                                <input
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 text-white pl-12 pr-5 py-4 rounded-2xl font-medium focus:outline-none focus:border-[#f89e35] focus:ring-4 focus:ring-[#f89e35]/15 transition-all placeholder:text-slate-600"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#f89e35] hover:bg-[#e08922] text-white py-4 rounded-2xl font-black text-sm tracking-wide transition-all shadow-xl shadow-[#f89e35]/25 hover:shadow-2xl hover:shadow-[#f89e35]/35 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin text-white" />
                            ) : (
                                <>
                                    ENTER STAFF CRM <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="text-center mt-8">
                    <button
                        onClick={() => router.push('/')}
                        className="text-slate-500 hover:text-slate-300 font-bold text-sm transition-colors py-2 px-4 rounded-full hover:bg-slate-800/40 inline-flex items-center gap-2 cursor-pointer"
                    >
                        ← Back to Website
                    </button>
                </div>
            </div>
        </div>
    );
}
