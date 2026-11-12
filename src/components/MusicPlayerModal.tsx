import React, { useState } from 'react';
import { ModalWrapper } from './Modals';
import { soundEngine, speakText } from '../utils/audio';
import { Lock, Unlock, Key, Eye, EyeOff, AlertCircle, X, ShieldCheck } from 'lucide-react';

export interface UniversalTrack {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: string;
  youtubeId: string;
}

const GLOBAL_POPULAR_HITS: UniversalTrack[] = [
  {
    id: 'xVS4zgb9AuU',
    title: 'TIKI TIKI (Montagem PR Funk)',
    artist: 'QMIIR / Phonk Wave',
    thumbnail: 'https://i.ytimg.com/vi/xVS4zgb9AuU/hq720.jpg',
    duration: '2:15',
    youtubeId: 'xVS4zgb9AuU',
  },
  {
    id: '4NRXx6U8ABQ',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hq720.jpg',
    duration: '3:20',
    youtubeId: '4NRXx6U8ABQ',
  },
  {
    id: '7wtfhZwyrcc',
    title: 'Believer',
    artist: 'Imagine Dragons',
    thumbnail: 'https://i.ytimg.com/vi/7wtfhZwyrcc/hq720.jpg',
    duration: '3:24',
    youtubeId: '7wtfhZwyrcc',
  },
  {
    id: 'w-sQRS-Mun8',
    title: 'Murder In My Mind (Drift Phonk)',
    artist: 'Kordhell',
    thumbnail: 'https://i.ytimg.com/vi/w-sQRS-Mun8/hq720.jpg',
    duration: '2:25',
    youtubeId: 'w-sQRS-Mun8',
  },
  {
    id: '60ItHLz5WEA',
    title: 'Faded',
    artist: 'Alan Walker',
    thumbnail: 'https://i.ytimg.com/vi/60ItHLz5WEA/hq720.jpg',
    duration: '3:32',
    youtubeId: '60ItHLz5WEA',
  },
  {
    id: 'BddP6PYo2gs',
    title: 'Kesariya',
    artist: 'Arijit Singh / Pritam',
    thumbnail: 'https://i.ytimg.com/vi/BddP6PYo2gs/hq720.jpg',
    duration: '4:28',
    youtubeId: 'BddP6PYo2gs',
  },
];

interface MusicPlayerModalProps {
  onClose: () => void;
  onLog: (text: string, tag: string) => void;
  voiceGender: 'Male' | 'Female';
  audioActive: boolean;
}

export const MusicPlayerModal: React.FC<MusicPlayerModalProps> = ({
  onClose,
  onLog,
  voiceGender,
  audioActive,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState<UniversalTrack[]>(GLOBAL_POPULAR_HITS);
  const [currentTrack, setCurrentTrack] = useState<UniversalTrack>(GLOBAL_POPULAR_HITS[0]);
  const [loading, setLoading] = useState(false);
  const [, setHistory] = useState<UniversalTrack[]>([]);
  
  const [playlists, setPlaylists] = useState<Record<string, UniversalTrack[]>>(() => {
    try {
      const saved = localStorage.getItem('SuperAI_Playlists');
      return saved ? JSON.parse(saved) : { 'Recent': [] };
    } catch {
      return { 'Recent': [] };
    }
  });
  const [activePlaylist, setActivePlaylist] = useState('Recent');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  
  const savePlaylists = (newPlaylists: Record<string, UniversalTrack[]>) => {
    setPlaylists(newPlaylists);
    localStorage.setItem('SuperAI_Playlists', JSON.stringify(newPlaylists));
  };

  // Vibe mode state: defaults to true (ON) as requested by user
  const [vibeMode, setVibeMode] = useState(true);
  
  // Security verification dialog state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPasswordText, setShowPasswordText] = useState(false);

  // Accepted passwords: 'superai14' (SuperAI OS dev pass), 'off', 'on', 'vibe', 'superai', 'admin'
  const VALID_KEYS = ['superai14', 'off', 'on', 'vibe', 'superai', 'admin', '1234'];

  const playSong = (track: UniversalTrack) => {
    soundEngine.playClick();
    setCurrentTrack(track);
    setHistory((prev) => [track, ...prev.filter((t) => t.id !== track.id)]);
    
    // Add to Recent playlist
    const newPlaylists = { ...playlists };
    newPlaylists['Recent'] = [track, ...newPlaylists['Recent'].filter((t) => t.id !== track.id)];
    savePlaylists(newPlaylists);
    
    onLog(`[REAL_SONG_STREAM]: Now playing "${track.title}" by ${track.artist}`, 'MUSIC');

    if (audioActive) {
      speakText(`Now playing ${track.title}.`, voiceGender);
    }
  };

  const handleSearchSong = async (e: React.FormEvent, directQuery?: string) => {
    if (e) e.preventDefault();
    const query = (directQuery || searchQuery).trim();
    if (!query || loading) return;

    soundEngine.playClick();
    setLoading(true);
    onLog(`[MUSIC_CORE]: Resolving authentic audio stream for: "${query}"...`, 'INTELLIGENCE');

    try {
      const res = await fetch('/api/ai/universal-song-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const results: UniversalTrack[] = data.tracks || [];

      if (results.length > 0) {
        setTracks(results);
        playSong(results[0]);
        soundEngine.playSuccess();
        onLog(`✓ Stream confirmed: "${results[0].title}" by ${results[0].artist}`, 'SYSTEM');
      } else {
        onLog(`[-] No direct audio match found for "${query}". Reverting to library.`, 'ERROR');
        soundEngine.playAlertBeep();
      }
    } catch (err: any) {
      console.error(err);
      onLog(`[-] Error searching song: ${err.message}`, 'ERROR');
      soundEngine.playAlertBeep();
    } finally {
      setLoading(false);
    }
  };



  const triggerVibeToggle = () => {
    soundEngine.playClick();
    if (vibeMode) {
      // Vibe mode is ON: prompt for password to disable it
      setPasswordInput('');
      setPasswordError(null);
      setShowPasswordDialog(true);
    } else {
      // Vibe mode is OFF: click to turn back ON directly
      setVibeMode(true);
      soundEngine.playSuccess();
      onLog('[AUDIO]: Vibe Mode re-activated (Pure Audio Immersion).', 'AUDIO');
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = passwordInput.trim().toLowerCase();
    if (VALID_KEYS.includes(cleaned)) {
      setVibeMode(false);
      soundEngine.playSuccess();
      setShowPasswordDialog(false);
      setPasswordInput('');
      setPasswordError(null);
      onLog('[SECURITY]: Vibe Mode unlocked & disabled with password. Video display revealed.', 'SECURITY');
    } else {
      soundEngine.playAlertBeep();
      setPasswordError('Invalid security key. (Accepted: superai14 or off)');
      onLog('[-] Incorrect Vibe Mode password attempt.', 'ERROR');
    }
  };

  return (
    <ModalWrapper title="🎵 100% FREE MUSIC & SONG STUDIO" onClose={onClose}>
      <div className="flex flex-col font-mono text-emerald-400 relative">
        {/* Top Guarantee Banner */}
        <div className="bg-emerald-950/40 border border-emerald-800/80 px-2.5 py-1 rounded mb-2.5 flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
            <span className={`w-2 h-2 rounded-full ${vibeMode ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
            PLAYS ANY REAL SONG · VIBE MODE: {vibeMode ? 'ACTIVE (AUDIO ONLY)' : 'OFF (VIDEO SCREEN)'}
          </span>
          <span className="text-emerald-500 text-[10px]">ALL ARTISTS & HITS</span>
        </div>

        {/* Search Song Form */}
        <form onSubmit={(e) => handleSearchSong(e)} className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Type any song name (e.g. Tiki Tiki, Blinding Lights, Believer)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={loading}
            autoFocus
            className="flex-1 bg-black border border-emerald-800 focus:border-emerald-400 text-xs sm:text-sm text-emerald-300 px-3 py-2 rounded focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-extrabold text-xs px-4 sm:px-5 py-2 rounded transition-colors whitespace-nowrap cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            {loading ? 'LOADING...' : '⚡ SEARCH'}
          </button>
        </form>

        {/* Cyberpunk Now Playing Card */}
        <div className="bg-black border border-emerald-800 rounded p-3 mb-3 shadow-[0_0_25px_rgba(16,185,129,0.2)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-950 pb-2 mb-2.5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-950/80 border border-emerald-500 rounded flex items-center justify-center text-xl shrink-0">
                🎵
              </div>
              <div className="truncate">
                <div className="font-bold text-sm text-emerald-200 truncate">{currentTrack.title}</div>
                <div className="text-xs text-emerald-500 truncate">
                  {currentTrack.artist} · <span className="text-emerald-400">{currentTrack.duration}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 shrink-0 self-start sm:self-auto items-center">
              <button
                type="button"
                onClick={triggerVibeToggle}
                className={`border px-3 py-1.5 rounded text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer ${
                  vibeMode
                    ? 'border-emerald-400 bg-emerald-950 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'border-zinc-700 bg-zinc-900/90 text-zinc-300 hover:border-emerald-500 hover:text-emerald-300'
                }`}
                title={vibeMode ? 'Vibe Mode is ON (Locked). Tap & enter password to disable' : 'Vibe Mode is OFF. Tap to activate'}
              >
                {vibeMode ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>🎧 VIBE MODE: ON (LOCKED)</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-zinc-400" />
                    <span>👁️ VIBE MODE: OFF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Real Audio / Video Stream */}
          <div className="relative w-full aspect-video max-h-[260px] sm:max-h-[300px] rounded overflow-hidden bg-[#020503] border border-emerald-950">
            {/* The Video Container (Hidden when Vibe Mode is ON) */}
            <div className={`w-full h-full ${vibeMode ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
              <iframe
                key={currentTrack.youtubeId}
                src={`https://www.youtube-nocookie.com/embed/${currentTrack.youtubeId}?autoplay=1&enablejsapi=1&rel=0`}
                title={currentTrack.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>

            {/* The Barrier / Vibe UI */}
            {vibeMode && (
              <div className="absolute inset-0 z-10 bg-[#050505] flex flex-col items-center justify-center border border-emerald-900/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-1.5 h-6 bg-emerald-500 animate-pulse" />
                  <span className="w-1.5 h-10 bg-emerald-400 animate-pulse delay-75" />
                  <span className="w-1.5 h-14 bg-emerald-300 animate-pulse delay-150" />
                  <span className="w-1.5 h-8 bg-emerald-400 animate-pulse delay-100" />
                  <span className="w-1.5 h-12 bg-emerald-500 animate-pulse delay-200" />
                </div>
                <div className="text-emerald-400 font-bold tracking-widest text-center">
                  <div className="text-2xl sm:text-3xl mb-1 flex items-center justify-center gap-2">
                    <span>🎧</span>
                    <span>VIBE MODE ACTIVE</span>
                  </div>
                  <div className="text-xs text-emerald-200 font-semibold">{currentTrack.title}</div>
                  <div className="text-[11px] text-emerald-600 mt-0.5">{currentTrack.artist}</div>
                  <span className="text-[10px] text-emerald-600 mt-3 inline-block bg-emerald-950/70 border border-emerald-800/60 px-3 py-1 rounded">
                    ENCRYPTED AUDIO IMMERSION · VIDEO HIDDEN
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Playlist Management */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex flex-wrap gap-2 mb-2">
            <div className="flex-1 flex gap-1 overflow-x-auto pb-1 scrollbar-none">
              {Object.keys(playlists).map((pName) => (
                <button
                  key={pName}
                  onClick={() => setActivePlaylist(pName)}
                  className={`text-[10px] font-bold py-1 px-2 rounded border transition-colors whitespace-nowrap ${
                    activePlaylist === pName ? 'bg-emerald-950 border-emerald-500 text-emerald-300' : 'bg-black border-emerald-900 text-emerald-600'
                  }`}
                >
                  {pName}
                </button>
              ))}
            </div>
            <div className="flex gap-1 shrink-0">
              <input
                type="text"
                placeholder="New list..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-20 bg-black border border-emerald-900 text-[10px] px-1 rounded focus:outline-none"
              />
              <button
                onClick={() => {
                  if (newPlaylistName && !playlists[newPlaylistName]) {
                    savePlaylists({ ...playlists, [newPlaylistName]: [] });
                    setNewPlaylistName('');
                    soundEngine.playSuccess();
                  }
                }}
                className="bg-emerald-900 text-emerald-300 px-1.5 rounded text-[10px] font-bold"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[140px] border border-emerald-900 rounded p-1.5 space-y-1 scrollbar-thin scrollbar-thumb-emerald-800">
            <div className="text-[10px] text-emerald-600 font-bold px-2 py-0.5">
              {activePlaylist.toUpperCase()} PLAYLIST:
            </div>
            {(activePlaylist === 'Search' ? tracks : playlists[activePlaylist] || []).map((t) => (
              <div
                key={t.id}
                onClick={() => playSong(t)}
                className={`p-1.5 rounded border flex items-center justify-between cursor-pointer transition-all text-xs ${
                  currentTrack.id === t.id
                    ? 'border-emerald-400 bg-emerald-950/60 text-emerald-200 shadow-sm'
                    : 'border-emerald-900/60 bg-black text-emerald-400 hover:border-emerald-600'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <div className="truncate">
                    <div className="font-bold truncate text-[11px] sm:text-xs">{t.title}</div>
                    <div className="text-[10px] text-emerald-600 truncate">{t.artist}</div>
                  </div>
                </div>
                {activePlaylist !== 'Search' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newPlaylists = { ...playlists };
                      newPlaylists[activePlaylist] = newPlaylists[activePlaylist].filter(tr => tr.id !== t.id);
                      savePlaylists(newPlaylists);
                    }}
                    className="text-red-500 hover:text-red-300 text-[10px]"
                  >
                    X
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <button
            onClick={() => {
              if (activePlaylist !== 'Recent' && activePlaylist !== 'Search' && !playlists[activePlaylist].some(t => t.id === currentTrack.id)) {
                const newPlaylists = { ...playlists };
                newPlaylists[activePlaylist] = [currentTrack, ...newPlaylists[activePlaylist]];
                savePlaylists(newPlaylists);
                soundEngine.playSuccess();
                onLog(`[MUSIC]: Added "${currentTrack.title}" to "${activePlaylist}"`, 'MUSIC');
              }
            }}
            disabled={activePlaylist === 'Recent' || activePlaylist === 'Search'}
            className="mt-2 w-full bg-emerald-900 text-emerald-300 hover:bg-emerald-800 disabled:opacity-50 py-1.5 rounded text-[10px] font-bold"
          >
            + ADD "{currentTrack.title.slice(0, 15)}..." TO "{activePlaylist}"
          </button>
        </div>

        {/* In-App Cyberpunk Security Modal for Vibe Mode Password Entry */}
        {showPasswordDialog && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-emerald-500/80 rounded-xl max-w-sm w-full p-5 shadow-[0_0_35px_rgba(16,185,129,0.35)] text-emerald-400 relative">
              <button
                type="button"
                onClick={() => setShowPasswordDialog(false)}
                className="absolute top-3 right-3 text-zinc-500 hover:text-emerald-300 p-1 rounded transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 mb-3 text-emerald-300">
                <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-700/60 text-emerald-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide text-white">SECURITY ACCESS KEY</h3>
                  <div className="text-[10px] text-emerald-500 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    SUPERAI-OS CRYPTOGRAPHIC GATEWAY
                  </div>
                </div>
              </div>

              <p className="text-xs text-zinc-300 mb-3 leading-relaxed">
                {vibeMode
                  ? 'Enter security password to disable Vibe Mode and reveal the video player:'
                  : 'Enter security password to activate Vibe Mode and lock into audio immersion:'}
              </p>

              <form onSubmit={handlePasswordSubmit} className="space-y-3">
                <div className="relative">
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setPasswordError(null);
                    }}
                    autoFocus
                    placeholder="Enter password (e.g. superai14 or off)"
                    className="w-full bg-black border border-emerald-700 focus:border-emerald-400 text-sm text-emerald-300 px-3 py-2 pr-9 rounded focus:outline-none placeholder:text-zinc-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-emerald-300 transition-colors cursor-pointer"
                    title={showPasswordText ? 'Hide password' : 'Show password'}
                  >
                    {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {passwordError && (
                  <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/80 px-2.5 py-1.5 rounded flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-[10px] text-emerald-600">
                  <span>Valid Passwords: <code className="text-emerald-400">superai14</code> or <code className="text-emerald-400">off</code></span>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPasswordDialog(false)}
                    className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 font-bold text-xs py-2 rounded transition-colors cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs py-2 rounded transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
                  >
                    {vibeMode ? 'UNLOCK (TURN OFF)' : 'VERIFY & TURN ON'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};
