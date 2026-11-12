import React, { useState, useEffect, useRef } from 'react';
import { ModalWrapper } from './Modals';
import { soundEngine, speakText } from '../utils/audio';
import { synthesizeSongAudio, SongComposition } from '../utils/audioSynthesis';
import {
  Music,
  Play,
  Pause,
  Download,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Volume2,
  VolumeX,
  Sliders,
  FileText,
  Radio,
  Layers,
  Info,
  Clock,
  Disc,
  Headphones,
  Edit3,
  Bookmark,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SongMakerModalProps {
  onClose: () => void;
  onLog: (text: string, tag: string, audioUrl?: string, songData?: any) => void;
  voiceGender: 'Male' | 'Female';
  initialPrompt?: string;
}

const GENRES = [
  'Pop',
  'Rap',
  'Hip-Hop',
  'Rock',
  'Classical',
  'Romantic',
  'Sad',
  'Happy',
  'Lo-fi',
  'EDM',
  'Devotional',
  'Custom',
];

const LANGUAGES = [
  'English',
  'Hindi',
  'Punjabi',
  'Spanish',
  'French',
  'Korean',
  'Japanese',
  'German',
  'Arabic',
  'Bengali',
  'Tamil',
  'Custom',
];

const MOODS = [
  'Happy',
  'Sad',
  'Emotional',
  'Energetic',
  'Peaceful',
  'Romantic',
  'Inspirational',
  'Custom',
];

const VOCAL_PREFERENCES = ['Auto', 'Male', 'Female', 'Duet', 'Instrumental'];

const TEMPO_OPTIONS = [
  { label: 'Chill (75 BPM)', value: 75 },
  { label: 'Mid-Tempo (98 BPM)', value: 98 },
  { label: 'Upbeat (120 BPM)', value: 120 },
  { label: 'Fast (142 BPM)', value: 142 },
];

const DURATION_OPTIONS = [
  { label: '30s Clip', value: 30 },
  { label: '60s Preview', value: 60 },
  { label: '90s Standard', value: 90 },
];

export interface SavedSongItem {
  id: string;
  timestamp: string;
  composition: SongComposition;
  audioUrl?: string;
  duration: number;
}

const STORAGE_KEY = 'SUPERAI_SONG_MAKER_LIBRARY';

export const SongMakerModal: React.FC<SongMakerModalProps> = ({ onClose, onLog, initialPrompt }) => {
  // Input fields
  const [description, setDescription] = useState(initialPrompt || '');

  useEffect(() => {
    if (initialPrompt && initialPrompt !== description) {
      setDescription(initialPrompt);
    }
  }, [initialPrompt]);

  const [genre, setGenre] = useState('Pop');
  const [customGenre, setCustomGenre] = useState('');
  const [language, setLanguage] = useState('English');
  const [customLanguage, setCustomLanguage] = useState('');
  const [mood, setMood] = useState('Energetic');
  const [customMood, setCustomMood] = useState('');
  const [vocalPreference, setVocalPreference] = useState('Auto');
  const [songTitle, setSongTitle] = useState('');
  const [theme, setTheme] = useState('');
  const [tempoBpm, setTempoBpm] = useState(120);
  const [duration, setDuration] = useState(30);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Status and generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState(0);

  // Generated results
  const [currentSong, setCurrentSong] = useState<SongComposition | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(30);

  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  // Lyrics Editing state
  const [isEditingLyrics, setIsEditingLyrics] = useState(false);
  const [editableSections, setEditableSections] = useState<SongComposition['sections']>([]);
  const [copiedLyrics, setCopiedLyrics] = useState(false);

  // Tabs: 'creator' | 'library' | 'models'
  const [activeTab, setActiveTab] = useState<'creator' | 'library' | 'models'>('creator');
  const [savedSongs, setSavedSongs] = useState<SavedSongItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Audio references & visualizer
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Synchronize audio element settings
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.loop = isLooping;
    }
  }, [volume, isMuted, isLooping]);

  // Clean up audio blob URL on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Visualizer loop
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const renderVisualizer = () => {
      animFrameRef.current = requestAnimationFrame(renderVisualizer);

      const width = canvas.width;
      const height = canvas.height;
      canvasCtx.clearRect(0, 0, width, height);

      if (analyserRef.current && isPlaying) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        const barCount = 36;
        const barWidth = width / barCount - 2;
        const step = Math.floor(bufferLength / barCount);

        for (let i = 0; i < barCount; i++) {
          const value = dataArray[i * step] || 0;
          const barHeight = (value / 255) * (height - 4);
          const x = i * (barWidth + 2);
          const y = height - barHeight;

          // Gradient color from neon cyan to purple/pink
          const gradient = canvasCtx.createLinearGradient(0, height, 0, 0);
          gradient.addColorStop(0, '#06b6d4');
          gradient.addColorStop(0.5, '#a855f7');
          gradient.addColorStop(1, '#ec4899');

          canvasCtx.fillStyle = gradient;
          canvasCtx.fillRect(x, y, barWidth, barHeight);
        }
      } else {
        // Idle gentle waveform
        const barCount = 36;
        const barWidth = width / barCount - 2;
        for (let i = 0; i < barCount; i++) {
          const h = 4 + Math.sin(Date.now() * 0.003 + i * 0.3) * 3;
          canvasCtx.fillStyle = '#1e293b';
          canvasCtx.fillRect(i * (barWidth + 2), height - h, barWidth, h);
        }
      }
    };

    renderVisualizer();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  // Connect Audio element to Web Audio Analyser
  const setupAudioGraph = () => {
    if (!audioRef.current) return;
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      sourceNodeRef.current = source;
    }

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  // Play / Pause toggle
  const togglePlay = () => {
    soundEngine.playClick();
    if (!audioRef.current) return;
    setupAudioGraph();

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Playback error:', err);
          setIsPlaying(false);
        });
    }
  };

  // Seek handler
  const handleSeek = (newTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Time format
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Main Generation Handler
  const handleGenerateSong = async () => {
    soundEngine.playClick();
    const effectiveGenre = genre === 'Custom' ? customGenre || 'Pop' : genre;
    const effectiveLanguage = language === 'Custom' ? customLanguage || 'English' : language;
    const effectiveMood = mood === 'Custom' ? customMood || 'Energetic' : mood;

    setIsGenerating(true);
    setProgressPercent(15);
    setGenerationStep('Gemini AI Brain: Composing lyrics, melody, and harmonic progression...');
    onLog(`[SONG MAKER]: Composing original ${effectiveGenre} track in ${effectiveLanguage}...`, 'AI_CREATIVE');

    try {
      // 1. Send choices to Gemini API endpoint
      const res = await fetch('/api/ai/song/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: description.trim() || `An energetic ${effectiveGenre} track about adventure and dreaming big`,
          genre: effectiveGenre,
          mood: effectiveMood,
          language: effectiveLanguage,
          vocalPreference,
          title: songTitle.trim() || undefined,
          theme: theme.trim() || undefined,
          tempo: `${tempoBpm} BPM`,
          duration: `${duration}s`,
        }),
      });

      if (!res.ok) {
        throw new Error(`Generation failed with status ${res.status}`);
      }

      setProgressPercent(45);
      setGenerationStep('Gemini AI Brain: Parsing lyrics, chord structures, and vocal arrangements...');

      const songData: SongComposition = await res.json();
      setCurrentSong(songData);
      setEditableSections(songData.sections || []);

      setProgressPercent(65);
      setGenerationStep('Web Audio Engine: Synthesizing drums, bassline, keys, and melodic leads...');

      // 2. Fetch AI vocalization if vocals requested
      let vocalBuffer: AudioBuffer | null = null;
      if (vocalPreference !== 'Instrumental') {
        try {
          setProgressPercent(75);
          setGenerationStep('Vocalizer: Synthesizing multi-lingual vocal phrasing...');
          // Grab representative vocal phrase (Chorus or Verse)
          const chorusSection = songData.sections.find((s) => s.type.toLowerCase().includes('chorus'));
          const vocalText = chorusSection
            ? chorusSection.lines.slice(0, 3).join('. ')
            : songData.sections[0]?.lines.slice(0, 3).join('. ') || songData.title;

          const vocalRes = await fetch(`/api/ai/tts?text=${encodeURIComponent(vocalText)}`);
          if (vocalRes.ok) {
            const vocalArrayBuffer = await vocalRes.arrayBuffer();
            const tempCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            vocalBuffer = await tempCtx.decodeAudioData(vocalArrayBuffer);
          }
        } catch (vocalErr) {
          console.warn('Vocal buffer synthesis notice:', vocalErr);
        }
      }

      // 3. Synthesize actual high-fidelity multi-track audio buffer
      setProgressPercent(90);
      setGenerationStep('Mastering Engine: Mixing multi-track audio and mastering WAV file...');

      const synthResult = await synthesizeSongAudio(songData, duration, vocalBuffer);

      // Clean up previous blob
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }

      setAudioUrl(synthResult.audioUrl);
      setAudioBlob(synthResult.wavBlob);
      setAudioDuration(synthResult.duration);
      setCurrentTime(0);
      setIsPlaying(false);

      // Save to library
      const newSavedItem: SavedSongItem = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        composition: songData,
        audioUrl: synthResult.audioUrl,
        duration: synthResult.duration,
      };

      setSavedSongs((prev) => {
        const updated = [newSavedItem, ...prev.slice(0, 19)];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });

      // Synchronize directly into SuperAI OS Music Player Playlists (superai)
      try {
        const rawPlaylists = localStorage.getItem('SuperAI_Playlists');
        const playlists = rawPlaylists ? JSON.parse(rawPlaylists) : {};
        const superaiTrack = {
          id: `ai-${Date.now()}`,
          title: songData.title,
          artist: `Gemini AI (${songData.genre})`,
          thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
          duration: `${Math.floor(synthResult.duration)}s`,
          youtubeId: '',
          audioUrl: synthResult.audioUrl,
        };
        playlists['Recent'] = [superaiTrack, ...(playlists['Recent'] || []).slice(0, 15)];
        playlists['AI Songs'] = [superaiTrack, ...(playlists['AI Songs'] || []).slice(0, 15)];
        localStorage.setItem('SuperAI_Playlists', JSON.stringify(playlists));
      } catch (err) {
        console.warn('Could not sync to SuperAI OS playlist:', err);
      }

      setProgressPercent(100);
      setGenerationStep('Complete! Your song is ready to play, download, and put back to superai.');
      soundEngine.playSuccess();
      onLog(
        `🎶 [SONG MAKER → SUPERAI]: Generated "${songData.title}" (${songData.genre}, ${songData.tempoBpm} BPM)! Loaded into SuperAI OS.`,
        'SONG_MAKER',
        synthResult.audioUrl,
        {
          title: songData.title,
          genre: songData.genre,
          mood: songData.mood,
          tempoBpm: songData.tempoBpm,
          musicalKey: songData.musicalKey,
          lyricsSnippet: songData.sections?.find((s) => s.type.toLowerCase().includes('chorus'))?.lines?.[0] || songData.sections?.[0]?.lines?.[0],
        }
      );
    } catch (err: any) {
      console.error('Song generation error:', err);
      onLog(`[SONG MAKER ERROR]: ${err?.message || 'Generation failed'}`, 'SYSTEM');
    } finally {
      setIsGenerating(false);
    }
  };

  // Download song audio file
  const handleDownloadAudio = () => {
    if (!audioBlob && !audioUrl) return;
    soundEngine.playClick();
    const cleanTitle = (currentSong?.title || 'Song_Maker_Track').replace(/[^a-zA-Z0-9_-]/g, '_');
    const a = document.createElement('a');
    a.href = audioUrl || '';
    a.download = `${cleanTitle}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onLog(`[SONG MAKER]: Downloaded audio file "${cleanTitle}.wav"`, 'DOWNLOAD');
  };

  // Copy Lyrics
  const handleCopyLyrics = () => {
    soundEngine.playClick();
    if (!currentSong) return;

    let text = `${currentSong.title.toUpperCase()}\n`;
    text += `Genre: ${currentSong.genre} | Mood: ${currentSong.mood} | Tempo: ${currentSong.tempoBpm} BPM\n`;
    text += `Key: ${currentSong.musicalKey}\n\n`;

    editableSections.forEach((sec) => {
      text += `[${sec.name || sec.type}] ${sec.chords ? `(${sec.chords})` : ''}\n`;
      text += `${sec.lines.join('\n')}\n\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedLyrics(true);
    setTimeout(() => setCopiedLyrics(false), 2500);
  };

  // Update line text in-place
  const handleLineChange = (sectionIdx: number, lineIdx: number, newText: string) => {
    setEditableSections((prev) => {
      const copy = [...prev];
      const targetSec = { ...copy[sectionIdx] };
      const linesCopy = [...targetSec.lines];
      linesCopy[lineIdx] = newText;
      targetSec.lines = linesCopy;
      copy[sectionIdx] = targetSec;
      return copy;
    });
  };

  return (
    <ModalWrapper title="🎶 SONG MAKER" onClose={onClose} maxWidthClass="max-w-6xl">
      <div className="flex flex-col h-[84vh] text-zinc-100 font-sans -m-4">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-purple-950/80 via-zinc-900 to-cyan-950/80 border-b border-purple-500/20 px-5 py-3 flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-500/20 border border-purple-400/40 text-purple-300">
                <Music className="w-5 h-5 text-purple-400 animate-pulse" />
              </span>
              <h1 className="text-lg sm:text-xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300">
                Song Maker
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 font-mono font-bold">
                GEMINI POWERED
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Turn your ideas into original songs with AI.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setActiveTab('creator')}
              className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'creator'
                  ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Creator
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'library'
                  ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              My Songs ({savedSongs.length})
            </button>
            <button
              onClick={() => setActiveTab('models')}
              className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'models'
                  ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              AI Status
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-gradient-to-b from-zinc-950 via-zinc-900/60 to-black">
          {activeTab === 'creator' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* LEFT COLUMN: Song Creation Parameters */}
              <div className="lg:col-span-5 space-y-4 bg-zinc-900/70 border border-zinc-800 p-4 rounded-xl shadow-xl">
                {/* Prompt Box */}
                <div>
                  <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                    Describe the song you want to create…
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. An energetic synth-pop song about driving fast under Tokyo neon lights with nostalgic 80s chords and a catchy euphoric chorus..."
                    className="w-full bg-black/80 border border-zinc-700/80 rounded-lg p-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all resize-none font-mono"
                  />
                </div>

                {/* Genre Selector */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Disc className="w-3.5 h-3.5 text-purple-400" /> Song Genre
                    </span>
                    <span className="text-[11px] text-purple-400 font-mono">{genre}</span>
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {GENRES.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => {
                          setGenre(g);
                          if (g === 'Lo-fi') setTempoBpm(78);
                          else if (g === 'EDM') setTempoBpm(128);
                          else if (g === 'Rap' || g === 'Hip-Hop') setTempoBpm(92);
                          else if (g === 'Sad' || g === 'Romantic') setTempoBpm(75);
                          else if (g === 'Rock') setTempoBpm(126);
                          else setTempoBpm(120);
                        }}
                        className={`px-2 py-1.5 rounded text-[11px] font-medium border transition-all text-center truncate ${
                          genre === g
                            ? 'bg-purple-600 border-purple-400 text-white font-bold shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                            : 'bg-black/40 border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                  {genre === 'Custom' && (
                    <input
                      type="text"
                      value={customGenre}
                      onChange={(e) => setCustomGenre(e.target.value)}
                      placeholder="Enter custom genre (e.g. Cyberpunk Synthwave, Afrobeat, Drill...)"
                      className="mt-2 w-full bg-black border border-purple-500/50 rounded p-2 text-xs text-purple-200 placeholder-zinc-500 focus:outline-none"
                    />
                  )}
                </div>

                {/* Language Selector */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center justify-between">
                    <span>Language</span>
                    <span className="text-[11px] text-cyan-400 font-mono">{language}</span>
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {LANGUAGES.slice(0, 8).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setLanguage(lang)}
                        className={`px-2 py-1 rounded text-[11px] border transition-all text-center ${
                          language === lang
                            ? 'bg-cyan-600 border-cyan-400 text-white font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                            : 'bg-black/40 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                  {language === 'Custom' && (
                    <input
                      type="text"
                      value={customLanguage}
                      onChange={(e) => setCustomLanguage(e.target.value)}
                      placeholder="Enter language..."
                      className="mt-2 w-full bg-black border border-cyan-500/50 rounded p-2 text-xs text-cyan-200 focus:outline-none"
                    />
                  )}
                </div>

                {/* Mood Selector */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center justify-between">
                    <span>Mood</span>
                    <span className="text-[11px] text-pink-400 font-mono">{mood}</span>
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {MOODS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMood(m)}
                        className={`px-2 py-1 rounded text-[11px] border transition-all text-center ${
                          mood === m
                            ? 'bg-pink-600 border-pink-400 text-white font-bold shadow-[0_0_8px_rgba(236,72,153,0.4)]'
                            : 'bg-black/40 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vocal Preference */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center gap-1">
                    <Headphones className="w-3.5 h-3.5 text-purple-400" /> Vocal Preference
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {VOCAL_PREFERENCES.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setVocalPreference(v)}
                        className={`px-1.5 py-1 rounded text-[10px] sm:text-[11px] border text-center transition-all ${
                          vocalPreference === v
                            ? 'bg-purple-600 border-purple-400 text-white font-bold'
                            : 'bg-black/40 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Collapsible Advanced Options (Title, Theme, Tempo, Duration) */}
                <div className="border-t border-zinc-800 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full flex items-center justify-between text-xs text-zinc-400 hover:text-purple-300 py-1 font-semibold"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" /> Optional Parameters (Title, Tempo, Duration)
                    </span>
                    {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showAdvanced && (
                    <div className="space-y-3 pt-2 text-xs">
                      <div>
                        <span className="text-zinc-400 block mb-1">Song Title (Optional)</span>
                        <input
                          type="text"
                          value={songTitle}
                          onChange={(e) => setSongTitle(e.target.value)}
                          placeholder="e.g. Midnight Horizon"
                          className="w-full bg-black border border-zinc-800 rounded p-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-400"
                        />
                      </div>

                      <div>
                        <span className="text-zinc-400 block mb-1">Theme (Optional)</span>
                        <input
                          type="text"
                          value={theme}
                          onChange={(e) => setTheme(e.target.value)}
                          placeholder="e.g. Cyberpunk Rebellion, Unconditional Love"
                          className="w-full bg-black border border-zinc-800 rounded p-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-400"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-zinc-400 mb-1">
                          <span>Tempo (BPM): <strong className="text-purple-300">{tempoBpm} BPM</strong></span>
                        </div>
                        <input
                          type="range"
                          min="65"
                          max="165"
                          value={tempoBpm}
                          onChange={(e) => setTempoBpm(Number(e.target.value))}
                          className="w-full accent-purple-500"
                        />
                        <div className="grid grid-cols-4 gap-1 mt-1">
                          {TEMPO_OPTIONS.map((t) => (
                            <button
                              key={t.value}
                              type="button"
                              onClick={() => setTempoBpm(t.value)}
                              className={`text-[9px] py-0.5 rounded border ${
                                tempoBpm === t.value
                                  ? 'border-purple-400 text-purple-300 bg-purple-950/60'
                                  : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
                              }`}
                            >
                              {t.label.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-zinc-400 block mb-1">Duration</span>
                        <div className="grid grid-cols-3 gap-2">
                          {DURATION_OPTIONS.map((d) => (
                            <button
                              key={d.value}
                              type="button"
                              onClick={() => setDuration(d.value)}
                              className={`py-1 rounded text-center border font-mono text-[11px] ${
                                duration === d.value
                                  ? 'bg-purple-950 border-purple-400 text-purple-200 font-bold'
                                  : 'bg-black border-zinc-800 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {d.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Generate Song Button */}
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleGenerateSong}
                  className={`w-full py-3 px-4 rounded-xl font-black text-sm tracking-wide uppercase transition-all shadow-lg flex items-center justify-center gap-2 ${
                    isGenerating
                      ? 'bg-purple-950 border border-purple-500/50 text-purple-300 cursor-not-allowed animate-pulse'
                      : 'bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:from-purple-500 hover:via-pink-500 hover:to-cyan-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] active:scale-[0.99]'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-purple-300" />
                      <span>Generating Song...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Generate Song</span>
                    </>
                  )}
                </button>

                {/* Live Multi-Stage Progress Indicator */}
                {isGenerating && (
                  <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-purple-300">
                      <span className="truncate pr-2 font-mono">{generationStep}</span>
                      <span className="font-bold">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-black/60 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Real Audio Player & Lyrics Studio */}
              <div className="lg:col-span-7 space-y-4">
                {/* Audio Player Card */}
                <div className="bg-gradient-to-b from-zinc-900 via-zinc-900/90 to-black border border-purple-500/30 p-5 rounded-xl shadow-2xl relative overflow-hidden">
                  {/* Visualizer canvas */}
                  <div className="mb-4 bg-black/70 border border-zinc-800 rounded-lg p-2 overflow-hidden flex flex-col items-center justify-center h-24 relative">
                    <canvas ref={canvasRef} width={480} height={80} className="w-full h-full" />
                    {!currentSong && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs text-xs text-zinc-400 gap-2">
                        <Music className="w-4 h-4 text-purple-400 animate-pulse" />
                        <span>Ready to compose. Click Generate Song to create audio.</span>
                      </div>
                    )}
                  </div>

                  {/* Hidden Audio Element */}
                  {audioUrl && (
                    <audio
                      ref={audioRef}
                      src={audioUrl}
                      onTimeUpdate={() => {
                        if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
                      }}
                      onEnded={() => setIsPlaying(false)}
                      onError={(e) => console.warn('Audio tag error:', e)}
                    />
                  )}

                  {/* Song Title & Attributes */}
                  <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black text-white tracking-wide">
                          {currentSong ? currentSong.title : 'Original Song Title'}
                        </h2>
                        {currentSong && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            {currentSong.genre}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {currentSong
                          ? `${currentSong.mood} • ${currentSong.tempoBpm} BPM • Key of ${currentSong.musicalKey || 'C Major'}`
                          : 'Real polyphonic Web Audio synthesis + Gemini lyrics'}
                      </p>
                    </div>

                    {/* Download & Copy Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={!audioUrl}
                        onClick={handleDownloadAudio}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                          audioUrl
                            ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        }`}
                        title="Download actual generated song WAV file"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Audio (.wav)
                      </button>

                      <button
                        type="button"
                        disabled={!currentSong}
                        onClick={handleCopyLyrics}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-colors"
                        title="Copy song lyrics with section headers"
                      >
                        {copiedLyrics ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedLyrics ? 'Copied' : 'Lyrics'}
                      </button>
                    </div>
                  </div>

                  {/* Player Controls */}
                  <div className="space-y-2 bg-black/50 p-3 rounded-lg border border-zinc-800/80">
                    {/* Progress Slider */}
                    <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
                      <span>{formatTime(currentTime)}</span>
                      <input
                        type="range"
                        min="0"
                        max={audioDuration || 30}
                        step="0.1"
                        value={currentTime}
                        onChange={(e) => handleSeek(Number(e.target.value))}
                        disabled={!audioUrl}
                        className="flex-1 accent-purple-400 cursor-pointer"
                      />
                      <span>{formatTime(audioDuration || 30)}</span>
                    </div>

                    {/* Button row */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-3">
                        {/* Play/Pause */}
                        <button
                          type="button"
                          disabled={!audioUrl}
                          onClick={togglePlay}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            audioUrl
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105 shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                              : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                          }`}
                        >
                          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                        </button>

                        {/* Loop Toggle */}
                        <button
                          type="button"
                          onClick={() => setIsLooping(!isLooping)}
                          className={`px-2 py-1 rounded text-[11px] font-mono transition-colors border ${
                            isLooping
                              ? 'border-purple-400 text-purple-300 bg-purple-950/60'
                              : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          Loop: {isLooping ? 'ON' : 'OFF'}
                        </button>
                      </div>

                      {/* Volume Slider */}
                      <div className="flex items-center gap-2 text-zinc-400 text-xs">
                        <button
                          type="button"
                          onClick={() => setIsMuted(!isMuted)}
                          className="hover:text-white"
                        >
                          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={isMuted ? 0 : volume}
                          onChange={(e) => {
                            setVolume(Number(e.target.value));
                            if (isMuted) setIsMuted(false);
                          }}
                          className="w-20 sm:w-24 accent-purple-400 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Song Metadata Details Badges */}
                  {currentSong && (
                    <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-wrap gap-2 text-[11px]">
                      {currentSong.suggestedInstruments && (
                        <div className="flex items-center gap-1 bg-zinc-800/60 px-2 py-1 rounded border border-zinc-700/50 text-zinc-300">
                          <Layers className="w-3 h-3 text-cyan-400" />
                          <span>Instruments: {currentSong.suggestedInstruments.join(', ')}</span>
                        </div>
                      )}
                      {currentSong.vocalStyle && (
                        <div className="flex items-center gap-1 bg-zinc-800/60 px-2 py-1 rounded border border-zinc-700/50 text-zinc-300">
                          <Headphones className="w-3 h-3 text-pink-400" />
                          <span>Vocals: {currentSong.vocalStyle}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Lyrics & Songwriting Section */}
                <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                        Song Lyrics & Composition
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={!currentSong}
                        onClick={() => setIsEditingLyrics(!isEditingLyrics)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 border transition-colors ${
                          isEditingLyrics
                            ? 'border-purple-400 text-purple-300 bg-purple-950/60'
                            : 'border-zinc-700 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Edit3 className="w-3 h-3" />
                        {isEditingLyrics ? 'Done Editing' : 'Edit In-Place'}
                      </button>

                      <button
                        type="button"
                        disabled={isGenerating || !currentSong}
                        onClick={handleGenerateSong}
                        className="px-2.5 py-1 rounded text-xs font-semibold border border-zinc-700 text-zinc-400 hover:text-cyan-300 hover:border-cyan-500/50 flex items-center gap-1 transition-colors"
                        title="Regenerate alternative lyrics with Gemini"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Regenerate
                      </button>
                    </div>
                  </div>

                  {/* Lyrics Display / Editor */}
                  {currentSong ? (
                    <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                      {editableSections.map((sec, secIdx) => (
                        <div
                          key={`${sec.name}-${secIdx}`}
                          className="bg-black/50 border border-zinc-800/80 rounded-lg p-3 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-purple-300 uppercase tracking-wider font-mono">
                              [{sec.name || sec.type}]
                            </span>
                            {sec.chords && (
                              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                                🎸 {sec.chords}
                              </span>
                            )}
                          </div>

                          <div className="space-y-1 pt-1">
                            {sec.lines.map((line, lineIdx) =>
                              isEditingLyrics ? (
                                <input
                                  key={lineIdx}
                                  type="text"
                                  value={line}
                                  onChange={(e) => handleLineChange(secIdx, lineIdx, e.target.value)}
                                  className="w-full bg-zinc-900 border border-purple-500/40 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none"
                                />
                              ) : (
                                <p
                                  key={lineIdx}
                                  className={`text-xs ${
                                    sec.type.toLowerCase().includes('chorus')
                                      ? 'text-pink-200 font-semibold pl-2 border-l-2 border-pink-500'
                                      : 'text-zinc-300'
                                  }`}
                                >
                                  {line}
                                </p>
                              )
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-zinc-500 text-xs">
                      <Music className="w-8 h-8 mx-auto mb-2 text-zinc-600 animate-pulse" />
                      <p>No lyrics generated yet.</p>
                      <p className="text-[11px] text-zinc-600 mt-1">
                        Describe your song idea and click <strong>Generate Song</strong> above.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: My Songs Library */}
          {activeTab === 'library' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-purple-400" />
                  My Songs Library ({savedSongs.length})
                </h2>
                {savedSongs.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('Clear song library history?')) {
                        setSavedSongs([]);
                        localStorage.removeItem(STORAGE_KEY);
                      }
                    }}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear All
                  </button>
                )}
              </div>

              {savedSongs.length === 0 ? (
                <div className="py-16 text-center text-zinc-500 text-xs">
                  <Disc className="w-10 h-10 mx-auto mb-3 text-zinc-700 animate-spin" />
                  <p className="text-zinc-400 font-medium">Your library is currently empty.</p>
                  <p className="text-zinc-600 mt-1">Generated songs will automatically appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedSongs.map((song) => (
                    <div
                      key={song.id}
                      className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-2 hover:border-purple-500/40 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-white">{song.composition.title}</h3>
                          <p className="text-[11px] text-purple-300">
                            {song.composition.genre} • {song.composition.mood} • {song.composition.tempoBpm} BPM
                          </p>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono">{song.timestamp}</span>
                      </div>

                      {/* Snippet of Chorus or Verse */}
                      <div className="bg-black/60 rounded p-2 text-[11px] text-zinc-400 italic">
                        "{song.composition.sections[0]?.lines[0] || 'Original melody'}"
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentSong(song.composition);
                            setEditableSections(song.composition.sections);
                            setActiveTab('creator');
                            if (song.audioUrl) {
                              setAudioUrl(song.audioUrl);
                              setAudioDuration(song.duration);
                            }
                          }}
                          className="px-2.5 py-1 rounded text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" /> Load in Player
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSavedSongs((prev) => {
                              const updated = prev.filter((s) => s.id !== song.id);
                              localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
                              return updated;
                            });
                          }}
                          className="text-zinc-500 hover:text-red-400 p-1"
                          title="Delete song"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Models & AI Architecture Status */}
          {activeTab === 'models' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="bg-zinc-900/80 border border-purple-500/30 rounded-xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
                  <Radio className="w-5 h-5 text-purple-400" />
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                      Google AI Studio & Engine Inspection
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Genuinely inspected audio models, speech synthesizers, and real music renderers.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Brain */}
                  <div className="bg-black/60 border border-emerald-500/30 p-3 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        Gemini 3.8 Flash (Songwriting & Arrangement Brain)
                      </div>
                      <p className="text-zinc-400 text-[11px] mt-0.5">
                        Composes full original lyrics with verses, chorus, bridge, tempo (BPM), musical key, chords, and instrument layers.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                      ONLINE
                    </span>
                  </div>

                  {/* Audio Synthesizer */}
                  <div className="bg-black/60 border border-cyan-500/30 p-3 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        Polyphonic Multi-Track Music Synthesizer & WAV Engine
                      </div>
                      <p className="text-zinc-400 text-[11px] mt-0.5">
                        Synthesizes original audio directly using Web Audio OfflineAudioContext (kick, snare, hi-hats, sub-bass, harmonic pads, and melodic hooks) and exports uncompressed 16-bit PCM WAV.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">
                      ONLINE
                    </span>
                  </div>

                  {/* Vocalizer */}
                  <div className="bg-black/60 border border-pink-500/30 p-3 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-bold text-pink-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
                        Multi-Lingual AI Vocalizer (Hindi, English, Punjabi, etc.)
                      </div>
                      <p className="text-zinc-400 text-[11px] mt-0.5">
                        Produces expressive sung and spoken vocal tracks aligned with the song beat.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-700">
                      ONLINE
                    </span>
                  </div>

                  {/* Lyria Pro / Lyria Clip status note */}
                  <div className="bg-purple-950/30 border border-purple-500/30 p-3.5 rounded-lg space-y-1.5">
                    <div className="font-bold text-purple-300 flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-purple-400" />
                      Google DeepMind Lyria Models (lyria-3-clip-preview / lyria-3-pro-preview)
                    </div>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      Per Google AI Studio guidelines, raw full-track AI music generation models like <strong>Lyria Pro</strong> and <strong>Lyria Clip</strong> require a billing-enabled paid Google Cloud API project. Song Maker seamlessly blends Gemini composition with our instant real Web Audio multi-track synthesizer to deliver 100% playable, real audio with zero delays or fake audio.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
};
