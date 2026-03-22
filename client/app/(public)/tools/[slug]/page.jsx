'use client';

import React, { useState, useRef, use } from 'react';
import { Download, UploadCloud, File, RefreshCw, X, ArrowLeft, Settings, Plus, Type } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '@/lib/api';
import { toolsList } from '@/lib/toolsList';

// Helper to determine tool requirements based on category or name
const getToolConfig = (tool) => {
    if (!tool) return null;
    
    // Default config
    let config = { ...tool, accept: '*/*', multiple: false, needsPassword: false, needsText: false, noFile: false };

    // File accept rules
    if (tool.category === 'Image Tools') config.accept = 'image/*';
    if (tool.category === 'Pdf Tools') config.accept = '.pdf';
    if (['word-to-pdf'].includes(tool.slug)) config.accept = '.doc,.docx';
    if (['csv-to-json', 'csv-to-xml'].includes(tool.slug)) config.accept = '.csv';
    if (['json-to-xml'].includes(tool.slug)) config.accept = '.json';
    if (['xml-to-json', 'xml-to-csv'].includes(tool.slug)) config.accept = '.xml';
    if (['jpg-to-pdf', 'png-to-pdf'].includes(tool.slug)) config.accept = 'image/*';
    
    // Multiple files rules
    if (['merge-pdf', 'jpg-to-pdf', 'png-to-pdf'].includes(tool.slug)) {
        config.multiple = true;
    }

    // Special fields
    if (tool.slug === 'protect-pdf' || tool.slug === 'unlock-pdf') config.needsPassword = true;
    if (tool.slug === 'watermark-pdf') config.needsText = true;
    
    // No-file utilities
    if (tool.slug === 'qr-code-generator') {
        config.noFile = true;
        config.needsText = true; // Text for QR content
    }
    if (['lorem-ipsum-generator', 'epoch-converter'].includes(tool.slug)) {
        config.noFile = true;
    }

    return config;
};

export default function ToolServicePage({ params }) {
    // Unwind params Promise for Next.js 15
    const resolvedParams = use(params);
    const { slug } = resolvedParams;
    const baseTool = toolsList.find(t => t.slug === slug);
    const toolInfo = getToolConfig(baseTool);

    const [files, setFiles] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    
    // Extracted settings
    const [password, setPassword] = useState('');
    const [customText, setCustomText] = useState('');

    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);
            setFiles(toolInfo.multiple ? [...files, ...selectedFiles] : [selectedFiles[0]]);
            setErrorMsg('');
        }
    };

    const removeFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const handleProcess = async () => {
        if (!toolInfo.noFile && files.length === 0) return;
        setIsProcessing(true);
        setErrorMsg('');
        setIsComplete(false);

        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        formData.append('tool', slug);
        
        if (toolInfo.needsPassword) formData.append('password', password);
        if (toolInfo.needsText) formData.append('text', customText);

        try {
            const res = await fetch(`${API_BASE_URL}/tools/process`, {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                // Expecting a file blob back
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                
                // Get filename from header if available
                const contentDisposition = res.headers.get('Content-Disposition');
                let filename = `${slug}-output`;
                if (contentDisposition && contentDisposition.includes('filename=')) {
                    filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
                } else {
                    // Fallback extensions based on category
                    if (toolInfo.category === 'Pdf Tools') filename += '.pdf';
                    else if (toolInfo.category === 'Image Tools') filename += '.png';
                    else filename += '.txt';
                }

                setDownloadUrl({ url, filename });
                setIsComplete(true);
            } else {
                const errData = await res.json();
                setErrorMsg(errData.message || 'Apologies, this conversion failed. It might not be fully implemented in the backend yet.');
            }
        } catch (error) {
            console.error(error);
            setErrorMsg('Network error or server unavailable. Ensure backend is running.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!toolInfo) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 text-gray-900 pb-20">
                <div className="bg-white p-12 rounded-3xl shadow-xl border border-gray-100 max-w-lg text-center">
                    <Settings className="w-16 h-16 text-orange-500 mx-auto mb-6 opacity-50" />
                    <h2 className="text-3xl font-black mb-4">Tool Not Found</h2>
                    <p className="text-gray-500 mb-8 font-medium">We couldn't find the tool you're looking for. It may have been removed or renamed.</p>
                    <Link href="/tools" className="inline-flex bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-full transition shadow-[0_8px_20px_rgb(248,158,53,0.3)]">
                        Browse All Tools
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen pt-20 pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                
                <Link href="/tools" className="inline-flex items-center text-orange-600 font-bold hover:text-orange-700 transition mb-6 group">
                    <ArrowLeft className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition" />
                    Back to All Tools
                </Link>

                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-[#110f0e] text-white p-10 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4 relative z-10">{toolInfo.name}</h1>
                        <p className="text-xl text-gray-300 max-w-2xl mx-auto relative z-10 font-medium">
                            {toolInfo.desc}
                        </p>
                    </div>

                    <div className="p-8 md:p-12">

                        <AnimatePresence mode="wait">
                            {!isComplete ? (
                                <motion.div 
                                    key="uploading"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="flex flex-col items-center"
                                >
                                    
                                    {toolInfo.noFile ? (
                                        <div className="w-full border-4 border border-gray-100 rounded-3xl p-12 text-center transition-colors bg-orange-50/30 mb-8">
                                            <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto mb-6 text-orange-500">
                                                <Settings className="w-10 h-10" />
                                            </div>
                                            <h3 className="text-2xl font-black text-gray-900 mb-2">No Files Required</h3>
                                            <p className="text-gray-500 font-medium">This tool generates content directly from parameters.</p>
                                        </div>
                                    ) : files.length === 0 ? (
                                        <div 
                                            className="w-full border-4 border-dashed border-gray-200 hover:border-orange-500 rounded-3xl p-16 text-center transition-colors cursor-pointer bg-gray-50 hover:bg-orange-50/30 mb-8"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto mb-6 text-orange-500">
                                                <UploadCloud className="w-12 h-12" />
                                            </div>
                                            <h3 className="text-3xl font-black text-gray-900 mb-3">Select {toolInfo.multiple ? 'Files' : 'File'}</h3>
                                            <p className="text-gray-500 font-medium text-lg">or drop {toolInfo.multiple ? 'them' : 'it'} here</p>
                                        </div>
                                    ) : (
                                        <div className="w-full">
                                            <div className="grid gap-3 mb-8">
                                                {files.map((f, i) => (
                                                    <div key={i} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                                                        <div className="flex items-center gap-4 mb-3 sm:mb-0 w-full overflow-hidden">
                                                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-orange-600 flex-shrink-0">
                                                                <File className="w-6 h-6" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="font-bold text-gray-900 truncate">{f.name}</p>
                                                                <p className="text-sm font-medium text-gray-500">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => removeFile(i)}
                                                            className="p-2 text-gray-400 hover:text-red-500 bg-white hover:bg-red-50 rounded-full transition shadow-sm border border-gray-100 flex-shrink-0"
                                                        >
                                                            <X className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            {toolInfo.multiple && (
                                                <button 
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="mb-8 w-full border-2 border-dashed border-gray-300 text-gray-600 font-bold py-4 rounded-2xl hover:bg-gray-50 hover:border-gray-400 transition flex items-center justify-center gap-2"
                                                >
                                                    + Add More Files
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    <div className="w-full">
                                        {toolInfo.needsPassword && (
                                            <div className="mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-200 w-full">
                                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                                    <Settings className="w-4 h-4" /> Password
                                                </label>
                                                <input 
                                                    type="password" 
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="Enter document password"
                                                    className="w-full bg-white border border-gray-300 rounded-xl p-4 text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition"
                                                />
                                            </div>
                                        )}

                                        {toolInfo.needsText && (
                                            <div className="mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-200 w-full">
                                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                                    <Type className="w-4 h-4" /> {toolInfo.slug === 'qr-code-generator' ? 'QR Code Content (URL or Text)' : 'Custom Text / Watermark'}
                                                </label>
                                                <input 
                                                    type="text" 
                                                    value={customText}
                                                    onChange={(e) => setCustomText(e.target.value)}
                                                    placeholder={toolInfo.slug === 'qr-code-generator' ? "https://example.com" : "CONFIDENTIAL"}
                                                    className="w-full bg-white border border-gray-300 rounded-xl p-4 text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {errorMsg && (
                                        <div className="mb-6 w-full p-4 bg-red-50 text-red-600 font-bold rounded-xl border border-red-100 flex items-start gap-3">
                                            <span className="mt-0.5 animate-pulse">!</span>
                                            {errorMsg}
                                        </div>
                                    )}

                                    <button 
                                        onClick={handleProcess}
                                        disabled={isProcessing || (!toolInfo.noFile && files.length === 0)}
                                        className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-70 disabled:cursor-not-allowed text-white text-xl font-black py-5 rounded-2xl transition shadow-[0_8px_30px_rgb(248,158,53,0.3)] flex items-center justify-center gap-3"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <RefreshCw className="w-6 h-6 animate-spin" />
                                                Processing... 
                                            </>
                                        ) : (
                                            <>
                                                {toolInfo.name.includes('to') ? 'Convert Now' : 'Process Now'}
                                            </>
                                        )}
                                    </button>

                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="completed"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-10"
                                >
                                    <div className="w-24 h-24 bg-green-100 rounded-full mx-auto mb-8 flex items-center justify-center text-green-500">
                                        <Download className="w-12 h-12" />
                                    </div>
                                    <h2 className="text-3xl font-black text-gray-900 mb-4">Task Completed Successfully!</h2>
                                    <p className="text-xl text-gray-500 font-medium mb-10 max-w-md mx-auto">Your file has been processed and is ready for download.</p>
                                    
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                        <a 
                                            href={downloadUrl?.url} 
                                            download={downloadUrl?.filename}
                                            className="bg-orange-600 hover:bg-orange-700 text-white text-xl font-black py-5 px-10 rounded-2xl transition shadow-[0_8px_30px_rgb(248,158,53,0.3)] flex justify-center items-center gap-3"
                                        >
                                            <Download className="w-6 h-6" /> Download Output
                                        </a>
                                        <button 
                                            onClick={() => {
                                                setFiles([]);
                                                setIsComplete(false);
                                                setDownloadUrl(null);
                                                setErrorMsg('');
                                            }}
                                            className="bg-white hover:bg-gray-50 text-gray-700 text-xl font-black py-5 px-10 rounded-2xl border-2 border-gray-200 transition shadow-sm flex justify-center items-center gap-3"
                                        >
                                            Convert Another File
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </div>
                </div>

                {!toolInfo?.noFile && (
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange}
                        accept={toolInfo?.accept} 
                        multiple={toolInfo?.multiple}
                        className="hidden" 
                    />
                )}
            </div>
        </div>
    );
}
