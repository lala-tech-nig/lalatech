import React, { useState, useEffect } from 'react';
import { X, Volume2, VolumeX, Play } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AudioTestModal({ onClose, onComplete }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioCtx, setAudioCtx] = useState(null);

    useEffect(() => {
        return () => {
            if (audioCtx && audioCtx.state !== 'closed') {
                try { audioCtx.close(); } catch(e) {}
            }
        };
    }, [audioCtx]);

    const playTone = (channel) => {
        if (audioCtx && audioCtx.state !== 'closed') {
            try { audioCtx.close(); } catch(e) {}
        }
        
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        setAudioCtx(ctx);
        setIsPlaying(channel);

        const osc = ctx.createOscillator();
        const panner = ctx.createStereoPanner();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime); // 440 Hz
        
        // Pan: -1 is left, 1 is right
        panner.pan.setValueAtTime(channel === 'left' ? -1 : 1, ctx.currentTime);
        
        // Fade out
        gain.gain.setValueAtTime(1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

        osc.connect(panner);
        panner.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 1.5);

        setTimeout(() => setIsPlaying(false), 1500);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500">
                    <X size={18} />
                </button>
                
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Volume2 size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Stereo Speaker Test</h2>
                    <p className="text-slate-500 mt-2 text-sm">Please make sure your volume is turned up. Test both left and right audio channels.</p>
                </div>

                <div className="flex gap-4 mb-8">
                    <button 
                        onClick={() => playTone('left')}
                        disabled={isPlaying}
                        className="flex-1 flex flex-col items-center py-6 bg-slate-50 border-2 border-slate-100 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all disabled:opacity-50 group"
                    >
                        <Volume2 className="text-slate-400 group-hover:text-emerald-500 mb-2" />
                        <span className="font-bold text-slate-700">Test Left</span>
                    </button>
                    
                    <button 
                        onClick={() => playTone('right')}
                        disabled={isPlaying}
                        className="flex-1 flex flex-col items-center py-6 bg-slate-50 border-2 border-slate-100 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all disabled:opacity-50 group"
                    >
                        <Volume2 className="text-slate-400 group-hover:text-emerald-500 mb-2" />
                        <span className="font-bold text-slate-700">Test Right</span>
                    </button>
                </div>

                <div className="space-y-3 border-t border-slate-100 pt-6">
                    <button onClick={() => onComplete(true)} className="w-full py-4 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-colors">
                        Yes, I heard both clearly
                    </button>
                    <button onClick={() => onComplete(false)} className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors">
                        No, Audio is not working properly
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
