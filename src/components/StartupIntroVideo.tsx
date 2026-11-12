import React, { useState, useEffect, useRef } from 'react';
import { Play, Volume2, VolumeX, SkipForward, Film, Maximize, Minimize, Shield } from 'lucide-react';

interface StartupIntroVideoProps {
  onComplete: () => void;
  videoSrc?: string;
  alternateSrc?: string;
}

export const StartupIntroVideo: React.FC<StartupIntroVideoProps> = ({
  onComplete,
  videoSrc = '/assets/aistudio/presenting_4ce0e4b3.mp4',
  alternateSrc = '/videos/ishai-intro.mp4',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // Unmuted by default as requested
  const [hasError, setHasError] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const requestFullscreenMode = () => {
    try {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        const elem = document.documentElement as any;
        if (elem.requestFullscreen) {
          elem.requestFullscreen().catch(() => {});
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
          elem.msRequestFullscreen();
        }
      }
    } catch {}
  };

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        requestFullscreenMode();
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch {}
  };

  // Check reduced motion preference
  useEffect(() => {
    try {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mediaQuery.matches) {
        onComplete();
        return;
      }
    } catch {}
  }, [onComplete]);

  // Track fullscreen state
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  const finishIntro = () => {
    if (isFadingOut) return;
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  const handleVideoEnded = () => {
    finishIntro();
  };

  const handleVideoError = (e: any) => {
    console.warn('Startup intro video playback note:', e);
    setHasError(true);
    setTimeout(() => {
      finishIntro();
    }, 1200);
  };

  const handleSkip = () => {
    requestFullscreenMode();
    if (videoRef.current) {
      videoRef.current.pause();
    }
    finishIntro();
  };

  const toggleMute = () => {
    requestFullscreenMode();
    if (videoRef.current) {
      const newMuted = !videoRef.current.muted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  };

  const handleContainerClick = () => {
    requestFullscreenMode();
    if (videoRef.current) {
      if (videoRef.current.muted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      }
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => setIsPaused(false)).catch(() => {});
      }
    }
  };

  // Attempt unmuted autoplay safely on mount with automatic gesture unmute fallback
  useEffect(() => {
    requestFullscreenMode();

    const vid = videoRef.current;
    if (vid) {
      vid.muted = false;
      setIsMuted(false);
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Autoplay with audio blocked by browser policy, unmuting on first gesture:', err);
          // If browser policy requires gesture for audio, mute temporarily to start video
          vid.muted = true;
          setIsMuted(true);
          vid.play().then(() => setIsPaused(false)).catch(() => setIsPaused(true));
        });
      }
    }

    // Auto unmute & auto fullscreen on first user gesture anywhere
    const autoGestureHandler = () => {
      requestFullscreenMode();
      if (videoRef.current) {
        videoRef.current.muted = false;
        setIsMuted(false);
        if (videoRef.current.paused) {
          videoRef.current.play().then(() => setIsPaused(false)).catch(() => {});
        }
      }
      window.removeEventListener('click', autoGestureHandler);
      window.removeEventListener('touchstart', autoGestureHandler);
      window.removeEventListener('keydown', autoGestureHandler);
    };

    window.addEventListener('click', autoGestureHandler, { once: true });
    window.addEventListener('touchstart', autoGestureHandler, { once: true });
    window.addEventListener('keydown', autoGestureHandler, { once: true });

    const maxSafetyTimer = setTimeout(() => {
      finishIntro();
    }, 14000);

    return () => {
      clearTimeout(maxSafetyTimer);
      window.removeEventListener('click', autoGestureHandler);
      window.removeEventListener('touchstart', autoGestureHandler);
      window.removeEventListener('keydown', autoGestureHandler);
    };
  }, []);

  return (
    <div
      onClick={handleContainerClick}
      className={`fixed inset-0 z-[99999] bg-black flex items-center justify-center overflow-hidden transition-opacity duration-500 select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-label="ISHAI Cinematic Startup Intro"
    >
      {/* Background ambient subtle glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/20 via-transparent to-violet-950/20 pointer-events-none" />

      {/* Cinematic Video Player */}
      {!hasError ? (
        <video
          ref={videoRef}
          autoPlay
          muted={isMuted}
          playsInline
          onEnded={handleVideoEnded}
          onError={handleVideoError}
          className="w-full h-full object-contain max-w-full max-h-full"
        >
          <source src={videoSrc} type="video/mp4" />
          <source src={alternateSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 animate-pulse">
            <Film className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">
            ISHAI OS
          </h2>
          <p className="text-xs text-zinc-400 font-mono">Initializing System Workspace...</p>
        </div>
      )}

      {/* 🛡️ BRANDING SHIELD OVERLAYS: COMPLETELY COVERS ANY GEMINI WATERMARK / SIGN */}
      {/* Bottom Right Brand Shield Cover */}
      <div className="absolute bottom-4 right-4 z-30 pointer-events-auto bg-black border-2 border-cyan-400/90 rounded-xl px-4 py-2 shadow-[0_0_25px_rgba(6,182,212,0.8)] flex items-center gap-2 backdrop-blur-xl">
        <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(6,182,212,1)]" />
        <div className="flex flex-col">
          <span className="text-[11px] font-mono font-extrabold tracking-widest text-cyan-300 uppercase leading-none">
            ISHAI OS • CORE ENGINE
          </span>
          <span className="text-[9px] font-mono font-bold text-cyan-400/80 tracking-tight">
            EMBODIED 3D HOLOGRAPHIC AI
          </span>
        </div>
      </div>

      {/* Top Right Brand Shield Cover */}
      <div className="absolute top-4 right-4 z-30 pointer-events-auto bg-black border border-cyan-500/80 rounded-lg px-3 py-1.5 shadow-[0_0_20px_rgba(6,182,212,0.6)] flex items-center gap-2 backdrop-blur-xl">
        <Shield className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-[10px] font-mono font-extrabold tracking-widest text-cyan-200 uppercase">
          ISHAI CINEMATIC v25.0
        </span>
      </div>

      {/* Top Header Branding Badge */}
      <div className="absolute top-6 left-6 z-10 flex items-center gap-2 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        <span className="text-xs font-mono font-bold tracking-widest text-cyan-400/80 uppercase">
          ISHAI OS • CINEMATIC STARTUP
        </span>
      </div>

      {/* Fullscreen & Sound Controls */}
      <div className="absolute bottom-6 left-6 z-20 flex items-center gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          className={`px-3.5 py-2 rounded-xl border font-mono text-xs flex items-center gap-2 backdrop-blur-md transition-all shadow-lg cursor-pointer ${
            !isMuted 
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold shadow-[0_0_15px_rgba(6,182,212,0.5)]' 
              : 'bg-black/60 border-cyan-500/30 text-zinc-400 hover:text-cyan-300'
          }`}
          title={isMuted ? 'Unmute Video Audio' : 'Mute Video Audio'}
        >
          {!isMuted ? <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" /> : <VolumeX className="w-4 h-4 text-zinc-400" />}
          <span className="text-[11px] font-semibold">{!isMuted ? 'AUDIO ACTIVE' : 'UNMUTE AUDIO'}</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFullscreen();
          }}
          className="px-3.5 py-2 rounded-xl bg-black/60 hover:bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono text-xs flex items-center gap-2 backdrop-blur-md transition-all shadow-lg cursor-pointer"
          title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
        >
          {isFullscreen ? <Minimize className="w-4 h-4 text-cyan-400" /> : <Maximize className="w-4 h-4 text-cyan-400" />}
          <span className="text-[11px] font-semibold">{isFullscreen ? 'EXIT FULL' : 'FULL SCREEN'}</span>
        </button>

        {isPaused && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              requestFullscreenMode();
              if (videoRef.current) {
                videoRef.current.play();
                setIsPaused(false);
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-200 font-mono text-xs flex items-center gap-2 backdrop-blur-md transition-all shadow-lg cursor-pointer animate-pulse"
          >
            <Play className="w-4 h-4 text-cyan-300" />
            <span className="text-[11px] font-semibold">PLAY INTRO</span>
          </button>
        )}
      </div>

      {/* Elegant Skip Intro Button */}
      <div className="absolute bottom-20 right-4 z-20 sm:bottom-6 sm:right-64">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSkip();
          }}
          className="group px-4 py-2 rounded-xl bg-black/80 hover:bg-cyan-500/20 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 hover:text-white font-mono text-xs tracking-wider flex items-center gap-2 backdrop-blur-md transition-all shadow-xl shadow-cyan-500/10 cursor-pointer active:scale-95"
          title="Skip intro video and enter ISHAI immediately"
        >
          <span className="font-bold">SKIP INTRO</span>
          <SkipForward className="w-4 h-4 group-hover:translate-x-0.5 transition-transform text-cyan-400" />
        </button>
      </div>
    </div>
  );
};
