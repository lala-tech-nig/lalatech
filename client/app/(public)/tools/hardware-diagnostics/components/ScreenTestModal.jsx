import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ScreenTestModal({ onClose, onComplete }) {
    const [step, setStep] = useState(0);
    const colors = ['bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-white', 'bg-black'];

    useEffect(() => {
        // Try to request fullscreen
        try { document.documentElement.requestFullscreen(); } catch (e) {}
        return () => {
            try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
        }
    }, []);

    const nextColor = () => {
        if (step < colors.length - 1) {
            setStep(step + 1);
        } else {
            setStep('complete');
            try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
        }
    };

    if (step === 'complete') {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
                    <h3 className="text-2xl font-bold mb-4">Screen Test Complete</h3>
                    <p className="text-slate-600 mb-8">Did you notice any dead pixels or discoloration?</p>
                    <div className="flex gap-4">
                        <button onClick={() => onComplete(false)} className="flex-1 py-3 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200">Yes, Issues</button>
                        <button onClick={() => onComplete(true)} className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600">No, All Good</button>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <div className={`fixed inset-0 z-[100] ${colors[step]} cursor-pointer flex items-center justify-center`} onClick={nextColor}>
            <div className={`text-base font-bold px-6 py-3 rounded-full opacity-50 ${step === 3 ? 'bg-black text-white' : 'bg-white text-black'}`}>
                Tap screen to change color ({step + 1}/{colors.length})
            </div>
        </div>
    );
}
