'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import API_BASE_URL from '@/lib/api';

export default function PromotionModal() {
    const [config, setConfig] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/config`);
                const data = await res.json();
                if (data.modalActive) {
                    setConfig(data);
                    // Show modal after a short delay
                    setTimeout(() => setIsVisible(true), 1500);
                }
            } catch (err) {
                console.error('Failed to fetch modal config');
            }
        };
        fetchConfig();
    }, []);

    if (!config || !isVisible) return null;

    const handleClick = () => {
        if (config.modalWhatsAppNumber) {
            window.open(`https://wa.me/${config.modalWhatsAppNumber}`, '_blank');
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsVisible(false)}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg bg-white rounded-[40px] overflow-hidden shadow-2xl border border-white/20"
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setIsVisible(false)}
                            className="absolute top-6 right-6 z-10 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white p-2 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div
                            className="cursor-pointer group relative aspect-[4/5] overflow-hidden bg-slate-100"
                            onClick={handleClick}
                        >
                            {config.modalType === 'image' ? (
                                <img
                                    src={config.modalMediaUrl}
                                    alt="Promotion"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                            ) : (
                                <video
                                    src={config.modalMediaUrl}
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                            )}

                            {/* Hover Overlay */}
                            <div className="absolute inset-x-0 bottom-0 p-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                                <span className="inline-flex items-center gap-2 bg-[#f89e35] text-white px-6 py-3 rounded-full font-black text-sm shadow-xl animate-bounce">
                                    Chat with us on WhatsApp
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
