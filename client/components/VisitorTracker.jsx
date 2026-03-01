'use client';

import { useEffect } from 'react';

export default function VisitorTracker() {
    useEffect(() => {
        fetch('http://localhost:5000/api/stats/increment', { method: 'POST' }).catch(() => { });
    }, []);
    return null;
}
