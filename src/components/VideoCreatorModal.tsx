import React, { useState, useRef, useEffect } from 'react';
import { ModalWrapper } from './Modals';
import { soundEngine, speakText } from '../utils/audio';

export interface WebVideoItem {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
  views: string;
  videoUrl: string;
  downloadUrl: string;
  posterUrl: string;
  interactionId?: string;
  aspectRatio?: '16:9' | '9:16';
  resolution?: '360p' | '720p' | '1080p';
  isAiGenerated?: boolean;
}

interface VideoCreatorModalProps {
  onClose: () => void;
  onLog: (text: string, tag: string) => void;
  voiceGender: 'Male' | 'Female';
  audioActive: boolean;
}

const FEATURED_VIDEOS: WebVideoItem[] = [
  {
    id: 'local-cyberpunk',
    title: 'Cyberpunk Metropolis - Neon Night Drone Run (HD)',
    channel: 'ISHAI Studio Library',
    thumbnail: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop',
    duration: '0:15',
    views: 'Studio Clip',
    videoUrl: '/videos/cyberpunk.mp4',
    downloadUrl: '/videos/cyberpunk.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop',
  },
  {
    id: 'local-supercar',
    title: 'Supercar Hyper-Drift Velocity 4K',
    channel: 'ISHAI Studio Library',
    thumbnail: 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=800&auto=format&fit=crop',
    duration: '0:15',
    views: 'Studio Clip',
    videoUrl: '/videos/supercar.mp4',
    downloadUrl: '/videos/supercar.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=800&auto=format&fit=crop',
  },
  {
    id: 'local-space',
    title: 'Deep Space Orbital Drift & Cosmic Nebula',
    channel: 'ISHAI Studio Library',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop',
    duration: '0:15',
    views: 'Studio Clip',
    videoUrl: '/videos/space.mp4',
    downloadUrl: '/videos/space.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop',
  },
  {
    id: 'local-ocean',
    title: 'Bioluminescent Giant Ocean Wave Swell',
    channel: 'ISHAI Studio Library',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
    duration: '0:15',
    views: 'Studio Clip',
    videoUrl: '/videos/ocean.mp4',
    downloadUrl: '/videos/ocean.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
  },
];

const PRESETS = [
  'Neon cyberpunk drone soaring over rain-slicked Tokyo streets',
  'Hypercar drifting around an alpine pass at golden hour sunset',
  'Astronaut floating outside an orbital station with Earth below',
  'Crystal ocean wave curling in slow motion under northern lights',
  'Autonomous humanoid robot assembling futuristic circuit boards',
  'Rocket lifting off through glowing dusk clouds with shockwaves',
];

const WATCHLIST_KEY = 'SuperAI_Watchlist';

export const VideoCreatorModal: React.FC<VideoCreatorModalProps> = ({
  onClose,
  onLog,
  voiceGender,
  audioActive,
}) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [duration, setDuration] = useState<'5s' | '8s' | '10s' | '15s'>('5s');
  const [resolution, setResolution] = useState<'360p' | '720p' | '1080p'>('720p');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceName, setReferenceName] = useState('');
  const [extendSelected, setExtendSelected] = useState(false);

  const [videos, setVideos] = useState<WebVideoItem[]>(FEATURED_VIDEOS);
  const [currentVideo, setCurrentVideo] = useState<WebVideoItem>(FEATURED_VIDEOS[0]);
  const [generating, setGenerating] = useState(false);
  const [statusLabel, setStatusLabel] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'studio' | 'watchlist'>('studio');
  const [fullScreen, setFullScreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const pollTimerRef = useRef<number | null>(null);
  const elapsedTimerRef = useRef<number | null>(null);

  const [watchlist, setWatchlist] = useState<WebVideoItem[]>(() => {
    try {
      const saved = localStorage.getItem(WATCHLIST_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Sanitize any legacy YouTube items out cleanly
          const valid = parsed.filter((v: any) => v && typeof v.videoUrl === 'string' && !v.embedUrl);
          if (valid.length > 0) return valid;
        }
      }
    } catch {}
    return [FEATURED_VIDEOS[0], FEATURED_VIDEOS[1]];
  });

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) window.clearTimeout(pollTimerRef.current);
      if (elapsedTimerRef.current) window.clearInterval(elapsedTimerRef.current);
    };
  }, []);

  const saveWatchlist = (list: WebVideoItem[]) => {
    setWatchlist(list);
    try {
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
    } catch {}
  };

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReferenceName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setReferenceImage(reader.result as string);
      soundEngine.playSuccess();
    };
    reader.readAsDataURL(file);
  };

  const stopTimers = () => {
    if (pollTimerRef.current) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (elapsedTimerRef.current) {
      window.clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  };

  const pollGenerationStatus = async (
    interactionId: string,
    targetPrompt: string,
    targetAspect: '16:9' | '9:16',
    targetDuration: string,
    targetResolution: '360p' | '720p' | '1080p',
    attempts = 0
  ) => {
    if (attempts > 90) {
      stopTimers();
      setGenerating(false);
      setErrorMsg('Video synthesis timed out after 4.5 minutes. Please retry with a shorter duration.');
      onLog('[-] Gemini Omni video synthesis timed out.', 'ERROR');
      return;
    }

    try {
      const statusRes = await fetch(`/api/ai/video/status/${encodeURIComponent(interactionId)}`);
      const statusData = await statusRes.json();

      if (statusData.status === 'completed' && statusData.ready) {
        stopTimers();
        setGenerating(false);
        setStatusLabel('Ready');

        const newItem: WebVideoItem = {
          id: `omni-${interactionId}`,
          title: targetPrompt.length > 55 ? `${targetPrompt.slice(0, 52)}...` : targetPrompt,
          channel: `Gemini Omni 1.2 (${targetResolution})`,
          thumbnail: currentVideo.posterUrl || FEATURED_VIDEOS[0].posterUrl,
          duration: `0:${targetDuration.replace('s', '').padStart(2, '0')}`,
          views: `${targetAspect} AI Render`,
          videoUrl: statusData.videoUrl,
          downloadUrl: statusData.downloadUrl,
          posterUrl: currentVideo.posterUrl || FEATURED_VIDEOS[0].posterUrl,
          interactionId,
          aspectRatio: targetAspect,
          resolution: targetResolution,
          isAiGenerated: true,
        };

        setVideos((prev) => [newItem, ...prev]);
        setCurrentVideo(newItem);
        setExtendSelected(false);
        soundEngine.playSuccess();
        onLog(`✓ AI Video ready (${targetDuration} @ ${targetResolution}): "${newItem.title}"`, 'SYSTEM');
        if (audioActive) {
          speakText('Your AI generated video is ready.', voiceGender);
        }
        return;
      }

      if (statusData.status === 'failed' || statusData.status === 'cancelled') {
        stopTimers();
        setGenerating(false);
        const failReason = statusData.error || `Generation ${statusData.status}`;
        setErrorMsg(failReason);
        soundEngine.playAlertBeep();
        onLog(`[-] AI Video synthesis failed: ${failReason}`, 'ERROR');
        return;
      }

      setStatusLabel(`Rendering (${statusData.status || 'in_progress'})...`);
      pollTimerRef.current = window.setTimeout(() => {
        pollGenerationStatus(
          interactionId,
          targetPrompt,
          targetAspect,
          targetDuration,
          targetResolution,
          attempts + 1
        );
      }, 3000);
    } catch (err: any) {
      pollTimerRef.current = window.setTimeout(() => {
        pollGenerationStatus(
          interactionId,
          targetPrompt,
          targetAspect,
          targetDuration,
          targetResolution,
          attempts + 1
        );
      }, 3500);
    }
  };

  const handleGenerateVideo = async (e?: React.FormEvent, overridePrompt?: string) => {
    if (e) e.preventDefault();
    const targetPrompt = (overridePrompt || prompt).trim();
    if (!targetPrompt || generating) return;

    soundEngine.playClick();
    stopTimers();
    setErrorMsg(null);
    setGenerating(true);
    setElapsedSeconds(0);
    setStatusLabel('Submitting to Gemini Omni 1.2...');
    setActiveTab('studio');

    elapsedTimerRef.current = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    onLog(`[VIDEO_CREATOR]: Generating ${duration} ${resolution} AI video for "${targetPrompt}"...`, 'INTELLIGENCE');

    try {
      const res = await fetch('/api/ai/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: targetPrompt,
          aspectRatio,
          duration,
          resolution,
          imageBase64: referenceImage || undefined,
          previousInteractionId:
            extendSelected && currentVideo.interactionId ? currentVideo.interactionId : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.interactionId) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setStatusLabel('Queued on GPU cluster...');
      pollGenerationStatus(data.interactionId, targetPrompt, aspectRatio, duration, resolution, 0);
    } catch (err: any) {
      stopTimers();
      setGenerating(false);
      soundEngine.playAlertBeep();
      const msg = err?.message || 'AI video request failed';
      setErrorMsg(msg);
      onLog(`[-] Video Creator error: ${msg}`, 'ERROR');
    }
  };

  const toggleWatchlist = (video: WebVideoItem) => {
    soundEngine.playClick();
    const exists = watchlist.some((v) => v.id === video.id);
    if (exists) {
      const updated = watchlist.filter((v) => v.id !== video.id);
      saveWatchlist(updated);
      onLog(`Removed "${video.title}" from watchlist.`, 'FILES');
    } else {
      const updated = [video, ...watchlist];
      saveWatchlist(updated);
      soundEngine.playSuccess();
      onLog(`✓ Saved "${video.title}" to watchlist.`, 'FILES');
    }
  };

  const handleDownload = (video: WebVideoItem) => {
    soundEngine.playClick();
    onLog(`Downloading MP4 clip: "${video.title}"...`, 'FILES');
    const a = document.createElement('a');
    a.href = video.downloadUrl || video.videoUrl;
    a.download = `${video.title.replace(/[^a-z0-9]/gi, '_')}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    soundEngine.playSuccess();
  };

  const handleCopyLink = (video: WebVideoItem) => {
    soundEngine.playClick();
    const url = video.videoUrl.startsWith('http')
      ? video.videoUrl
      : window.location.origin + video.videoUrl;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    soundEngine.playSuccess();
    onLog(`✓ Copied video stream link: ${url}`, 'SYSTEM');
  };

  const isCurrentInWatchlist = watchlist.some((v) => v.id === currentVideo.id);

  return (
    <ModalWrapper title="🎬 VIDEO CREATOR STUDIO · GEMINI OMNI AI" onClose={onClose}>
      <div className="flex flex-col max-h-[675px] font-mono text-emerald-400">
        {/* Banner */}
        <div className="bg-emerald-950/40 border border-emerald-800/80 px-2.5 py-1 rounded mb-2 flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            GEMINI OMNI 1.2 VIDEO ENGINE · TEXT &amp; IMAGE TO MP4
          </span>
          <span className="text-emerald-500 text-[10px]">NATIVE MP4 · ZERO EMBEDS</span>
        </div>

        {/* Prompt Presets */}
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 mb-2 border-b border-emerald-950 text-[10px] scrollbar-none items-center">
          <span className="text-emerald-600 whitespace-nowrap font-bold">Scene Prompts:</span>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              disabled={generating}
              onClick={() => setPrompt(p)}
              className="bg-black border border-emerald-900/80 hover:border-emerald-400 hover:bg-emerald-950 text-emerald-300 px-2.5 py-0.5 rounded whitespace-nowrap transition-colors text-[10px] cursor-pointer"
            >
              {p.slice(0, 38)}...
            </button>
          ))}
        </div>

        {/* Generation Controls Form */}
        <form onSubmit={(e) => handleGenerateVideo(e)} className="space-y-2 mb-2.5">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Describe the scene to generate with Gemini Omni AI (camera motion, lighting, subject)..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={generating}
              autoFocus
              className="flex-1 bg-black border border-emerald-800 focus:border-emerald-400 text-xs text-emerald-300 px-3 py-2 rounded focus:outline-none placeholder:text-emerald-800 font-mono shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]"
            />
            <button
              type="submit"
              disabled={generating || !prompt.trim()}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-extrabold text-xs px-5 py-2 rounded transition-colors whitespace-nowrap cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              {generating ? `RENDERING (${elapsedSeconds}s)` : '⚡ GENERATE AI VIDEO'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px] bg-black/60 border border-emerald-950 rounded px-2.5 py-1.5">
            <label className="flex items-center gap-1 text-emerald-500">
              <span>Aspect:</span>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as '16:9' | '9:16')}
                disabled={generating}
                className="bg-black border border-emerald-800 text-emerald-300 rounded px-1.5 py-0.5"
              >
                <option value="16:9">16:9 Widescreen</option>
                <option value="9:16">9:16 Vertical</option>
              </select>
            </label>

            <label className="flex items-center gap-1 text-emerald-500">
              <span>Duration:</span>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value as '5s' | '8s' | '10s' | '15s')}
                disabled={generating}
                className="bg-black border border-emerald-800 text-emerald-300 rounded px-1.5 py-0.5"
              >
                <option value="5s">5s</option>
                <option value="8s">8s</option>
                <option value="10s">10s</option>
                <option value="15s">15s</option>
              </select>
            </label>

            <label className="flex items-center gap-1 text-emerald-500">
              <span>Quality:</span>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as '360p' | '720p' | '1080p')}
                disabled={generating}
                className="bg-black border border-emerald-800 text-emerald-300 rounded px-1.5 py-0.5"
              >
                <option value="360p">360p Draft</option>
                <option value="720p">720p HD</option>
                <option value="1080p">1080p Full HD</option>
              </select>
            </label>

            <label className="cursor-pointer bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 px-2 py-0.5 rounded flex items-center gap-1">
              <span>{referenceName ? `Frame: ${referenceName.slice(0, 14)}` : '+ Ref Frame'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleReferenceUpload}
                className="hidden"
              />
            </label>
            {referenceImage && (
              <button
                type="button"
                onClick={() => {
                  setReferenceImage(null);
                  setReferenceName('');
                }}
                className="text-red-400 hover:text-red-300"
              >
                Clear
              </button>
            )}

            {currentVideo.interactionId && (
              <label className="ml-auto flex items-center gap-1 text-cyan-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={extendSelected}
                  onChange={(e) => setExtendSelected(e.target.checked)}
                  className="accent-emerald-400"
                />
                <span>Extend Current AI Clip</span>
              </label>
            )}
          </div>
        </form>

        {errorMsg && (
          <div className="mb-2 px-3 py-2 rounded bg-red-950/50 border border-red-700 text-red-200 text-[11px] flex items-center justify-between gap-2">
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-red-400 hover:text-white px-1.5"
            >
              ✕
            </button>
          </div>
        )}

        {/* Primary HTML5 MP4 Video Stage */}
        <div className="bg-black/95 border border-emerald-900 rounded p-2 mb-2.5 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="relative w-full aspect-video max-h-[270px] rounded overflow-hidden bg-black border border-emerald-950 shadow-[0_0_30px_rgba(16,185,129,0.15)] flex items-center justify-center">
            <video
              key={currentVideo.videoUrl}
              src={currentVideo.videoUrl}
              poster={currentVideo.posterUrl}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain bg-black"
              onError={(e) => console.error('HTML5 Video playback error:', e)}
            />

            <div className="absolute top-2 left-2 z-10 pointer-events-none flex items-center gap-1.5">
              <div className="bg-black/75 backdrop-blur px-2 py-0.5 rounded border border-emerald-900 text-[9px] text-emerald-400 font-bold tracking-widest uppercase">
                {currentVideo.isAiGenerated ? 'GEMINI OMNI AI RENDER' : 'ISHAI STUDIO MP4'}
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
            </div>

            {generating && (
              <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-center p-4">
                <div className="w-9 h-9 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <div className="text-xs font-bold text-emerald-300">{statusLabel || 'Synthesizing MP4 frames...'}</div>
                <div className="text-[10px] text-emerald-500">Elapsed: {elapsedSeconds}s · {resolution} · {aspectRatio}</div>
              </div>
            )}
          </div>

          {/* Current Video Info & Controls */}
          <div className="w-full mt-2 pt-2 border-t border-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs px-1">
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="text-emerald-200 font-bold text-sm truncate" title={currentVideo.title}>
                {currentVideo.title}
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-emerald-600 mt-0.5">
                <span className="text-emerald-400 font-semibold">{currentVideo.channel}</span>
                <span>•</span>
                <span>{currentVideo.duration}</span>
                <span>•</span>
                <span>{currentVideo.views}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => toggleWatchlist(currentVideo)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors ${
                  isCurrentInWatchlist
                    ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                    : 'bg-black border-emerald-900 text-zinc-400 hover:border-emerald-600 hover:text-emerald-300'
                }`}
              >
                {isCurrentInWatchlist ? '★ SAVED' : '☆ SAVE'}
              </button>

              <button
                type="button"
                onClick={() => handleCopyLink(currentVideo)}
                className="bg-black hover:bg-emerald-950 border border-emerald-900 text-emerald-400 px-2 py-1 rounded text-[11px] transition-colors"
              >
                {copiedLink ? '✓ COPIED' : '🔗 LINK'}
              </button>

              <button
                type="button"
                onClick={() => handleDownload(currentVideo)}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-3.5 py-1 rounded text-[11px] transition-all shadow-[0_0_12px_rgba(16,185,129,0.35)] active:scale-95 flex items-center gap-1 cursor-pointer"
              >
                <span>↓ DOWNLOAD MP4</span>
              </button>

              <button
                type="button"
                onClick={() => setFullScreen(true)}
                className="border border-emerald-900 hover:bg-emerald-950 text-emerald-400 px-2 py-1 rounded text-[11px]"
                title="Fullscreen mode"
              >
                🔍
              </button>
            </div>
          </div>
        </div>

        {/* Studio / Watchlist Tabs */}
        <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-emerald-950 text-xs">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('studio')}
              className={`px-3 py-0.5 rounded text-[11px] font-bold transition-colors ${
                activeTab === 'studio'
                  ? 'bg-emerald-500 text-black'
                  : 'text-emerald-500 hover:bg-emerald-950'
              }`}
            >
              🔥 STUDIO CLIPS ({videos.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('watchlist')}
              className={`px-3 py-0.5 rounded text-[11px] font-bold transition-colors ${
                activeTab === 'watchlist'
                  ? 'bg-emerald-500 text-black'
                  : 'text-emerald-500 hover:bg-emerald-950'
              }`}
            >
              ⭐ MY WATCHLIST ({watchlist.length})
            </button>
          </div>
          <span className="text-[10px] text-emerald-600">SELECT ANY CLIP TO PLAY OR EXTEND</span>
        </div>

        {/* Video Cards List */}
        <div className="flex-1 overflow-y-auto max-h-[160px] pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-emerald-900">
          {(activeTab === 'studio' ? videos : watchlist).map((v) => {
            const isPlayingThis = currentVideo.id === v.id;
            return (
              <div
                key={v.id}
                onClick={() => {
                  soundEngine.playClick();
                  setCurrentVideo(v);
                  onLog(`Now playing: "${v.title}" (${v.channel})`, 'MEDIA');
                }}
                className={`group flex items-center justify-between p-1.5 rounded border transition-all cursor-pointer ${
                  isPlayingThis
                    ? 'bg-emerald-950/60 border-emerald-400 ring-1 ring-emerald-500'
                    : 'bg-black/80 border-emerald-950 hover:border-emerald-800 hover:bg-emerald-950/30'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="relative w-20 h-12 bg-black rounded overflow-hidden shrink-0 border border-emerald-900/60">
                    <img
                      src={v.thumbnail}
                      alt={v.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0.5 right-0.5 bg-black/90 text-emerald-300 text-[9px] font-bold px-1 rounded">
                      {v.duration}
                    </span>
                    {isPlayingThis && (
                      <div className="absolute inset-0 bg-emerald-900/40 flex items-center justify-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 pr-2">
                    <div className="text-xs font-bold text-emerald-200 truncate group-hover:text-emerald-300">
                      {v.title}
                    </div>
                    <div className="text-[10px] text-emerald-600 truncate mt-0.5">
                      {v.channel} • {v.views}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => handleDownload(v)}
                    className="border border-emerald-900 hover:border-emerald-500 hover:bg-emerald-950 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded transition-colors"
                  >
                    ↓ MP4
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleWatchlist(v)}
                    className="text-emerald-500 hover:text-emerald-300 text-xs px-1"
                  >
                    {watchlist.some((item) => item.id === v.id) ? '★' : '☆'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Fullscreen Overlay */}
        {fullScreen && (
          <div
            onClick={() => setFullScreen(false)}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 cursor-pointer"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="max-w-5xl max-h-[85vh] w-full aspect-video overflow-hidden rounded-lg border border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.5)] bg-black flex items-center justify-center"
            >
              <video
                src={currentVideo.videoUrl}
                poster={currentVideo.posterUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-xs text-emerald-400 mt-3 font-mono">
              [ CLICK OUTSIDE TO CLOSE FULLSCREEN ]
            </div>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};
