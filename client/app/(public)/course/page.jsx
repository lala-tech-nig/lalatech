'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PlayCircle, Clock, X, Volume2, SkipForward, BookOpen, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '@/lib/api';
import Image from 'next/image';
import YoutubeDuration from '@/components/YoutubeDuration';

// Helper: extract YouTube video id
const getYouTubeId = (id) => id; // our backend already stores just the ID

export default function CoursePage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [search, setSearch] = useState('');
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [introState, setIntroState] = useState('idle'); // idle | speaking | done
    const [categories, setCategories] = useState(['All']);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/courses/categories`);
                if (res.ok) setCategories(['All', ...(await res.json())]);
            } catch (e) { console.error(e); }
        };
        fetchCategories();
    }, []);
    const [introProgress, setIntroProgress] = useState(0);
    const [resumePrompt, setResumePrompt] = useState(null);
    const speechRef = useRef(null);
    const progressTimerRef = useRef(null);

    useEffect(() => {
        fetchCourses();
        checkResumeState();
    }, [activeCategory]);

    // Cleanup speech on unmount
    useEffect(() => {
        return () => {
            if (speechRef.current) window.speechSynthesis?.cancel();
            clearInterval(progressTimerRef.current);
        };
    }, []);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const params = activeCategory !== 'All' ? `?category=${encodeURIComponent(activeCategory)}` : '';
            const res = await fetch(`${API_BASE_URL}/courses${params}`);
            if (res.ok) setCourses(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filtered = courses.filter(c =>
        c.title?.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase())
    );

    const checkResumeState = () => {
// ... rest of the logic ...
        try {
            const saved = localStorage.getItem('lastWatchedCourse');
            if (saved) setResumePrompt(JSON.parse(saved));
        } catch (e) {}
    };

    const handleWatchCourse = (course) => {
        localStorage.setItem('lastWatchedCourse', JSON.stringify(course));
        setSelectedCourse(course);
        setIntroProgress(0);

        if (course.introText && course.introText.trim()) {
            setIntroState('speaking');
            speakIntro(course.introText);
        } else {
            setIntroState('done');
        }

        if (resumePrompt?._id === course._id) setResumePrompt(null);
    };

    const speakIntro = (text) => {
        if (!window.speechSynthesis) {
            setIntroState('done');
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);

        // Attempt to select Male African English, fallback to UK Male, fallback to deeper default
        const availableVoices = window.speechSynthesis.getVoices();
        const preferred = availableVoices.find(v => 
            (v.lang.includes('en-NG') || v.lang.includes('en-ZA') || v.lang.includes('en-KE')) && 
            !v.name.toLowerCase().includes('female')
        ) || availableVoices.find(v => 
            v.lang.includes('en-GB') && 
            (v.name.toLowerCase().includes('male') || !v.name.toLowerCase().includes('female'))
        );
        
        if (preferred) {
            utterance.voice = preferred;
        }

        utterance.rate = 0.90; // Slightly slower
        utterance.pitch = 0.85; // Deeper pitch for male sound


        // Estimated duration for progress bar
        const estimatedDuration = Math.max(text.length * 55, 3000); // ~55ms per char
        let elapsed = 0;
        progressTimerRef.current = setInterval(() => {
            elapsed += 100;
            setIntroProgress(Math.min((elapsed / estimatedDuration) * 100, 95));
        }, 100);

        utterance.onend = () => {
            clearInterval(progressTimerRef.current);
            setIntroProgress(100);
            setTimeout(() => setIntroState('done'), 400);
        };
        utterance.onerror = () => {
            clearInterval(progressTimerRef.current);
            setIntroState('done');
        };

        speechRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    const skipIntro = () => {
        window.speechSynthesis?.cancel();
        clearInterval(progressTimerRef.current);
        setIntroProgress(100);
        setTimeout(() => setIntroState('done'), 200);
    };

    const closeModal = () => {
        window.speechSynthesis?.cancel();
        clearInterval(progressTimerRef.current);
        setSelectedCourse(null);
        setIntroState('idle');
        setIntroProgress(0);
    };

    // Get thumbnail: custom if set, else YouTube auto
    const getThumbnail = (course) => {
        if (course.thumbnailUrl) return course.thumbnailUrl;
        return `https://img.youtube.com/vi/${course.youtubeVideoId}/maxresdefault.jpg`;
    };

    return (
        <div className="course-page">
            <style>{`
                .course-page {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #fff7ed 0%, #fff 60%, #fef1f0 100%);
                    padding: 80px 0 60px;
                }
                .course-container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
                .course-header { text-align: center; margin-bottom: 48px; padding-top: 20px; }
                .course-badge {
                    display: inline-flex; align-items: center; gap: 6px;
                    background: linear-gradient(135deg, #f89e35, #f56e00);
                    color: white; font-size: 11px; font-weight: 800;
                    letter-spacing: 1.5px; text-transform: uppercase;
                    padding: 6px 14px; border-radius: 100px; margin-bottom: 16px;
                }
                .course-title { font-size: 48px; font-weight: 900; color: #0f172a; letter-spacing: -1.5px; margin: 0 0 12px; }
                .course-subtitle { color: #64748b; font-size: 17px; font-weight: 500; margin-bottom: 32px; }

                /* Search */
                .course-search {
                    max-width: 440px; margin: 0 auto 32px;
                    display: flex; align-items: center;
                    background: white; border-radius: 100px; border: 1.5px solid #e2e8f0;
                    padding: 8px 16px; gap: 10px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .course-search:focus-within { border-color: #f89e35; box-shadow: 0 4px 20px rgba(248,158,53,0.12); }
                .course-search input { flex: 1; border: none; outline: none; font-size: 15px; font-weight: 500; color: #0f172a; background: transparent; }
                .course-search input::placeholder { color: #94a3b8; }

                /* Category Strip */
                .category-strip {
                    display: flex; gap: 10px; overflow-x: auto; padding-bottom: 8px;
                    margin-bottom: 40px; scrollbar-width: none; justify-content: center;
                }
                @media (max-width: 768px) { .category-strip { justify-content: flex-start; } }
                .category-strip::-webkit-scrollbar { display: none; }
                .cat-btn {
                    padding: 8px 18px; border-radius: 100px; border: 1.5px solid #e2e8f0;
                    font-size: 13px; font-weight: 700; cursor: pointer;
                    white-space: nowrap; transition: all 0.15s;
                    background: white; color: #64748b;
                }
                .cat-btn.active { background: linear-gradient(135deg, #f89e35, #f56e00); color: white; border-color: transparent; box-shadow: 0 4px 16px rgba(248,158,53,0.3); }
                .cat-btn:hover:not(.active) { border-color: #f89e35; color: #f89e35; }
                .course-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 28px; }
                .course-card {
                    background: white; border-radius: 24px; overflow: hidden;
                    box-shadow: 0 2px 16px rgba(0,0,0,0.06);
                    border: 1px solid rgba(0,0,0,0.05);
                    transition: box-shadow 0.25s, transform 0.25s;
                    cursor: pointer; display: flex; flex-direction: column;
                }
                .course-card:hover { box-shadow: 0 12px 48px rgba(248,158,53,0.15); transform: translateY(-4px); }
                .card-thumb { position: relative; aspect-ratio: 16/9; overflow: hidden; background: #1a1a2e; }
                .card-thumb img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
                .course-card:hover .card-thumb img { transform: scale(1.06); }
                .card-play-btn {
                    position: absolute; inset: 0; background: rgba(0,0,0,0.35);
                    display: flex; align-items: center; justify-content: center;
                    opacity: 0; transition: opacity 0.2s;
                }
                .course-card:hover .card-play-btn { opacity: 1; }
                .play-circle {
                    width: 68px; height: 68px; border-radius: 50%;
                    background: rgba(255,255,255,0.95); backdrop-filter: blur(4px);
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
                    transform: scale(0.85); transition: transform 0.2s;
                }
                .course-card:hover .play-circle { transform: scale(1); }
                .card-body { padding: 22px; flex: 1; display: flex; flex-direction: column; }
                .card-title { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 8px; line-height: 1.3; }
                .card-desc { font-size: 14px; color: #64748b; line-height: 1.6; flex: 1; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
                .card-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 16px; margin-top: 12px; border-top: 1px solid #f1f5f9; }
                .watch-btn { display: flex; align-items: center; gap: 6px; color: #f89e35; font-size: 14px; font-weight: 800; }
                
                /* Modal */
                .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; }
                .modal-box { background: #0f172a; border-radius: 28px; overflow: hidden; width: 100%; max-width: 860px; position: relative; box-shadow: 0 40px 120px rgba(0,0,0,0.5); }
                
                /* Intro splash */
                .intro-splash {
                    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #0f172a 100%);
                    padding: 60px 40px;
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    min-height: 400px; text-align: center; position: relative; overflow: hidden;
                }
                .intro-splash::before {
                    content: ''; position: absolute; inset: 0;
                    background: radial-gradient(circle at 50% 40%, rgba(248,158,53,0.12) 0%, transparent 70%);
                }
                .intro-logo-ring {
                    width: 120px; height: 120px; border-radius: 50%;
                    border: 3px solid rgba(248,158,53,0.3);
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 28px; position: relative; z-index: 1;
                    animation: pulseRing 2s infinite;
                }
                .intro-logo-inner {
                    width: 90px; height: 90px; border-radius: 50%;
                    background: linear-gradient(135deg, #f89e35, #f56e00);
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 900; font-size: 28px; color: white;
                    box-shadow: 0 8px 32px rgba(248,158,53,0.4);
                }
                @keyframes pulseRing {
                    0%, 100% { border-color: rgba(248,158,53,0.3); transform: scale(1); }
                    50% { border-color: rgba(248,158,53,0.6); transform: scale(1.04); }
                }
                .sound-bars { display: flex; align-items: flex-end; gap: 3px; height: 30px; margin: 20px auto 0; }
                .sound-bar {
                    width: 4px; background: #f89e35; border-radius: 2px;
                    animation: bounce 0.8s ease-in-out infinite;
                }
                .sound-bar:nth-child(1) { animation-delay: 0s; height: 12px; }
                .sound-bar:nth-child(2) { animation-delay: 0.1s; height: 20px; }
                .sound-bar:nth-child(3) { animation-delay: 0.2s; height: 28px; }
                .sound-bar:nth-child(4) { animation-delay: 0.3s; height: 16px; }
                .sound-bar:nth-child(5) { animation-delay: 0.4s; height: 24px; }
                @keyframes bounce { 0%, 100% { transform: scaleY(0.5); } 50% { transform: scaleY(1.2); } }
                .intro-text-display {
                    color: rgba(255,255,255,0.85); font-size: 16px; font-weight: 500;
                    line-height: 1.7; max-width: 540px; margin: 24px auto 0;
                    position: relative; z-index: 1;
                }
                .intro-progress-bar {
                    width: 100%; height: 3px; background: rgba(255,255,255,0.1);
                    border-radius: 2px; overflow: hidden; margin-top: 32px;
                    position: relative; z-index: 1;
                }
                .intro-progress-fill {
                    height: 100%; background: linear-gradient(90deg, #f89e35, #f56e00);
                    border-radius: 2px; transition: width 0.1s linear;
                }
                .skip-btn {
                    position: relative; z-index: 1;
                    margin-top: 24px; display: flex; align-items: center; gap-6;
                    background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15);
                    color: white; padding: 10px 20px; border-radius: 100px;
                    cursor: pointer; font-size: 13px; font-weight: 700;
                    transition: background 0.15s;
                }
                .skip-btn:hover { background: rgba(255,255,255,0.18); }
                
                /* YouTube Player */
                .video-wrapper { position: relative; padding-top: 56.25%; background: #000; }
                .video-wrapper iframe { position: absolute; inset: 0; width: 100%; height: 100%; }
                .modal-info { background: #1e293b; padding: 24px 28px; }
                .modal-title { font-size: 22px; font-weight: 800; color: white; margin: 0 0 8px; }
                .modal-desc { color: #94a3b8; font-size: 14px; line-height: 1.6; }
                .modal-close { position: absolute; top: 20px; right: 20px; z-index: 10; background: rgba(0,0,0,0.5); border: none; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(4px); transition: background 0.15s; }
                .modal-close:hover { background: rgba(0,0,0,0.8); }

                /* Skeleton */
                @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
                .skeleton { background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 400% 100%; animation: shimmer 1.5s infinite; border-radius: 12px; }
            `}</style>

            {/* ✅ Resume Prompt */}
            <AnimatePresence>
                {resumePrompt && !selectedCourse && (
                    <motion.div
                        initial={{ opacity: 0, y: 60 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 60 }}
                        style={{ position: 'fixed', bottom: 32, right: 24, zIndex: 60, background: 'white', borderRadius: 20, padding: '20px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', border: '1px solid #f1f5f9', maxWidth: 320 }}
                    >
                        <button onClick={() => setResumePrompt(null)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                            <X size={16} />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Clock size={18} color="#f89e35" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>Resume Watching</div>
                                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{resumePrompt.title}</div>
                            </div>
                        </div>
                        <button
                            onClick={() => handleWatchCourse(resumePrompt)}
                            style={{ width: '100%', background: 'linear-gradient(135deg, #f89e35, #f56e00)', color: 'white', border: 'none', borderRadius: 12, padding: '10px 0', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}
                        >
                            Continue Course →
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ✅ Course Modal */}
            <AnimatePresence>
                {selectedCourse && (
                    <motion.div
                        className="modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="modal-box"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                        >
                            <button className="modal-close" onClick={closeModal}><X size={18} /></button>

                            {/* Intro Splash - shows while speaking */}
                            <AnimatePresence mode="wait">
                                {introState === 'speaking' && (
                                    <motion.div
                                        key="intro"
                                        className="intro-splash"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0, scale: 0.97 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {/* Animated logo */}
                                        <div className="intro-logo-ring">
                                            <div className="intro-logo-inner">LT</div>
                                        </div>

                                        <p style={{ color: '#f89e35', fontWeight: 800, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', position: 'relative', zIndex: 1 }}>
                                            Lala Tech Presents
                                        </p>
                                        <h2 style={{ color: 'white', fontWeight: 900, fontSize: 22, marginTop: 8, position: 'relative', zIndex: 1 }}>
                                            {selectedCourse.title}
                                        </h2>

                                        {/* Sound-wave animation */}
                                        <div className="sound-bars">
                                            {[0,1,2,3,4].map(i => <div key={i} className="sound-bar" />)}
                                        </div>

                                        {selectedCourse.introText && (
                                            <p className="intro-text-display">"{selectedCourse.introText}"</p>
                                        )}

                                        {/* Progress bar */}
                                        <div className="intro-progress-bar">
                                            <div className="intro-progress-fill" style={{ width: `${introProgress}%` }} />
                                        </div>

                                        <button className="skip-btn" onClick={skipIntro}>
                                            <SkipForward size={14} />
                                            Skip Intro
                                        </button>
                                    </motion.div>
                                )}

                                {introState === 'done' && (
                                    <motion.div
                                        key="player"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        <div className="video-wrapper">
                                            <iframe
                                                src={`https://www.youtube.com/embed/${selectedCourse.youtubeVideoId}?autoplay=1`}
                                                title={selectedCourse.title}
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                        <div className="modal-info">
                                            <h2 className="modal-title">{selectedCourse.title}</h2>
                                            <p className="modal-desc">{selectedCourse.description}</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="course-container">
                {/* Header */}
                <div className="course-header">
                    <div className="course-badge"><BookOpen size={11} /> Learning Hub</div>
                    <h1 className="course-title">Lala Tech Courses</h1>
                    <p className="course-subtitle">Handpicked learning resources — watch directly, progress is saved</p>

                    {/* Search */}
                    <div className="course-search">
                        <Search size={18} color="#94a3b8" />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Category filters */}
                <div className="category-strip">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`cat-btn ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="course-grid">
                        {[1,2,3].map(i => (
                            <div key={i} style={{ background: 'white', borderRadius: 24, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
                                <div className="skeleton" style={{ width: '100%', aspectRatio: '16/9' }} />
                                <div style={{ padding: 22 }}>
                                    <div className="skeleton" style={{ height: 20, width: '75%', marginBottom: 10 }} />
                                    <div className="skeleton" style={{ height: 14, marginBottom: 6 }} />
                                    <div className="skeleton" style={{ height: 14, width: '60%' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: 24, border: '2px dashed #e2e8f0' }}>
                        <PlayCircle size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
                        <h3 style={{ fontWeight: 800, color: '#0f172a' }}>
                            {search ? 'No courses match your search' : 'No Courses Yet'}
                        </h3>
                        <p style={{ color: '#94a3b8', marginTop: 6 }}>
                            {search ? 'Try a different keyword' : 'Check back soon!'}
                        </p>
                    </div>
                ) : (
                    <div className="course-grid">
                        {filtered.map((course, idx) => (
                            <motion.div
                                key={course._id}
                                className="course-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.06 }}
                                onClick={() => handleWatchCourse(course)}
                            >
                                <div className="card-thumb">
                                    <img
                                        src={getThumbnail(course)}
                                        alt={course.title}
                                        onError={(e) => {
                                            e.target.src = `https://img.youtube.com/vi/${course.youtubeVideoId}/hqdefault.jpg`;
                                        }}
                                    />
                                    {course.youtubeVideoId && <YoutubeDuration videoId={course.youtubeVideoId} />}
                                    <div className="card-play-btn">
                                        <div className="play-circle">
                                            <PlayCircle size={32} color="#f89e35" />
                                        </div>
                                    </div>
                                    {/* Intro badge */}
                                    {course.introText && (
                                        <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(248,158,53,0.9)', color: 'white', fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', padding: '4px 10px', borderRadius: 100, display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Volume2 size={10} /> Intro
                                        </div>
                                    )}
                                </div>
                                <div className="card-body">
                                    <h3 className="card-title">{course.title}</h3>
                                    <p className="card-desc">{course.description}</p>
                                    <div className="card-footer">
                                        <span className="watch-btn"><PlayCircle size={16} /> Watch Now</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
