import React, { useState, useEffect } from 'react';
import { X, Wifi, WifiOff, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NetworkTestModal({ onClose, onComplete }) {
    const [network, setNetwork] = useState(null);

    useEffect(() => {
        const updateNetworkInfo = () => {
            const isOnline = navigator.onLine;
            let type = 'Unknown';
            let downlink = null;
            let rtt = null;

            if (navigator.connection) {
                type = navigator.connection.effectiveType || navigator.connection.type || 'Unknown';
                downlink = navigator.connection.downlink;
                rtt = navigator.connection.rtt;
            }

            setNetwork({ isOnline, type, downlink, rtt });
        };

        updateNetworkInfo();

        window.addEventListener('online', updateNetworkInfo);
        window.addEventListener('offline', updateNetworkInfo);
        
        if (navigator.connection) {
            navigator.connection.addEventListener('change', updateNetworkInfo);
        }

        return () => {
            window.removeEventListener('online', updateNetworkInfo);
            window.removeEventListener('offline', updateNetworkInfo);
            if (navigator.connection) {
                navigator.connection.removeEventListener('change', updateNetworkInfo);
            }
        };
    }, []);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                    <X size={18} />
                </button>
                
                <h2 className="text-2xl font-bold flex items-center text-slate-800 mb-6">
                    <Activity className="mr-3 text-cyan-500" /> Network & Wi-Fi Test
                </h2>
                
                {!network ? (
                    <div className="text-center py-8 text-slate-500">Reading sensor data...</div>
                ) : (
                    <div className="space-y-4 mb-8">
                        <div className={`p-6 rounded-2xl border flex flex-col items-center justify-center text-center ${network.isOnline ? 'bg-cyan-50 border-cyan-100' : 'bg-red-50 border-red-100'}`}>
                            {network.isOnline ? (
                                <>
                                    <Wifi size={48} className="text-cyan-500 mb-3" />
                                    <h3 className="text-xl font-bold text-cyan-800">Online Mode Active</h3>
                                </>
                            ) : (
                                <>
                                    <WifiOff size={48} className="text-red-500 mb-3" />
                                    <h3 className="text-xl font-bold text-red-800">Internet Disconnected</h3>
                                </>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Connection Type</span>
                                <span className="text-lg font-bold text-slate-800 uppercase">{network.type}</span>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Est. Downlink</span>
                                <span className="text-lg font-bold text-slate-800">{network.downlink ? `${network.downlink} Mbps` : 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex gap-4 border-t border-slate-100 pt-6">
                    <button onClick={() => onComplete(false)} className="flex-1 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors">
                        Fail
                    </button>
                    <button onClick={() => onComplete(true)} className="flex-1 py-4 bg-cyan-500 text-white font-bold rounded-xl shadow-lg hover:bg-cyan-600 transition-colors">
                        Network Pass
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
