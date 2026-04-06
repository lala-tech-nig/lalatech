'use client';
import { useState, useEffect } from 'react';
import { Camera, X, ZoomIn, ChevronLeft, ChevronRight, Images, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '@/lib/api';

export default function GalleryPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Lightbox State
    const [activeFolder, setActiveFolder] = useState(null); // stores the currently viewed gallery item
    const [activeIndex, setActiveIndex] = useState(0); // stores the index of the image within the folder

    useEffect(() => { fetchGallery(); }, []);

    const fetchGallery = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/gallery`);
            if (res.ok) setItems(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const currentImages = activeFolder ? (activeFolder.images?.length > 1 ? activeFolder.images : [activeFolder.image]) : [];

    const prev = () => setActiveIndex(i => (i - 1 + currentImages.length) % currentImages.length);
    const next = () => setActiveIndex(i => (i + 1) % currentImages.length);

    useEffect(() => {
        const handleKey = (e) => {
            if (activeFolder) {
                if (e.key === 'ArrowLeft') prev();
                if (e.key === 'ArrowRight') next();
                if (e.key === 'Escape') setActiveFolder(null);
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [activeFolder, currentImages.length]);

    return (
        <div className="gallery-page">
            <style>{`
                .gallery-page { min-height: 100vh; background: #ffffff; padding: 120px 0 80px; }
                .gallery-container { max-width: 1160px; margin: 0 auto; padding: 0 24px; }

                .gallery-hero { text-align: center; margin-bottom: 60px; }
                .g-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(248,158,53,0.1); border: 1px solid rgba(248,158,53,0.2); color: #f89e35; font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; padding: 7px 16px; border-radius: 100px; margin-bottom: 18px; box-shadow: 0 2px 5px rgba(248,158,53,0.05); }
                .g-title { font-size: 56px; font-weight: 900; color: #0f172a; letter-spacing: -2px; line-height: 1.05; margin: 0 0 14px; }
                .g-title span { background: linear-gradient(135deg, #f89e35, #f56e00); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
                .g-subtitle { color: #64748b; font-size: 16px; max-width: 440px; margin: 0 auto; line-height: 1.6; font-weight: 500; }

                /* Masonry Grid */
                .masonry { columns: 4; column-gap: 20px; }
                .masonry-item { break-inside: avoid; margin-bottom: 20px; position: relative; cursor: pointer; border-radius: 20px; background: #f8fafc; border: 1px solid #f1f5f9; z-index: 1; }
                
                /* Folder Styling for multiple images */
                .masonry-item.is-folder { margin-top: 12px; margin-bottom: 32px; }
                .masonry-item.is-folder::before {
                    content: ''; position: absolute; top: -8px; right: 6px; bottom: 8px; left: 6px;
                    background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 20px; z-index: -1;
                    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .masonry-item.is-folder::after {
                    content: ''; position: absolute; top: -16px; right: 12px; bottom: 16px; left: 12px;
                    background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 20px; z-index: -2;
                    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .masonry-item.is-folder:hover::before { transform: rotate(3deg) scale(0.98); border-color: rgba(248,158,53,0.3); background: rgba(248,158,53,0.05); }
                .masonry-item.is-folder:hover::after { transform: rotate(-3deg) scale(0.95); border-color: rgba(248,158,53,0.2); background: rgba(248,158,53,0.02); }

                .folder-badge {
                    position: absolute; top: 16px; left: 16px; background: rgba(255,255,255,0.9);
                    backdrop-filter: blur(8px); color: #0f172a; padding: 6px 12px; border-radius: 100px;
                    font-size: 11px; font-weight: 800; display: flex; align-items: center; gap: 6px; z-index: 10;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid rgba(0,0,0,0.05);
                }

                .masonry-item img { width: 100%; display: block; border-radius: 20px; transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
                .photo-wrapper { overflow: hidden; border-radius: 20px; position: relative; z-index: 2; height: 100%; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
                
                .masonry-item:hover .photo-wrapper img { transform: scale(1.05); }
                
                .masonry-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(15,23,42,0.8) 0%, transparent 60%); opacity: 0; transition: opacity 0.4s; border-radius: 20px; display: flex; flex-direction: column; justify-content: flex-end; padding: 24px; z-index: 3; }
                .masonry-item:hover .masonry-overlay { opacity: 1; }
                .masonry-title { color: white; font-weight: 800; font-size: 16px; margin-bottom: 6px; letter-spacing: -0.5px; }
                .masonry-desc { color: rgba(255,255,255,0.8); font-size: 13px; font-weight: 500; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                
                .zoom-icon { position: absolute; top: 16px; right: 16px; width: 36px; height: 36px; background: rgba(255,255,255,0.9); backdrop-filter: blur(8px); border-radius: 50%; display: flex; align-items: center; justify-content: center; opacity: 0; transition: all 0.3s; z-index: 10; box-shadow: 0 4px 15px rgba(0,0,0,0.1); color: #0f172a; }
                .masonry-item:hover .zoom-icon { opacity: 1; transform: scale(1); }
                .zoom-icon:hover { background: #f89e35; color: white; }

                .empty-gallery { text-align: center; padding: 120px 24px; background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 32px; }

                /* Skeleton */
                .skel-grid { columns: 4; column-gap: 20px; }
                .skel-item { break-inside: avoid; margin-bottom: 20px; border-radius: 20px; background: #f1f5f9; animation: pulse 1.5s ease-in-out infinite; }
                @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.6} }

                /* Lightbox */
                .lightbox { position: fixed; inset: 0; z-index: 500; background: rgba(15,23,42,0.95); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; padding: 20px; }
                .lb-img { max-width: 90vw; max-height: 85vh; border-radius: 16px; object-fit: contain; box-shadow: 0 32px 80px rgba(0,0,0,0.5); }
                .lb-close { position: fixed; top: 24px; right: 32px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.1); color: white; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; transition: all 0.2s; backdrop-filter: blur(8px); }
                .lb-close:hover { background: white; color: #0f172a; transform: scale(1.05); }
                
                .lb-btn { position: fixed; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.1); color: white; width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; z-index: 10; backdrop-filter: blur(8px); }
                .lb-btn:hover { background: white; color: #0f172a; scale: 1.05; }
                .lb-prev { left: 32px; }
                .lb-next { right: 32px; }
                
                .lb-caption { position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%); text-align: center; background: rgba(0,0,0,0.6); backdrop-filter: blur(12px); padding: 12px 24px; border-radius: 100px; border: 1px solid rgba(255,255,255,0.1); }
                .lb-title-text { color: white; font-weight: 800; font-size: 15px; margin-bottom: 2px; }
                .lb-counter { color: #94a3b8; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }

                @media (max-width: 1024px) { .masonry, .skel-grid { columns: 3; } }
                @media (max-width: 768px) { .masonry, .skel-grid { columns: 2; } .g-title { font-size: 42px; } .lb-prev { left: 16px; } .lb-next { right: 16px; } }
                @media (max-width: 480px) { .masonry, .skel-grid { columns: 1; } }
            `}</style>

            <div className="gallery-container">
                <div className="gallery-hero">
                    <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}}>
                        <div className="g-badge"><Camera size={14} /> Our Gallery</div>
                        <h1 className="g-title">Moments &<br /><span>Milestones</span></h1>
                        <p className="g-subtitle">A visual journey through Lala Tech's projects, events, and team memories.</p>
                    </motion.div>
                </div>

                {loading ? (
                    <div className="skel-grid">
                        {[240, 320, 180, 300, 260, 200, 340, 280, 220].map((h, i) => (
                            <div key={i} className="skel-item" style={{ height: h }} />
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <div className="empty-gallery">
                        <Images size={64} className="mx-auto text-slate-300 mb-6" />
                        <h3 className="text-2xl font-black text-slate-900 mb-2">Gallery Coming Soon</h3>
                        <p className="text-slate-500 font-medium">We're curating moments to share with you. Check back soon!</p>
                    </div>
                ) : (
                    <motion.div className="masonry" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ staggerChildren: 0.1 }}>
                        {items.map((item, idx) => {
                            const isFolder = item.images && item.images.length > 1;
                            return (
                                <motion.div
                                    key={item._id}
                                    className={`masonry-item ${isFolder ? 'is-folder' : ''}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => { setActiveFolder(item); setActiveIndex(0); }}
                                >
                                    <div className="photo-wrapper">
                                        {isFolder && (
                                            <div className="folder-badge">
                                                <Layers size={12} className="text-[#f89e35]" />
                                                <span>{item.images.length}</span>
                                            </div>
                                        )}
                                        <img src={item.image} alt={item.title || `Gallery ${idx + 1}`} loading="lazy" />
                                        <div className="masonry-overlay">
                                            {item.title && <div className="masonry-title">{item.title}</div>}
                                            {item.description && <div className="masonry-desc">{item.description}</div>}
                                        </div>
                                    </div>
                                    <div className="zoom-icon"><ZoomIn size={18} /></div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {activeFolder !== null && currentImages[activeIndex] && (
                    <motion.div className="lightbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveFolder(null)}>
                        <button className="lb-close" onClick={() => setActiveFolder(null)}><X size={20} /></button>
                        
                        {currentImages.length > 1 && (
                            <>
                                <button className="lb-btn lb-prev" onClick={e => { e.stopPropagation(); prev(); }}><ChevronLeft size={28} /></button>
                                <button className="lb-btn lb-next" onClick={e => { e.stopPropagation(); next(); }}><ChevronRight size={28} /></button>
                            </>
                        )}

                        <motion.img
                            key={`${activeFolder._id}-${activeIndex}`}
                            src={currentImages[activeIndex]}
                            alt={activeFolder.title || ''}
                            className="lb-img"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            onClick={e => e.stopPropagation()}
                        />
                        
                        <div className="lb-caption" onClick={e => e.stopPropagation()}>
                            {activeFolder.title && <div className="lb-title-text">{activeFolder.title}</div>}
                            <div className="lb-counter">
                                {currentImages.length > 1 
                                    ? `Photo ${activeIndex + 1} of ${currentImages.length} in this folder` 
                                    : 'Single Item'}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
