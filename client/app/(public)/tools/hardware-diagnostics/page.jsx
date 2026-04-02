'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { 
  CheckCircle, XCircle, Play, Smartphone, Monitor, Cpu, Fingerprint, 
  Wifi, Volume2, Camera, Keyboard, Battery, Mic, Share2, Download, ShieldAlert,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

// Test Components (Will be imported)
import ScreenTestModal from './components/ScreenTestModal';
import TouchTestModal from './components/TouchTestModal';
import AudioTestModal from './components/AudioTestModal';
import MicTestModal from './components/MicTestModal';
import CameraTestModal from './components/CameraTestModal';
import KeyboardTestModal from './components/KeyboardTestModal';
import BatteryTestModal from './components/BatteryTestModal';
import NetworkTestModal from './components/NetworkTestModal';

export default function HardwareDiagnosticsPage() {
    const [deviceInfo, setDeviceInfo] = useState({ os: 'Loading...', browser: 'Loading...', cores: 'Loading...', memory: 'Loading...', userAgent: '' });
    const reportRef = useRef(null);

    const [testResults, setTestResults] = useState({
        screen: null,
        touch: null,
        audio: null,
        mic: null,
        camera: null,
        keyboard: null,
        battery: null,
        network: null,
    });

    const [activeTest, setActiveTest] = useState(null);

    const [dateString, setDateString] = useState('');

    useEffect(() => {
        setDateString(new Date().toLocaleDateString());
        // Gather Device Info on client mount
        const parser = {
            os: navigator.userAgent.includes('Windows') ? 'Windows' : 
                navigator.userAgent.includes('Mac') ? 'macOS' : 
                navigator.userAgent.includes('Android') ? 'Android' : 
                navigator.userAgent.includes('iPhone') ? 'iOS' : 'Unknown OS',
            browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                     navigator.userAgent.includes('Firefox') ? 'Firefox' : 
                     navigator.userAgent.includes('Safari') ? 'Safari' : 'Unknown Browser',
            cores: navigator.hardwareConcurrency || 'Unknown',
            memory: navigator.deviceMemory ? `${navigator.deviceMemory} GB+` : 'Unknown',
            userAgent: navigator.userAgent
        };
        setDeviceInfo(parser);
    }, []);

    const updateTestResult = (testKey, isPass) => {
        setTestResults(prev => ({ ...prev, [testKey]: isPass }));
        setActiveTest(null);
    };

    const generateLetterheadPDF = async () => {
        try {
            const url = '/lalatech.pdf';
            const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer());
            const pdfDoc = await PDFDocument.load(existingPdfBytes);
            const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];
            const { height } = firstPage.getSize();
            
            const drawText = (text, x, y, size = 11, font = helveticaFont, color = rgb(0.2, 0.2, 0.2)) => {
                firstPage.drawText(text, { x, y: height - y, size, font, color });
            };

            const orangeColor = rgb(0.97, 0.61, 0.2); // approx #f89e35
            const redColor = rgb(0.93, 0.26, 0.26);
            const greenColor = rgb(0.13, 0.77, 0.36);

            // Shift everything down to account for the letterhead header.
            let startY = 160;
            
            drawText("Hardware Diagnostics Report", 50, startY, 20, helveticaBold, orangeColor);
            
            const now = new Date();
            const timeString = now.toLocaleTimeString();
            drawText(`Generated on: ${dateString} at ${timeString}`, 50, startY + 20, 10);
            drawText(`Tool URL: ${window.location.href}`, 50, startY + 35, 10);

            drawText("Device Information", 50, startY + 65, 14, helveticaBold);
            drawText(`OS: ${deviceInfo.os}`, 50, startY + 85);
            drawText(`Browser: ${deviceInfo.browser}`, 50, startY + 100);
            drawText(`Logic Cores: ${deviceInfo.cores}`, 250, startY + 85);
            drawText(`Memory: ${deviceInfo.memory}`, 250, startY + 100);

            drawText("Test Suite Results", 50, startY + 135, 14, helveticaBold);

            let yPos = startY + 160;
            tests.forEach((test) => {
                const status = testResults[test.id];
                let statusText = 'Not Tested';
                let color = rgb(0.6, 0.6, 0.6); // Gray
                
                if (status === true) {
                    statusText = 'PASSED';
                    color = greenColor;
                } else if (status === false) {
                    statusText = 'FAILED';
                    color = redColor;
                }

                drawText(`${test.title}:`, 50, yPos);
                drawText(statusText, 250, yPos, 11, helveticaBold, color);
                
                yPos += 20;
            });
            
            return await pdfDoc.save();
        } catch (err) {
            console.error('Letterhead generation error:', err);
            return null;
        }
    };

    const generateNativePDF = async () => {
        const pdfBytes = await generateLetterheadPDF();
        if (!pdfBytes) {
            alert('Could not generate PDF with Letterhead template. Check if lalatech.pdf exists.');
            return;
        }

        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'Lalatech_Diagnostics_Letterhead.pdf';
        link.click();
    };

    const handleWhatsAppShare = async () => {
        const textStr = `*Lalatech Diagnostics Report*\n📱 *Device Info:*\nOS: ${deviceInfo.os} | Browser: ${deviceInfo.browser}\n\n*Check out the attached PDF for full details!*\n\nTest your own device at Lalatech: ${window.location.href}`;

        const pdfBytes = await generateLetterheadPDF();
        
        if (pdfBytes && navigator.share && navigator.canShare) {
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const file = new File([blob], 'Lalatech_Diagnostics_Letterhead.pdf', { type: 'application/pdf' });
            
            if (navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        title: 'Hardware Diagnostic Report - Lalatech',
                        text: textStr,
                        files: [file]
                    });
                    return; // Successfully shared natively
                } catch (e) {
                    console.warn("Native share cancelled or failed:", e);
                }
            }
        }

        // Fallback for Desktop where navigator.share for files is not supported
        if (pdfBytes) {
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'Lalatech_Diagnostics_Letterhead.pdf';
            link.click();
            alert('Your letterhead report is downloading! You can manually attach it directly to your WhatsApp text.');
        }

        window.open(`https://wa.me/?text=${encodeURIComponent(textStr)}`, '_blank');
    };

    const tests = [
        { id: 'screen', title: 'Screen Colors', icon: Monitor, color: 'text-blue-500', bg: 'bg-blue-50' },
        { id: 'touch', title: 'Touch/Digitizer', icon: Smartphone, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { id: 'audio', title: 'Speakers Output', icon: Volume2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { id: 'mic', title: 'Microphone', icon: Mic, color: 'text-teal-500', bg: 'bg-teal-50' },
        { id: 'camera', title: 'Webcam/Camera', icon: Camera, color: 'text-purple-500', bg: 'bg-purple-50' },
        { id: 'keyboard', title: 'Keyboard & Side Buttons', icon: Keyboard, color: 'text-orange-500', bg: 'bg-orange-50' },
        { id: 'battery', title: 'Battery & Charging', icon: Battery, color: 'text-yellow-500', bg: 'bg-yellow-50' },
        { id: 'network', title: 'Network & Wi-Fi', icon: Wifi, color: 'text-cyan-500', bg: 'bg-cyan-50' }
    ];

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <Link href="/tools" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-orange-600 mb-4 transition-colors">
                            <ArrowLeft size={16} className="mr-1" /> Back to Tools
                        </Link>
                        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Hardware Diagnostics</h1>
                        <p className="mt-2 text-lg text-slate-600">Quickly test your device's hardware components right in your browser.</p>
                    </div>
                </div>

                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-8 rounded-r-lg shadow-sm">
                    <div className="flex">
                        <ShieldAlert className="h-6 w-6 text-amber-500 mr-3 shrink-0" />
                        <div>
                            <h3 className="text-sm font-bold text-amber-800">Browser Limitations Notice</h3>
                            <p className="mt-1 text-sm text-amber-700">
                                For security and privacy, web browsers cannot access device IMEI, Serial Numbers, or run system-level CMD commands for deep disk/battery health. This suite tests what is natively accessible via Web APIs.
                            </p>
                        </div>
                    </div>
                </div>

                <div ref={reportRef} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 mb-8 relative">
                    {/* Device Info Section */}
                    <div className="mb-10">
                        <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4 mb-6 flex items-center">
                            <Cpu className="mr-2 text-orange-500" /> Device Information
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Operating System</p>
                                <p className="text-slate-800 font-semibold">{deviceInfo.os}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Browser Engine</p>
                                <p className="text-slate-800 font-semibold">{deviceInfo.browser}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Logical Cores</p>
                                <p className="text-slate-800 font-semibold">{deviceInfo.cores}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Memory (RAM)</p>
                                <p className="text-slate-800 font-semibold">{deviceInfo.memory}</p>
                            </div>
                        </div>
                        <p className="mt-4 text-xs text-slate-400 font-mono break-all bg-slate-50 p-3 rounded-lg border border-slate-100">
                            {deviceInfo.userAgent}
                        </p>
                    </div>

                    {/* Test Suite */}
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-4 mb-6 flex items-center justify-between">
                            <span className="flex items-center"><Play className="mr-2 text-orange-500" /> Test Suite</span>
                            <span className="text-sm font-medium bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
                                {Object.values(testResults).filter(v => v !== null).length} / {tests.length} Tests Completed
                            </span>
                        </h2>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {tests.map(test => {
                                const Icon = test.icon;
                                const status = testResults[test.id];
                                
                                return (
                                    <div key={test.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-orange-200 hover:shadow-md transition-all bg-white group">
                                        <div className="flex items-center flex-1">
                                            <div className={`p-3 rounded-xl ${test.bg} ${test.color} mr-4 group-hover:scale-110 transition-transform`}>
                                                <Icon size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800">{test.title}</h3>
                                                <p className="text-xs text-slate-500">
                                                    {status === null ? 'Not tested' : status === true ? 'Working perfectly' : 'Issues detected'}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                            {status === true && <CheckCircle className="text-green-500 mr-2" size={24} />}
                                            {status === false && <XCircle className="text-red-500 mr-2" size={24} />}
                                            
                                            <button 
                                                onClick={() => setActiveTest(test.id)}
                                                data-html2canvas-ignore="true"
                                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                                                    status === null 
                                                    ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' 
                                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                                }`}
                                            >
                                                {status === null ? 'Start' : 'Retest'}
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    
                    {/* Watermark for PDF */}
                    <div className="hidden mt-12 text-center text-slate-400 text-sm font-bold" id="pdf-watermark">
                        Generated by Lalatech Diagnostics • {dateString}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                    <button 
                        onClick={generateNativePDF}
                        className="flex items-center justify-center px-6 py-3 bg-white text-slate-700 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        <Download size={18} className="mr-2" /> Download Full Report
                    </button>
                    <button 
                        onClick={handleWhatsAppShare}
                        className="flex items-center justify-center px-6 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all shadow-md hover:shadow-lg shadow-green-500/30"
                    >
                        <Share2 size={18} className="mr-2" /> Share on WhatsApp
                    </button>
                </div>
            </div>

            {/* Test Modals */}
            <AnimatePresence>
                {activeTest === 'screen' && <ScreenTestModal onClose={() => setActiveTest(null)} onComplete={(res) => updateTestResult('screen', res)} />}
                {activeTest === 'touch' && <TouchTestModal onClose={() => setActiveTest(null)} onComplete={(res) => updateTestResult('touch', res)} />}
                {activeTest === 'audio' && <AudioTestModal onClose={() => setActiveTest(null)} onComplete={(res) => updateTestResult('audio', res)} />}
                {activeTest === 'mic' && <MicTestModal onClose={() => setActiveTest(null)} onComplete={(res) => updateTestResult('mic', res)} />}
                {activeTest === 'camera' && <CameraTestModal onClose={() => setActiveTest(null)} onComplete={(res) => updateTestResult('camera', res)} />}
                {activeTest === 'keyboard' && <KeyboardTestModal onClose={() => setActiveTest(null)} onComplete={(res) => updateTestResult('keyboard', res)} />}
                {activeTest === 'battery' && <BatteryTestModal onClose={() => setActiveTest(null)} onComplete={(res) => updateTestResult('battery', res)} />}
                {activeTest === 'network' && <NetworkTestModal onClose={() => setActiveTest(null)} onComplete={(res) => updateTestResult('network', res)} />}
            </AnimatePresence>
        </div>
    );
}
