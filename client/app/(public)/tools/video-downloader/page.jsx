'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Search, Download, Youtube, Twitter, Instagram, 
  Music, Film, Sparkles, AlertCircle, CheckCircle, RefreshCw,
  Info, HelpCircle, Layers, ShieldAlert, Cpu
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '@/lib/api';

export default function VideoDownloaderPage() {
  const [url, setUrl] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState(null); // 'youtube', 'tiktok', 'instagram', 'twitter', 'facebook', null
  const [format, setFormat] = useState('mp4'); // 'mp4', 'mp3'
  const [quality, setQuality] = useState('720'); // '1080', '720', '480', '360'
  
  // Status states
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Platforms regex configurations
  const PLATFORMS = [
    { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-500 bg-red-50 border-red-200 shadow-red-500/10 hover:shadow-red-500/20 active-color:bg-red-500', regex: /(youtube\.com|youtu\.be)/i },
    { id: 'tiktok', name: 'TikTok', icon: Music, color: 'text-cyan-500 bg-cyan-50 border-cyan-200 shadow-cyan-500/10 hover:shadow-cyan-500/20 active-color:bg-cyan-500', regex: /tiktok\.com/i },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-500 bg-pink-50 border-pink-200 shadow-pink-500/10 hover:shadow-pink-500/20 active-color:bg-pink-500', regex: /instagram\.com/i },
    { id: 'twitter', name: 'Twitter / X', icon: Twitter, color: 'text-sky-500 bg-sky-50 border-sky-200 shadow-sky-500/10 hover:shadow-sky-500/20 active-color:bg-sky-500', regex: /(twitter\.com|x\.com)/i },
  ];

  // Auto-detect platform on link paste
  useEffect(() => {
    if (!url) {
      setDetectedPlatform(null);
      return;
    }

    const matched = PLATFORMS.find(p => p.regex.test(url));
    if (matched) {
      setDetectedPlatform(matched.id);
    } else {
      setDetectedPlatform(null);
    }
  }, [url]);

  // Handle Download trigger
  const handleDownload = async () => {
    if (!url) return;
    setStatus('loading');
    setErrorMsg('');
    setProgressMsg('Initializing secure connection to backend...');

    setTimeout(() => {
      setProgressMsg('Bypassing standard platform CORS configurations...');
    }, 1500);

    setTimeout(() => {
      setProgressMsg('Streaming high-definition video chunks directly to client...');
    }, 3000);

    try {
      const response = await fetch(`${API_BASE_URL}/tools/download-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          format,
          quality
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Apologies, video resolving failed. Ensure link is public and valid.');
      }

      // Check if the backend returned a redirect URL (direct CDN link)
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await response.json();
        if (json.redirect && json.url) {
          // Open the CDN link directly — browser will handle the download
          const a = document.createElement('a');
          a.href = json.url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.download = '';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setStatus('success');
          setProgressMsg('');
          return;
        }
        throw new Error(json.message || 'Unexpected response from server.');
      }

      // Otherwise stream the response back to a local blob in the browser
      const blob = await response.blob();
      const localUrl = window.URL.createObjectURL(blob);
      
      // Determine file extension
      const extension = format === 'mp3' ? 'mp3' : 'mp4';
      
      // Extract platform or generic name
      const platformPrefix = detectedPlatform ? `${detectedPlatform}-` : 'media-';
      const downloadName = `${platformPrefix}download-${Date.now()}.${extension}`;

      // Trigger standard instant local save
      const link = document.createElement('a');
      link.href = localUrl;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup Object URL after download
      window.URL.revokeObjectURL(localUrl);
      
      setStatus('success');
      setProgressMsg('');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Connection timeout or backend offline. Ensure dev server is running.');
      setStatus('error');
    }
  };

  const getPlatformLabel = () => {
    const matched = PLATFORMS.find(p => p.id === detectedPlatform);
    return matched ? matched.name : 'Platform Link';
  };

  return (
    <div className="min-h-screen bg-[#fafafb] text-slate-900 pt-20 pb-20 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Navigation Breadcrumb */}
        <Link href="/tools" className="inline-flex items-center text-orange-600 font-bold hover:text-orange-700 transition mb-6 group">
          <ArrowLeft className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition" />
          Back to All Tools
        </Link>

        {/* Dynamic header design banner */}
        <div className="bg-slate-950 text-white rounded-3xl p-8 md:p-10 mb-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-10 w-60 h-60 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles size={12} /> Pro utility
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2">Social Video Downloader</h1>
            <p className="text-slate-400 text-lg max-w-2xl font-medium">
              Save high-quality MP4 videos or extract MP3 audio directly from YouTube, TikTok, Instagram, and Twitter/X completely free.
            </p>
          </div>
        </div>

        {/* Downloader Studio Core Container */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 flex flex-col gap-8">
          
          {/* 1. Dynamic Platform Selector Widgets */}
          <div>
            <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 text-center">
              Supported Platforms
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {PLATFORMS.map((p) => {
                const Icon = p.icon;
                const isActive = detectedPlatform === p.id;
                
                return (
                  <div 
                    key={p.id}
                    className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-2 ${
                      isActive 
                        ? 'border-orange-500 bg-orange-50/50 shadow-md scale-105' 
                        : 'border-slate-100 bg-slate-50/50 opacity-60'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isActive ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-white text-slate-400 border border-slate-100'}`}>
                      <Icon size={24} />
                    </div>
                    <span className={`text-xs font-extrabold ${isActive ? 'text-orange-950' : 'text-slate-500'}`}>
                      {p.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Pulsing URL Search box */}
          <div className="flex flex-col gap-3">
            <label className="block text-sm font-bold text-slate-700">
              Paste Video URL link
            </label>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-2.5 focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-50/50 transition duration-200">
              <Search className="text-slate-400 ml-2" size={20} />
              <input 
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://tiktok.com/@..."
                className="flex-1 bg-transparent border-none outline-none font-bold text-slate-800 text-sm py-2 placeholder-slate-400 focus:ring-0"
                disabled={status === 'loading'}
              />
              {url && (
                <button 
                  onClick={() => setUrl('')}
                  className="text-xs font-bold bg-white text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 transition shrink-0"
                  disabled={status === 'loading'}
                >
                  Clear
                </button>
              )}
            </div>
            {detectedPlatform && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-lg w-fit font-bold"
              >
                <CheckCircle size={12} /> {getPlatformLabel()} link detected! Ready to download.
              </motion.div>
            )}
          </div>

          {/* 3. Output configuration choices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            {/* Format choice toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Download Format
              </label>
              <div className="grid grid-cols-2 gap-3 bg-white p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setFormat('mp4')}
                  className={`py-2 px-4 rounded-lg font-bold text-sm transition flex items-center justify-center gap-1.5 ${
                    format === 'mp4' 
                      ? 'bg-orange-500 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  disabled={status === 'loading'}
                >
                  <Film size={16} /> Video (MP4)
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('mp3')}
                  className={`py-2 px-4 rounded-lg font-bold text-sm transition flex items-center justify-center gap-1.5 ${
                    format === 'mp3' 
                      ? 'bg-orange-500 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  disabled={status === 'loading'}
                >
                  <Music size={16} /> Audio (MP3)
                </button>
              </div>
            </div>

            {/* Quality Slider (hidden if audio selected) */}
            <div>
              {format === 'mp4' ? (
                <>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Video Resolution
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['1080', '720', '480', '360'].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setQuality(q)}
                        className={`py-2 rounded-lg text-xs font-extrabold border transition ${
                          quality === q 
                            ? 'bg-white border-orange-500 text-orange-600 shadow-sm' 
                            : 'bg-white/50 border-slate-200 hover:bg-white text-slate-600'
                        }`}
                        disabled={status === 'loading'}
                      >
                        {q}p
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Audio Encoding
                  </label>
                  <div className="py-2.5 px-4 bg-white rounded-lg border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2">
                    <Music size={14} className="text-orange-500 shrink-0" /> Pristine 320kbps MP3 (Highest quality extract)
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Error warning block */}
          {status === 'error' && errorMsg && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 font-bold rounded-xl flex gap-3 text-sm">
              <AlertCircle size={20} className="shrink-0 animate-pulse" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Glowing Submit trigger button */}
          <button
            onClick={handleDownload}
            disabled={!url || status === 'loading'}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-black py-4.5 rounded-2xl transition shadow-[0_8px_30px_rgb(248,158,53,0.3)] flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            {status === 'loading' ? (
              <>
                <RefreshCw className="animate-spin" size={20} /> Retrieving Stream...
              </>
            ) : (
              <>
                <Download size={20} /> Retrieve &amp; Download locally
              </>
            )}
          </button>

        </div>

        {/* 4. Stream status progress overlay loader */}
        <AnimatePresence>
          {status === 'loading' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-100 shadow-2xl text-center flex flex-col items-center gap-6"
              >
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
                  <Download size={28} className="text-orange-500 animate-bounce" />
                </div>

                <div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Streaming File Locally</h3>
                  <p className="text-slate-500 font-medium text-sm">
                    Please keep this window active. The backend is fetching and piping the video stream chunks directly to your browser memory.
                  </p>
                </div>

                {progressMsg && (
                  <div className="w-full bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 font-mono text-[10px] text-slate-500 uppercase tracking-wider animate-pulse">
                    {progressMsg}
                  </div>
                )}

                <div className="flex gap-2 text-[10px] text-slate-400 font-semibold uppercase items-center">
                  <Cpu size={12} /> Stateless Server Tunnel • 0% Disk Use
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Modal panel */}
        <AnimatePresence>
          {status === 'success' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-3xl p-8 max-w-sm w-full border border-slate-100 shadow-2xl text-center flex flex-col items-center gap-6"
              >
                <div className="w-16 h-16 bg-green-50 border border-green-200 text-green-500 rounded-full flex items-center justify-center shadow-sm">
                  <CheckCircle size={32} />
                </div>

                <div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Download Succeeded!</h3>
                  <p className="text-slate-500 font-medium text-sm">
                    The platform security checks were successfully bypassed and the file is now saved on your local device storage.
                  </p>
                </div>

                <button 
                  onClick={() => {
                    setUrl('');
                    setStatus('idle');
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition text-sm"
                >
                  Download Another Video
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
