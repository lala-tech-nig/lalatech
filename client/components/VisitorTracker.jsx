'use client';

import { useEffect } from 'react';
import API_BASE_URL from '@/lib/api';

export default function VisitorTracker() {
    useEffect(() => {
        fetch(`${API_BASE_URL}/stats/increment`, { method: 'POST' }).catch(() => { });
    }, []);
    return null;
}
