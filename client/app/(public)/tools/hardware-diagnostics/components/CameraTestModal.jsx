import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CameraTestModal({ onClose, onComplete }) {
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState('');
    const [facingMode, setFacingMode] = useState('user'); // 'user' or 'environment'

    const initCamera = async (mode) => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        try {
            setError('');
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: mode }
            });
            setStream(newStream);
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }
        } catch (err) {
            console.warn("Camera error:", err);
            setError('Could not access camera. Please check permissions or if a camera is connected.');
        }
    };

    useEffect(() => {
        initCamera(facingMode);
        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [facingMode]);

    const toggleCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl overflow-hidden max-w-lg w-full relative h-[80vh] flex flex-col">
                <div className="p-4 flex justify-between items-center border-b border-slate-100 flex-shrink-0">
                    <h2 className="text-xl font-bold flex items-center text-slate-800"><Camera className="mr-2 text-purple-500" /> Camera Test</h2>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                        <X size={18} />
                    </button>
                </div>
                
                <div className="flex-1 bg-black relative flex items-center justify-center">
                    {error ? (
                        <div className="text-red-500 bg-red-50 p-4 rounded-xl m-4 text-center">{error}</div>
                    ) : (
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} 
                        />
                    )}
                    
                    {!error && (
                        <button 
                            onClick={toggleCamera} 
                            className="absolute bottom-4 right-4 p-4 bg-black/50 text-white backdrop-blur-md rounded-full hover:bg-black/70 transition-colors"
                        >
                            <RefreshCw size={24} />
                        </button>
                    )}
                </div>

                <div className="p-6 bg-white space-y-3 flex-shrink-0">
                    <button onClick={() => onComplete(!error)} disabled={!!error} className="w-full py-4 bg-purple-500 text-white font-bold rounded-xl shadow-lg hover:bg-purple-600 disabled:opacity-50 transition-colors">
                        Yes, Camera works clearly
                    </button>
                    <button onClick={() => onComplete(false)} className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors">
                        No, Camera has issues
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
