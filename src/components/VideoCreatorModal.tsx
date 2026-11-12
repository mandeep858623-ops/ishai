import React, { useState } from 'react';
import { ModalWrapper } from './Modals';
import { soundEngine, speakText } from '../utils/audio';

export interface WebVideoItem {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
  views: string;
  youtubeId: string;
  embedUrl: string;
  downloadUrl: string;
  downloadMp4Url: string;
  posterUrl: string;
  isLocalMp4?: boolean;
  localMp4Url?: string;
}

interface VideoCreatorModalProps {
  onClose: () => void;
  onLog: (text: string, tag: string) => void;
  voiceGender: 'Male' | 'Female';
  audioActive: boolean;
}

const LOCAL_MP4_VIDEOS: WebVideoItem[] = [
  {
    id: 'local-cyberpunk',
    title: 'Cyberpunk Metropolis - Neon Night Drone Run (HD)',
    channel: 'SuperAI OS AI Studio',
    thumbnail: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop',
    duration: '0:15',
    views: '1.2M streams',
    youtubeId: 'cyberpunk',
    embedUrl: 'https://www.youtube-nocookie.com/embed/obUnEqsTmLg?autoplay=1&enablejsapi=1&rel=0&controls=1',
    downloadUrl: '/api/ai/video-proxy?url=%2Fapi%2Fai%2Fvideo-stream%2Fcyberpunk.mp4&download=true&filename=Cyberpunk_Neon.mp4',
    downloadMp4Url: '/api/ai/video-stream/cyberpunk.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop',
    isLocalMp4: true,
    localMp4Url: '/api/ai/video-stream/cyberpunk.mp4',
  },
  {
    id: 'local-supercar',
    title: 'Supercar Hyper-Drift Velocity 4K',
    channel: 'SuperAI OS AI Studio',
    thumbnail: 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=800&auto=format&fit=crop',
    duration: '0:15',
    views: '2.5M streams',
    youtubeId: 'supercar',
    embedUrl: 'https://www.youtube-nocookie.com/embed/obUnEqsTmLg?autoplay=1&enablejsapi=1&rel=0&controls=1',
    downloadUrl: '/api/ai/video-proxy?url=%2Fapi%2Fai%2Fvideo-stream%2Fsupercar.mp4&download=true&filename=Supercar_Drift.mp4',
    downloadMp4Url: '/api/ai/video-stream/supercar.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=800&auto=format&fit=crop',
    isLocalMp4: true,
    localMp4Url: '/api/ai/video-stream/supercar.mp4',
  },
  {
    id: 'local-space',
    title: 'Deep Space Orbital Drift & Cosmic Nebula',
    channel: 'SuperAI OS AI Studio',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop',
    duration: '0:15',
    views: '950K streams',
    youtubeId: 'space',
    embedUrl: 'https://www.youtube-nocookie.com/embed/1-iS7LArMPA?autoplay=1&enablejsapi=1&rel=0&controls=1',
    downloadUrl: '/api/ai/video-proxy?url=%2Fapi%2Fai%2Fvideo-stream%2Fspace.mp4&download=true&filename=Deep_Space.mp4',
    downloadMp4Url: '/api/ai/video-stream/space.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop',
    isLocalMp4: true,
    localMp4Url: '/api/ai/video-stream/space.mp4',
  },
  {
    id: 'local-ocean',
    title: 'Bioluminescent Giant Ocean Wave Swell',
    channel: 'SuperAI OS AI Studio',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
    duration: '0:15',
    views: '3.1M streams',
    youtubeId: 'ocean',
    embedUrl: 'https://www.youtube-nocookie.com/embed/obUnEqsTmLg?autoplay=1&enablejsapi=1&rel=0&controls=1',
    downloadUrl: '/api/ai/video-proxy?url=%2Fapi%2Fai%2Fvideo-stream%2Focean.mp4&download=true&filename=Ocean_Waves.mp4',
    downloadMp4Url: '/api/ai/video-stream/ocean.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
    isLocalMp4: true,
    localMp4Url: '/api/ai/video-stream/ocean.mp4',
  },
];

const FEATURED_VIDEOS: WebVideoItem[] = [
  LOCAL_MP4_VIDEOS[0],
  LOCAL_MP4_VIDEOS[1],
  LOCAL_MP4_VIDEOS[2],
  LOCAL_MP4_VIDEOS[3],
  {
    id: 'obUnEqsTmLg',
    title: 'Ferrari-Powered Supercar Drifts Mountain Pass (4K 60FPS)',
    channel: 'Donut Media',
    thumbnail: 'https://i.ytimg.com/vi/obUnEqsTmLg/hqdefault.jpg',
    duration: '11:42',
    views: '8.4M views',
    youtubeId: 'obUnEqsTmLg',
    embedUrl: 'https://www.youtube-nocookie.com/embed/obUnEqsTmLg?autoplay=1&enablejsapi=1&rel=0&controls=1',
    downloadUrl: 'https://ssyoutube.com/watch?v=obUnEqsTmLg',
    downloadMp4Url: 'https://www.y2mate.com/youtube/obUnEqsTmLg',
    posterUrl: 'https://i.ytimg.com/vi/obUnEqsTmLg/hqdefault.jpg',
  },
  {
    id: 'qC5KtatMcUw',
    title: 'Cyberpunk 2077 - Ultra Photorealistic 8K Path Tracing Graphics',
    channel: 'Digital Dreams',
    thumbnail: 'https://i.ytimg.com/vi/qC5KtatMcUw/hqdefault.jpg',
    duration: '8:15',
    views: '4.2M views',
    youtubeId: 'qC5KtatMcUw',
    embedUrl: 'https://www.youtube-nocookie.com/embed/qC5KtatMcUw?autoplay=1&enablejsapi=1&rel=0&controls=1',
    downloadUrl: 'https://ssyoutube.com/watch?v=qC5KtatMcUw',
    downloadMp4Url: 'https://www.y2mate.com/youtube/qC5KtatMcUw',
    posterUrl: 'https://i.ytimg.com/vi/qC5KtatMcUw/hqdefault.jpg',
  },
];

const PRESETS = [
  '🏎️ Ferrari Drift 4K',
  '🏙️ Cyberpunk City 4K',
  '🌌 Deep Space Orbit',
  '⚡ Phonk Drift Edit',
  '🦁 Lion Hunting 4K',
  '🌊 Ocean Waves 4K',
  '🚀 SpaceX Starship',
  '🤖 Boston Dynamics Robots',
];

const WATCHLIST_KEY = 'SuperAI_Watchlist';

export const VideoCreatorModal: React.FC<VideoCreatorModalProps> = ({
  onClose,
  onLog,
  voiceGender,
  audioActive,
}) => {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState<WebVideoItem[]>(FEATURED_VIDEOS);
  const [currentVideo, setCurrentVideo] = useState<WebVideoItem>(FEATURED_VIDEOS[0]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'watchlist'>('search');
  const [fullScreen, setFullScreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [watchlist, setWatchlist] = useState<WebVideoItem[]>(() => {
    try {
      const saved = localStorage.getItem(WATCHLIST_KEY);
      return saved ? JSON.parse(saved) : [FEATURED_VIDEOS[0], FEATURED_VIDEOS[1]];
    } catch {
      return [FEATURED_VIDEOS[0]];
    }
  });

  const saveWatchlist = (list: WebVideoItem[]) => {
    setWatchlist(list);
    try {
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
    } catch {}
  };

  const handleSearch = async (e?: React.FormEvent, customQ?: string) => {
    if (e) e.preventDefault();
    const searchTarget = (customQ || query).trim();
    if (!searchTarget || loading) return;

    soundEngine.playClick();
    setLoading(true);
    setActiveTab('search');
    onLog(`[VIDEO_STUDIO]: Searching global network for videos: "${searchTarget}"...`, 'INTELLIGENCE');

    try {
      const res = await fetch('/api/ai/universal-video-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchTarget }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.videos && data.videos.length > 0) {
        setVideos(data.videos);
        setCurrentVideo(data.videos[0]);
        soundEngine.playSuccess();
        onLog(`✓ Located ${data.videos.length} videos for "${searchTarget}". Playing now.`, 'SYSTEM');

        if (audioActive) {
          speakText(`Here are the videos for ${searchTarget}.`, voiceGender);
        }
      } else {
        onLog(`[-] No videos returned for "${searchTarget}". Showing featured library.`, 'INTELLIGENCE');
      }
    } catch (err: any) {
      console.error('Video search failed:', err);
      soundEngine.playAlertBeep();
      onLog(`[-] Network query interrupted: ${err.message || 'Error'}.`, 'ERROR');
    } finally {
      setLoading(false);
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
    onLog(`Opening video download stream for: "${video.title}"...`, 'FILES');
    if (video.isLocalMp4 && video.localMp4Url) {
      const a = document.createElement('a');
      a.href = video.localMp4Url;
      a.download = `${video.title.replace(/[^a-z0-9]/gi, '_')}.mp4`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const downloadPage = video.downloadUrl || `https://ssyoutube.com/watch?v=${video.youtubeId}`;
      window.open(downloadPage, '_blank');
    }
    soundEngine.playSuccess();
  };

  const handleDownloadMp4Fast = (video: WebVideoItem) => {
    soundEngine.playClick();
    onLog(`Downloading MP4 HD video for: "${video.title}"...`, 'FILES');
    if (video.isLocalMp4 && video.localMp4Url) {
      const a = document.createElement('a');
      a.href = video.localMp4Url;
      a.download = `${video.title.replace(/[^a-z0-9]/gi, '_')}.mp4`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const mp4Page = video.downloadMp4Url || `https://www.y2mate.com/youtube/${video.youtubeId}`;
      window.open(mp4Page, '_blank');
    }
    soundEngine.playSuccess();
  };

  const handleDownloadPoster = (video: WebVideoItem) => {
    soundEngine.playClick();
    const a = document.createElement('a');
    a.href = video.posterUrl || video.thumbnail;
    a.download = `SuperAI_Poster_${video.title.replace(/[^a-z0-9]/gi, '_')}.jpg`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    soundEngine.playSuccess();
    onLog(`↓ Downloaded HD poster for: ${video.title}`, 'FILES');
  };

  const handleCopyLink = (video: WebVideoItem) => {
    soundEngine.playClick();
    const url = video.isLocalMp4 ? window.location.origin + (video.localMp4Url || '') : `https://www.youtube.com/watch?v=${video.youtubeId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    soundEngine.playSuccess();
    onLog(`✓ Copied link to clipboard: ${url}`, 'SYSTEM');
  };

  const isCurrentInWatchlist = watchlist.some((v) => v.id === currentVideo.id);

  return (
    <ModalWrapper title="🎬 UNIVERSAL VIDEO CREATOR & STREAMING STUDIO" onClose={onClose}>
      <div className="flex flex-col max-h-[660px] font-mono text-emerald-400">
        {/* Banner */}
        <div className="bg-emerald-950/40 border border-emerald-800/80 px-2.5 py-1 rounded mb-2 flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            100% INSTANT PLAYBACK · HD MP4 STREAMS & DOWNLOADS
          </span>
          <span className="text-emerald-500 text-[10px]">VERIFIED 60FPS · ZERO ADS</span>
        </div>

        {/* Quick Category Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 mb-2 border-b border-emerald-950 text-[10px] scrollbar-none items-center">
          <span className="text-emerald-600 whitespace-nowrap font-bold">Presets:</span>
          {PRESETS.map((p, idx) => {
            const cleanText = p.replace(/^[^\w\s]+\s*/, '');
            return (
              <button
                key={idx}
                disabled={loading}
                onClick={() => {
                  setQuery(cleanText);
                  handleSearch(undefined, cleanText);
                }}
                className="bg-black border border-emerald-900/80 hover:border-emerald-400 hover:bg-emerald-950 text-emerald-300 px-2.5 py-0.5 rounded whitespace-nowrap transition-colors text-[10px] cursor-pointer"
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Search Input Form */}
        <form onSubmit={(e) => handleSearch(e)} className="flex gap-2 mb-2.5">
          <input
            type="text"
            placeholder="Type ANY video in the world (e.g. Ferrari Drift, Cyberpunk, Lion, Anime, MrBeast)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            autoFocus
            className="flex-1 bg-black border border-emerald-800 focus:border-emerald-400 text-xs text-emerald-300 px-3 py-2 rounded focus:outline-none placeholder:text-emerald-800 font-mono shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-extrabold text-xs px-5 py-2 rounded transition-colors whitespace-nowrap cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            {loading ? 'SEARCHING...' : '⚡ FIND VIDEO'}
          </button>
        </form>

        {/* Primary Video Player & Stage */}
        <div className="bg-black/95 border border-emerald-900 rounded p-2 mb-2.5 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Main Video Embed / HTML5 Video Player */}
          <div className="relative w-full aspect-video max-h-[300px] rounded overflow-hidden bg-black border border-emerald-950 shadow-[0_0_30px_rgba(16,185,129,0.15)] flex items-center justify-center">
            {currentVideo.isLocalMp4 && currentVideo.localMp4Url ? (
              <video
                key={currentVideo.localMp4Url}
                src={currentVideo.localMp4Url}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-cover bg-black"
                onError={(e) => console.error('HTML5 Video playback error:', e)}
              />
            ) : (
              <iframe
                key={currentVideo.youtubeId}
                src={currentVideo.embedUrl}
                title={currentVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            )}
            
            {/* Minimal Watermark Overlay */}
            <div className="absolute top-2 left-2 z-10 pointer-events-none flex items-center gap-1.5">
              <div className="bg-black/70 backdrop-blur px-2 py-0.5 rounded border border-emerald-900 text-[9px] text-emerald-400 font-bold tracking-widest uppercase">
                SUPERAI OS · {currentVideo.isLocalMp4 ? 'HD 60FPS STREAM' : 'SECURE PLAYER'}
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
            </div>
          </div>

          {/* Current Video Info & Download Controls */}
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

            {/* Action Download Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <button
                onClick={() => toggleWatchlist(currentVideo)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors ${
                  isCurrentInWatchlist
                    ? 'bg-emerald-950 border-emerald-400 text-emerald-300'
                    : 'bg-black border-emerald-900 text-zinc-400 hover:border-emerald-600 hover:text-emerald-300'
                }`}
                title="Save video to Watchlist"
              >
                {isCurrentInWatchlist ? '★ SAVED' : '☆ SAVE'}
              </button>

              <button
                onClick={() => handleCopyLink(currentVideo)}
                className="bg-black hover:bg-emerald-950 border border-emerald-900 text-emerald-400 px-2 py-1 rounded text-[11px] transition-colors"
                title="Copy video link"
              >
                {copiedLink ? '✓ COPIED' : '🔗 LINK'}
              </button>

              <button
                onClick={() => handleDownloadPoster(currentVideo)}
                className="bg-black hover:bg-emerald-950 border border-emerald-800 text-emerald-300 px-2.5 py-1 rounded text-[11px] transition-colors"
                title="Download 1080p Cover Poster"
              >
                📷 POSTER
              </button>

              <button
                onClick={() => handleDownload(currentVideo)}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-3.5 py-1 rounded text-[11px] transition-all shadow-[0_0_12px_rgba(16,185,129,0.35)] active:scale-95 flex items-center gap-1 cursor-pointer"
                title="Download Video in HD (MP4/WebM)"
              >
                <span>↓ DOWNLOAD MP4</span>
              </button>

              <button
                onClick={() => setFullScreen(true)}
                className="border border-emerald-900 hover:bg-emerald-950 text-emerald-400 px-2 py-1 rounded text-[11px]"
                title="Fullscreen mode"
              >
                🔍
              </button>
            </div>
          </div>
        </div>

        {/* Results / Watchlist Tabs */}
        <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-emerald-950 text-xs">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-3 py-0.5 rounded text-[11px] font-bold transition-colors ${
                activeTab === 'search'
                  ? 'bg-emerald-500 text-black'
                  : 'text-emerald-500 hover:bg-emerald-950'
              }`}
            >
              🔥 VIDEOS ({videos.length})
            </button>
            <button
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
          <span className="text-[10px] text-emerald-600">CLICK ANY CARD TO PLAY INSTANTLY</span>
        </div>

        {/* Video Cards Grid */}
        <div className="flex-1 overflow-y-auto max-h-[180px] pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-emerald-900">
          {(activeTab === 'search' ? videos : watchlist).map((v) => {
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
                {/* Thumbnail & Duration */}
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

                  {/* Title & Creator */}
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="text-xs font-bold text-emerald-200 truncate group-hover:text-emerald-300">
                      {v.title}
                    </div>
                    <div className="text-[10px] text-emerald-600 truncate mt-0.5">
                      {v.channel} • {v.views}
                    </div>
                  </div>
                </div>

                {/* Quick card action */}
                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleDownloadMp4Fast(v)}
                    className="border border-emerald-900 hover:border-emerald-500 hover:bg-emerald-950 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded transition-colors"
                    title="Download this video"
                  >
                    ↓ MP4
                  </button>
                  <button
                    onClick={() => toggleWatchlist(v)}
                    className="text-emerald-500 hover:text-emerald-300 text-xs px-1"
                    title="Add / Remove from Watchlist"
                  >
                    {watchlist.some((item) => item.id === v.id) ? '★' : '☆'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Fullscreen Video Overlay */}
        {fullScreen && (
          <div
            onClick={() => setFullScreen(false)}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 cursor-pointer"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="max-w-5xl max-h-[85vh] w-full aspect-video overflow-hidden rounded-lg border border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.5)] bg-black flex items-center justify-center"
            >
              {currentVideo.isLocalMp4 && currentVideo.localMp4Url ? (
                <video
                  src={currentVideo.localMp4Url}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <iframe
                  src={currentVideo.embedUrl}
                  title={currentVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              )}
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
