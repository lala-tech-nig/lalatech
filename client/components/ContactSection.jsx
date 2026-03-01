'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Confetti from 'react-confetti';
import { Send, Loader2 } from 'lucide-react';

export default function ContactSection() {
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [loading, setLoading] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('http://localhost:5000/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to send message');

            toast.success('Message sent successfully!', {
                style: { background: '#f89e35', color: '#ffffff', fontWeight: 'bold' }
            });
            setShowConfetti(true);
            setFormData({ name: '', email: '', message: '' });
            setTimeout(() => setShowConfetti(false), 5000);
        } catch (err) {
            toast.error('Failed to send message. Please try again.', {
                style: { background: '#ef4444', color: '#fff' }
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="py-24 relative bg-white" id="contact">
            {showConfetti && mounted && <Confetti recycle={false} numberOfPieces={500} colors={['#f89e35', '#000000', '#e08b2c']} className="!fixed !top-0 !left-0 !z-[100]" />}

            {/* Subtle glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-2xl bg-[#f89e35]/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-4xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-200 text-slate-500 bg-slate-50 font-bold text-xs tracking-widest uppercase mb-6 transition-all duration-500 shadow-sm">
                        Contact
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black mb-6 text-slate-900 tracking-tight transition-all duration-500">
                        Get In <span className="text-[#f89e35]">Touch</span>
                    </h2>
                    <p className="text-slate-600 font-medium transition-all duration-500 delay-100">
                        Ready to turn your ideas into wonderful software solutions? Send us a message!
                    </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-8 md:p-12 rounded-3xl shadow-lg transition-all duration-700">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#f89e35] focus:ring-1 focus:ring-[#f89e35] transition shadow-sm"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#f89e35] focus:ring-1 focus:ring-[#f89e35] transition shadow-sm"
                                    placeholder="john@example.com"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Message</label>
                            <textarea
                                required
                                rows="5"
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#f89e35] focus:ring-1 focus:ring-[#f89e35] transition resize-none shadow-sm"
                                placeholder="How can we help you?"
                            ></textarea>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#f89e35] hover:bg-[#e08b2c] text-white font-black py-4 rounded-xl transition flex justify-center items-center gap-2 group disabled:opacity-50 shadow-md shadow-[#f89e35]/20"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    Send Message
                                    <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}
