import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  CameraOff,
  Eye,
  Smile,
  Activity,
  ShieldCheck,
  ChevronDown,
  Minimize2,
  Maximize2,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  faceTrackingService,
  FaceTrackingMetrics,
  FaceTrackingMode,
  DEFAULT_FACE_METRICS,
  VideoDeviceOption,
} from './faceTrackingService';

interface CameraFaceTrackerProps {
  onMetricsUpdate: (metrics: FaceTrackingMetrics) => void;
  trackingMode: FaceTrackingMode;
  onChangeTrackingMode: (mode: FaceTrackingMode) => void;
  theme?: 'dark' | 'light';
  isOpen?: boolean;
  isMobile?: boolean;
  isLargeDisplay?: boolean;
}

export const CameraFaceTracker: React.FC<CameraFaceTrackerProps> = ({
  onMetricsUpdate,
  trackingMode,
  onChangeTrackingMode,
  theme = 'dark',
  isMobile = false,
  isLargeDisplay = false,
}) => {
  const isDark = theme === 'dark';
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isActive, setIsActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<FaceTrackingMetrics>(DEFAULT_FACE_METRICS);
  const [isMinimized, setIsMinimized] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<VideoDeviceOption[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);

  // Load available camera devices when tracker is opened or activated
  const refreshDevices = async () => {
    try {
      const devices = await faceTrackingService.getCameraDevices();
      setAvailableDevices(devices);
      if (devices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(devices[0].deviceId);
      }
    } catch (err) {
      console.warn('Could not list cameras:', err);
    }
  };

  useEffect(() => {
    refreshDevices();
  }, []);

  // Handle Enable Camera Click
  const handleStartCamera = async (deviceIdToUse?: string) => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsStarting(true);
    setErrorMessage(null);

    const devId = deviceIdToUse || selectedDeviceId || undefined;
    const res = await faceTrackingService.startTracking(
      videoRef.current,
      canvasRef.current,
      devId,
      (newMetrics) => {
        setMetrics(newMetrics);
        onMetricsUpdate(newMetrics);
      }
    );

    setIsStarting(false);
    if (res.success) {
      setIsActive(true);
      // Re-query devices so friendly names appear once permission is granted
      refreshDevices();
    } else {
      setIsActive(false);
      setErrorMessage(res.error || 'Failed to start camera');
    }
  };

  // Handle Disable Camera
  const handleStopCamera = () => {
    faceTrackingService.stopTracking();
    setIsActive(false);
    setMetrics(DEFAULT_FACE_METRICS);
    onMetricsUpdate(DEFAULT_FACE_METRICS);
  };

  // Handle switching camera device
  const handleSelectDevice = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    setShowDeviceDropdown(false);
    if (isActive) {
      handleStopCamera();
      setTimeout(() => {
        handleStartCamera(deviceId);
      }, 150);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      faceTrackingService.stopTracking();
    };
  }, []);

  return (
    <div
      className={`transition-all duration-300 rounded-2xl border shadow-2xl backdrop-blur-xl pointer-events-auto overflow-hidden ${
        isDark
          ? 'bg-[#060c18]/90 border-cyan-500/30 shadow-cyan-500/10'
          : 'bg-white/95 border-blue-200 shadow-blue-500/10'
      } ${
        isMinimized
          ? isMobile ? 'w-48' : 'w-64'
          : isMobile
          ? 'w-full max-w-[calc(100vw-2rem)]'
          : isLargeDisplay
          ? 'w-96 scale-110 origin-bottom-right'
          : 'w-80 sm:w-88'
      }`}
    >
      {/* Header Bar */}
      <div
        className={`px-3 py-2.5 flex items-center justify-between border-b ${
          isDark ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-gray-50/80'
        } ${isMobile ? 'py-3.5' : ''}`}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <Camera
              className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${
                isActive ? 'text-emerald-400 animate-pulse' : 'text-cyan-400'
              }`}
            />
            {isActive && (
              <span className={`absolute -top-1 -right-1 rounded-full bg-emerald-400 animate-ping ${isMobile ? 'w-2.5 h-2.5' : 'w-2 h-2'}`} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className={`font-semibold tracking-wide ${
                  isDark ? 'text-white' : 'text-gray-900'
                } ${isMobile ? 'text-sm' : 'text-xs'}`}
              >
                Face Tracking
              </span>
              {isActive && (
                <span className={`px-1.5 py-0.5 font-mono font-medium rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 ${isMobile ? 'text-[10px]' : 'text-[9px]'}`}>
                  LIVE
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className={`rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
            } ${isMobile ? 'p-2' : 'p-1'}`}
            title={isMinimized ? 'Expand tracker' : 'Minimize tracker'}
          >
            {isMinimized ? (
              <Maximize2 className={isMobile ? 'w-5 h-5' : 'w-3.5 h-3.5'} />
            ) : (
              <Minimize2 className={isMobile ? 'w-5 h-5' : 'w-3.5 h-3.5'} />
            )}
          </button>
        </div>
      </div>

      {/* Body Area */}
      {!isMinimized && (
        <div className={`space-y-3 ${isMobile ? 'p-4' : 'p-3'}`}>
          {/* Video Preview & Canvas Landmark Overlay Container */}
          <div className={`relative w-full rounded-xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center ${isMobile ? 'aspect-video' : 'aspect-[4/3]'}`}>
            {/* Native Video Element (hidden or styled as background) */}
            <video
              ref={videoRef}
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover -scale-x-100 ${
                isActive ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Landmark Overlay Canvas */}
            <canvas
              ref={canvasRef}
              width={isMobile ? 640 : 320}
              height={isMobile ? 360 : 240}
              className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${
                isActive ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Placeholder state when camera is inactive */}
            {!isActive && (
              <div className="flex flex-col items-center justify-center text-center p-4 z-10 space-y-2">
                <div className={`rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 ${isMobile ? 'p-4' : 'p-3'}`}>
                  <Camera className={isMobile ? 'w-8 h-8' : 'w-6 h-6'} />
                </div>
                <div>
                  <p
                    className={`font-medium ${
                      isDark ? 'text-zinc-300' : 'text-gray-700'
                    } ${isMobile ? 'text-sm' : 'text-xs'}`}
                  >
                    Camera is currently off
                  </p>
                  <p className={`text-zinc-500 max-w-[200px] mt-0.5 ${isMobile ? 'text-xs' : 'text-[10px]'}`}>
                    Click enable below to start real-time avatar head and expression mirroring
                  </p>
                </div>
              </div>
            )}

            {/* Active overlay HUD telemetry on top of video */}
            {isActive && (
              <div className={`absolute left-2 right-2 flex items-center justify-between pointer-events-none z-10 font-mono ${isMobile ? 'top-3 text-xs' : 'top-2 text-[10px]'}`}>
                <span
                  className={`px-2 py-0.5 rounded-md backdrop-blur-md border ${
                    metrics.detected
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {metrics.detected ? 'FACE LOCKED' : 'SEARCHING...'}
                </span>

                <span className="px-2 py-0.5 rounded-md backdrop-blur-md bg-black/70 text-cyan-300 border border-cyan-500/30">
                  {metrics.trackingFps} FPS • {metrics.engine === 'mediapipe' ? 'WASM GPU' : 'OPTICAL'}
                </span>
              </div>
            )}
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className={`p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 ${isMobile ? 'text-xs' : 'text-[11px]'}`}>
              {errorMessage}
            </div>
          )}

          {/* Mode Switcher: Mirror Mode vs Smart Assistant Mode */}
          <div className="space-y-1.5">
            <div className={`flex items-center justify-between ${isMobile ? 'text-xs' : 'text-[11px]'}`}>
              <span className={`font-medium ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
                Tracking Mode
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {trackingMode === 'mirror' ? 'Real-Time Mimic' : 'Conversational Look-At'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10">
              <button
                onClick={() => onChangeTrackingMode('mirror')}
                className={`px-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  trackingMode === 'mirror'
                    ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30 font-semibold'
                    : isDark
                    ? 'text-zinc-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
                } ${isMobile ? 'py-2.5 text-sm' : 'py-1.5 text-xs'}`}
                title="Avatar mirrors your head rotations, smiles, mouth movements, blinks, and eyebrows 1-to-1"
              >
                <Zap className={isMobile ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
                Mirror
              </button>

              <button
                onClick={() => onChangeTrackingMode('smart_assistant')}
                className={`px-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  trackingMode === 'smart_assistant'
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30 font-semibold'
                    : isDark
                    ? 'text-zinc-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
                } ${isMobile ? 'py-2.5 text-sm' : 'py-1.5 text-xs'}`}
                title="Avatar maintains eye contact and responds subtly while keeping autonomous personality and gestures"
              >
                <Sparkles className={isMobile ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
                Smart
              </button>
            </div>
          </div>

          {/* Live Facial Expression Telemetry Pills (Visible when active) */}
          {isActive && (
            <div className={`grid grid-cols-3 gap-1.5 font-mono ${isMobile ? 'text-xs' : 'text-[10px]'}`}>
              <div
                className={`p-1.5 rounded-lg border text-center ${
                  isDark ? 'bg-white/5 border-white/10 text-cyan-300' : 'bg-gray-100 border-gray-200 text-blue-800'
                }`}
              >
                <div className="text-[9px] text-zinc-400 flex items-center justify-center gap-1">
                  <Smile className="w-3 h-3 text-cyan-400" /> Smile
                </div>
                <div className="font-bold">{Math.round(metrics.mouthSmile * 100)}%</div>
              </div>

              <div
                className={`p-1.5 rounded-lg border text-center ${
                  isDark ? 'bg-white/5 border-white/10 text-cyan-300' : 'bg-gray-100 border-gray-200 text-blue-800'
                }`}
              >
                <div className="text-[9px] text-zinc-400 flex items-center justify-center gap-1">
                  <Activity className="w-3 h-3 text-purple-400" /> Mouth
                </div>
                <div className="font-bold">{Math.round(metrics.mouthOpen * 100)}%</div>
              </div>

              <div
                className={`p-1.5 rounded-lg border text-center ${
                  isDark ? 'bg-white/5 border-white/10 text-cyan-300' : 'bg-gray-100 border-gray-200 text-blue-800'
                }`}
              >
                <div className="text-[9px] text-zinc-400 flex items-center justify-center gap-1">
                  <Eye className="w-3 h-3 text-emerald-400" /> Brow/Gaze
                </div>
                <div className="font-bold">
                  {Math.round(metrics.eyebrowRaise * 100)}%
                </div>
              </div>
            </div>
          )}

          {/* Camera Selection Dropdown (if multiple cameras exist) */}
          {availableDevices.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowDeviceDropdown(!showDeviceDropdown)}
                className={`w-full px-2.5 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                  isDark
                    ? 'border-white/10 bg-black/40 text-zinc-300 hover:border-cyan-500/40'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-400'
                } ${isMobile ? 'py-2.5 text-sm' : 'py-1.5 text-xs'}`}
              >
                <span className="truncate">
                  {availableDevices.find((d) => d.deviceId === selectedDeviceId)?.label || 'Select Camera'}
                </span>
                <ChevronDown className={`${isMobile ? 'w-4 h-4' : 'w-3.5 h-3.5'} shrink-0 opacity-60`} />
              </button>

              {showDeviceDropdown && (
                <div
                  className={`absolute bottom-full left-0 right-0 mb-1 rounded-xl border p-1 shadow-2xl z-50 backdrop-blur-xl ${
                    isDark ? 'bg-[#0a1224] border-cyan-500/40 text-white' : 'bg-white border-gray-200 text-gray-900'
                  }`}
                >
                  {availableDevices.map((d) => (
                    <button
                      key={d.deviceId}
                      onClick={() => handleSelectDevice(d.deviceId)}
                      className={`w-full text-left px-2 rounded-lg transition-colors cursor-pointer ${
                        selectedDeviceId === d.deviceId
                          ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                          : isDark
                          ? 'hover:bg-white/10'
                          : 'hover:bg-gray-100'
                      } ${isMobile ? 'py-2.5 text-sm' : 'py-1.5 text-xs'}`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Primary Action Button: Enable / Disable Face Tracking */}
          <div className="flex gap-2">
            {!isActive ? (
              <button
                onClick={() => handleStartCamera()}
                disabled={isStarting}
                className={`flex-1 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-bold tracking-wide shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${isMobile ? 'py-3.5 text-sm' : 'py-2.5 text-xs'}`}
              >
                {isStarting ? (
                  <>
                    <RefreshCw className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} animate-spin text-black`} />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Camera className={isMobile ? 'w-5 h-5' : 'w-4 h-4'} />
                    Enable Face Tracking
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleStopCamera}
                className={`flex-1 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${isMobile ? 'py-3 text-sm' : 'py-2 text-xs'}`}
              >
                <CameraOff className={isMobile ? 'w-5 h-5' : 'w-4 h-4'} />
                Stop Tracking
              </button>
            )}
          </div>

          {/* Privacy & Security Guarantee Badge */}
          <div className={`pt-1 flex items-center justify-center gap-1.5 text-zinc-500 text-center ${isMobile ? 'text-xs' : 'text-[10px]'}`}>
            <ShieldCheck className={`${isMobile ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-emerald-400 shrink-0`} />
            <span>100% on-device vision processing</span>
          </div>
        </div>
      )}
    </div>
  );
};
