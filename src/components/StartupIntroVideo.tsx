import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Volume2, VolumeX, SkipForward, Film, Maximize, Minimize, Sparkles, Loader2 } from 'lucide-react';

interface StartupIntroVideoProps {
  onComplete: () => void;
  videoSrc?: string;
  alternateSrc?: string;
}

export const StartupIntroVideo: React.FC<StartupIntroVideoProps> = ({
  onComplete,
  videoSrc = '/videos/ishai-intro.mp4',
  alternateSrc = '/assets/aistudio/presenting_4ce0e4b3.mp4',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const completedRef = useRef(false);
  const triedAlternateRef = useRef(false);

  const [activeSrc, setActiveSrc] = useState<string>(videoSrc);
  const [isFadingOut, setIsFadingOut] = useState(false);
  // Start muted by default for strict autoplay compliance on iOS Safari, Android Chrome, Desktop & Smartboards
  const [isMuted, setIsMuted] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [showTapToPlay, setShowTapToPlay] = useState(false);
  const [showUnmuteHint, setShowUnmuteHint] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const finishIntro = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsFadingOut(true);
    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch {}
    }
    setTimeout(() => {
      onComplete();
    }, 450);
  }, [onComplete]);

  // Strictly user-initiated Fullscreen Handler (Desktop, Chrome, Smartboards, iOS Safari)
  const toggleFullscreen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const doc = document as any;
      const elem = document.documentElement as any;

      if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
        if (elem.requestFullscreen) {
          elem.requestFullscreen().catch(() => {});
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
          elem.msRequestFullscreen();
        } else if (videoRef.current && (videoRef.current as any).webkitEnterFullscreen) {
          (videoRef.current as any).webkitEnterFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (doc.exitFullscreen) {
          doc.exitFullscreen().catch(() => {});
        } else if (doc.webkitExitFullscreen) {
          doc.webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch {}
  };

  useEffect(() => {
    const handleFsChange = () => {
      const doc = document as any;
      setIsFullscreen(!!(doc.fullscreenElement || doc.webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  // Safe start playback routine with muted autoplay fallback and manual Play overlay if blocked
  const attemptPlay = useCallback(async (withSound = false) => {
    const vid = videoRef.current;
    if (!vid || completedRef.current) return;

    try {
      vid.defaultMuted = !withSound;
      vid.muted = !withSound;
      if (withSound) {
        vid.volume = 1.0;
      }
      setIsMuted(!withSound);

      const playPromise = vid.play();
      if (playPromise !== undefined) {
        await playPromise;
        setIsPlaying(true);
        setShowTapToPlay(false);
        if (withSound) {
          setShowUnmuteHint(false);
        }
      }
    } catch (err: any) {
      if (withSound) {
        console.warn('Audio autoplay deferred by browser policy; trying muted autoplay:', err?.message || err);
      }
      try {
        vid.muted = true;
        vid.defaultMuted = true;
        setIsMuted(true);
        const secondPromise = vid.play();
        if (secondPromise !== undefined) {
          await secondPromise;
          setIsPlaying(true);
          setShowTapToPlay(false);
          setShowUnmuteHint(true);
        }
      } catch (mutedErr) {
        console.warn('Muted autoplay blocked, showing manual Play button:', mutedErr);
        setIsPlaying(false);
        setIsBuffering(false);
        setShowTapToPlay(true);
      }
    }
  }, []);

  // On mount: configure cross-device inline playback attributes and begin muted autoplay (NO fixed timeout!)
  useEffect(() => {
    const vid = videoRef.current;
    if (vid) {
      vid.setAttribute('playsinline', 'true');
      vid.setAttribute('webkit-playsinline', 'true');
      vid.setAttribute('x5-playsinline', 'true');
      vid.setAttribute('x5-video-player-type', 'h5');
      vid.muted = true;
      vid.defaultMuted = true;
    }

    attemptPlay(false);
  }, [attemptPlay]);

  // Tap screen unmutes audio or starts playback if paused
  const handleScreenTouch = () => {
    const vid = videoRef.current;
    if (!vid || hasError) return;

    if (vid.paused) {
      attemptPlay(true);
      return;
    }

    if (vid.muted) {
      vid.muted = false;
      vid.volume = 1.0;
      setIsMuted(false);
      setShowUnmuteHint(false);
    }
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const vid = videoRef.current;
    if (!vid) return;

    const nextMuted = !vid.muted;
    vid.muted = nextMuted;
    if (!nextMuted) {
      vid.volume = 1.0;
      setShowUnmuteHint(false);
      if (vid.paused) {
        attemptPlay(true);
      }
    }
    setIsMuted(nextMuted);
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    finishIntro();
  };

  const handleVideoError = () => {
    if (!triedAlternateRef.current && alternateSrc && activeSrc !== alternateSrc) {
      console.warn(`Primary intro video (${activeSrc}) failed to load; falling back to ${alternateSrc}`);
      triedAlternateRef.current = true;
      setIsBuffering(true);
      setActiveSrc(alternateSrc);
      setTimeout(() => {
        const vid = videoRef.current;
        if (vid) {
          try {
            vid.load();
            attemptPlay(false);
          } catch {}
        }
      }, 50);
      return;
    }

    console.error('All intro video sources failed to load.');
    setIsBuffering(false);
    setHasError(true);
  };

  return (
    <div
      onClick={handleScreenTouch}
      className={`fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center overflow-hidden transition-opacity duration-500 select-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-label="ISHAI Cinematic Startup Intro"
    >
      {/* Background ambient subtle glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/20 via-transparent to-violet-950/20 pointer-events-none" />

      {/* Cinematic Video Player */}
      {!hasError ? (
        <video
          key={activeSrc}
          ref={videoRef}
          src={activeSrc}
          autoPlay
          muted={isMuted}
          playsInline
          preload="auto"
          onLoadStart={() => setIsBuffering(true)}
          onLoadedData={() => setIsBuffering(false)}
          onCanPlay={() => setIsBuffering(false)}
          onWaiting={() => setIsBuffering(true)}
          onStalled={() => setIsBuffering(true)}
          onPlaying={() => {
            setIsPlaying(true);
            setIsBuffering(false);
            setShowTapToPlay(false);
          }}
          onEnded={finishIntro}
          onError={handleVideoError}
          onPause={() => {
            if (!completedRef.current && !isFadingOut) {
              setIsPlaying(false);
              setIsBuffering(false);
            }
          }}
          className="w-full h-full object-contain max-w-full max-h-full pointer-events-auto"
        >
          Your browser does not support HTML5 video playback.
        </video>
      ) : (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col items-center justify-center p-6 text-center space-y-4 z-40"
        >
          <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300">
            <Film className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">
            ISHAI OS
          </h2>
          <p className="text-xs text-zinc-400 font-mono max-w-sm">
            Unable to decode startup intro video on this browser.
          </p>
          <button
            onClick={handleSkip}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-black tracking-wider uppercase cursor-pointer shadow-lg transition-all"
          >
            Enter ISHAI Workspace
          </button>
        </div>
      )}

      {/* Subtle Buffering Indicator when slow network or smartboard buffers */}
      {isBuffering && !showTapToPlay && !hasError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="bg-black/75 border border-cyan-500/50 rounded-full px-4 py-2 flex items-center gap-2.5 backdrop-blur-md">
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            <span className="text-[11px] font-mono text-cyan-200 tracking-wider uppercase">
              Buffering Intro...
            </span>
          </div>
        </div>
      )}

      {/* Prominent Manual Play Overlay (if browser/smartboard blocks autoplay or playback is paused) */}
      {showTapToPlay && !hasError && (
        <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              attemptPlay(true);
            }}
            className="group px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-500/30 to-blue-600/30 hover:from-cyan-500/50 hover:to-blue-600/50 border-2 border-cyan-400 text-white font-mono flex items-center gap-3.5 shadow-[0_0_35px_rgba(6,182,212,0.6)] cursor-pointer active:scale-95 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-black tracking-wider uppercase">PLAY ISHAI INTRO</span>
              <span className="text-[11px] text-cyan-200">Tap to start cinematic intro with sound</span>
            </div>
          </button>
        </div>
      )}

      {/* Responsive Sound Hint Banner (Mobile, Smartboard & Desktop) */}
      {showUnmuteHint && isPlaying && isMuted && !hasError && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleScreenTouch();
          }}
          className="absolute top-16 sm:top-20 z-30 pointer-events-auto bg-black/80 hover:bg-black border border-cyan-400/80 rounded-full px-4 py-2 shadow-[0_0_20px_rgba(6,182,212,0.5)] backdrop-blur-md flex items-center gap-2.5 cursor-pointer animate-pulse active:scale-95 transition-all"
        >
          <VolumeX className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-[11px] font-mono font-bold text-cyan-200 tracking-wide">
            TAP SCREEN TO UNMUTE AUDIO
          </span>
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
        </div>
      )}

      {/* Branding Shield Overlay */}
      <div className="absolute bottom-20 right-3 sm:bottom-4 sm:right-4 z-30 pointer-events-auto bg-black/95 border-2 border-cyan-400/90 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 shadow-[0_0_25px_rgba(6,182,212,0.8)] flex items-center gap-2 backdrop-blur-xl max-w-[85vw]">
        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(6,182,212,1)] shrink-0" />
        <div className="flex flex-col">
          <span className="text-[10px] sm:text-[11px] font-mono font-extrabold tracking-widest text-cyan-300 uppercase leading-none">
            ISHAI OS • CORE ENGINE
          </span>
          <span className="text-[8px] sm:text-[9px] font-mono font-bold text-cyan-400/80 tracking-tight">
            EMBODIED 3D HOLOGRAPHIC AI
          </span>
        </div>
      </div>

      {/* Top Header Branding Badge */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center gap-2 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        <span className="text-[11px] sm:text-xs font-mono font-bold tracking-widest text-cyan-400/90 uppercase">
          ISHAI OS • CINEMATIC
        </span>
      </div>

      {/* Bottom Controls Bar (Phones, Tablets, Desktop & Interactive Smartboards) */}
      <div className="absolute bottom-4 left-3 right-3 sm:left-6 sm:right-auto z-30 flex items-center justify-between sm:justify-start gap-2.5 pointer-events-auto">
        <div className="flex items-center gap-2">
          {/* Manual Play button if paused */}
          {!isPlaying && !showTapToPlay && !hasError && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                attemptPlay(!isMuted);
              }}
              className="min-h-[42px] px-3.5 py-2 rounded-xl border border-cyan-400 bg-cyan-500/30 text-cyan-100 font-mono text-xs font-bold flex items-center gap-1.5 backdrop-blur-md shadow-lg cursor-pointer active:scale-95"
              title="Play intro video"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>PLAY</span>
            </button>
          )}

          {/* Audio Unmute/Mute Button */}
          <button
            onClick={handleToggleMute}
            className={`min-h-[42px] px-3.5 py-2 rounded-xl border font-mono text-xs flex items-center gap-2 backdrop-blur-md transition-all shadow-lg cursor-pointer active:scale-95 ${
              !isMuted
                ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 font-bold shadow-[0_0_15px_rgba(6,182,212,0.6)]'
                : 'bg-black/80 border-cyan-500/40 text-zinc-300 hover:text-cyan-300'
            }`}
            title={isMuted ? 'Unmute video audio' : 'Mute video audio'}
          >
            {!isMuted ? (
              <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
            ) : (
              <VolumeX className="w-4 h-4 text-cyan-400 shrink-0" />
            )}
            <span className="text-[11px] font-semibold">
              {!isMuted ? 'SOUND ON' : 'UNMUTE'}
            </span>
          </button>

          {/* User-Triggered Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="min-h-[42px] px-3 py-2 rounded-xl bg-black/80 hover:bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-mono text-xs flex items-center gap-1.5 backdrop-blur-md transition-all shadow-lg cursor-pointer active:scale-95"
            title={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4 text-cyan-400" />
            ) : (
              <Maximize className="w-4 h-4 text-cyan-400" />
            )}
            <span className="hidden sm:inline text-[11px] font-semibold">
              {isFullscreen ? 'EXIT' : 'FULL'}
            </span>
          </button>
        </div>

        {/* Skip Intro Button */}
        <button
          onClick={handleSkip}
          className="min-h-[42px] px-4 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400/80 text-cyan-200 hover:text-white font-mono text-xs font-bold tracking-wider flex items-center gap-2 backdrop-blur-md transition-all shadow-lg shadow-cyan-950/50 cursor-pointer active:scale-95"
          title="Skip intro video and enter workspace immediately"
        >
          <span>SKIP</span>
          <SkipForward className="w-4 h-4 text-cyan-400" />
        </button>
      </div>
    </div>
  );
};
