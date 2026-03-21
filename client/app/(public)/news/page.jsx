'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Tag, TrendingUp, Eye, Heart, Share2, Clock } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

const NEWS_CATEGORIES = ['All', 'Technology', 'Business', 'Design', 'Tutorial', 'Industry News', 'General'];

export default function NewsPage() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchNews();
    }, [activeCategory]);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const params = activeCategory !== 'All' ? `?category=${encodeURIComponent(activeCategory)}` : '';
            const res = await fetch(`${API_BASE_URL}/news${params}`);
            if (res.ok) setArticles(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filtered = articles.filter(a =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        (a.excerpt || '').toLowerCase().includes(search.toLowerCase())
    );

    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const readTime = (content) => `${Math.max(1, Math.ceil((content || '').split(' ').length / 200))} min read`;

    return (
        <div className="news-page">
            <style>{`
                .news-page {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #fff7ed 0%, #fff 60%, #fef1f0 100%);
                    padding: 80px 0 80px;
                }
                .news-container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
                .news-header { text-align: center; margin-bottom: 48px; padding-top: 20px; }
                .news-badge {
                    display: inline-flex; align-items: center; gap: 6px;
                    background: linear-gradient(135deg, #f89e35, #f56e00);
                    color: white; font-size: 11px; font-weight: 800;
                    letter-spacing: 1.5px; text-transform: uppercase;
                    padding: 6px 14px; border-radius: 100px; margin-bottom: 16px;
                }
                .news-title { font-size: 48px; font-weight: 900; color: #0f172a; letter-spacing: -1.5px; margin: 0 0 12px; }
                .news-subtitle { color: #64748b; font-size: 17px; font-weight: 500; }

                .search-bar {
                    max-width: 480px; margin: 28px auto 0;
                    display: flex; align-items: center;
                    background: white; border-radius: 100px; border: 1.5px solid #e2e8f0;
                    padding: 10px 18px; gap: 10px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
                    transition: border-color 0.2s;
                }
                .search-bar:focus-within { border-color: #f89e35; }
                .search-bar input { flex: 1; border: none; outline: none; font-size: 15px; font-weight: 500; color: #0f172a; background: transparent; }

                .category-strip {
                    display: flex; gap: 10px; overflow-x: auto; padding-bottom: 8px;
                    margin-bottom: 40px; scrollbar-width: none;
                }
                .category-strip::-webkit-scrollbar { display: none; }
                .cat-btn {
                    padding: 8px 18px; border-radius: 100px; border: 1.5px solid #e2e8f0;
                    font-size: 13px; font-weight: 700; cursor: pointer;
                    white-space: nowrap; transition: all 0.15s;
                    background: white; color: #64748b;
                }
                .cat-btn.active { background: linear-gradient(135deg, #f89e35, #f56e00); color: white; border-color: transparent; box-shadow: 0 4px 16px rgba(248,158,53,0.3); }
                .cat-btn:hover:not(.active) { border-color: #f89e35; color: #f89e35; }

                /* Featured article */
                .featured-card {
                    display: grid; grid-template-columns: 1fr 1fr; gap: 0;
                    background: #0f172a; border-radius: 28px; overflow: hidden;
                    margin-bottom: 40px; box-shadow: 0 20px 60px rgba(0,0,0,0.12);
                    text-decoration: none;
                    transition: transform 0.25s, box-shadow 0.25s;
                }
                @media (max-width: 768px) { .featured-card { grid-template-columns: 1fr; } }
                .featured-card:hover { transform: translateY(-4px); box-shadow: 0 32px 80px rgba(0,0,0,0.18); }
                .featured-img { aspect-ratio: 4/3; overflow: hidden; }
                .featured-img img { width: 100%; height: 100%; object-fit: cover; }
                .featured-img .no-img { width: 100%; height: 100%; background: linear-gradient(135deg, #1e293b, #0f172a); display: flex; align-items: center; justify-content: center; }
                .featured-body { padding: 48px 40px; display: flex; flex-direction: column; justify-content: center; }
                .featured-cat { font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #f89e35; margin-bottom: 16px; }
                .featured-title { font-size: 26px; font-weight: 900; color: white; line-height: 1.25; margin-bottom: 16px; }
                .featured-excerpt { font-size: 15px; color: #94a3b8; line-height: 1.7; margin-bottom: 24px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
                .featured-meta { display: flex; gap: 16px; align-items: center; font-size: 13px; font-weight: 600; color: #64748b; }
                .meta-item { display: flex; align-items: center; gap: 5px; }

                /* Article grid */
                .articles-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
                .article-card {
                    background: white; border-radius: 24px; overflow: hidden;
                    box-shadow: 0 2px 16px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.05);
                    transition: box-shadow 0.25s, transform 0.25s; text-decoration: none;
                    display: flex; flex-direction: column;
                }
                .article-card:hover { box-shadow: 0 12px 48px rgba(248,158,53,0.13); transform: translateY(-4px); }
                .article-img { aspect-ratio: 16/9; overflow: hidden; background: #f8fafc; }
                .article-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
                .article-card:hover .article-img img { transform: scale(1.06); }
                .no-img-placeholder { width: 100%; height: 100%; background: linear-gradient(135deg, #f1f5f9, #e2e8f0); display: flex; align-items: center; justify-content: center; }
                .article-body { padding: 22px; flex: 1; display: flex; flex-direction: column; }
                .article-cat { font-size: 10px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #f89e35; margin-bottom: 8px; }
                .article-title { font-size: 17px; font-weight: 800; color: #0f172a; line-height: 1.3; margin-bottom: 10px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                .article-excerpt { font-size: 13.5px; color: #64748b; line-height: 1.6; flex: 1; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 16px; }
                .article-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 14px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; font-weight: 600; }
                .article-stats { display: flex; gap: 12px; }
                .stat { display: flex; align-items: center; gap: 4px; }

                @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
                .skeleton { background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 400% 100%; animation: shimmer 1.5s infinite; border-radius: 12px; }
            `}</style>

            <div className="news-container">
                <div className="news-header">
                    <div className="news-badge"><TrendingUp size={11} /> Latest News</div>
                    <h1 className="news-title">Lala Tech News</h1>
                    <p className="news-subtitle">Insights, tutorials & industry updates from the team</p>
                    <div className="search-bar">
                        <Search size={18} color="#94a3b8" />
                        <input
                            type="text"
                            placeholder="Search articles..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Category filters */}
                <div className="category-strip">
                    {NEWS_CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            className={`cat-btn ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="articles-grid">
                        {[1,2,3].map(i => (
                            <div key={i} style={{ background: 'white', borderRadius: 24, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
                                <div className="skeleton" style={{ width: '100%', aspectRatio: '16/9' }} />
                                <div style={{ padding: 22 }}>
                                    <div className="skeleton" style={{ height: 12, width: '30%', marginBottom: 10 }} />
                                    <div className="skeleton" style={{ height: 20, width: '80%', marginBottom: 8 }} />
                                    <div className="skeleton" style={{ height: 14, marginBottom: 6 }} />
                                    <div className="skeleton" style={{ height: 14, width: '60%' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: 24, border: '2px dashed #e2e8f0' }}>
                        <TrendingUp size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
                        <h3 style={{ fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>No articles yet</h3>
                        <p style={{ color: '#94a3b8' }}>Check back soon for the latest updates!</p>
                    </div>
                ) : (
                    <>
                        {/* Featured - first article */}
                        {filtered.length > 0 && !search && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                                <Link href={`/news/${filtered[0].slug}`} className="featured-card">
                                    <div className="featured-img">
                                        {filtered[0].coverImage
                                            ? <img src={filtered[0].coverImage} alt={filtered[0].title} />
                                            : <div className="no-img"><TrendingUp size={48} color="#334155" /></div>
                                        }
                                    </div>
                                    <div className="featured-body">
                                        <div className="featured-cat">✦ {filtered[0].category}</div>
                                        <h2 className="featured-title">{filtered[0].title}</h2>
                                        <p className="featured-excerpt">{filtered[0].excerpt || filtered[0].content?.substring(0, 200)}</p>
                                        <div className="featured-meta">
                                            <span className="meta-item"><Clock size={13} />{readTime(filtered[0].content)}</span>
                                            <span className="meta-item"><Eye size={13} />{filtered[0].views || 0}</span>
                                            <span className="meta-item"><Heart size={13} />{filtered[0].likes || 0}</span>
                                            <span style={{ marginLeft: 'auto', color: '#64748b' }}>{formatDate(filtered[0].createdAt)}</span>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        )}

                        {/* Rest of articles */}
                        <div className="articles-grid" style={{ marginTop: 32 }}>
                            {(search ? filtered : filtered.slice(1)).map((article, idx) => (
                                <motion.div
                                    key={article._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <Link href={`/news/${article.slug}`} className="article-card">
                                        <div className="article-img">
                                            {article.coverImage
                                                ? <img src={article.coverImage} alt={article.title} onError={e => { e.target.style.display = 'none'; const p = e.target.parentNode.querySelector('.no-img-placeholder'); if (p) p.style.display = 'flex'; }} />
                                                : <div className="no-img-placeholder"><TrendingUp size={32} color="#cbd5e1" /></div>
                                            }
                                        </div>
                                        <div className="article-body">
                                            <div className="article-cat">{article.category}</div>
                                            <h3 className="article-title">{article.title}</h3>
                                            <p className="article-excerpt">{article.excerpt || article.content?.substring(0, 180)}</p>
                                            <div className="article-footer">
                                                <div className="article-stats">
                                                    <span className="stat"><Eye size={12} />{article.views || 0}</span>
                                                    <span className="stat"><Heart size={12} />{article.likes || 0}</span>
                                                </div>
                                                <span>{formatDate(article.createdAt)}</span>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
