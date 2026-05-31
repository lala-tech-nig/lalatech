'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, CheckCircle, Wrench, ShieldCheck, Heart } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { API_BASE_URL } from '@/lib/api';

export default function CustomerFeedback() {
    const params = useParams();
    const router = useRouter();
    const token = params?.token;

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [feedbackData, setFeedbackData] = useState(null);
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        if (!token) return;
        
        const fetchFeedbackDetails = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/crm/feedback/token/${token}`);
                if (!res.ok) {
                    toast.error('Invalid or expired feedback link');
                    setLoading(false);
                    return;
                }
                const data = await res.json();
                setFeedbackData(data);
                if (data.isSubmitted) {
                    setIsFinished(true);
                }
            } catch (err) {
                toast.error('Failed to load feedback details');
            } finally {
                setLoading(false);
            }
        };

        fetchFeedbackDetails();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE_URL}/crm/feedback/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, rating, comment })
            });
            const data = await res.json();

            if (res.ok) {
                toast.success('Thank you for your feedback!');
                setIsFinished(true);
            } else {
                toast.error(data.message || 'Failed to submit feedback');
            }
        } catch (err) {
            toast.error('Error submitting feedback. Please check your connection.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-[#f89e35] border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-500 font-semibold">Loading review form...</p>
                </div>
            </div>
        );
    }

    if (!feedbackData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
                        <Wrench className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900">Link Invalid or Expired</h2>
                    <p className="text-slate-500 font-medium">
                        This feedback link is not valid or has expired. If you recently had a device repaired, please ask the technician to generate a new feedback link.
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full bg-slate-900 text-white py-3 rounded-2xl font-bold hover:bg-slate-800 transition"
                    >
                        Back to Lala Tech Home
                    </button>
                </div>
            </div>
        );
    }

    if (isFinished) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="max-w-md w-full bg-white rounded-3xl p-10 border border-slate-200 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-500 shadow-inner">
                        <CheckCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900">Thank You!</h2>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        We have successfully recorded your feedback for job <strong className="text-slate-800">{feedbackData.job?.jobId}</strong>. Your satisfaction helps us deliver professional repairs.
                    </p>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-4 text-xs font-semibold text-slate-400">
                        <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-green-500" /> Inspected</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Heart className="w-4 h-4 text-[#f89e35]" /> Lala Tech Care</span>
                    </div>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full bg-slate-900 hover:bg-[#f89e35] text-white py-4 rounded-2xl font-black text-sm tracking-wide transition-all shadow-md cursor-pointer"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans relative selection:bg-[#f89e35] selection:text-white">
            <Toaster position="top-right" />
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#f89e35]/5 rounded-full blur-[80px]"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[80px]"></div>
            </div>

            <div className="relative z-10 w-full max-w-xl bg-white rounded-3xl border border-slate-200/80 p-8 md:p-12 shadow-2xl">
                <div className="text-center mb-8">
                    <span className="text-xs font-black uppercase tracking-widest text-[#f89e35] bg-[#f89e35]/10 px-4 py-1.5 rounded-full">Customer Review</span>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-4 mb-2">Share Your Experience</h1>
                    <p className="text-slate-400 font-semibold text-sm">
                        Hello {feedbackData.customer?.name}, how did we do on your <strong className="text-slate-700 font-bold">{feedbackData.job?.device}</strong> repair?
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col items-center justify-center space-y-4">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400">Rate Our Service</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="p-1 cursor-pointer transition transform active:scale-95"
                                >
                                    <Star
                                        className={`w-10 h-10 ${
                                            star <= (hoverRating || rating)
                                                ? 'fill-[#f89e35] text-[#f89e35] drop-shadow-sm scale-110'
                                                : 'text-slate-300'
                                        } transition-all duration-150`}
                                    />
                                </button>
                            ))}
                        </div>
                        <span className="text-sm font-bold text-slate-600">
                            {rating === 5 && 'Excellent! 🌟'}
                            {rating === 4 && 'Very Good! 👍'}
                            {rating === 3 && 'Good / Satisfactory'}
                            {rating === 2 && 'Fair / Needs Improvement'}
                            {rating === 1 && 'Poor / Dissatisfied 👎'}
                        </span>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-400">Tell Us More (Optional)</label>
                        <textarea
                            rows="4"
                            placeholder="Write your review comments here. Your experience helps other customers make informed decisions!"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-5 py-4 rounded-2xl font-medium focus:outline-none focus:border-[#f89e35] focus:ring-4 focus:ring-[#f89e35]/10 shadow-inner transition-all placeholder:text-slate-400 resize-none text-sm leading-relaxed"
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-[#0f172a] hover:bg-[#f89e35] text-white py-4 rounded-2xl font-black text-sm tracking-wide transition-all shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {submitting ? (
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            'SUBMIT FEEDBACK ➔'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
