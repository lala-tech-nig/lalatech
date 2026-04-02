'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
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

    const generateNativePDF = () => {
        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            // Header
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(22);
            pdf.setTextColor(248, 158, 53); // Orange
            pdf.text("Lalatech Hardware Diagnostics", 20, 25);
            
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(10);
            pdf.setTextColor(150, 150, 150);
            pdf.text(`Generated on: ${dateString}`, 20, 32);

            // Device Info
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(14);
            pdf.setTextColor(50, 50, 50);
            pdf.text("Device Information", 20, 45);
            
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(11);
            pdf.text(`OS: ${deviceInfo.os}`, 25, 55);
            pdf.text(`Browser: ${deviceInfo.browser}`, 25, 62);
            pdf.text(`Cores: ${deviceInfo.cores}`, 105, 55);
            pdf.text(`Memory: ${deviceInfo.memory}`, 105, 62);

            // Divider
            pdf.setDrawColor(230, 230, 230);
            pdf.line(20, 70, 190, 70);

            // Test Results
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(14);
            pdf.text("Test Suite Results", 20, 85);

            let yPos = 95;
            tests.forEach((test) => {
                const status = testResults[test.id];
                let statusText = 'Not Tested';
                let r = 150, g = 150, b = 150; // Gray
                
                if (status === true) {
                    statusText = 'PASSED';
                    r = 34; g = 197; b = 94; // Green
                } else if (status === false) {
                    statusText = 'FAILED';
                    r = 239; g = 68; b = 68; // Red
                }

                pdf.setFont("helvetica", "normal");
                pdf.setTextColor(50, 50, 50);
                pdf.text(`${test.title}:`, 25, yPos);
                
                pdf.setFont("helvetica", "bold");
                pdf.setTextColor(r, g, b);
                pdf.text(statusText, 105, yPos);
                
                yPos += 10;
            });
            
            pdf.save('Lalatech_Diagnostics.pdf');
        } catch (err) {
            console.error('PDF error:', err);
            alert('Could not generate PDF. Please use your browser Print feature.');
            window.print();
        }
    };

    const handleWhatsAppShare = () => {
        let text = `*Lalatech Diagnostics Report*\n\n`;
        text += `📱 *Device Info:*\n`;
        text += `OS: ${deviceInfo.os} | Browser: ${deviceInfo.browser}\n\n`;
        
        text += `🛠️ *Test Results:*\n`;
        tests.forEach(test => {
            const status = testResults[test.id];
            let emoji = '⚪ Not Tested';
            if (status === true) emoji = '✅ Passed';
            if (status === false) emoji = '❌ Failed';
            text += `- ${test.title}: ${emoji}\n`;
        });
        
        text += `\nTest your own device at Lalatech!`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
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
