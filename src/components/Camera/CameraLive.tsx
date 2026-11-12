import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  RefreshCcw, 
  Save, 
  Trash2, 
  Upload, 
  Timer, 
  Zap, 
  ZapOff, 
  Check, 
  AlertCircle, 
  Loader2, 
  FlipHorizontal, 
  Sliders, 
  Layers, 
  ExternalLink,
  Sparkles,
  ArrowRight,
  Maximize2
} from 'lucide-react';
import { CameraService, CameraPhoto } from '../../services/CameraService';
import { soundEngine } from '../../utils/audio';
import { UserProfile } from '../../../server/authService';
import { ImageEditor } from './ImageEditor';

interface CameraLiveProps {
  onPhotoSaved: (photo: CameraPhoto) => void;
  onLog: (msg: string, tag?: string) => void;
  currentUser?: UserProfile | null;
  onOpenGallery?: () => void;
  onOpenVault?: () => void;
  recentPhotos?: CameraPhoto[];
}

export const CameraLive: React.FC<CameraLiveProps> = ({
  onPhotoSaved,
  onLog,
  currentUser,
  onOpenGallery,
  onOpenVault,
  recentPhotos = [],
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [useTimer, setUseTimer] = useState(false);

  // Capture & Auto-save states
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedPhoto, setLastSavedPhoto] = useState<CameraPhoto | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [capturedBlobData, setCapturedBlobData] = useState<{ blob: Blob; dataUrl: string; name: string } | null>(null);

  // Active filter adjustments
  const [filters, setFilters] = useState<CameraPhoto['filters']>({
    brightness: 100,
    contrast: 100,
    grayscale: false,
    sepia: false,
    hueRotate: 0,
  });
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);

  // Active preview image modal
  const [previewingPhoto, setPreviewingPhoto] = useState<CameraPhoto | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    try {
      stopCamera();
      setError(null);
      setSaveError(null);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch((e) => console.warn('Video play interrupted:', e));
      }
      onLog(`Optical capture unit initialized in ${facingMode} mode.`, 'SYSTEM');
    } catch (err: any) {
      console.error('Camera init error:', err);
      const msg = err.name === 'NotAllowedError'
        ? 'Camera permission denied. Please enable camera access in your browser.'
        : 'Failed to access camera device. Ensure camera is not locked by another application.';
      setError(msg);
      onLog(`Camera initialization failed: ${err.message}`, 'ERROR');
    }
  }, [facingMode, onLog, stopCamera]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  /**
   * AUTOMATIC ONE-CLICK PHOTO SAVE:
   * Takes the captured frame and immediately saves it to storage and AI Vault -> Photos.
   */
  const executeAutoSave = async (blob: Blob, dataUrl: string, defaultName: string) => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      onLog(`Auto-saving photo "${defaultName}" to AI Vault → Photos...`, 'DATABASE');

      const metadata: Partial<CameraPhoto> = {
        width: canvasRef.current?.width || 1920,
        height: canvasRef.current?.height || 1080,
        filters,
      };

      // Directly upload and save to storage & AI Vault -> Photos
      const savedPhoto = await CameraService.uploadPhoto(
        blob,
        defaultName,
        metadata,
        true, // syncToVault = true
        currentUser?.uid
      );

      soundEngine.playSuccess();
      setLastSavedPhoto(savedPhoto);
      setSaveSuccess(true);
      onPhotoSaved(savedPhoto);
      onLog(`✓ Photo "${savedPhoto.name}" successfully saved in AI Vault → Photos.`, 'DATABASE');

      // Auto-hide success overlay after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3500);
    } catch (err: any) {
      console.error('Auto-save error:', err);
      soundEngine.playAlertBeep();
      const errorMsg = err?.message || 'Failed to complete auto-save to AI Vault.';
      setSaveError(errorMsg);
      onLog(`Auto-save failed: ${errorMsg}`, 'ERROR');
    } finally {
      setIsSaving(false);
      setIsCapturing(false);
    }
  };

  /**
   * Capture photo from the live video feed
   */
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || isCapturing || isSaving) return;

    setIsCapturing(true);
    soundEngine.playClick();

    // Flash animation effect
    if (flash) {
      document.body.classList.add('brightness-200');
      setTimeout(() => document.body.classList.remove('brightness-200'), 120);
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const defaultName = `photo_${Date.now()}.jpg`;

      // Convert dataURL to Blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      setCapturedBlobData({ blob, dataUrl, name: defaultName });

      // TRIGGER AUTOMATIC SAVE TO AI VAULT IMMEDIATELY
      await executeAutoSave(blob, dataUrl, defaultName);
    } else {
      setIsCapturing(false);
    }
  };

  /**
   * Handle Capture click with optional self-timer
   */
  const handleCaptureClick = () => {
    if (isCapturing || isSaving || countdown !== null) return;

    if (useTimer) {
      setCountdown(3);
      const timerInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timerInterval);
            capturePhoto();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      capturePhoto();
    }
  };

  /**
   * Retry failed save
   */
  const handleRetrySave = () => {
    if (capturedBlobData) {
      executeAutoSave(capturedBlobData.blob, capturedBlobData.dataUrl, capturedBlobData.name);
    }
  };

  /**
   * File upload fallback
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCapturing(true);
    try {
      const defaultName = file.name || `import_${Date.now()}.jpg`;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string;
        setCapturedBlobData({ blob: file, dataUrl, name: defaultName });
        await executeAutoSave(file, dataUrl, defaultName);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setSaveError(err?.message || 'File import failed.');
      setIsCapturing(false);
    }
  };

  const getFilterStyle = () => {
    if (!filters) return {};
    return {
      filter: `
        brightness(${filters.brightness ?? 100}%) 
        contrast(${filters.contrast ?? 100}%) 
        grayscale(${filters.grayscale ? 100 : 0}%) 
        sepia(${filters.sepia ? 100 : 0}%) 
        hue-rotate(${filters.hueRotate ?? 0}deg)
      `,
    };
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between bg-black overflow-hidden select-none font-mono">
      {/* ===================================================================== */}
      {/* 1. TOP STATUS & HUD CONTROL TOOLBAR (z-40) */}
      {/* ===================================================================== */}
      <div className="absolute top-3 left-4 right-4 z-40 flex items-center justify-between pointer-events-auto">
        {/* Left Telemetry */}
        <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-emerald-500/30 shadow-lg shadow-black/80">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-black text-emerald-400 tracking-wider uppercase">
            LIVE OPTICS
          </span>
          <span className="text-[10px] text-zinc-500 font-bold hidden sm:inline">
            | AUTO-SAVE TO VAULT ACTIVE
          </span>
        </div>

        {/* Right Camera Actions */}
        <div className="flex items-center gap-2">
          {/* Flash Toggle */}
          <button
            onClick={() => {
              soundEngine.playClick();
              setFlash(!flash);
            }}
            className={`p-2.5 rounded-full transition-all border backdrop-blur-md cursor-pointer ${
              flash
                ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.6)]'
                : 'bg-black/70 text-emerald-400 border-emerald-500/30 hover:border-emerald-400'
            }`}
            title="Toggle Flash"
          >
            {flash ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
          </button>

          {/* 3s Timer Toggle */}
          <button
            onClick={() => {
              soundEngine.playClick();
              setUseTimer(!useTimer);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border backdrop-blur-md flex items-center gap-1.5 cursor-pointer ${
              useTimer
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]'
                : 'bg-black/70 text-emerald-400 border-emerald-500/30 hover:border-emerald-400'
            }`}
            title="3-Second Self Timer"
          >
            <Timer className="w-3.5 h-3.5" />
            <span className="text-[10px]">3S TIMER</span>
          </button>

          {/* Front / Rear Camera Flip */}
          <button
            onClick={() => {
              soundEngine.playClick();
              setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
            }}
            className="p-2.5 rounded-full bg-black/70 text-emerald-400 border border-emerald-500/30 hover:border-emerald-400 transition-all backdrop-blur-md active:rotate-180 duration-500 cursor-pointer"
            title="Flip Camera (Front/Back)"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. MAIN VIEWFINDER & LIVE VIDEO FEED (z-10) */}
      {/* ===================================================================== */}
      <div className="relative w-full flex-1 flex items-center justify-center p-2 sm:p-4 min-h-0">
        <div className="relative w-full h-full max-w-4xl max-h-[82vh] bg-zinc-950 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-emerald-500/20 shadow-[0_0_40px_rgba(0,0,0,0.9)] flex items-center justify-center group">
          {error ? (
            <div className="m-auto max-w-md w-full p-8 text-center bg-red-950/40 border border-red-500/40 rounded-3xl z-20">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-black text-white mb-2 tracking-tight uppercase">
                OPTICS OFFLINE
              </h3>
              <p className="text-xs text-red-300 mb-6 font-bold leading-relaxed">{error}</p>
              <button
                onClick={startCamera}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black text-xs transition-all active:scale-95 cursor-pointer"
              >
                RE-INITIALIZE CAMERA
              </button>
            </div>
          ) : (
            <>
              {/* The Live Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={getFilterStyle()}
                className={`w-full h-full object-cover z-10 ${
                  facingMode === 'user' ? 'scale-x-[-1]' : ''
                }`}
              />

              {/* Viewfinder Target Reticle / Rule-of-Thirds Grid */}
              <div className="absolute inset-0 pointer-events-none z-20 grid grid-cols-3 grid-rows-3 opacity-25">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="border border-emerald-500/30" />
                ))}
              </div>

              {/* Target Focus Reticle in Center */}
              <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                <div className="w-24 h-24 border border-emerald-400/40 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-emerald-400/60" />
                </div>
              </div>

              {/* 3s Countdown Animation Overlay (z-50) */}
              {countdown !== null && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-none">
                  <span className="text-8xl sm:text-9xl font-black text-white animate-ping drop-shadow-[0_0_30px_rgba(16,185,129,0.8)]">
                    {countdown}
                  </span>
                </div>
              )}
            </>
          )}

          {/* =================================================================== */}
          {/* 3. AUTO-SAVING IN PROGRESS BANNER (z-50) */}
          {/* =================================================================== */}
          {isSaving && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6 text-center animate-in fade-in duration-300">
              <div className="relative mb-6">
                <Loader2 className="w-16 h-16 text-emerald-400 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Save className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
              <h3 className="text-sm sm:text-base font-black text-emerald-300 tracking-wider uppercase mb-2">
                AUTOMATICALLY SAVING PHOTO...
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm">
                Encoding optical frame and committing directly to <strong className="text-emerald-400">AI Vault → Photos</strong>.
              </p>
            </div>
          )}

          {/* =================================================================== */}
          {/* 4. AUTO-SAVE SUCCESS BANNER WITH QUICK LAUNCH (z-50) */}
          {/* =================================================================== */}
          {saveSuccess && lastSavedPhoto && !isSaving && (
            <div className="absolute top-16 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-emerald-950/95 border-2 border-emerald-400 p-4 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.4)] backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-emerald-500/50 bg-black shrink-0">
                  <img
                    src={lastSavedPhoto.url}
                    alt={lastSavedPhoto.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-black">
                    <Check className="w-4 h-4 stroke-[3px]" />
                    <span>SAVED TO AI VAULT → PHOTOS</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 truncate mt-0.5">
                    {lastSavedPhoto.name}
                  </p>
                  <p className="text-[9px] text-emerald-500/80 font-bold uppercase mt-0.5">
                    Persistent Cloud & Local Storage Confirmed
                  </p>
                </div>
              </div>

              {/* Action buttons on success */}
              <div className="mt-3 pt-3 border-t border-emerald-800/60 flex items-center justify-between gap-2">
                {onOpenVault && (
                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      onOpenVault();
                    }}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-black py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)] cursor-pointer"
                  >
                    <span>OPEN IN AI VAULT</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {onOpenGallery && (
                  <button
                    onClick={() => {
                      soundEngine.playClick();
                      onOpenGallery();
                    }}
                    className="bg-black hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700 text-[11px] font-bold py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
                  >
                    VIEW GALLERY
                  </button>
                )}
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* 5. AUTO-SAVE FAILED ALERT WITH RETRY BUTTON (z-50) */}
          {/* =================================================================== */}
          {saveError && !isSaving && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6 text-center animate-in zoom-in duration-200">
              <div className="w-14 h-14 rounded-2xl bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400 mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-sm sm:text-base font-black text-red-300 tracking-wider uppercase mb-1">
                PHOTO SAVE FAILED
              </h3>
              <p className="text-xs text-red-400/90 max-w-sm mb-6 leading-relaxed">
                {saveError}
              </p>

              <div className="flex items-center gap-3 w-full max-w-xs">
                <button
                  onClick={() => {
                    soundEngine.playClick();
                    setSaveError(null);
                    setIsCapturing(false);
                  }}
                  className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  DISCARD
                </button>
                <button
                  onClick={handleRetrySave}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/30"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  <span>RETRY SAVE</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 6. BOTTOM ACTION BAR: CAPTURE BUTTON & CONTROLS (z-40) */}
      {/* ===================================================================== */}
      <div className="w-full max-w-4xl px-4 pb-4 pt-1 flex flex-col items-center gap-3 z-40 pointer-events-auto shrink-0">
        {/* The Capture Controls Strip */}
        <div className="w-full flex items-center justify-between px-2 sm:px-8">
          {/* Upload Photo from device button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isSaving || isCapturing}
            className="w-12 h-12 rounded-full bg-black/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center transition-all hover:bg-emerald-500 hover:text-black hover:scale-105 active:scale-95 disabled:opacity-40 cursor-pointer shadow-lg"
            title="Upload Photo to AI Vault"
          >
            <Upload className="w-5 h-5" />
          </button>

          {/* MAIN SHUTTER CAPTURE BUTTON */}
          <div className="flex flex-col items-center">
            <button
              onClick={handleCaptureClick}
              disabled={isSaving || isCapturing}
              className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-full border-4 border-emerald-400 bg-white/10 backdrop-blur-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50 group cursor-pointer shadow-[0_0_25px_rgba(16,185,129,0.5)]"
              title="Click to Capture Photo (Auto-Saves to AI Vault)"
            >
              {isSaving ? (
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-emerald-500 flex items-center justify-center text-black">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white group-hover:bg-emerald-400 transition-colors flex items-center justify-center shadow-inner">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-black/10 flex items-center justify-center">
                    <Camera className="w-6 h-6 text-black" />
                  </div>
                </div>
              )}
            </button>
            <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider mt-1.5">
              {isSaving ? 'SAVING...' : 'CAPTURE & SAVE'}
            </span>
          </div>

          {/* Quick Gallery Switch Button */}
          {onOpenGallery ? (
            <button
              onClick={() => {
                soundEngine.playClick();
                onOpenGallery();
              }}
              className="w-12 h-12 rounded-full bg-black/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center transition-all hover:bg-emerald-500 hover:text-black hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
              title="View Photos Gallery"
            >
              <Layers className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-12 h-12" />
          )}
        </div>

        {/* =================================================================== */}
        {/* 7. RECENT PHOTOS FILMSTRIP AT BOTTOM (z-40) */}
        {/* =================================================================== */}
        {recentPhotos.length > 0 && (
          <div className="w-full bg-[#05080c]/90 border border-emerald-950 rounded-xl p-2 flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] text-emerald-500/80 font-black uppercase whitespace-nowrap pl-1 pr-2">
              RECENT CAPTURES:
            </span>
            <div className="flex items-center gap-2">
              {recentPhotos.slice(0, 10).map((p) => (
                <div
                  key={p.id}
                  onClick={() => setPreviewingPhoto(p)}
                  className="relative w-12 h-12 rounded-lg overflow-hidden border border-emerald-500/30 hover:border-emerald-400 cursor-pointer shrink-0 transition-transform hover:scale-105 group bg-black"
                  title={`${p.name} (Click to preview)`}
                >
                  <img
                    src={p.url}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Maximize2 className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              ))}
            </div>

            {onOpenVault && (
              <button
                onClick={() => {
                  soundEngine.playClick();
                  onOpenVault();
                }}
                className="ml-auto text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 whitespace-nowrap px-2 py-1 rounded border border-emerald-800/80 hover:bg-emerald-950/60 transition-colors cursor-pointer"
              >
                <span>ALL VAULT PHOTOS</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Hidden file input & Canvas for frame processing */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* ===================================================================== */}
      {/* 8. FULLSCREEN PREVIEW LIGHTBOX MODAL (z-[100]) */}
      {/* ===================================================================== */}
      {previewingPhoto && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-[88vh] flex flex-col bg-[#05080c] border border-emerald-500/60 rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-emerald-950 bg-black/40">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-xs text-emerald-300 truncate max-w-xs">
                  {previewingPhoto.name}
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded uppercase font-bold">
                  AI VAULT PHOTO
                </span>
              </div>
              <button
                onClick={() => setPreviewingPhoto(null)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                ✕ CLOSE
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex items-center justify-center p-4 bg-black/60">
              <img
                src={previewingPhoto.url}
                alt={previewingPhoto.name}
                className="max-w-full max-h-[65vh] object-contain rounded-xl border border-emerald-900/50"
              />
            </div>

            <div className="p-4 border-t border-emerald-950 bg-black/40 flex items-center justify-between text-xs">
              <span className="text-zinc-500 text-[10px]">
                Captured: {new Date(previewingPhoto.createdAt).toLocaleString()}
              </span>
              <div className="flex items-center gap-2">
                {onOpenVault && (
                  <button
                    onClick={() => {
                      setPreviewingPhoto(null);
                      onOpenVault();
                    }}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>VIEW IN AI VAULT → PHOTOS</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
