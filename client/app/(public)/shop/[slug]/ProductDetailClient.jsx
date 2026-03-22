'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ArrowLeft, MessageCircle, Share2, ShieldCheck, Truck, RefreshCcw } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

export default function ProductDetailClient({ initialProduct, slug }) {
    const router = useRouter();
    const [product, setProduct] = useState(initialProduct);
    const [loading, setLoading] = useState(!initialProduct);
    const [whatsappNumber, setWhatsappNumber] = useState('2348121444306');

    useEffect(() => {
        if (!product && slug) {
            fetchProduct();
        }
        fetchConfig();
    }, [slug, product]);

    const fetchConfig = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/config`);
            if (res.ok) {
                const data = await res.json();
                if (data.modalWhatsAppNumber) setWhatsappNumber(data.modalWhatsAppNumber);
            }
        } catch (_) {}
    };

    const fetchProduct = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/products/slug/${slug}`);
            if (res.ok) {
                const data = await res.json();
                setProduct(data);
            }
        } catch (error) {
            console.error('Failed to fetch product:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBuyNow = () => {
        if (!product) return;
        const message = `Hey! 👋 I'm interested in buying *${product.title}* I saw on your website.\n\n💰 *Price:* ₦${Number(product.price).toLocaleString()}\n🔗 *Link:* ${window.location.href}\n\nCan you help me place an order? 🙏`;
        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/${whatsappNumber}?text=${encoded}`, '_blank');
    };

    const handleShare = async () => {
        if (!product) return;
        const url = window.location.href;
        const caption = `🛍️ Found this awesome product on Lala Tech: *${product.title}*\n\n💰 Price: ₦${Number(product.price).toLocaleString()}\n\n🔗 Check it out: ${url}`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: product.title,
                    text: caption,
                    url: url,
                });
            } catch (_) {}
        } else {
            await navigator.clipboard.writeText(url);
            alert('Link copied to clipboard!');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-12 h-12 border-4 border-[#f89e35] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
                <ShoppingBag size={64} className="text-slate-200 mb-6" />
                <h1 className="text-3xl font-black text-slate-900 mb-2">Product Not Found</h1>
                <p className="text-slate-500 mb-8 max-w-md">The product you're looking for might have been removed or the link is incorrect.</p>
                <Link href="/shop" className="bg-[#f89e35] text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-[#f89e35]/20 hover:scale-105 transition-transform">
                    Back to Shop
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-28 pb-20 px-6">
            <div className="max-w-6xl mx-auto">
                <Link href="/shop" className="inline-flex items-center gap-2 text-slate-500 font-bold hover:text-[#f89e35] transition-colors mb-8">
                    <ArrowLeft size={20} />
                    Back to Shop
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-[32px] overflow-hidden shadow-xl shadow-slate-200/50 border border-white"
                    >
                        <div className="aspect-square relative group">
                            {product.image ? (
                                <img 
                                    src={product.image} 
                                    alt={product.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                            ) : (
                                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                    <ShoppingBag size={80} className="text-slate-300" />
                                </div>
                            )}
                            <div className="absolute top-6 right-6 bg-[#f89e35] text-white px-6 py-2 rounded-full font-black text-lg shadow-xl shadow-[#f89e35]/30">
                                ₦{Number(product.price).toLocaleString()}
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col h-full"
                    >
                        <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-white flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-4 py-1.5 bg-orange-50 text-[#f89e35] text-xs font-black uppercase tracking-wider rounded-full border border-orange-100">
                                    {product.category || 'General'}
                                </span>
                                <span className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                                    <ShieldCheck size={14} className="text-emerald-500" />
                                    Authentic Product
                                </span>
                            </div>

                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                                {product.title}
                            </h1>

                            <div className="space-y-6 mb-10">
                                <p className="text-slate-600 text-lg leading-relaxed whitespace-pre-wrap">
                                    {product.description || 'Experience excellence with this premium product from Lala Tech.'}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 pt-6 border-t border-slate-50">
                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-[#f89e35]">
                                        <Truck size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900">Fast Delivery</p>
                                        <p className="text-xs text-slate-500">Nationwide shipping</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-[#f89e35]">
                                        <RefreshCcw size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900">Secure Payment</p>
                                        <p className="text-xs text-slate-500">Multiple options</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <button 
                                    onClick={handleBuyNow}
                                    className="flex-1 bg-[#f89e35] hover:bg-[#e08b2c] text-white px-8 py-5 rounded-2xl font-black text-xl transition-all shadow-xl shadow-[#f89e35]/20 flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <MessageCircle size={24} />
                                    Buy on WhatsApp
                                </button>
                                <button 
                                    onClick={handleShare}
                                    className="px-8 py-5 bg-white border-2 border-slate-100 hover:border-[#f89e35] hover:text-[#f89e35] text-slate-500 rounded-2xl font-black text-xl transition-all flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <Share2 size={24} />
                                    Share
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 flex items-center justify-between px-4 text-slate-400">
                             <div className="flex items-center gap-3">
                                <p className="text-sm font-black uppercase tracking-tighter text-slate-900">LALA TECH EXCELLENCE</p>
                             </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
