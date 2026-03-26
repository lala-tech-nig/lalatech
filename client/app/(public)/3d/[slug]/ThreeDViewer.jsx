'use client';
import { Maximize, Minimize, Box } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function ThreeDViewer({ embedUrl, title }) {
    const containerRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    if (!embedUrl) {
        return (
            <div className="w-full aspect-video md:aspect-square bg-slate-900 flex flex-col items-center justify-center text-white/50 space-y-4 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-800">
                <Box className="w-16 h-16 opacity-50" />
                <p className="font-bold tracking-widest uppercase text-xs">Invalid Model URL</p>
            </div>
        );
    }

    return (
        <div 
            ref={containerRef} 
            className={`relative w-full overflow-hidden shadow-2xl transition-all duration-500 rounded-[2.5rem] group ${isFullscreen ? 'h-screen w-screen bg-black rounded-none' : 'aspect-video md:aspect-square bg-[#110f0e] border border-slate-800'}`}
        >
            <iframe 
                title={title} 
                frameBorder="0" 
                allowFullScreen 
                mozallowfullscreen="true" 
                webkitallowfullscreen="true" 
                allow="autoplay; fullscreen; xr-spatial-tracking" 
                xr-spatial-tracking="true"
                execution-while-out-of-viewport="true" 
                execution-while-not-rendered="true" 
                web-share="true" 
                className="w-full h-full absolute inset-0"
                src={embedUrl}
            />
            
            {/* Fullscreen Toggle Button */}
            <button 
                onClick={toggleFullscreen}
                className="absolute bottom-6 right-6 z-20 bg-black/60 hover:bg-[#f89e35] text-white p-3.5 rounded-2xl backdrop-blur-md border border-white/20 shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 group/btn"
                title="Toggle Fullscreen"
            >
                {isFullscreen ? <Minimize className="w-5 h-5 md:w-6 h-6" /> : <Maximize className="w-5 h-5 md:w-6 h-6" />}
                <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-black/80 rounded-lg text-[10px] font-black uppercase tracking-widest opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap hidden md:block">
                    {isFullscreen ? 'Exit Fullscreen' : 'Landscape Fullscreen'}
                </span>
            </button>

            {/* Hint overlay */}
            {!isFullscreen && (
                <div className="absolute top-6 left-6 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity md:block hidden">
                    <div className="bg-black/40 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-full text-white/80 text-[10px] font-black uppercase tracking-widest">
                        Interactive 3D Preview
                    </div>
                </div>
            )}
        </div>
    );
}
