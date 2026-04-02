import React, { useState, useEffect } from 'react';
import { X, Battery, BatteryCharging, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BatteryTestModal({ onClose, onComplete }) {
    const [battery, setBattery] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let mounted = true;
        
        if ('getBattery' in navigator) {
            navigator.getBattery().then(bat => {
                if (!mounted) return;
                
                const updateBat = () => {
                    setBattery({
                        level: Math.round(bat.level * 100),
                        charging: bat.charging,
                        chargingTime: bat.chargingTime,
                        dischargingTime: bat.dischargingTime
                    });
                };
                
                updateBat();
                
                bat.addEventListener('levelchange', updateBat);
                bat.addEventListener('chargingchange', updateBat);
                
                return () => {
                    bat.removeEventListener('levelchange', updateBat);
                    bat.removeEventListener('chargingchange', updateBat);
                };
            }).catch(() => {
                setError('Could not read battery status due to browser restrictions.');
            });
        } else {
            setError('Battery Status API is not supported in this browser (often disabled on iOS/Firefox for privacy).');
        }
        
        return () => { mounted = false; };
    }, []);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                    <X size={18} />
                </button>
                
                <h2 className="text-2xl font-bold flex items-center text-slate-800 mb-6">
                    <Zap className="mr-3 text-yellow-500" /> Battery & Charging Test
                </h2>
                
                {error ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
                        <Battery className="mx-auto text-amber-500 mb-3 h-10 w-10 opacity-50" />
                        <p className="text-amber-800 text-sm font-medium">{error}</p>
                        <p className="mt-4 text-xs text-amber-600">Please verify battery charging manually by plugging in a cable.</p>
                    </div>
                ) : !battery ? (
                    <div className="text-center py-8 text-slate-500">Reading sensor data...</div>
                ) : (
                    <div className="space-y-4 mb-8">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-sm font-medium mb-1">Current Level</p>
                                <p className="text-3xl font-black text-slate-800">{battery.level}%</p>
                            </div>
                            <div className={`p-4 rounded-full ${battery.level > 20 ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'}`}>
                                {battery.charging ? <BatteryCharging size={32} /> : <Battery size={32} />}
                            </div>
                        </div>
                        
                        <div className={`p-6 rounded-2xl border flex items-center ${battery.charging ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                            <div className={`w-3 h-3 rounded-full mr-3 ${battery.charging ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                            <span className={`font-bold ${battery.charging ? 'text-green-700' : 'text-slate-600'}`}>
                                {battery.charging ? 'Device is currently charging' : 'Device is running on battery'}
                            </span>
                        </div>
                        
                        <p className="text-xs text-slate-400 text-center px-4">
                            Try plugging and unplugging a charging cable to see if the status updates.
                        </p>
                    </div>
                )}

                <div className="flex gap-4 border-t border-slate-100 pt-6">
                    <button onClick={() => onComplete(false)} className="flex-1 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors">
                        Issue Detected
                    </button>
                    <button onClick={() => onComplete(true)} className="flex-1 py-4 bg-yellow-500 text-white font-bold rounded-xl shadow-lg hover:bg-yellow-600 transition-colors">
                        Pass
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
