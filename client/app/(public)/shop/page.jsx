'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, Share2, MessageCircle, X, Search, ChevronRight, Filter, Star, ShieldCheck, Truck } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '@/lib/api';
import YoutubeDuration from '@/components/YoutubeDuration';

export default function ShopPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [search, setSearch] = useState('');
    const [shareProduct, setShareProduct] = useState(null);
    const [shareCopied, setShareCopied] = useState(false);
    const [whatsappNumber, setWhatsappNumber] = useState('2340000000000');
    const [categories, setCategories] = useState(['All']);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/products/categories`);
                if (res.ok) setCategories(['All', ...(await res.json())]);
            } catch (e) { console.error(e); }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchProducts();
        fetchConfig();
    }, [activeCategory]);

    const fetchConfig = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/config`);
            if (res.ok) {
                const data = await res.json();
                if (data.modalWhatsAppNumber) setWhatsappNumber(data.modalWhatsAppNumber);
            }
        } catch (_) {}
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = activeCategory !== 'All' ? `?category=${encodeURIComponent(activeCategory)}` : '';
            const res = await fetch(`${API_BASE_URL}/products${params}`);
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            }
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const filtered = products.filter(p =>
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
    );

    // --- Share ---
    const handleShare = async (product) => {
        const url = `${window.location.origin}/shop/${product.slug}`;
        const caption = `🛍️ Found this awesome product on Lala Tech website and I'm sure it'll be of your interest!\n\n*${product.title}*\n💰 Price: ₦${Number(product.price).toLocaleString()}\n\n${product.description || ''}\n\n🔗 Check it out: ${url}`;

        if (navigator.share) {
            try { await navigator.share({ title: product.title, text: caption, url }); } catch (_) {}
        } else {
            setShareProduct({ ...product, caption, url });
        }
    };

    const copyShareText = async () => {
        if (!shareProduct) return;
        await navigator.clipboard.writeText(shareProduct.caption);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
    };

    // --- WhatsApp Buy ---
    const handleBuyNow = (product) => {
        const message = `Hey! 👋 I found this on *Lala Tech Website* and I'd love to buy it!\n\n🛒 *Product:* ${product.title}\n💰 *Price:* ₦${Number(product.price).toLocaleString()}\n🔗 *Link:* ${window.location.origin}/shop/${product.slug}\n\nCan you help me place this order? 🙏`;
        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/${whatsappNumber}?text=${encoded}`, '_blank');
    };

    const extractVideoId = (url) => {
        if (!url) return null;
        const match = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
        return match ? match[1] : null;
    };

    return (
        <div className="min-h-screen bg-[#fafafa] pt-24 pb-20 font-sans text-slate-900 selection:bg-[#f89e35] selection:text-white">
            
            {/* Share Fallback Modal */}
            <AnimatePresence>
                {shareProduct && (
                    <motion.div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShareProduct(null)}>
                        <motion.div className="bg-white rounded-[24px] overflow-hidden w-full max-w-md shadow-2xl relative" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-bold text-lg">Share Product</h3>
                                <button onClick={() => setShareProduct(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
                            </div>
                            <div className="p-6">
                                {shareProduct.image && <img src={shareProduct.image} alt={shareProduct.title} className="w-full h-48 object-cover rounded-xl mb-4 border border-slate-100" />}
                                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm text-slate-600 mb-6 whitespace-pre-wrap leading-relaxed">{shareProduct.caption}</div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={copyShareText} className="py-3 px-4 rounded-xl font-bold text-sm bg-white border-2 border-slate-200 hover:border-[#f89e35] hover:text-[#f89e35] transition-all">
                                        {shareCopied ? 'Copied!' : 'Copy Text'}
                                    </button>
                                    <button onClick={() => handleBuyNow(shareProduct)} className="py-3 px-4 rounded-xl font-bold text-sm bg-green-500 hover:bg-green-600 text-white transition-all shadow-lg shadow-green-500/20">
                                        WhatsApp
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-[1400px] mx-auto px-4 md:px-8">
                
                {/* Header & Breadcrumbs */}
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                            <Link href="/" className="hover:text-[#f89e35] transition-colors">Home</Link>
                            <ChevronRight size={12} />
                            <span className="text-slate-900">Shop</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Tech Store</h1>
                        <p className="text-slate-500 mt-2 font-medium">Equip yourself with the best tech gear.</p>
                    </div>

                    <div className="relative w-full md:w-80">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Search size={18} className="text-slate-400" />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Search products..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-white border border-slate-200 pl-11 pr-4 py-3.5 rounded-2xl font-medium text-sm focus:outline-none focus:border-[#f89e35] focus:ring-4 focus:ring-[#f89e35]/10 shadow-sm transition-all"
                        />
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-10">
                    {/* Sidebar / Filters Desktop */}
                    <div className="hidden lg:block w-64 flex-shrink-0">
                        <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm sticky top-28">
                            <h3 className="font-black text-lg mb-6 flex items-center gap-2">
                                <Filter size={18} className="text-[#f89e35]" />
                                Categories
                            </h3>
                            <div className="space-y-1.5">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                            activeCategory === cat 
                                            ? 'bg-[#f89e35] text-white shadow-md shadow-[#f89e35]/20' 
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                            
                            <hr className="my-8 border-slate-100" />
                            
                            {/* Trust badges */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><ShieldCheck size={18} /></div>
                                    Secure Payments
                                </div>
                                <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500"><Truck size={18} /></div>
                                    Fast Shipping
                                </div>
                                <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500"><Star size={18} /></div>
                                    Premium Quality
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Filter Toggle */}
                    <div className="lg:hidden flex overflow-x-auto gap-2 pb-4 scrollbar-none">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${
                                    activeCategory === cat 
                                    ? 'bg-[#f89e35] text-white border-[#f89e35] shadow-md shadow-[#f89e35]/20' 
                                    : 'bg-white text-slate-600 border-slate-200'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                {[1,2,3,4,5,6].map(i => (
                                    <div key={i} className="bg-white rounded-[24px] border border-slate-100 p-2 shadow-sm">
                                        <div className="bg-slate-100 rounded-[18px] w-full aspect-[4/5] animate-pulse mb-4"></div>
                                        <div className="px-3 pb-3">
                                            <div className="h-4 bg-slate-100 rounded-md w-2/3 mb-2"></div>
                                            <div className="h-4 bg-slate-100 rounded-md w-1/3 mb-6"></div>
                                            <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[32px] py-24 px-6 text-center">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <ShoppingBag size={32} className="text-slate-300" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2">No Products Found</h3>
                                <p className="text-slate-500 mb-8 max-w-sm mx-auto">Try adjusting your category or search to find what you're looking for.</p>
                                <button onClick={() => {setSearch(''); setActiveCategory('All');}} className="bg-[#f89e35] text-white px-8 py-3 rounded-xl font-bold shadow-md shadow-[#f89e35]/20 hover:scale-105 transition-transform">
                                    Clear Filters
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filtered.map((product, idx) => {
                                    const videoId = extractVideoId(product.youtubeUrl);
                                    return (
                                        <Link href={`/shop/${product.slug}`} key={product._id} className="block group">
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.04 }}
                                                className="bg-white rounded-[24px] border border-slate-100 p-2 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] hover:border-slate-200 transition-all duration-300 h-full flex flex-col"
                                            >
                                                {/* Image Container */}
                                                <div className="relative bg-slate-50 rounded-[18px] aspect-[4/5] overflow-hidden mb-4">
                                                    {product.image ? (
                                                        <img
                                                            src={product.image}
                                                            alt={product.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                            onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.style.background = '#f1f5f9'; }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                                            <ShoppingBag size={48} className="text-slate-300" />
                                                        </div>
                                                    )}
                                                    
                                                    {/* Top Badges */}
                                                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                                                        {product.category && (
                                                            <span className="bg-white/95 backdrop-blur-sm text-slate-900 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm">
                                                                {product.category}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Duration Badge / YouTube logic */}
                                                    {videoId && (
                                                        <YoutubeDuration videoId={videoId} className="absolute bottom-3 left-3" />
                                                    )}
                                                    
                                                    {/* Share button floating target */}
                                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                                                        <button 
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShare(product); }}
                                                            className="w-8 h-8 bg-white/95 backdrop-blur-sm shadow-sm rounded-full flex items-center justify-center text-slate-500 hover:text-[#f89e35] transition-colors"
                                                            aria-label="Share"
                                                        >
                                                            <Share2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Product Details */}
                                                <div className="px-3 pb-3 flex flex-col flex-1">
                                                    <h3 className="font-bold text-slate-900 text-base mb-1 line-clamp-2 leading-tight flex-1">
                                                        {product.title}
                                                    </h3>
                                                    <div className="flex items-center justify-between mt-auto pt-3">
                                                        <span className="text-lg font-black text-[#f89e35]">
                                                            ₦{Number(product.price).toLocaleString()}
                                                        </span>
                                                        <button 
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleBuyNow(product); }}
                                                            className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-[#f89e35] hover:scale-105 transition-all shadow-md group-hover:shadow-[0_8px_20px_-4px_rgba(248,158,53,0.4)]"
                                                        >
                                                            <ShoppingBag size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                        
                        {!loading && filtered.length > 0 && (
                            <div className="mt-12 text-center text-slate-400 font-bold text-sm">
                                Showing {filtered.length} of {products.length} products
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
