'use client';

import React, { useState, useEffect } from 'react';
import { PlayCircle, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '@/lib/api';

export default function CoursePage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [resumePrompt, setResumePrompt] = useState(null);

    useEffect(() => {
        fetchCourses();
        checkResumeState();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/courses`);
            if (res.ok) {
                const data = await res.json();
                setCourses(data);
            }
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const checkResumeState = () => {
        const lastWatched = localStorage.getItem('lastWatchedCourse');
        if (lastWatched) {
            try {
                const course = JSON.parse(lastWatched);
                setResumePrompt(course);
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handleWatchVideo = (course) => {
        setSelectedCourse(course);
        localStorage.setItem('lastWatchedCourse', JSON.stringify(course));
        if (resumePrompt && resumePrompt._id === course._id) {
            setResumePrompt(null);
        }
    };

    const closeResumePrompt = () => {
        setResumePrompt(null);
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-20 pt-10 relative">
            
            {/* Resume Prompt Modal Component */}
            <AnimatePresence>
                {resumePrompt && !selectedCourse && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-10 right-10 z-50 bg-white rounded-xl shadow-2xl p-6 border border-gray-200 max-w-sm"
                    >
                        <button onClick={closeResumePrompt} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700">
                            <X className="w-5 h-5"/>
                        </button>
                        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-orange-500" /> Resume Watching
                        </h3>
                        <p className="text-sm text-gray-600 mb-4 truncate">
                            {resumePrompt.title}
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => handleWatchVideo(resumePrompt)}
                                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-medium transition text-sm text-center"
                            >
                                Continue
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Video Player Modal Component */}
            <AnimatePresence>
                {selectedCourse && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
                    >
                        <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl">
                            <div className="relative pt-[56.25%] bg-black">
                                <iframe 
                                    className="absolute top-0 left-0 w-full h-full"
                                    src={`https://www.youtube.com/embed/${selectedCourse.youtubeVideoId}?autoplay=1`} 
                                    title={selectedCourse.title}
                                    frameBorder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowFullScreen
                                ></iframe>
                            </div>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-2xl font-bold text-gray-900">{selectedCourse.title}</h2>
                                    <button 
                                        onClick={() => setSelectedCourse(null)}
                                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition"
                                    >
                                        <X className="w-6 h-6 text-gray-600" />
                                    </button>
                                </div>
                                <p className="text-gray-600 whitespace-pre-wrap">{selectedCourse.description}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16 mt-8">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
                        Learn & Grow with Our Courses
                    </h1>
                    <p className="text-xl text-gray-600">
                        Watch premium tutorials and guides straight from our website. We save your progress!
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                    </div>
                ) : courses.length === 0 ? (
                    <div className="text-center bg-white rounded-2xl p-12 shadow-sm border border-gray-100">
                        <PlayCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-700 mb-2">No Courses Available</h3>
                        <p className="text-gray-500">Check back later for new content!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {courses.map((course) => (
                            <motion.div 
                                key={course._id}
                                whileHover={{ y: -5 }}
                                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 transition-all flex flex-col cursor-pointer group"
                                onClick={() => handleWatchVideo(course)}
                            >
                                <div className="relative aspect-video bg-gray-200 overflow-hidden">
                                    {/* Thumbnail logic */}
                                    {course.thumbnailUrl ? (
                                        <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                    ) : (
                                        <img src={`https://img.youtube.com/vi/${course.youtubeVideoId}/maxresdefault.jpg`} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" onError={(e) => {
                                            // Fallback to hqdefault if maxresdefault doesn't exist
                                            e.target.src = `https://img.youtube.com/vi/${course.youtubeVideoId}/hqdefault.jpg`;
                                        }} />
                                    )}
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition flex items-center justify-center">
                                        <div className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all shadow-lg">
                                            <PlayCircle className="w-8 h-8 text-orange-600" />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
                                    <p className="text-gray-500 text-sm line-clamp-3 mb-4 flex-1">
                                        {course.description}
                                    </p>
                                    <div className="text-orange-600 font-medium text-sm flex items-center gap-2 group-hover:text-orange-700 transition">
                                        <PlayCircle className="w-4 h-4" /> Watch Now
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
