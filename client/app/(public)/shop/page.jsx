'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Share2, MessageCircle, X, Search } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '@/lib/api';

const SHOP_CATEGORIES = ['All', 'General', 'Electronics', 'Accessories', 'Software', 'Clothing', 'Books', 'Other'];

export default function ShopPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [search, setSearch] = useState('');
    const [shareProduct, setShareProduct] = useState(null);
    const [shareCopied, setShareCopied] = useState(false);
    const [whatsappNumber, setWhatsappNumber] = useState('2340000000000');

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
    
    // ... rest of the logic ...
    const filtered = products.filter(p =>
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
    );

    // --- Share ---
    const handleShare = async (product) => {
        const url = `${window.location.origin}/shop/${product.slug}`;
        const caption = `🛍️ Found this awesome product on Lala Tech website and I'm sure it'll be of your interest!\n\n*${product.title}*\n💰 Price: ₦${Number(product.price).toLocaleString()}\n\n${product.description || ''}\n\n🔗 Check it out: ${url}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: product.title,
                    text: caption,
                    url,
                });
            } catch (_) {}
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
        const message = `Hey! 👋 I found this on *Lala Tech Website* and I'd love to buy it!\n\n🛒 *Product:* ${product.title}\n💰 *Price:* ₦${Number(product.price).toLocaleString()}\n🖼️ *Image:* ${product.image || ''}\n\n${product.description ? `📝 *Details:* ${product.description}\n\n` : ''}Can you help me place this order? 🙏`;
        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/${whatsappNumber}?text=${encoded}`, '_blank');
    };

    return (
        <div className="shop-page">
            <style>{`
                .shop-page {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #fff7ed 0%, #fff 60%, #fef1f0 100%);
                    padding: 80px 0 80px;
                }
                .shop-container { max-width: 1280px; margin: 0 auto; padding: 0 20px; }

                /* Header */
                .shop-header { text-align: center; margin-bottom: 48px; padding-top: 20px; }
                .shop-badge {
                    display: inline-flex; align-items: center; gap: 6px;
                    background: linear-gradient(135deg, #f89e35, #f56e00);
                    color: white; font-size: 11px; font-weight: 800;
                    letter-spacing: 1.5px; text-transform: uppercase;
                    padding: 6px 14px; border-radius: 100px; margin-bottom: 16px;
                }
                .shop-title { font-size: 48px; font-weight: 900; color: #0f172a; letter-spacing: -1.5px; margin: 0 0 12px; }
                .shop-subtitle { color: #64748b; font-size: 17px; font-weight: 500; margin-bottom: 32px; }

                /* Search */
                .shop-search {
                    max-width: 440px; margin: 0 auto 32px;
                    display: flex; align-items: center;
                    background: white; border-radius: 100px; border: 1.5px solid #e2e8f0;
                    padding: 8px 16px; gap: 10px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .shop-search:focus-within { border-color: #f89e35; box-shadow: 0 4px 20px rgba(248,158,53,0.12); }
                .shop-search input { flex: 1; border: none; outline: none; font-size: 15px; font-weight: 500; color: #0f172a; background: transparent; }
                .shop-search input::placeholder { color: #94a3b8; }

                /* Category Strip */
                .category-strip {
                    display: flex; gap: 10px; overflow-x: auto; padding-bottom: 8px;
                    margin-bottom: 40px; scrollbar-width: none; justify-content: center;
                }
                @media (max-width: 768px) { .category-strip { justify-content: flex-start; } }
                .category-strip::-webkit-scrollbar { display: none; }
                .cat-btn {
                    padding: 8px 18px; border-radius: 100px; border: 1.5px solid #e2e8f0;
                    font-size: 13px; font-weight: 700; cursor: pointer;
                    white-space: nowrap; transition: all 0.15s;
                    background: white; color: #64748b;
                }
                .cat-btn.active { background: linear-gradient(135deg, #f89e35, #f56e00); color: white; border-color: transparent; box-shadow: 0 4px 16px rgba(248,158,53,0.3); }
                .cat-btn:hover:not(.active) { border-color: #f89e35; color: #f89e35; }

                /* Grid */
                .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 28px; }

                /* Card */
                .product-card {
                    background: white; border-radius: 24px; overflow: hidden;
                    box-shadow: 0 2px 16px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.05);
                    transition: box-shadow 0.25s, transform 0.25s;
                    display: flex; flex-direction: column;
                }
                .product-card:hover { box-shadow: 0 12px 48px rgba(248,158,53,0.14); transform: translateY(-4px); }
                .product-img-wrap { position: relative; aspect-ratio: 1; overflow: hidden; background: #f8fafc; }
                .product-img-wrap img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
                .product-card:hover .product-img-wrap img { transform: scale(1.06); }
                .price-badge {
                    position: absolute; top: 14px; right: 14px;
                    background: linear-gradient(135deg, #f89e35, #f56e00);
                    color: white; font-weight: 900; font-size: 14px;
                    padding: 6px 14px; border-radius: 100px;
                    box-shadow: 0 4px 16px rgba(248,158,53,0.35);
                }
                .product-body { padding: 20px; flex: 1; display: flex; flex-direction: column; }
                .product-name { font-size: 17px; font-weight: 800; color: #0f172a; margin-bottom: 6px; line-height: 1.3; }
                .product-desc { font-size: 13px; color: #64748b; line-height: 1.6; flex: 1; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 16px; }
                .product-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                .btn-share {
                    display: flex; align-items: center; justify-content: center; gap: 6px;
                    padding: 11px 8px; border-radius: 14px; border: 1.5px solid #f89e35;
                    background: white; color: #f89e35; font-size: 13px; font-weight: 700;
                    cursor: pointer; transition: all 0.15s;
                }
                .btn-share:hover { background: #fff7ed; transform: translateY(-1px); }
                .btn-buy {
                    display: flex; align-items: center; justify-content: center; gap: 6px;
                    padding: 11px 8px; border-radius: 14px; border: none;
                    background: linear-gradient(135deg, #f89e35, #f56e00);
                    color: white; font-size: 13px; font-weight: 800;
                    cursor: pointer; transition: all 0.15s;
                    box-shadow: 0 4px 16px rgba(248,158,53,0.3);
                }
                .btn-buy:hover { transform: scale(1.03); box-shadow: 0 6px 24px rgba(248,158,53,0.4); }

                /* Share modal */
                .share-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .share-box { background: white; border-radius: 28px; padding: 32px; width: 100%; max-width: 440px; box-shadow: 0 40px 100px rgba(0,0,0,0.2); }
                .share-product-img { width: 100%; height: 220px; object-fit: cover; border-radius: 18px; margin-bottom: 20px; border: 1px solid #f1f5f9; }
                .share-caption { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; font-size: 14px; color: #334155; line-height: 1.6; white-space: pre-wrap; margin-bottom: 20px; }
                .share-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                .share-btn-copy { padding: 13px; border-radius: 14px; border: 1.5px solid #e2e8f0; background: white; font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.15s; color: #0f172a; }
                .share-btn-copy:hover { border-color: #f89e35; color: #f89e35; }
                .share-btn-wa { padding: 13px; border-radius: 14px; border: none; background: linear-gradient(135deg, #25D366, #128C7E); color: white; font-weight: 800; font-size: 14px; cursor: pointer; transition: all 0.15s; }
                .share-btn-wa:hover { transform: scale(1.02); }

                /* Skeleton */
                @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
                .skeleton { background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 400% 100%; animation: shimmer 1.5s infinite; border-radius: 12px; }
            `}</style>

            {/* ✅ Share Fallback Modal */}
            <AnimatePresence>
                {shareProduct && (
                    <motion.div className="share-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShareProduct(null)}>
                        <motion.div
                            className="share-box"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h3 style={{ fontWeight: 900, fontSize: 18, color: '#0f172a', margin: 0 }}>Share Product</h3>
                                <button onClick={() => setShareProduct(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                    <X size={20} />
                                </button>
                            </div>
                            {shareProduct.image && (
                                <img src={shareProduct.image} alt={shareProduct.title} className="share-product-img" />
                            )}
                            <div className="share-caption">{shareProduct.caption}</div>
                            <div className="share-actions">
                                <button className="share-btn-copy" onClick={copyShareText}>
                                    {shareCopied ? '✓ Copied!' : '📋 Copy Text'}
                                </button>
                                <button className="share-btn-wa" onClick={() => handleBuyNow(shareProduct)}>
                                    💬 Share on WhatsApp
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="shop-container">
                {/* Header */}
                <div className="shop-header">
                    <div className="shop-badge"><ShoppingBag size={11} /> Official Shop</div>
                    <h1 className="shop-title">Lala Tech Shop</h1>
                    <p className="shop-subtitle">Premium tech products — delivered to your doorstep</p>

                    {/* Search */}
                    <div className="shop-search">
                        <Search size={18} color="#94a3b8" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Category filters */}
                <div className="category-strip">
                    {SHOP_CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            className={`cat-btn ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Products */}
                {loading ? (
                    <div className="product-grid">
                        {[1,2,3,4].map(i => (
                            <div key={i} style={{ background: 'white', borderRadius: 24, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
                                <div className="skeleton" style={{ width: '100%', aspectRatio: '1' }} />
                                <div style={{ padding: 20 }}>
                                    <div className="skeleton" style={{ height: 20, width: '70%', marginBottom: 10 }} />
                                    <div className="skeleton" style={{ height: 14, marginBottom: 6 }} />
                                    <div className="skeleton" style={{ height: 14, width: '50%', marginBottom: 20 }} />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                        <div className="skeleton" style={{ height: 42, borderRadius: 14 }} />
                                        <div className="skeleton" style={{ height: 42, borderRadius: 14 }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: 24, border: '2px dashed #e2e8f0' }}>
                        <ShoppingBag size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
                        <h3 style={{ fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
                            {search ? 'No products match your search' : 'Shop Coming Soon'}
                        </h3>
                        <p style={{ color: '#94a3b8', fontSize: 14 }}>
                            {search ? `Try a different keyword` : 'We\'re restocking — check back soon!'}
                        </p>
                    </div>
                ) : (
                    <div className="product-grid">
                        {filtered.map((product, idx) => (
                            <Link href={`/shop/${product.slug}`} key={product._id} className="block no-underline">
                                <motion.div
                                    className="product-card"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    {/* Image */}
                                    <div className="product-img-wrap">
                                        {product.image ? (
                                            <img
                                                src={product.image}
                                                alt={product.title}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentNode.style.background = '#f1f5f9';
                                                }}
                                            />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <ShoppingBag size={48} color="#cbd5e1" />
                                            </div>
                                        )}
                                        <div className="price-badge">₦{Number(product.price).toLocaleString()}</div>
                                    </div>

                                    {/* Body */}
                                    <div className="product-body">
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                                            <h3 className="product-name">{product.title}</h3>
                                        </div>
                                        <p className="product-desc">{product.description || 'Premium product from Lala Tech.'}</p>

                                        <div className="product-actions" onClick={(e) => e.preventDefault()}>
                                            <button className="btn-share" onClick={(e) => { e.stopPropagation(); handleShare(product); }}>
                                                <Share2 size={15} />
                                                Share
                                            </button>
                                            <button className="btn-buy" onClick={(e) => { e.stopPropagation(); handleBuyNow(product); }}>
                                                <MessageCircle size={15} />
                                                Buy Now
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Footer count */}
                {!loading && products.length > 0 && (
                    <p style={{ textAlign: 'center', color: '#94a3b8', fontWeight: 600, fontSize: 13, marginTop: 48 }}>
                        Showing {filtered.length} of {products.length} products
                    </p>
                )}
            </div>
        </div>
    );
}
