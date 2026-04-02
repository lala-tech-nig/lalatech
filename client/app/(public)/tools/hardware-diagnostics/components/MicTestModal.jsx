import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, StopCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MicTestModal({ onClose, onComplete }) {
    const [status, setStatus] = useState('idle'); // idle, recording, playing, done
    const [error, setError] = useState('');
    const [audioUrl, setAudioUrl] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            setError('');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url);
                setStatus('done');
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setStatus('recording');

            // Auto stop after 5 seconds
            setTimeout(() => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    mediaRecorderRef.current.stop();
                }
            }, 5000);

        } catch (err) {
            console.warn("Mic error:", err);
            setError('Could not access microphone. Please check permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full relative text-center">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                    <X size={18} />
                </button>
                
                <div className="w-16 h-16 bg-teal-100 text-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mic size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Microphone Test</h2>
                
                {error ? (
                    <div className="text-red-500 bg-red-50 p-4 rounded-xl mb-6">{error}</div>
                ) : (
                    <>
                        <p className="text-slate-500 mb-8 text-sm">
                            {status === 'idle' && "Click start and speak for a few seconds."}
                            {status === 'recording' && <span className="text-red-500 animate-pulse font-bold">Recording... Speak now!</span>}
                            {status === 'done' && "Listen to your recording below."}
                        </p>

                        {status === 'idle' && (
                            <button onClick={startRecording} className="py-3 px-8 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-600 mb-6 transition-colors">Start Recording</button>
                        )}
                        
                        {status === 'recording' && (
                            <button onClick={stopRecording} className="py-3 px-8 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 mb-6 flex items-center mx-auto transition-colors"><StopCircle className="mr-2" size={20} /> Stop Early</button>
                        )}

                        {status === 'done' && audioUrl && (
                            <div className="mb-8">
                                <audio src={audioUrl} controls className="w-full h-12 outline-none mb-4" />
                            </div>
                        )}
                    </>
                )}

                {(status === 'done' || error) && (
                    <div className="space-y-3 border-t border-slate-100 pt-6">
                        <button onClick={() => onComplete(!error)} disabled={!!error} className="w-full py-4 bg-teal-500 text-white font-bold rounded-xl shadow-lg hover:bg-teal-600 disabled:opacity-50 transition-colors">
                            Yes, I heard myself clearly
                        </button>
                        <button onClick={() => onComplete(false)} className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors">
                            No, it didn't record properly
                        </button>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
