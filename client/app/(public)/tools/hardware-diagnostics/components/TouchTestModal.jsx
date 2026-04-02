import React, { useState, useRef, useEffect } from 'react';
import { X, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TouchTestModal({ onClose, onComplete }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [painted, setPainted] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Draw grid
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 50) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 50) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }
    }, []);

    const startDraw = (e) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDraw = () => {
        setIsDrawing(false);
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        setPainted(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.lineWidth = 30;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(248, 158, 53, 0.5)'; // Orange transparent

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        ctx.lineTo(clientX, clientY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(clientX, clientY);
    };

    const reset = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 50) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 50) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }
        setPainted(false);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-white touch-none">
            <canvas
                ref={canvasRef}
                onMouseDown={startDraw} onMouseUp={stopDraw} onMouseMove={draw} onMouseLeave={stopDraw}
                onTouchStart={startDraw} onTouchEnd={stopDraw} onTouchMove={draw} onTouchCancel={stopDraw}
                className="absolute inset-0 cursor-crosshair"
            />
            
            <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none">
                <div className="bg-slate-900/80 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-bold shadow-xl pointer-events-auto flex items-center gap-4">
                    <span>Draw all over the screen to test touch points</span>
                    <button onClick={reset} className="p-2 hover:bg-white/20 rounded-full"><RefreshCcw size={16} /></button>
                </div>
            </div>

            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 pointer-events-auto">
                <button onClick={() => onComplete(false)} className="px-8 py-3 bg-red-100 text-red-600 font-bold rounded-xl shadow-lg border border-red-200">Dead Zones Found</button>
                <button onClick={() => onComplete(true)} className="px-8 py-3 bg-green-500 text-white font-bold rounded-xl shadow-lg hover:bg-green-600">Screen works perfectly</button>
            </div>
            
            <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-600 z-10 shadow-sm">
                <X size={20} />
            </button>
        </motion.div>
    );
}
