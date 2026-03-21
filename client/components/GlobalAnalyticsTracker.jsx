'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function GlobalAnalyticsTracker() {
    const pathname = usePathname();
    const sessionIdRef = useRef('');
    
    // Tracking references
    const timeSpentRef = useRef(0);
    const clicksRef = useRef([]);
    const lastTickRef = useRef(Date.now());

    useEffect(() => {
        // Generate a random session ID on mount
        sessionIdRef.current = Math.random().toString(36).substring(2, 15);
        timeSpentRef.current = 0;
        clicksRef.current = [];
        lastTickRef.current = Date.now();
    }, [pathname]);

    useEffect(() => {
        // Track clicks
        const handleClick = (e) => {
            const element = e.target.tagName + (e.target.id ? `#${e.target.id}` : '') + (e.target.className && typeof e.target.className === 'string' ? `.${e.target.className.split(' ')[0]}` : '');
            clicksRef.current.push({
                x: e.clientX,
                y: e.clientY,
                element: element.substring(0, 50), // keep it short
                timestamp: new Date()
            });
        };

        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const elapsed = Math.floor((now - lastTickRef.current) / 1000);
            if (elapsed > 0) {
                timeSpentRef.current += elapsed;
                lastTickRef.current = now;
            }

            // Sync with backend every 5 seconds
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            
            const payload = {
                sessionId: sessionIdRef.current,
                page: pathname,
                timeSpent: timeSpentRef.current,
                newClicks: clicksRef.current,
                userAgent: navigator.userAgent
            };

            // Clear clicks after sending
            clicksRef.current = [];

            fetch(`${apiUrl}/api/analytics/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(() => {
                // Silently ignore ping errors
            });

        }, 5000);

        return () => clearInterval(interval);
    }, [pathname]);

    return null;
}
