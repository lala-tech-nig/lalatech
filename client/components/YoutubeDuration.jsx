'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function YoutubeDuration({ videoId, className }) {
    const [duration, setDuration] = useState(null);
    const containerRef = useRef(null);
    const playerRef = useRef(null);

    useEffect(() => {
        if (!videoId) return;

        const loadPlayer = () => {
            try {
                playerRef.current = new window.YT.Player(containerRef.current, {
                    videoId: videoId,
                    height: '0',
                    width: '0',
                    playerVars: { controls: 0, showinfo: 0, rel: 0, autoplay: 0, mute: 1 },
                    events: {
                        onReady: (event) => {
                            const seconds = event.target.getDuration();
                            if (seconds) {
                                const m = Math.floor(seconds / 60);
                                const s = Math.floor(seconds % 60);
                                setDuration(`${m}:${s.toString().padStart(2, '0')}`);
                            }
                        }
                    }
                });
            } catch (e) {
                console.error("Youtube API error:", e);
            }
        };

        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            if (firstScriptTag && firstScriptTag.parentNode) {
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            } else {
                document.head.appendChild(tag);
            }
            window.onYouTubeIframeAPIReady = () => {
                if (containerRef.current) loadPlayer();
            };
        } else if (window.YT && window.YT.Player) {
            loadPlayer();
        }

        return () => {
            if (playerRef.current && playerRef.current.destroy) {
                playerRef.current.destroy();
            }
        };
    }, [videoId]);

    if (!duration) return null;

    return (
        <div className={className} style={{
            position: 'absolute', bottom: '8px', right: '8px',
            background: 'rgba(0,0,0,0.85)', color: 'white',
            fontSize: '12px', fontWeight: 'bold', padding: '3px 8px',
            borderRadius: '6px', zIndex: 10, backdropFilter: 'blur(4px)',
            pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: '4px'
        }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            {duration}
        </div>
    );
}
