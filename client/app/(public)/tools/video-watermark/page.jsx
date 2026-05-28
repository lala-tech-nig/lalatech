'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, UploadCloud, Video, Image as ImageIcon, Settings, Play, Pause, 
  RefreshCw, Download, Sparkles, Sliders, PlayCircle, Info, HelpCircle,
  Eye, Check, RotateCcw, VolumeX, Volume2
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// Checkerboard pattern styling for transparent logo previews
const checkerboardStyle = {
  backgroundImage: 'radial-gradient(#e2e8f0 20%, transparent 20%), radial-gradient(#e2e8f0 20%, transparent 20%)',
  backgroundPosition: '0 0, 8px 8px',
  backgroundSize: '16px 16px',
  backgroundColor: '#f8fafc',
};

export default function VideoWatermarkPage() {
  // File states
  const [videoFile, setVideoFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  
  // Media details loaded from files
  const [videoMeta, setVideoMeta] = useState({ width: 0, height: 0, duration: 0 });
  const [logoMeta, setLogoMeta] = useState({ width: 0, height: 0 });
  
  // Watermark styling configuration
  const [wmSize, setWmSize] = useState(15); // % of video width (5% - 40%)
  const [wmOpacity, setWmOpacity] = useState(70); // % opacity (10% - 100%)
  const [wmSpeed, setWmSpeed] = useState(4); // speed scaling factor (1 - 10)
  const [wmPattern, setWmPattern] = useState('dvd'); // 'dvd', 'drift', 'corner-hop', 'static'
  const [wmCorner, setWmCorner] = useState('bottom-right'); // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
  const [wmPadding, setWmPadding] = useState(5); // % padding from edge (2% - 15%) for static lock
  
  // Playback/Preview state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [previewVolume, setPreviewVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);

  // Live Position States for Overlay & Rendering
  // Using vectors to animate logo bouncing
  const [pos, setPos] = useState({ x: 10, y: 10 });
  const [vel, setVel] = useState({ x: 2, y: 2 });
  const [driftAngle, setDriftAngle] = useState(Math.PI / 4);

  // Render & Output recording states
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStatus, setRenderStatus] = useState('idle'); // 'idle', 'recording', 'complete', 'error'
  const [downloadUrl, setDownloadUrl] = useState('');
  const [recordedBlob, setRecordedBlob] = useState(null);

  // Refs for video, canvas, images and recorders
  const videoRef = useRef(null);
  const logoImgRef = useRef(null);
  const containerRef = useRef(null);
  const recordCanvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  
  // Real-time animation refs to completely avoid React stale closures in canvas loops
  const wmSizeRef = useRef(15);
  const wmOpacityRef = useRef(70);
  const wmSpeedRef = useRef(4);
  const wmPatternRef = useRef('dvd');
  const wmCornerRef = useRef('bottom-right');
  const wmPaddingRef = useRef(5);

  const posRef = useRef({ x: 10, y: 10 });
  const velRef = useRef({ x: 2, y: 2 });
  const driftAngleRef = useRef(Math.PI / 4);

  // Sync state changes to refs instantly
  useEffect(() => { wmSizeRef.current = wmSize; }, [wmSize]);
  useEffect(() => { wmOpacityRef.current = wmOpacity; }, [wmOpacity]);
  useEffect(() => { wmSpeedRef.current = wmSpeed; }, [wmSpeed]);
  useEffect(() => { wmPatternRef.current = wmPattern; }, [wmPattern]);
  useEffect(() => { wmCornerRef.current = wmCorner; }, [wmCorner]);
  useEffect(() => { wmPaddingRef.current = wmPadding; }, [wmPadding]);
  
  // Animation frames for real-time render preview
  const requestRef = useRef(null);
  const renderRequestRef = useRef(null);
  
  // MediaRecorder instancing
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const videoUrlRef = useRef('');
  const logoUrlRef = useRef('');
  const downloadUrlRef = useRef('');

  useEffect(() => {
    videoUrlRef.current = videoUrl;
  }, [videoUrl]);

  useEffect(() => {
    logoUrlRef.current = logoUrl;
  }, [logoUrl]);

  useEffect(() => {
    downloadUrlRef.current = downloadUrl;
  }, [downloadUrl]);

  // Cleanup Object URLs ONLY on actual unmount to prevent ERR_FILE_NOT_FOUND on state changes
  useEffect(() => {
    return () => {
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
      if (logoUrlRef.current) URL.revokeObjectURL(logoUrlRef.current);
      if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
    };
  }, []);

  // Handle Video file upload
  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setIsPlaying(false);
    setRenderStatus('idle');
    setDownloadUrl('');
    setRecordedBlob(null);
  };

  // Handle Logo file upload
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (logoUrl) URL.revokeObjectURL(logoUrl);

    setLogoFile(file);
    const url = URL.createObjectURL(file);
    setLogoUrl(url);
    setRenderStatus('idle');
    setDownloadUrl('');
    setRecordedBlob(null);
  };

  // Video loaded metadata
  const onVideoMetadata = () => {
    if (!videoRef.current) return;
    setVideoMeta({
      width: videoRef.current.videoWidth,
      height: videoRef.current.videoHeight,
      duration: videoRef.current.duration
    });
    // Set video aspect ratio dimensions for preview canvas
    if (previewCanvasRef.current) {
      previewCanvasRef.current.width = videoRef.current.videoWidth;
      previewCanvasRef.current.height = videoRef.current.videoHeight;
    }
  };

  // Logo loaded size
  const onLogoLoad = () => {
    if (!logoImgRef.current) return;
    setLogoMeta({
      width: logoImgRef.current.naturalWidth,
      height: logoImgRef.current.naturalHeight
    });
  };

  // Reset tool state
  const handleReset = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (logoUrl) URL.revokeObjectURL(logoUrl);
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);

    setVideoFile(null);
    setLogoFile(null);
    setVideoUrl('');
    setLogoUrl('');
    setVideoMeta({ width: 0, height: 0, duration: 0 });
    setLogoMeta({ width: 0, height: 0 });
    setIsPlaying(false);
    setRenderStatus('idle');
    setDownloadUrl('');
    setRecordedBlob(null);
  };

  // Animation Update Math for live preview & canvas rendering - Pure Helper
  const updateWatermarkPosition = (width, height, wWidth, wHeight, speed, pattern, currentTime, currentPos, currentVel, currentAngle) => {
    let newX = currentPos.x;
    let newY = currentPos.y;
    let newVx = currentVel.x;
    let newVy = currentVel.y;
    let newAngle = currentAngle;

    const currentSpeed = speed * 1.5;

    if (pattern === 'dvd') {
      // Normalize velocity vectors
      if (Math.abs(newVx) !== currentSpeed) {
        newVx = newVx < 0 ? -currentSpeed : currentSpeed;
      }
      if (Math.abs(newVy) !== currentSpeed) {
        newVy = newVy < 0 ? -currentSpeed : currentSpeed;
      }

      newX += newVx;
      newY += newVy;

      // X bounce boundaries
      if (newX <= 0) {
        newX = 0;
        newVx = currentSpeed;
      } else if (newX + wWidth >= width) {
        newX = width - wWidth;
        newVx = -currentSpeed;
      }

      // Y bounce boundaries
      if (newY <= 0) {
        newY = 0;
        newVy = currentSpeed;
      } else if (newY + wHeight >= height) {
        newY = height - wHeight;
        newVy = -currentSpeed;
      }
    } else if (pattern === 'drift') {
      // Smooth drift random walk
      // Slowly alter angle of movement
      newAngle += (Math.random() - 0.5) * 0.15;
      
      newX += Math.cos(newAngle) * currentSpeed;
      newY += Math.sin(newAngle) * currentSpeed;

      // Boundary bouncing for angle drift
      if (newX <= 0) {
        newX = 0;
        newAngle = Math.PI - newAngle;
      } else if (newX + wWidth >= width) {
        newX = width - wWidth;
        newAngle = Math.PI - newAngle;
      }

      if (newY <= 0) {
        newY = 0;
        newAngle = -newAngle;
      } else if (newY + wHeight >= height) {
        newY = height - wHeight;
        newAngle = -newAngle;
      }
    } else if (pattern === 'corner-hop') {
      // Change corner position every 4 seconds
      const corners = [
        { x: wWidth * (wmPaddingRef.current/100), y: wHeight * (wmPaddingRef.current/100) }, // Top Left
        { x: width - wWidth - (width * (wmPaddingRef.current/100)), y: wHeight * (wmPaddingRef.current/100) }, // Top Right
        { x: width - wWidth - (width * (wmPaddingRef.current/100)), y: height - wHeight - (height * (wmPaddingRef.current/100)) }, // Bottom Right
        { x: wWidth * (wmPaddingRef.current/100), y: height - wHeight - (height * (wmPaddingRef.current/100)) } // Bottom Left
      ];
      const index = Math.floor(currentTime / 4) % 4;
      newX = corners[index].x;
      newY = corners[index].y;
    } else if (pattern === 'static') {
      // Custom corner lock
      const paddingX = width * (wmPaddingRef.current / 100);
      const paddingY = height * (wmPaddingRef.current / 100);

      switch (wmCornerRef.current) {
        case 'top-left':
          newX = paddingX;
          newY = paddingY;
          break;
        case 'top-right':
          newX = width - wWidth - paddingX;
          newY = paddingY;
          break;
        case 'bottom-left':
          newX = paddingX;
          newY = height - wHeight - paddingY;
          break;
        case 'bottom-right':
        default:
          newX = width - wWidth - paddingX;
          newY = height - wHeight - paddingY;
          break;
      }
    }

    // Return the updated position and vectors
    return { x: newX, y: newY, vx: newVx, vy: newVy, angle: newAngle };
  };

  // Preview Loop to draw live preview video and watermark on canvas
  const drawPreviewLoop = () => {
    if (!videoRef.current || !previewCanvasRef.current || !logoImgRef.current) return;
    const video = videoRef.current;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Clear and draw active frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Calculate watermark metrics
    const targetW = canvas.width * (wmSizeRef.current / 100);
    const aspect = logoMeta.width > 0 ? logoMeta.height / logoMeta.width : 1;
    const targetH = targetW * aspect;

    // Calculate next position coordinates
    const updated = updateWatermarkPosition(
      canvas.width, 
      canvas.height, 
      targetW, 
      targetH, 
      wmSpeedRef.current, 
      wmPatternRef.current, 
      video.currentTime,
      posRef.current,
      velRef.current,
      driftAngleRef.current
    );

    // Save to refs for accurate real-time updates
    posRef.current = { x: updated.x, y: updated.y };
    velRef.current = { x: updated.vx, y: updated.vy };
    driftAngleRef.current = updated.angle;

    // Save states
    setPos({ x: updated.x, y: updated.y });
    setVel({ x: updated.vx, y: updated.vy });
    setDriftAngle(updated.angle);

    // Draw overlay logo
    ctx.save();
    ctx.globalAlpha = wmOpacityRef.current / 100;
    ctx.drawImage(logoImgRef.current, updated.x, updated.y, targetW, targetH);
    ctx.restore();

    // Track time
    setCurrentTime(video.currentTime);

    // Repeat loop if video playing
    if (!video.paused && !video.ended && !isRendering) {
      requestRef.current = requestAnimationFrame(drawPreviewLoop);
    }
  };

  // Trigger draw preview whenever config changes or video is paused
  useEffect(() => {
    if (videoUrl && logoUrl && !isRendering) {
      // Re-draw once to reflect configuration sliders instantly
      drawPreviewLoop();
    }
  }, [wmSize, wmOpacity, wmSpeed, wmPattern, wmCorner, wmPadding, videoUrl, logoUrl, isRendering]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    } else {
      videoRef.current.loop = true; // Ensure looping for preview mode
      videoRef.current.play().catch(err => {
        if (err.name !== 'AbortError') {
          console.error("Play error:", err);
        }
      });
      setIsPlaying(true);
      requestRef.current = requestAnimationFrame(drawPreviewLoop);
    }
  };

  // Rendering engine synthesis (Web Audio + MediaRecorder + Canvas Loop)
  const startWatermarkRendering = async () => {
    if (!videoRef.current || !logoImgRef.current || isRendering) return;
    
    setIsRendering(true);
    setRenderStatus('recording');
    setRenderProgress(0);
    recordedChunksRef.current = [];
    
    const video = videoRef.current;
    
    // Make sure we stop preview playback loop
    video.pause();
    setIsPlaying(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);

    // Give browser media state machine a tiny moment to settle
    await new Promise(resolve => setTimeout(resolve, 150));

    // Disable loop for accurate recording of a single iteration
    video.loop = false;

    // Set video duration variables
    const duration = video.duration;
    video.currentTime = 0;
    video.muted = false; // Need audio unmuted to capture

    // Setup high-res recording canvas
    const recCanvas = recordCanvasRef.current;
    recCanvas.width = videoMeta.width;
    recCanvas.height = videoMeta.height;
    const recCtx = recCanvas.getContext('2d');

    // Reset watermark vectors for fresh render
    let renderPos = { x: 10, y: 10 };
    let renderVel = { x: wmSpeedRef.current, y: wmSpeedRef.current };
    let renderDriftAngle = Math.PI / 4;

    // Create stream from the high-res Canvas at 30 FPS
    const canvasStream = recCanvas.captureStream(30);
    const outputTracks = [canvasStream.getVideoTracks()[0]];

    // Capture the original Audio Track
    // We check captureStream/mozCaptureStream on video element
    let audioTrack = null;
    try {
      const videoStream = video.captureStream ? video.captureStream() : (video.mozCaptureStream ? video.mozCaptureStream() : null);
      if (videoStream) {
        const audioTracks = videoStream.getAudioTracks();
        if (audioTracks.length > 0) {
          audioTrack = audioTracks[0];
          outputTracks.push(audioTrack);
        }
      }
    } catch (err) {
      console.warn("Could not capture original audio track. Output video might not contain audio.", err);
    }

    // Merge tracks into single stream
    const mixedStream = new MediaStream(outputTracks);

    // Pick compatible MimeType
    let mime = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mime)) {
      mime = 'video/webm;codecs=vp8,opus';
    }
    if (!MediaRecorder.isTypeSupported(mime)) {
      mime = 'video/webm';
    }
    if (!MediaRecorder.isTypeSupported(mime)) {
      mime = 'video/mp4'; // Safari fallback
    }

    const options = { 
      mimeType: mime,
      videoBitsPerSecond: 5000000 // 5 Mbps for pristine quality
    };

    // Instantiate MediaRecorder
    try {
      const recorder = new MediaRecorder(mixedStream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mime.includes('mp4') ? 'video/mp4' : 'video/webm' });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setRenderStatus('complete');
        setIsRendering(false);
        if (videoRef.current) {
          videoRef.current.loop = true; // Restore loop for preview
        }
      };

      // Start recording
      recorder.start();

      // Mute browser speakers playback for preview video during high speed render so it doesn't bother the user
      video.muted = true; 
      
      // Start video playback
      try {
        await video.play();
      } catch (err) {
        if (err.name === 'AbortError') {
          console.warn("Play request was aborted but proceeding with render frame loop...");
          // Try playing again just in case
          try {
            await video.play();
          } catch (retryErr) {
            console.log("Play retry ignored:", retryErr.message);
          }
        } else {
          throw err;
        }
      }

      // Live rendering loop
      const processRenderFrame = () => {
        if (video.paused || video.ended || renderStatus === 'complete') {
          // If video naturally ended, stop recorder
          if (recorder.state !== 'inactive') {
            recorder.stop();
          }
          video.muted = false;
          return;
        }

        // 1. Draw video frame on render canvas
        recCtx.drawImage(video, 0, 0, recCanvas.width, recCanvas.height);

        // 2. Calc watermark metrics
        const targetW = recCanvas.width * (wmSizeRef.current / 100);
        const aspect = logoMeta.width > 0 ? logoMeta.height / logoMeta.width : 1;
        const targetH = targetW * aspect;

        const updated = updateWatermarkPosition(
          recCanvas.width,
          recCanvas.height,
          targetW,
          targetH,
          wmSpeedRef.current,
          wmPatternRef.current,
          video.currentTime,
          renderPos,
          renderVel,
          renderDriftAngle
        );

        renderPos = { x: updated.x, y: updated.y };
        renderVel = { x: updated.vx, y: updated.vy };
        renderDriftAngle = updated.angle;

        // 3. Draw Watermark logo
        recCtx.save();
        recCtx.globalAlpha = wmOpacityRef.current / 100;
        recCtx.drawImage(logoImgRef.current, renderPos.x, renderPos.y, targetW, targetH);
        recCtx.restore();

        // 4. Update progress bar
        const progress = Math.min(Math.round((video.currentTime / duration) * 100), 100);
        setRenderProgress(progress);

        // 5. Loop next frame via setTimeout to avoid requestAnimationFrame throttling in hidden/inactive states
        renderRequestRef.current = setTimeout(processRenderFrame, 1000 / 30);
      };

      // Run loop
      renderRequestRef.current = setTimeout(processRenderFrame, 1000 / 30);

    } catch (e) {
      console.error("Recording setup failed:", e);
      setRenderStatus('error');
      setIsRendering(false);
      video.muted = false;
    }
  };

  // Cancel/Abort rendering midway
  const abortRendering = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (renderRequestRef.current) clearTimeout(renderRequestRef.current);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      videoRef.current.muted = false;
      videoRef.current.loop = true; // Restore loop for preview
    }
    setIsRendering(false);
    setRenderStatus('idle');
    setRenderProgress(0);
  };

  // Helper for generating custom auto-incrementing file download name
  const getDownloadFileName = () => {
    if (!videoFile) return 'watermarked-video.webm';
    const originalName = videoFile.name;
    const lastDot = originalName.lastIndexOf('.');
    const base = lastDot !== -1 ? originalName.substring(0, lastDot) : originalName;
    const ext = recordedBlob?.type?.includes('mp4') ? 'mp4' : 'webm';
    return `${base}-watermarked.${ext}`;
  };

  return (
    <div className="min-h-screen bg-[#fafafb] text-slate-900 pt-20 pb-20 relative">
      {/* Hidden offscreen image used strictly to keep logo reference alive and compute metadata */}
      {logoUrl && (
        <img 
          src={logoUrl} 
          ref={logoImgRef} 
          onLoad={onLogoLoad} 
          style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }} 
          alt="Hidden Logo Anchor"
        />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Breadcrumb back navigation */}
        <Link href="/tools" className="inline-flex items-center text-orange-600 font-bold hover:text-orange-700 transition mb-6 group">
          <ArrowLeft className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition" />
          Back to All Tools
        </Link>

        {/* Decorative dynamic header banner */}
        <div className="bg-slate-950 text-white rounded-3xl p-8 md:p-10 mb-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-10 w-60 h-60 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-3">
                <Sparkles size={12} /> Live Studio
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2">Moving Video Watermark</h1>
              <p className="text-slate-400 text-lg max-w-2xl font-medium">
                Protect your videos with a dynamic bouncing or drifting screensaver logo. Complete local browser rendering ensures 100% privacy with zero data uploads.
              </p>
            </div>
            {videoFile && (
              <button 
                onClick={handleReset}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/10 px-5 py-3 rounded-2xl transition font-bold"
              >
                <RotateCcw size={16} /> Start Over
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Studio Dashboard */}
        {!videoFile ? (
          /* STEP 1: Upload Files */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Video Dropzone */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-[450px]">
              <div>
                <h3 className="text-2xl font-black text-slate-800 mb-2 flex items-center gap-2">
                  <Video className="text-orange-500" /> 1. Upload Video
                </h3>
                <p className="text-slate-500 font-medium mb-6">Select the source MP4, WebM, or MOV video file to be watermarked.</p>
              </div>

              <label className="flex-1 border-4 border-dashed border-slate-200 hover:border-orange-500 rounded-2xl flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-orange-50/20 transition-all duration-300 group">
                <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                <div className="w-20 h-20 bg-white rounded-full shadow-md flex items-center justify-center text-slate-400 group-hover:text-orange-500 group-hover:scale-110 transition-all mb-4">
                  <UploadCloud size={32} />
                </div>
                <span className="font-extrabold text-slate-700 text-lg mb-1">Select Video File</span>
                <span className="text-xs text-slate-400 font-medium">Drag & drop your video anywhere here</span>
              </label>
            </div>

            {/* Logo Dropzone */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-[450px]">
              <div>
                <h3 className="text-2xl font-black text-slate-800 mb-2 flex items-center gap-2">
                  <ImageIcon className="text-orange-500" /> 2. Upload Logo Watermark
                </h3>
                <p className="text-slate-500 font-medium mb-6">Upload a PNG or SVG logo image (preferably with transparent backgrounds).</p>
              </div>

              {logoUrl ? (
                <div className="flex-1 flex flex-col items-center justify-center border border-slate-200 rounded-2xl relative p-6 bg-slate-50 overflow-hidden">
                  <div style={checkerboardStyle} className="w-48 h-48 rounded-xl border border-slate-100 shadow-inner flex items-center justify-center p-4 relative overflow-hidden group">
                    <img 
                      src={logoUrl} 
                      alt="Logo Watermark" 
                      className="max-w-full max-h-full object-contain"
                    />
                    <label className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-sm font-bold gap-2">
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                      <RefreshCw size={20} className="animate-spin-slow" /> Replace Logo
                    </label>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="font-bold text-slate-800 truncate max-w-xs">{logoFile.name}</p>
                    <p className="text-xs text-slate-400 font-semibold uppercase">{logoMeta.width} x {logoMeta.height} px • {(logoFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              ) : (
                <label className="flex-1 border-4 border-dashed border-slate-200 hover:border-orange-500 rounded-2xl flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-orange-50/20 transition-all duration-300 group">
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  <div className="w-20 h-20 bg-white rounded-full shadow-md flex items-center justify-center text-slate-400 group-hover:text-orange-500 group-hover:scale-110 transition-all mb-4">
                    <ImageIcon size={32} />
                  </div>
                  <span className="font-extrabold text-slate-700 text-lg mb-1">Select Logo File</span>
                  <span className="text-xs text-slate-400 font-medium">PNG, SVG, or JPG images supported</span>
                </label>
              )}
            </div>
          </div>
        ) : (
          /* STEP 2: Live Editing Studio Dashboard */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT: Video & Canvas Live Preview (8 Columns) */}
            <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Eye className="text-orange-500" /> Live Studio Render Canvas
                </h3>
                <span className="text-xs font-bold px-3 py-1 rounded bg-slate-100 text-slate-500 uppercase tracking-wider">
                  {videoMeta.width}x{videoMeta.height} px • {videoMeta.duration.toFixed(1)}s
                </span>
              </div>

              {/* High-fidelity Live Render canvas wrapper */}
              <div className="w-full aspect-video bg-slate-950 rounded-2xl relative overflow-hidden flex items-center justify-center border border-slate-900 group shadow-md" ref={containerRef}>
                {/* Hidden HTML5 Video element */}
                <video 
                  src={videoUrl}
                  ref={videoRef}
                  onLoadedMetadata={onVideoMetadata}
                  onTimeUpdate={() => setCurrentTime(videoRef.current ? videoRef.current.currentTime : 0)}
                  style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }}
                  loop
                  playsInline
                  crossOrigin="anonymous"
                />

                {/* Render Frame Canvas */}
                <canvas 
                  ref={previewCanvasRef} 
                  className="max-w-full max-h-full object-contain"
                />

                {/* Overlaid Checkerboard image loaded invisibly for natural pixel size calculations */}
                {!logoUrl && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-white text-center p-6 backdrop-blur-sm">
                    <ImageIcon size={48} className="text-orange-500 mb-4 animate-bounce" />
                    <h4 className="text-lg font-bold mb-1">Watermark Logo Required</h4>
                    <p className="text-xs text-slate-400 max-w-sm mb-4">Please upload your brand logo on the right to preview how it bounces dynamically across the screen.</p>
                    <label className="bg-orange-500 hover:bg-orange-600 px-5 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-orange-500/20 cursor-pointer transition">
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                      Upload Logo Now
                    </label>
                  </div>
                )}

                {/* Control bar inside overlay */}
                <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 text-white p-3 rounded-xl flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm z-20">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={togglePlay}
                      className="w-10 h-10 rounded-lg bg-orange-500 hover:bg-orange-600 flex items-center justify-center transition-colors text-white"
                      disabled={!logoUrl}
                    >
                      {isPlaying ? <Pause size={18} /> : <Play size={18} className="translate-x-0.5" />}
                    </button>
                    <span className="text-xs font-mono">
                      {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')} / {Math.floor(videoMeta.duration / 60)}:{(Math.floor(videoMeta.duration % 60)).toString().padStart(2, '0')}
                    </span>
                  </div>
                  
                  {/* Volume controllers */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.muted = !isMuted;
                          setIsMuted(!isMuted);
                        }
                      }}
                      className="text-slate-400 hover:text-white transition"
                    >
                      {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                    <input 
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : previewVolume}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setPreviewVolume(val);
                        if (videoRef.current) {
                          videoRef.current.volume = val;
                          videoRef.current.muted = false;
                          setIsMuted(false);
                        }
                      }}
                      className="w-16 h-1 rounded-full bg-slate-800 accent-orange-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Rendering Tips Banner */}
              <div className="bg-orange-50/50 rounded-2xl p-4 border border-orange-100 flex gap-3 text-slate-700">
                <Info size={20} className="text-orange-500 shrink-0 mt-0.5" />
                <div className="text-sm leading-relaxed">
                  <span className="font-bold text-orange-950">How it works:</span> Adjust the sliders on the right to control how the logo looks and moves. Once you are satisfied, click <span className="font-bold">"Render & Download"</span>. The tool will compile the bounce animation and your original video sound track together.
                </div>
              </div>
            </div>

            {/* RIGHT: Parameters Control Panel (4 Columns) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Logo preview widget */}
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div style={checkerboardStyle} className="w-14 h-14 rounded-xl border border-slate-100 flex items-center justify-center p-1.5 shrink-0">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <ImageIcon className="text-slate-300" size={24} />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-slate-800 text-sm truncate">{logoFile ? logoFile.name : 'No logo uploaded'}</p>
                    <p className="text-xs text-slate-400 font-semibold">{logoFile ? `${(logoFile.size / 1024).toFixed(1)} KB` : 'Watermark hidden'}</p>
                  </div>
                </div>
                
                <label className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100 px-3 py-2 rounded-lg hover:bg-orange-100 transition cursor-pointer shrink-0">
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  Change
                </label>
              </div>

              {/* Watermark customization panel */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-6">
                <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Sliders className="text-orange-500" size={18} /> Studio Settings
                </h3>

                {/* 1. Size control slider */}
                <div>
                  <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                    <span>Watermark Size</span>
                    <span className="text-orange-600">{wmSize}%</span>
                  </div>
                  <input 
                    type="range"
                    min="5"
                    max="40"
                    value={wmSize}
                    onChange={(e) => setWmSize(parseInt(e.target.value))}
                    className="w-full h-2 rounded-lg bg-slate-100 accent-orange-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                    <span>Small (5%)</span>
                    <span>Large (40%)</span>
                  </div>
                </div>

                {/* 2. Opacity control slider */}
                <div>
                  <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                    <span>Watermark Opacity</span>
                    <span className="text-orange-600">{wmOpacity}%</span>
                  </div>
                  <input 
                    type="range"
                    min="10"
                    max="100"
                    value={wmOpacity}
                    onChange={(e) => setWmOpacity(parseInt(e.target.value))}
                    className="w-full h-2 rounded-lg bg-slate-100 accent-orange-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                    <span>Ghostly (10%)</span>
                    <span>Solid (100%)</span>
                  </div>
                </div>

                {/* 3. Movement style options */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">Movement Pattern</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setWmPattern('dvd')}
                      className={`p-3.5 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                        wmPattern === 'dvd' 
                          ? 'border-orange-500 bg-orange-50/50 text-orange-950 font-bold' 
                          : 'border-slate-200 hover:border-slate-300 text-slate-600 font-medium'
                      }`}
                    >
                      <span className="text-xs">DVD Bounce</span>
                    </button>
                    <button 
                      onClick={() => setWmPattern('drift')}
                      className={`p-3.5 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                        wmPattern === 'drift' 
                          ? 'border-orange-500 bg-orange-50/50 text-orange-950 font-bold' 
                          : 'border-slate-200 hover:border-slate-300 text-slate-600 font-medium'
                      }`}
                    >
                      <span className="text-xs">Smooth Drift</span>
                    </button>
                    <button 
                      onClick={() => setWmPattern('corner-hop')}
                      className={`p-3.5 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                        wmPattern === 'corner-hop' 
                          ? 'border-orange-500 bg-orange-50/50 text-orange-950 font-bold' 
                          : 'border-slate-200 hover:border-slate-300 text-slate-600 font-medium'
                      }`}
                    >
                      <span className="text-xs">Corner Hop</span>
                    </button>
                    <button 
                      onClick={() => setWmPattern('static')}
                      className={`p-3.5 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                        wmPattern === 'static' 
                          ? 'border-orange-500 bg-orange-50/50 text-orange-950 font-bold' 
                          : 'border-slate-200 hover:border-slate-300 text-slate-600 font-medium'
                      }`}
                    >
                      <span className="text-xs">Static Lock</span>
                    </button>
                  </div>
                </div>

                {/* 4. Speed control slider (hidden if static) */}
                {wmPattern !== 'static' && (
                  <div>
                    <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                      <span>Movement Speed</span>
                      <span className="text-orange-600">{wmSpeed}x</span>
                    </div>
                    <input 
                      type="range"
                      min="1"
                      max="10"
                      value={wmSpeed}
                      onChange={(e) => setWmSpeed(parseInt(e.target.value))}
                      className="w-full h-2 rounded-lg bg-slate-100 accent-orange-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                      <span>Slow (1x)</span>
                      <span>Fast (10x)</span>
                    </div>
                  </div>
                )}

                {/* 5. Static Locks options (Only shown if pattern is static) */}
                {wmPattern === 'static' && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Corner</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => (
                          <button
                            key={corner}
                            onClick={() => setWmCorner(corner)}
                            className={`px-3 py-2 rounded-lg text-xs font-bold border transition ${
                              wmCorner === corner 
                                ? 'bg-white border-orange-500 text-orange-600 shadow-sm' 
                                : 'bg-white/50 border-slate-200 hover:bg-white text-slate-600'
                            }`}
                          >
                            {corner.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        <span>Boundary Padding</span>
                        <span className="text-orange-600 font-bold">{wmPadding}%</span>
                      </div>
                      <input 
                        type="range"
                        min="2"
                        max="15"
                        value={wmPadding}
                        onChange={(e) => setWmPadding(parseInt(e.target.value))}
                        className="w-full h-1.5 rounded-lg bg-slate-200 accent-orange-500 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Start compile button */}
              <button 
                onClick={startWatermarkRendering}
                disabled={!logoUrl || isRendering}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-black py-4.5 rounded-2xl transition-all shadow-[0_8px_30px_rgb(248,158,53,0.3)] flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Sparkles size={18} /> Render &amp; Download Video
              </button>
            </div>

          </div>
        )}

        {/* Hidden high-res canvas used strictly for background recording output */}
        <canvas ref={recordCanvasRef} style={{ position: 'absolute', top: '-9999px', left: '-9999px', opacity: 0, pointerEvents: 'none' }} />

        {/* STEP 3: Live Studio Render Monitor modal overlay */}
        <AnimatePresence>
          {isRendering && (
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
                className="bg-white rounded-3xl p-8 max-w-lg w-full border border-slate-100 shadow-2xl text-center flex flex-col items-center gap-6"
              >
                {/* Visual rendering animations */}
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                  <div 
                    className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"
                    style={{ animationDuration: '1.2s' }}
                  ></div>
                  <div className="text-xl font-black text-slate-800">{renderProgress}%</div>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Compiling Video Watermark</h3>
                  <p className="text-slate-500 font-medium max-w-sm text-sm">
                    Please do not close this browser window. We are merging the bouncing logo frame-by-frame and stitching in the original audio.
                  </p>
                </div>

                <div className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left flex flex-col gap-2 font-mono text-xs text-slate-500">
                  <div className="flex justify-between">
                    <span>Target Mime:</span>
                    <span className="font-semibold text-slate-800">{mediaRecorderRef.current?.mimeType || 'Stitching...'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Source Resolution:</span>
                    <span className="font-semibold text-slate-800">{videoMeta.width} x {videoMeta.height} px</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Audio Track:</span>
                    <span className="font-semibold text-green-600 flex items-center gap-1"><Check size={12} /> Embedded</span>
                  </div>
                </div>

                {/* Abort button */}
                <button 
                  onClick={abortRendering}
                  className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold px-6 py-2.5 rounded-xl transition"
                >
                  Cancel Render
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STEP 4: Success & Download Modal Panel */}
        <AnimatePresence>
          {renderStatus === 'complete' && downloadUrl && (
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
                className="bg-white rounded-3xl p-8 max-w-2xl w-full border border-slate-100 shadow-2xl flex flex-col items-center gap-6"
              >
                <div className="w-16 h-16 bg-green-50 border border-green-200 text-green-500 rounded-full flex items-center justify-center shadow-sm">
                  <Check size={32} />
                </div>

                <div className="text-center">
                  <h3 className="text-3xl font-black text-slate-900 mb-2">Video Rendered Successfully!</h3>
                  <p className="text-slate-500 font-medium text-sm max-w-md mx-auto">
                    Your dynamic moving watermark has been fully baked onto the video frames. Download the output locally now.
                  </p>
                </div>

                {/* Output live video preview to double-check */}
                <div className="w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden shadow-inner border border-slate-900 flex items-center justify-center relative">
                  <video 
                    src={downloadUrl}
                    controls
                    className="max-w-full max-h-full object-contain"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                  {/* Download output */}
                  <a 
                    href={downloadUrl}
                    download={getDownloadFileName()}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-base font-black py-4 px-8 rounded-2xl transition shadow-[0_8px_20px_rgb(248,158,53,0.3)] flex justify-center items-center gap-2 text-center"
                  >
                    <Download size={18} /> Download Output
                  </a>
                  
                  {/* Clear state and go back */}
                  <button 
                    onClick={() => {
                      setRenderStatus('idle');
                      setDownloadUrl('');
                      setRecordedBlob(null);
                    }}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-base font-bold py-4 px-8 rounded-2xl transition flex justify-center items-center gap-2"
                  >
                    <RotateCcw size={18} /> Re-configure Watermark
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
