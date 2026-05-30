'use client';

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import toast, { Toaster } from 'react-hot-toast';
import { 
    Tv, Shield, Lock, Mail, Play, Volume2, VolumeX, Maximize2, 
    Copy, Send, Calendar, Clock, AlertCircle, Eye, RefreshCw, LogIn, Key, Sparkles, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL, BASE_URL } from '@/lib/api';

export default function LivestreamPage() {
    const [streams, setStreams] = useState([]);
    const [activeStream, setActiveStream] = useState(null);
    const [selectedStreamForPlayback, setSelectedStreamForPlayback] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isVerifying, setIsVerifying] = useState(false);

    // Authentication States
    const [viewerEmail, setViewerEmail] = useState('');
    const [viewerToken, setViewerToken] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [targetStreamId, setTargetStreamId] = useState(null);

    // Registration Success Overlay
    const [registrationSuccess, setRegistrationSuccess] = useState(null); // stores { token, email }
    const [isCopied, setIsCopied] = useState(false);

    // Stream Request State
    const [requestTitle, setRequestTitle] = useState('');
    const [submittingRequest, setSubmittingRequest] = useState(false);

    // Live Streaming WebRTC States
    const [isPlayingLive, setIsPlayingLive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected | connecting | connected

    const videoRef = useRef(null);
    const socketRef = useRef(null);
    const peerConnectionRef = useRef(null);

    useEffect(() => {
        // Load auth from localStorage if it exists
        const savedEmail = localStorage.getItem('viewerEmail');
        const savedToken = localStorage.getItem('viewerToken');
        if (savedEmail && savedToken) {
            setViewerEmail(savedEmail);
            setViewerToken(savedToken);
            setIsAuthenticated(true);
        }
        fetchStreams();
    }, []);

    const fetchStreams = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/streams`);
            if (res.ok) {
                const data = await res.json();
                setStreams(data);
                // Set the active stream if there is one
                const active = data.find(s => s.status === 'active');
                setActiveStream(active || null);
            }
        } catch (err) {
            toast.error('Failed to load livestreams.');
        } finally {
            setLoading(false);
        }
    };

    // Trigger viewer login/registration modal
    const handleStreamClick = (stream) => {
        if (stream.status === 'ended') {
            // Past recorded stream, plays immediately if authenticated
            if (!isAuthenticated) {
                setTargetStreamId(stream._id);
                setAuthModalOpen(true);
            } else {
                logVisitAndPlay(stream);
            }
        } else {
            // Active stream
            if (!isAuthenticated) {
                setTargetStreamId(stream._id);
                setAuthModalOpen(true);
            } else {
                startLivePlayback(stream);
            }
        }
    };

    const logVisitAndPlay = async (stream) => {
        setSelectedStreamForPlayback(stream);
        try {
            await fetch(`${API_BASE_URL}/streams/verify-and-log`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: viewerEmail,
                    token: viewerToken,
                    streamId: stream._id,
                    streamTitle: stream.title
                })
            });
        } catch (e) {
            console.error('Failed to log visit', e);
        }
    };

    // Authenticate returning user OR register new user
    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        if (!viewerEmail) return;

        setIsVerifying(true);
        try {
            if (!viewerToken) {
                // REGISTRATION: No token input, register this email
                const res = await fetch(`${API_BASE_URL}/streams/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: viewerEmail })
                });
                const data = await res.json();

                if (res.ok) {
                    setRegistrationSuccess({ token: data.token, email: viewerEmail });
                    setViewerToken(data.token);
                    localStorage.setItem('viewerEmail', viewerEmail);
                    localStorage.setItem('viewerToken', data.token);
                    setIsAuthenticated(true);
                    toast.success('Generated lifetime access token successfully!');
                } else {
                    toast.error(data.message || 'Registration failed.');
                }
            } else {
                // LOGIN: Verify returning user
                const res = await fetch(`${API_BASE_URL}/streams/verify-and-log`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: viewerEmail,
                        token: viewerToken,
                        streamId: targetStreamId,
                        streamTitle: targetStreamId ? streams.find(s => s._id === targetStreamId)?.title : undefined
                    })
                });
                const data = await res.json();

                if (res.ok && data.success) {
                    localStorage.setItem('viewerEmail', viewerEmail);
                    localStorage.setItem('viewerToken', viewerToken);
                    setIsAuthenticated(true);
                    setAuthModalOpen(false);
                    toast.success('Successfully authenticated!');

                    const selected = streams.find(s => s._id === targetStreamId);
                    if (selected) {
                        if (selected.status === 'active') {
                            startLivePlayback(selected);
                        } else {
                            setSelectedStreamForPlayback(selected);
                        }
                    }
                } else {
                    toast.error(data.message || 'Invalid email or token.');
                }
            }
        } catch (err) {
            toast.error('Connection error.');
        } finally {
            setIsVerifying(false);
        }
    };

    // Copy lifetime token
    const copyTokenToClipboard = () => {
        if (!registrationSuccess) return;
        navigator.clipboard.writeText(registrationSuccess.token);
        setIsCopied(true);
        toast.success('Token copied to clipboard!');
        setTimeout(() => setIsCopied(false), 2000);
    };

    // WebRTC connection logic for active stream
    const startLivePlayback = (stream) => {
        setIsPlayingLive(true);
        setSelectedStreamForPlayback(null);
        setConnectionStatus('connecting');

        // Log the visit to backend
        fetch(`${API_BASE_URL}/streams/verify-and-log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: viewerEmail,
                token: viewerToken,
                streamId: stream._id,
                streamTitle: stream.title
            })
        }).catch(e => console.error(e));

        // Connect to socket.io
        const socket = io(BASE_URL);
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Connected to signaling server');
            socket.emit('join-room', { room: `stream_${stream._id}`, role: 'viewer' });
        });

        // Set up RTCPeerConnection when receiving Offer
        socket.on('offer', async ({ sdp, senderSocketId }) => {
            console.log('Received WebRTC offer from admin');
            
            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' }
                ]
            });
            peerConnectionRef.current = pc;

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('ice-candidate', { candidate: event.candidate, targetSocketId: senderSocketId });
                }
            };

            pc.onconnectionstatechange = () => {
                console.log('Connection state changed:', pc.connectionState);
                if (pc.connectionState === 'connected') {
                    setConnectionStatus('connected');
                } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                    setConnectionStatus('disconnected');
                }
            };

            pc.ontrack = (event) => {
                console.log('Received remote media stream track:', event.track);
                if (videoRef.current) {
                    videoRef.current.srcObject = event.streams[0];
                }
            };

            try {
                await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('answer', { sdp: pc.localDescription, targetSocketId: senderSocketId });
            } catch (err) {
                console.error('Failed to set remote/local description during WebRTC handshake', err);
            }
        });

        socket.on('ice-candidate', async ({ candidate }) => {
            try {
                if (peerConnectionRef.current) {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                }
            } catch (e) {
                console.error('Error adding ICE candidate', e);
            }
        });

        socket.on('peer-disconnected', () => {
            toast.error('The stream host has disconnected.');
            stopLivePlayback();
        });
    };

    const stopLivePlayback = () => {
        setIsPlayingLive(false);
        setConnectionStatus('disconnected');
        
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    // Request livestream when no stream is live
    const handleRequestStreamSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            toast.error('Please register or login first to request a livestream.');
            setAuthModalOpen(true);
            return;
        }

        setSubmittingRequest(true);
        try {
            const res = await fetch(`${API_BASE_URL}/streams/request-stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: viewerEmail,
                    token: viewerToken,
                    title: requestTitle || 'Inner Friend is requesting a screen stream'
                })
            });
            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || 'Request successfully sent to Admin!');
                setRequestTitle('');
            } else {
                toast.error(data.message || 'Failed to submit request.');
            }
        } catch (err) {
            toast.error('Error connecting to server.');
        } finally {
            setSubmittingRequest(false);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted(videoRef.current.muted);
        }
    };

    const handleFullscreen = () => {
        if (videoRef.current) {
            if (videoRef.current.requestFullscreen) {
                videoRef.current.requestFullscreen();
            } else if (videoRef.current.webkitRequestFullscreen) {
                videoRef.current.webkitRequestFullscreen();
            }
        }
    };

    const logout = () => {
        localStorage.removeItem('viewerEmail');
        localStorage.removeItem('viewerToken');
        setViewerEmail('');
        setViewerToken('');
        setIsAuthenticated(false);
        stopLivePlayback();
        setSelectedStreamForPlayback(null);
        toast.success('Logged out successfully.');
    };

    return (
        <div className="min-h-screen bg-slate-50 selection:bg-[#f89e35] selection:text-white pt-24 pb-20 relative overflow-hidden">
            <Toaster position="top-right" toastOptions={{ style: { background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0' } }} />

            {/* Glowing background details */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-[#f89e35]/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-slate-900/5 rounded-full blur-[100px]"></div>
            </div>

            <div className="max-w-6xl mx-auto px-6 relative z-10">

                {/* 1. Legal Disclaimer Banner */}
                <div className="bg-amber-50/80 border border-amber-200/60 backdrop-blur-md rounded-2xl p-5 mb-10 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                    <Shield className="w-6 h-6 text-[#f89e35] flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-black text-amber-900 text-sm uppercase tracking-wider mb-1">Disclaimer & Rules</h4>
                        <p className="text-amber-800 text-xs md:text-sm leading-relaxed font-medium">
                            This streaming feature is built strictly for sharing private screen sessions with inner friends. 
                            It is not intended to host, stream, or broadcast any commercial copyrighted media illegally. 
                            By accessing this portal, you agree that you are an authorized personal contact and will respect all private content privacy controls.
                        </p>
                    </div>
                </div>

                {/* Top Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-slate-200/60 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-700 uppercase tracking-widest mb-3">
                            <Tv className="w-3.5 h-3.5 text-[#f89e35] animate-pulse" /> Private Lounge
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight heading-gradient">
                            Lala Livestream
                        </h1>
                        <p className="text-slate-500 font-medium text-sm md:text-base mt-2">
                            Watch in real-time what the host is watching, with full desktop screen sharing and synced audio.
                        </p>
                    </div>

                    {/* Auth Status & Options */}
                    <div className="flex items-center gap-3">
                        {isAuthenticated ? (
                            <div className="flex items-center gap-4 bg-white border border-slate-200/80 px-5 py-3 rounded-2xl shadow-sm">
                                <div className="text-right">
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Connected Friend</p>
                                    <p className="text-sm font-black text-slate-800 truncate max-w-[150px]">{viewerEmail}</p>
                                </div>
                                <button 
                                    onClick={logout}
                                    className="bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-600 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                                >
                                    Log Out
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => {
                                    setTargetStreamId(null);
                                    setAuthModalOpen(true);
                                }}
                                className="bg-slate-950 hover:bg-slate-850 text-white font-black px-6 py-3.5 rounded-2xl text-sm transition-all shadow-md flex items-center gap-2"
                            >
                                <Lock className="w-4 h-4 text-[#f89e35]" /> Request Token
                            </button>
                        )}
                        <button
                            onClick={fetchStreams}
                            className="bg-white hover:bg-slate-100 text-slate-700 p-3.5 rounded-2xl border border-slate-200/80 shadow-sm transition-all"
                            title="Refresh"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* 2. WebRTC Live Streaming Display (Player Overlay) */}
                <AnimatePresence>
                    {isPlayingLive && activeStream && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl border border-slate-800 mb-12 relative"
                        >
                            {/* Player Header Info */}
                            <div className="absolute top-0 left-0 w-full bg-gradient-to-b from-slate-950/80 to-transparent p-6 z-10 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
                                    <span className="bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full tracking-widest uppercase">LIVE NOW</span>
                                    <h3 className="text-white font-black text-base md:text-lg truncate max-w-[200px] md:max-w-md">{activeStream.title}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider ${
                                        connectionStatus === 'connected' ? 'bg-emerald-500/25 text-emerald-400' :
                                        connectionStatus === 'connecting' ? 'bg-amber-500/25 text-amber-400 animate-pulse' :
                                        'bg-red-500/25 text-red-400'
                                    }`}>
                                        {connectionStatus}
                                    </span>
                                    <button 
                                        onClick={stopLivePlayback}
                                        className="bg-red-500 hover:bg-red-600 text-white text-xs font-black px-4 py-2 rounded-xl transition-all uppercase tracking-wider"
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            </div>

                            {/* Main Video Canvas */}
                            <div className="aspect-video w-full bg-slate-950 relative flex items-center justify-center">
                                <video 
                                    ref={videoRef} 
                                    autoPlay 
                                    playsInline 
                                    className="w-full h-full object-contain"
                                />

                                {/* Connection state helper overlays */}
                                {connectionStatus !== 'connected' && (
                                    <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-center p-6">
                                        <div className="w-16 h-16 rounded-3xl bg-slate-800/80 flex items-center justify-center mb-4 border border-slate-700 animate-pulse">
                                            <Tv className="w-8 h-8 text-[#f89e35]" />
                                        </div>
                                        <h4 className="text-white font-black text-lg">
                                            {connectionStatus === 'connecting' ? 'Establishing Real-time Connection...' : 'Waiting for Video Signal...'}
                                        </h4>
                                        <p className="text-slate-400 text-sm max-w-sm mt-2 font-medium">
                                            We are syncing media tracks via low-latency WebRTC. Please make sure the host has initiated screen share.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Player Bottom Control Strip */}
                            <div className="bg-slate-950 p-5 flex items-center justify-between border-t border-slate-800">
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={toggleMute}
                                        className="text-slate-400 hover:text-white p-2 hover:bg-slate-850 rounded-xl transition-all"
                                        title={isMuted ? "Unmute" : "Mute"}
                                    >
                                        {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                                    </button>
                                    <span className="text-slate-400 text-xs font-bold bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-850 flex items-center gap-2">
                                        <Volume2 className="w-3.5 h-3.5 text-[#f89e35]" /> Screen Audio Synchronized
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={handleFullscreen}
                                        className="text-slate-400 hover:text-white p-2 hover:bg-slate-850 rounded-xl transition-all"
                                        title="Fullscreen"
                                    >
                                        <Maximize2 className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 3. Rewatchable Ended Stream Playback */}
                <AnimatePresence>
                    {selectedStreamForPlayback && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl border border-slate-800 mb-12 relative"
                        >
                            {/* Recording Player Header */}
                            <div className="absolute top-0 left-0 w-full bg-gradient-to-b from-slate-950/80 to-transparent p-6 z-10 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <span className="bg-slate-850 text-slate-300 text-xs font-black px-3 py-1 rounded-full border border-slate-700 tracking-widest uppercase">RECORDING</span>
                                    <h3 className="text-white font-black text-base md:text-lg truncate max-w-sm md:max-w-md">{selectedStreamForPlayback.title}</h3>
                                </div>
                                <button 
                                    onClick={() => setSelectedStreamForPlayback(null)}
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black px-4 py-2 rounded-xl transition-all uppercase tracking-wider"
                                >
                                    Close Player
                                </button>
                            </div>

                            {/* Recorded Video Element */}
                            <div className="aspect-video w-full bg-slate-950 relative flex items-center justify-center">
                                <video 
                                    src={selectedStreamForPlayback.videoUrl} 
                                    controls 
                                    autoPlay 
                                    className="w-full h-full object-contain"
                                />
                            </div>

                            {/* Bottom Info Bar */}
                            <div className="bg-slate-950 p-5 border-t border-slate-800 flex items-center justify-between text-slate-400 text-xs font-bold">
                                <div>Recorded Session</div>
                                <div>Ended on {new Date(selectedStreamForPlayback.endedAt).toLocaleDateString()}</div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 4. Active Stream Grid */}
                <div className="mb-14">
                    <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#f89e35] animate-ping"></span> Active Livestreams
                    </h2>

                    {activeStream && !isPlayingLive ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <motion.div 
                                whileHover={{ y: -5 }}
                                className="bg-white border-2 border-[#f89e35] rounded-3xl overflow-hidden shadow-lg p-6 relative flex flex-col justify-between"
                            >
                                <span className="absolute top-4 right-4 bg-red-600 text-white font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full animate-pulse shadow-md shadow-red-500/10">
                                    LIVE
                                </span>
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-6">
                                        <Tv className="w-6 h-6 text-[#f89e35]" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 truncate mb-2">{activeStream.title}</h3>
                                    <p className="text-slate-500 font-medium text-sm line-clamp-3 mb-6">
                                        {activeStream.description || 'Host is currently broadcasting their laptop screen and audio.'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleStreamClick(activeStream)}
                                    className="w-full bg-[#f89e35] hover:bg-[#e08b2c] text-white font-black text-sm py-4 rounded-2xl transition-all shadow-lg shadow-[#f89e35]/20 flex items-center justify-center gap-2"
                                >
                                    <Play className="w-4 h-4 fill-white" /> Connect Stream
                                </button>
                            </motion.div>
                        </div>
                    ) : isPlayingLive ? (
                        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 text-center text-slate-500 font-medium max-w-md">
                            You are currently viewing the live screen session above!
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200/80 rounded-[32px] p-10 text-center max-w-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-[#f89e35]/5 rounded-full blur-2xl"></div>
                            <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-6">
                                <Tv className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900">No Active Livestreams Right Now</h3>
                            <p className="text-slate-400 text-sm max-w-sm mx-auto mt-2 font-medium">
                                The host is currently offline. If you have a unique access token, you can request a livestream below!
                            </p>

                            {/* 5. Request Stream Form */}
                            <form onSubmit={handleRequestStreamSubmit} className="mt-8 border-t border-slate-100 pt-8 max-w-md mx-auto space-y-4">
                                <h4 className="text-sm font-black text-slate-800 text-left uppercase tracking-wider">
                                    Request a Livestream Session
                                </h4>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={requestTitle}
                                        onChange={(e) => setRequestTitle(e.target.value)}
                                        placeholder="What would you like to watch? (e.g. streaming anime)" 
                                        className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-xl font-medium focus:outline-none focus:border-[#f89e35] text-sm"
                                        required
                                    />
                                    <button 
                                        type="submit"
                                        disabled={submittingRequest}
                                        className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <Send className="w-3.5 h-3.5 text-[#f89e35]" /> Request
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {/* 6. Past Rewatchable Streams */}
                <div>
                    <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
                        <Play className="w-5 h-5 text-[#f89e35]" /> Past recorded sessions
                    </h2>

                    {streams.filter(s => s.status === 'ended' && s.rewatchable).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {streams.filter(s => s.status === 'ended' && s.rewatchable).map(stream => (
                                <motion.div 
                                    key={stream._id}
                                    whileHover={{ y: -4 }}
                                    className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-md p-6 flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                                <Play className="w-5 h-5 text-[#f89e35] fill-[#f89e35]/25" />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                                                RECORDING
                                            </span>
                                        </div>
                                        <h3 className="font-black text-slate-900 text-lg mb-1 truncate">{stream.title}</h3>
                                        <p className="text-slate-400 text-xs font-bold flex items-center gap-1 mb-4">
                                            <Calendar className="w-3.5 h-3.5 text-[#f89e35]" /> {new Date(stream.endedAt || stream.createdAt).toLocaleDateString()}
                                        </p>
                                        <p className="text-slate-500 font-medium text-xs md:text-sm line-clamp-3 mb-6">
                                            {stream.description || 'Saved livestream recording.'}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => handleStreamClick(stream)}
                                        className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <Eye className="w-4 h-4 text-[#f89e35]" /> Rewatch Recording
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200/80 rounded-[32px] p-8 text-center text-slate-400 font-medium max-w-md">
                            No rewatchable recorded sessions available.
                        </div>
                    )}
                </div>
            </div>

            {/* Viewer Authentication Modal */}
            <AnimatePresence>
                {authModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6 animate-in fade-in duration-200">
                        {/* Modal container */}
                        <motion.div 
                            initial={{ scale: 0.95, y: 10 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 10 }}
                            className="bg-white rounded-[32px] p-8 md:p-10 shadow-2xl border border-slate-100 w-full max-w-[450px] relative overflow-hidden"
                        >
                            {/* Overlay glows */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#f89e35]/10 rounded-full blur-2xl"></div>

                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                                    <Lock className="w-5 h-5 text-[#f89e35]" /> Lounge Access
                                </h3>
                                <button 
                                    onClick={() => setAuthModalOpen(false)}
                                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Normal Form */}
                            <p className="text-slate-500 font-medium text-sm mb-6 leading-relaxed">
                                Enter your email below to register and receive your **lifetime access token**, or input your email and token if you are a returning user.
                            </p>

                            <form onSubmit={handleAuthSubmit} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                                        <input 
                                            type="email" 
                                            value={viewerEmail}
                                            onChange={(e) => setViewerEmail(e.target.value)}
                                            placeholder="Enter your email" 
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-11 pr-5 py-3.5 rounded-2xl font-medium focus:outline-none focus:border-[#f89e35] text-sm shadow-inner"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Access Token (Optional)</label>
                                        <span className="text-[9px] font-bold text-[#f89e35]">Leave blank to generate new</span>
                                    </div>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                                        <input 
                                            type="text" 
                                            value={viewerToken}
                                            onChange={(e) => setViewerToken(e.target.value)}
                                            placeholder="LT-XXXXXX (Leave blank if registering)" 
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-11 pr-5 py-3.5 rounded-2xl font-medium focus:outline-none focus:border-[#f89e35] text-sm shadow-inner uppercase"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isVerifying}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl text-sm uppercase tracking-wider transition-all mt-4"
                                >
                                    {isVerifying ? 'Verifying...' : viewerToken ? 'Authenticate ➔' : 'Register Email & Get Token ➔'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Registration Success / Copy Token Overlay Modal */}
            <AnimatePresence>
                {registrationSuccess && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-6 animate-in fade-in duration-200">
                        <motion.div 
                            initial={{ scale: 0.95, y: 15 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 15 }}
                            className="bg-white rounded-[32px] p-8 md:p-10 shadow-2xl max-w-[480px] w-full text-center relative overflow-hidden"
                        >
                            {/* Confetti or spark glows */}
                            <div className="w-20 h-20 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-6">
                                <Sparkles className="w-10 h-10 text-[#f89e35]" />
                            </div>

                            <h3 className="text-2xl font-black text-slate-900">Your Access Token is Ready!</h3>
                            <p className="text-slate-500 font-medium text-xs md:text-sm mt-3 leading-relaxed">
                                We registered your email **{registrationSuccess.email}** and generated a unique lifetime token. 
                                <span className="text-red-500 font-bold block mt-2">IMPORTANT: Please copy this token and keep it safe! You will need it to view streams and send requests in the future.</span>
                            </p>

                            {/* Big Premium Code Box */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 my-6 flex items-center justify-between shadow-inner">
                                <span className="font-mono text-3xl font-black text-slate-800 tracking-wider ml-4">
                                    {registrationSuccess.token}
                                </span>
                                <button
                                    onClick={copyTokenToClipboard}
                                    className="bg-slate-900 hover:bg-slate-800 text-white p-3.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
                                >
                                    {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#f89e35]" />}
                                    {isCopied ? 'Copied' : 'Copy'}
                                </button>
                            </div>

                            <button
                                onClick={() => {
                                    setRegistrationSuccess(null);
                                    setAuthModalOpen(false);
                                    const selected = streams.find(s => s._id === targetStreamId);
                                    if (selected) {
                                        if (selected.status === 'active') {
                                            startLivePlayback(selected);
                                        } else {
                                            logVisitAndPlay(selected);
                                        }
                                    }
                                }}
                                className="w-full bg-[#f89e35] hover:bg-[#e08b2c] text-white font-black py-4 rounded-2xl text-sm uppercase tracking-wider transition-all"
                            >
                                I have copied it, proceed ➔
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
