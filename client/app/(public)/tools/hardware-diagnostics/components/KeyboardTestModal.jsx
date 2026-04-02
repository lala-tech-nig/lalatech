import React, { useState, useEffect } from 'react';
import { X, Keyboard as KeyboardIcon, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';

export default function KeyboardTestModal({ onClose, onComplete }) {
    const [pressedKeys, setPressedKeys] = useState({});
    const [lastPressed, setLastPressed] = useState(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            e.preventDefault(); // Prevent default browser actions for some keys
            setPressedKeys(prev => ({ ...prev, [e.code || e.key]: true }));
            setLastPressed(e.key);
        };

        const handleKeyUp = (e) => {
            // Keep it recorded
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Also try to hook into media keys for mobile side buttons
        if ('mediaSession' in navigator) {
            const mediaKeys = ['previoustrack', 'nexttrack']; /* volume is often protected, but we can try */
            mediaKeys.forEach(action => {
                try {
                    navigator.mediaSession.setActionHandler(action, () => {
                        setPressedKeys(prev => ({ ...prev, [action]: true }));
                        setLastPressed(`Side Button: ${action}`);
                    });
                } catch (e) {}
            });
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-8 max-w-2xl w-full relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                    <X size={18} />
                </button>
                
                <h2 className="text-2xl font-bold flex items-center text-slate-800 mb-6">
                    <KeyboardIcon className="mr-3 text-orange-500" /> Keyboard & Buttons Test
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                        <h3 className="font-bold text-orange-800 mb-2 flex items-center"><Smartphone className="mr-2 h-5 w-5" /> Phone/Tablet Users</h3>
                        <p className="text-orange-700 text-sm mb-2">Please click all available side buttons including:</p>
                        <ul className="list-disc pl-5 text-sm text-orange-700 mb-4 font-medium space-y-1">
                            <li>Volume Up / Down</li>
                            <li>Power / Lock button</li>
                            <li>Any other physical keys</li>
                        </ul>
                        <p className="text-xs text-orange-600 italic">* Note: Some browsers block volume buttons, but you can visually confirm if volume changes on your device.</p>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-2">PC / Laptop Users</h3>
                        <p className="text-slate-600 text-sm mb-4">Press various keys on your physical keyboard. The total count will increase to confirm the key was registered.</p>
                        
                        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center shadow-inner">
                            <span className="block text-4xl font-black text-orange-500 mb-1">{Object.keys(pressedKeys).length}</span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Keys Registered</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-xl p-4 min-h-[80px] flex items-center justify-center mb-8 shadow-inner">
                    {lastPressed ? (
                        <div className="text-white text-center">
                            <span className="text-sm font-medium text-slate-400 block mb-1">Last key detected</span>
                            <span className="text-2xl font-mono font-bold text-orange-400">{lastPressed}</span>
                        </div>
                    ) : (
                        <span className="text-slate-500 font-medium">Press any key or physical button...</span>
                    )}
                </div>

                <div className="flex gap-4 border-t border-slate-100 pt-6">
                    <button onClick={() => onComplete(false)} className="flex-1 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors">
                        Some buttons failed
                    </button>
                    <button onClick={() => onComplete(true)} className="flex-1 py-4 bg-orange-500 text-white font-bold rounded-xl shadow-lg hover:bg-orange-600 transition-colors">
                        All keys/buttons work
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
