import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Download,
  Trash2,
  Clock,
  Tag,
  Search,
  Filter,
  Volume2,
  VolumeX,
  FileText,
  Bookmark,
  Share2,
  CheckCircle,
  AlertCircle,
  X,
  Edit3,
  ChevronRight,
  ChevronLeft,
  FastForward,
  Rewind,
  Music,
  ListFilter,
  Check,
  Headphones,
  Sliders
} from 'lucide-react';
import {
  VoiceRecording,
  VoiceRecordingMoment,
  RecordingCategory
} from '../../types/voiceRecorder';
import {
  saveVoiceRecording,
  getUserVoiceRecordings,
  updateVoiceRecording,
  deleteVoiceRecording,
  downloadVoiceRecordingFile,
  formatAudioDuration,
  blobToBase64
} from '../../services/voiceRecorderStorage';
import { soundEngine } from '../../utils/audio';

interface VoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
  writeLog: (text: string, tag?: string) => void;
  isHeyIshaiActive?: boolean;
}

const CATEGORY_COLORS: Record<RecordingCategory, { bg: string; text: string; border: string; glow: string }> = {
  Ideas: {
    bg: 'bg-violet-950/60',
    text: 'text-violet-300',
    border: 'border-violet-500/40',
    glow: 'rgba(139, 92, 246, 0.4)'
  },
  Study: {
    bg: 'bg-cyan-950/60',
    text: 'text-cyan-300',
    border: 'border-cyan-500/40',
    glow: 'rgba(6, 182, 212, 0.4)'
  },
  Meetings: {
    bg: 'bg-emerald-950/60',
    text: 'text-emerald-300',
    border: 'border-emerald-500/40',
    glow: 'rgba(16, 185, 129, 0.4)'
  },
  Personal: {
    bg: 'bg-rose-950/60',
    text: 'text-rose-300',
    border: 'border-rose-500/40',
    glow: 'rgba(244, 63, 94, 0.4)'
  },
  Other: {
    bg: 'bg-amber-950/60',
    text: 'text-amber-300',
    border: 'border-amber-500/40',
    glow: 'rgba(245, 158, 11, 0.4)'
  }
};

const MOMENT_PRESETS = [
  { label: 'Key Idea', type: 'idea' as const, emoji: '💡' },
  { label: 'Question', type: 'question' as const, emoji: '❓' },
  { label: 'Action Item', type: 'action' as const, emoji: '⚡' },
  { label: 'Important Note', type: 'note' as const, emoji: '📌' }
];

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  writeLog,
  isHeyIshaiActive = false
}) => {
  const userId = currentUser?.uid || currentUser?.email || 'guest_user';

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'studio' | 'library'>('studio');

  // Recorder states
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle');
  const [recordDuration, setRecordDuration] = useState(0); // in seconds
  const [currentTag, setCurrentTag] = useState<RecordingCategory>('Ideas');
  const [sessionNotes, setSessionNotes] = useState('');
  const [currentMoments, setCurrentMoments] = useState<VoiceRecordingMoment[]>([]);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Audio stream and analysis refs
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const peakSamplesRef = useRef<number[]>([]);

  // Library & Records
  const [recordings, setRecordings] = useState<VoiceRecording[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'longest' | 'shortest' | 'title'>('newest');
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleText, setEditingTitleText] = useState('');

  // Mini-Player & Current Playing Record
  const [activeRecording, setActiveRecording] = useState<VoiceRecording | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackCurrentTime, setPlaybackCurrentTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // AI Transcription states
  const [transcribingId, setTranscribingId] = useState<string | null>(null);
  const [transcribeConfirmModal, setTranscribeConfirmModal] = useState<VoiceRecording | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [showTroubleshooter, setShowTroubleshooter] = useState(false);

  // Load recordings on open or user change
  const refreshLibrary = useCallback(async () => {
    try {
      const list = await getUserVoiceRecordings(userId);
      setRecordings(list);
    } catch (err) {
      console.error('Failed to load user voice recordings:', err);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen) {
      refreshLibrary();
    }
  }, [isOpen, refreshLibrary]);

  // Clean up audio & recorder on unmount or close
  useEffect(() => {
    return () => {
      stopAndCleanupMicrophone();
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
    };
  }, []);

  const stopAndCleanupMicrophone = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // Ignored
      }
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  // Real-time canvas waveform visualizer
  const drawWaveform = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate average volume peak for waveform sample storage
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const avg = sum / bufferLength;
    if (recordingState === 'recording') {
      peakSamplesRef.current.push(Math.min(1, avg / 128));
    }

    // Dynamic Sound Studio Visualizer: Draw mirrored frequency bars with ISHAI glowing gradient
    const barWidth = (canvas.width / 48) - 2;
    const step = Math.floor(bufferLength / 48);

    for (let i = 0; i < 48; i++) {
      const value = dataArray[i * step] || 0;
      const percent = value / 255;
      const barHeight = Math.max(4, percent * (canvas.height * 0.85));

      const x = i * (barWidth + 2);
      const y = (canvas.height - barHeight) / 2;

      // Color based on intensity: cyan -> electric blue -> violet
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, '#06b6d4'); // cyan
      gradient.addColorStop(0.5, '#3b82f6'); // blue
      gradient.addColorStop(1, '#a855f7'); // violet

      ctx.fillStyle = gradient;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = percent > 0.4 ? 8 : 2;

      // Rounded bars
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 3);
      ctx.fill();
    }

    if (recordingState === 'recording' || recordingState === 'paused') {
      animFrameRef.current = requestAnimationFrame(drawWaveform);
    }
  };

  // Start Real Recording
  const handleStartRecording = async () => {
    soundEngine.playClick();
    setPermissionError(null);
    setStatusNotice(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      mediaStreamRef.current = stream;

      // Setup Web Audio Analyser
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Setup MediaRecorder with best supported mimeType
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus'
      ];
      let selectedMimeType = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMimeType = mime;
          break;
        }
      }

      const recorder = new MediaRecorder(stream, selectedMimeType ? { mimeType: selectedMimeType } : undefined);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      peakSamplesRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: selectedMimeType || 'audio/webm'
        });

        // Downsample peaks to 36 points for library preview
        const rawPeaks = peakSamplesRef.current;
        const normalizedPeaks: number[] = [];
        const step = Math.max(1, Math.floor(rawPeaks.length / 36));
        for (let i = 0; i < 36; i++) {
          const sample = rawPeaks[i * step] ?? 0.2;
          normalizedPeaks.push(Math.round(sample * 100) / 100);
        }

        const newId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const defaultTitle = `Voice Note ${new Date().toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;

        const newRecording: VoiceRecording = {
          id: newId,
          userId,
          title: defaultTitle,
          duration: recordDuration,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          tag: currentTag,
          notes: sessionNotes.trim(),
          moments: [...currentMoments],
          audioBlob,
          mimeType: selectedMimeType || 'audio/webm',
          waveformSamples: normalizedPeaks,
          lastPlayedPosition: 0,
          sizeBytes: audioBlob.size
        };

        try {
          await saveVoiceRecording(newRecording);
          writeLog(`Audio session recorded and securely stored locally (${formatAudioDuration(recordDuration)})`, 'STUDIO');
          soundEngine.playSuccess();
          await refreshLibrary();
          // Load as active playing record
          setActiveRecording({
            ...newRecording,
            audioUrl: URL.createObjectURL(audioBlob)
          });
          setStatusNotice('Recording saved to your private sound vault.');
        } catch (saveErr) {
          console.error('Failed to save recording to IndexedDB:', saveErr);
          setPermissionError('Storage Error: Unable to save audio to browser database.');
        }

        // Reset studio inputs
        setRecordDuration(0);
        setCurrentMoments([]);
        setSessionNotes('');
        setRecordingState('idle');
      };

      recorder.start(250); // Slice every 250ms for reliable chunks
      setRecordingState('recording');
      setRecordDuration(0);

      // Start elapsed timer
      timerIntervalRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);

      // Start canvas animation loop
      drawWaveform();
      writeLog('Microphone input engaged. Voice Recorder active.', 'STUDIO');
    } catch (err: any) {
      console.error('Microphone access failed:', err);
      soundEngine.playAlertBeep();
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('Microphone permission denied. School smartboards or IT policies often block microphone access by default.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionError('No microphone detected. Please ensure a microphone is connected to the smartboard.');
      } else if (err.name === 'SecurityError') {
        setPermissionError('Security Error: Microphone access is blocked by browser policy or insecure context.');
      } else {
        setPermissionError(`System failed to initialize audio input: ${err.message || 'Access Denied'}`);
      }
      setRecordingState('idle');
    }
  };

  // Pause Recording
  const handlePauseRecording = () => {
    soundEngine.playClick();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setRecordingState('paused');
      writeLog('Voice recording paused.', 'STUDIO');
    }
  };

  // Resume Recording
  const handleResumeRecording = () => {
    soundEngine.playClick();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      timerIntervalRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
      setRecordingState('recording');
      drawWaveform();
      writeLog('Voice recording resumed.', 'STUDIO');
    }
  };

  // Stop and Finish Recording
  const handleStopRecording = () => {
    soundEngine.playClick();
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setRecordingState('stopped');
  };

  // Add Moment Bookmark during Recording
  const handleAddMoment = (label = 'Key Idea', type: VoiceRecordingMoment['type'] = 'idea') => {
    soundEngine.playClick();
    const newMoment: VoiceRecordingMoment = {
      id: `mom_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: recordDuration,
      label,
      type
    };
    setCurrentMoments((prev) => [...prev, newMoment]);
    writeLog(`Bookmark added at [${formatAudioDuration(recordDuration)}]: ${label}`, 'STUDIO');
  };

  // Insert timestamp into notes
  const handleInsertTimestampToNotes = () => {
    const stamp = `[${formatAudioDuration(recordDuration)}] `;
    setSessionNotes((prev) => (prev ? `${prev}\n${stamp}` : stamp));
  };

  // Playback Control Handlers
  const handleLoadAndPlay = (recording: VoiceRecording, startAt?: number) => {
    soundEngine.playClick();
    setActiveRecording(recording);
    if (!audioElementRef.current) return;

    const url = recording.audioUrl || (recording.audioBlob ? URL.createObjectURL(recording.audioBlob) : '');
    if (!url) {
      alert('Unable to load audio resource.');
      return;
    }

    audioElementRef.current.src = url;
    audioElementRef.current.playbackRate = playbackRate;
    audioElementRef.current.volume = isMuted ? 0 : volume;

    const targetTime = startAt !== undefined ? startAt : (recording.lastPlayedPosition || 0);

    audioElementRef.current.onloadedmetadata = () => {
      if (audioElementRef.current) {
        setPlaybackDuration(audioElementRef.current.duration || recording.duration);
        audioElementRef.current.currentTime = targetTime;
        audioElementRef.current.play().then(() => setIsPlaying(true)).catch(console.warn);
      }
    };
  };

  const handleTogglePlayPause = () => {
    if (!audioElementRef.current || !activeRecording) return;
    soundEngine.playClick();
    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
      // Save last position
      updateVoiceRecording(activeRecording.id, {
        lastPlayedPosition: audioElementRef.current.currentTime
      }).catch(console.warn);
    } else {
      audioElementRef.current.play().then(() => setIsPlaying(true)).catch(console.warn);
    }
  };

  const handleSeek = (newTime: number) => {
    if (!audioElementRef.current) return;
    audioElementRef.current.currentTime = newTime;
    setPlaybackCurrentTime(newTime);
  };

  const handleSkipSeconds = (delta: number) => {
    if (!audioElementRef.current) return;
    soundEngine.playClick();
    const next = Math.max(0, Math.min(playbackDuration, audioElementRef.current.currentTime + delta));
    audioElementRef.current.currentTime = next;
    setPlaybackCurrentTime(next);
  };

  const handleRateChange = () => {
    soundEngine.playClick();
    const rates = [1, 1.25, 1.5, 2, 0.75];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (audioElementRef.current) {
      audioElementRef.current.playbackRate = nextRate;
    }
  };

  // Audio element timeupdate & ended listener
  useEffect(() => {
    const el = audioElementRef.current;
    if (!el) return;

    const handleTimeUpdate = () => {
      setPlaybackCurrentTime(el.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setPlaybackCurrentTime(0);
      if (activeRecording) {
        updateVoiceRecording(activeRecording.id, { lastPlayedPosition: 0 }).catch(console.warn);
      }
    };

    el.addEventListener('timeupdate', handleTimeUpdate);
    el.addEventListener('ended', handleEnded);

    return () => {
      el.removeEventListener('timeupdate', handleTimeUpdate);
      el.removeEventListener('ended', handleEnded);
    };
  }, [activeRecording]);

  // Rename Recording
  const handleSaveRename = async (id: string) => {
    if (!editingTitleText.trim()) {
      setEditingTitleId(null);
      return;
    }
    soundEngine.playClick();
    try {
      await updateVoiceRecording(id, { title: editingTitleText.trim() });
      await refreshLibrary();
      if (activeRecording && activeRecording.id === id) {
        setActiveRecording((prev) => prev ? { ...prev, title: editingTitleText.trim() } : null);
      }
      setEditingTitleId(null);
    } catch (err) {
      console.error('Rename failed:', err);
    }
  };

  // Delete Recording
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.playAlertBeep();
    if (!confirm('Are you sure you want to delete this voice recording permanently?')) {
      return;
    }
    try {
      await deleteVoiceRecording(id);
      if (activeRecording && activeRecording.id === id) {
        if (audioElementRef.current) audioElementRef.current.pause();
        setActiveRecording(null);
        setIsPlaying(false);
      }
      await refreshLibrary();
      writeLog('Voice recording deleted from private sandbox.', 'STUDIO');
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // AI On-Demand Transcription with Gemini
  const handleExecuteTranscription = async (recording: VoiceRecording) => {
    setTranscribeConfirmModal(null);
    setTranscribingId(recording.id);
    soundEngine.playClick();
    writeLog(`Transcribing audio via Google Gemini for "${recording.title}"...`, 'INTELLIGENCE');

    try {
      if (!recording.audioBlob) {
        throw new Error('Audio blob not present in database.');
      }

      const base64Audio = await blobToBase64(recording.audioBlob);
      const res = await fetch('/api/voice-recorder/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64Audio,
          mimeType: recording.mimeType
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      const transcript = data.transcript || 'No audible speech found.';

      await updateVoiceRecording(recording.id, { transcript });
      soundEngine.playSuccess();
      writeLog(`AI Transcript generated successfully (${transcript.slice(0, 40)}...)`, 'INTELLIGENCE');
      await refreshLibrary();
      if (activeRecording && activeRecording.id === recording.id) {
        setActiveRecording((prev) => prev ? { ...prev, transcript } : null);
      }
    } catch (err: any) {
      console.error('Transcription failed:', err);
      soundEngine.playAlertBeep();
      alert(`Transcription could not be completed: ${err.message || 'Network error'}`);
    } finally {
      setTranscribingId(null);
    }
  };

  // Filtered and Sorted Library items
  const filteredRecordings = useMemo(() => {
    return recordings
      .filter((rec) => {
        const matchesCategory = selectedCategory === 'All' || rec.tag === selectedCategory;
        const matchesSearch =
          rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rec.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (rec.transcript && rec.transcript.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return b.createdAt - a.createdAt;
        if (sortBy === 'oldest') return a.createdAt - b.createdAt;
        if (sortBy === 'longest') return b.duration - a.duration;
        if (sortBy === 'shortest') return a.duration - b.duration;
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return 0;
      });
  }, [recordings, selectedCategory, searchQuery, sortBy]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md">
      {/* Hidden audio element for real playback */}
      <audio ref={audioElementRef} className="hidden" preload="metadata" />

      <div className="relative w-full max-w-5xl h-[92vh] bg-[#090b0e] border border-cyan-500/40 rounded-3xl overflow-hidden flex flex-col shadow-[0_0_60px_rgba(6,182,212,0.15)] text-zinc-100 font-sans select-none">

        {/* --- HEADER --- */}
        <header className="px-5 py-3.5 bg-[#0e121a] border-b border-cyan-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Mic className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                  ISHAI SOUND STUDIO
                  <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Voice Recorder
                  </span>
                </h2>
              </div>
              <p className="text-[11px] text-cyan-400/80 font-mono flex items-center gap-2">
                <span>Adaptive Waveform Engine</span>
                <span>•</span>
                <span className="text-zinc-400">User: {currentUser?.displayName || currentUser?.email || 'Guest Vault'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hey ISHAI coexistence notice */}
            {isHeyIshaiActive && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-[10px] text-emerald-300 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Hey ISHAI Ready</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              title="Close Voice Recorder"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* --- NAVIGATION & TABS --- */}
        <div className="px-5 py-2.5 bg-[#0c1018] border-b border-cyan-900/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setActiveTab('studio');
                soundEngine.playClick();
              }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'studio'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Sound Studio</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('library');
                soundEngine.playClick();
                refreshLibrary();
              }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'library'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Smart Library</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-black/40 rounded-full font-mono text-cyan-300">
                {recordings.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {recordingState === 'recording' && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-red-950/80 border border-red-500/60 rounded-full text-red-200 text-xs font-mono font-bold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>REC [{formatAudioDuration(recordDuration)}]</span>
              </div>
            )}
            {recordingState === 'paused' && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-950/80 border border-amber-500/60 rounded-full text-amber-200 text-xs font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>PAUSED [{formatAudioDuration(recordDuration)}]</span>
              </div>
            )}
          </div>
        </div>

        {/* --- ERROR OR STATUS NOTIFICATIONS --- */}
        {permissionError && (
          <div className="mx-5 mt-3 p-4 bg-red-950/90 border border-red-500/80 rounded-2xl text-xs text-red-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-300">Acoustic Input Failure</p>
                <p className="text-[11px] opacity-90 leading-relaxed">{permissionError}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowTroubleshooter(true)}
                className="px-3 py-1.5 bg-red-500 text-white rounded-xl text-[10px] font-bold hover:bg-red-400 transition-colors whitespace-nowrap cursor-pointer shadow-md"
              >
                Launch Troubleshooter
              </button>
              <button onClick={() => setPermissionError(null)} className="p-1 text-red-400 hover:text-white font-bold cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* --- MICROPHONE TROUBLESHOOTER (School/Smartboard Focused) --- */}
        {showTroubleshooter && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <div className="bg-[#0e121a] border border-cyan-500/60 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 text-sm overflow-y-auto max-h-[80vh] scrollbar-thin">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shadow-lg">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base">Microphone Troubleshooter</h3>
                    <p className="text-xs text-cyan-300/70">Optimization for School Environments</p>
                  </div>
                </div>
                <button onClick={() => setShowTroubleshooter(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 text-zinc-300 leading-relaxed">
                <section className="space-y-2">
                  <h4 className="text-white font-bold flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-900 text-cyan-300 flex items-center justify-center text-[10px]">1</span>
                    Smartboard Hardware Check
                  </h4>
                  <ul className="list-disc pl-9 space-y-1 text-xs opacity-90">
                    <li>Verify if the smartboard has a built-in microphone (usually near the camera or bottom bezel).</li>
                    <li>If using an external mic, ensure it is plugged into the correct USB port on the smartboard.</li>
                    <li>Check if there is a physical "Mute" toggle on the board's control panel.</li>
                  </ul>
                </section>

                <section className="space-y-2">
                  <h4 className="text-white font-bold flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-900 text-cyan-300 flex items-center justify-center text-[10px]">2</span>
                    Browser Permission (Chrome/Edge)
                  </h4>
                  <ul className="list-disc pl-9 space-y-1 text-xs opacity-90">
                    <li>Look at the address bar (where the URL is). Click the <strong>Padlock 🔒</strong> icon.</li>
                    <li>Ensure "Microphone" is set to <strong>Allow</strong>.</li>
                    <li>If it's blocked, change it and refresh the page.</li>
                  </ul>
                </section>

                <section className="space-y-2 bg-amber-950/20 border border-amber-500/30 p-3 rounded-2xl">
                  <h4 className="text-amber-300 font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    School IT Restrictions
                  </h4>
                  <p className="text-[11px] opacity-90 pl-6">
                    School networks often block microphone/camera access via "Group Policy". If the options are greyed out or won't save, you may need to ask your teacher or IT admin to whitelist microphone access for this site.
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="text-white font-bold flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-900 text-cyan-300 flex items-center justify-center text-[10px]">3</span>
                    Windows/OS Privacy Settings
                  </h4>
                  <ul className="list-disc pl-9 space-y-1 text-xs opacity-90">
                    <li>Search for <strong>"Microphone privacy settings"</strong> in the smartboard's OS search bar.</li>
                    <li>Ensure "Allow apps to access your microphone" and "Allow desktop apps to access your microphone" are both <strong>ON</strong>.</li>
                  </ul>
                </section>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
                <button
                  onClick={() => { window.location.reload(); }}
                  className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold cursor-pointer transition-all"
                >
                  Hard Refresh Page
                </button>
                <button
                  onClick={() => setShowTroubleshooter(false)}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold rounded-xl text-xs shadow-lg cursor-pointer transition-all active:scale-95"
                >
                  Got it, I'll Check
                </button>
              </div>
            </div>
          </div>
        )}

        {statusNotice && (
          <div className="mx-5 mt-3 p-3 bg-cyan-950/80 border border-cyan-500/50 rounded-2xl text-xs text-cyan-200 flex items-center justify-between shrink-0 shadow-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{statusNotice}</span>
            </div>
            <button onClick={() => setStatusNotice(null)} className="text-cyan-400 hover:text-white font-bold">
              ✕
            </button>
          </div>
        )}

        {/* --- MAIN BODY VIEW --- */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-cyan-900/40 pb-28">

          {/* TAB 1: SOUND STUDIO WORKSPACE */}
          {activeTab === 'studio' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">

              {/* Main Visualizer & Recorder Console (Left 8 Cols) */}
              <div className="lg:col-span-8 flex flex-col gap-4">

                {/* Acoustic Canvas Card */}
                <div className="relative bg-[#0d111a] border border-cyan-900/50 rounded-3xl p-5 overflow-hidden flex flex-col items-center justify-between min-h-[300px] shadow-2xl">
                  {/* Backdrop Glow */}
                  <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-violet-500/5 pointer-events-none" />

                  {/* Top Status Bar */}
                  <div className="w-full flex items-center justify-between text-xs text-zinc-400 z-10">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      <span className="font-mono uppercase text-[11px] tracking-wider text-cyan-300">
                        {recordingState === 'recording'
                          ? 'Real-Time Microphone Stream Active'
                          : recordingState === 'paused'
                          ? 'Microphone Stream Suspended'
                          : 'Studio Ready // Press Record to Begin'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-xl border border-zinc-800 text-[11px] font-mono">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span className="text-zinc-200 font-bold">{formatAudioDuration(recordDuration)}</span>
                    </div>
                  </div>

                  {/* Real-time Waveform Canvas */}
                  <div className="w-full my-6 flex items-center justify-center z-10">
                    <canvas
                      ref={canvasRef}
                      width={640}
                      height={120}
                      className="w-full max-w-[620px] h-[110px] rounded-xl bg-black/30 border border-cyan-900/30"
                    />
                  </div>

                  {/* Primary Record Control Dock */}
                  <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 z-10 pt-2 border-t border-zinc-800/80">
                    {/* Category Selector Pill */}
                    <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
                      {(['Ideas', 'Study', 'Meetings', 'Personal', 'Other'] as RecordingCategory[]).map((cat) => {
                        const style = CATEGORY_COLORS[cat];
                        const isSel = currentTag === cat;
                        return (
                          <button
                            key={cat}
                            disabled={recordingState !== 'idle'}
                            onClick={() => {
                              soundEngine.playClick();
                              setCurrentTag(cat);
                            }}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                              isSel
                                ? `${style.bg} ${style.text} ${style.border} shadow-sm`
                                : 'bg-black/30 text-zinc-400 border-zinc-800 hover:text-white'
                            } ${recordingState !== 'idle' ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>

                    {/* Central Recording Controls */}
                    <div className="flex items-center gap-3">
                      {recordingState === 'idle' && (
                        <button
                          onClick={handleStartRecording}
                          className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-extrabold text-xs shadow-lg shadow-red-500/25 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                        >
                          <span className="w-3 h-3 rounded-full bg-white animate-ping" />
                          <span>Start Recording</span>
                        </button>
                      )}

                      {recordingState === 'recording' && (
                        <>
                          <button
                            onClick={handlePauseRecording}
                            className="p-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer shadow-md"
                            title="Pause Recording"
                          >
                            <Pause className="w-4 h-4" />
                          </button>

                          <button
                            onClick={handleStopRecording}
                            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/25 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                          >
                            <Square className="w-4 h-4 fill-white" />
                            <span>Finish & Save</span>
                          </button>
                        </>
                      )}

                      {recordingState === 'paused' && (
                        <>
                          <button
                            onClick={handleResumeRecording}
                            className="p-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer shadow-md"
                            title="Resume Recording"
                          >
                            <Play className="w-4 h-4 fill-emerald-300" />
                          </button>

                          <button
                            onClick={handleStopRecording}
                            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/25 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                          >
                            <Square className="w-4 h-4 fill-white" />
                            <span>Save Recording</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Moments Bar (Flag Important Moments in Real Time) */}
                <div className="bg-[#0e121a] border border-cyan-900/40 rounded-2xl p-4 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Bookmark className="w-4 h-4 text-cyan-400" />
                      <span>Timestamped Moments</span>
                      <span className="text-[10px] text-zinc-400">({currentMoments.length})</span>
                    </div>

                    <button
                      onClick={() => handleAddMoment('Important Idea', 'idea')}
                      disabled={recordingState === 'idle'}
                      className={`px-3 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        recordingState === 'idle' ? 'opacity-40 cursor-not-allowed' : ''
                      }`}
                    >
                      <span>+ Flag Moment at {formatAudioDuration(recordDuration)}</span>
                    </button>
                  </div>

                  {/* Preset Quick Tags */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {MOMENT_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        disabled={recordingState === 'idle'}
                        onClick={() => handleAddMoment(preset.label, preset.type)}
                        className={`px-2.5 py-1 bg-black/40 hover:bg-zinc-800 border border-zinc-800 hover:border-cyan-500/40 rounded-xl text-[11px] text-zinc-300 flex items-center gap-1.5 transition-all cursor-pointer ${
                          recordingState === 'idle' ? 'opacity-40 cursor-not-allowed' : ''
                        }`}
                      >
                        <span>{preset.emoji}</span>
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Current Moments List */}
                  {currentMoments.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1 max-h-32 overflow-y-auto scrollbar-thin">
                      {currentMoments.map((m, idx) => (
                        <div
                          key={m.id}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-950/60 border border-cyan-500/30 rounded-xl text-xs text-cyan-200"
                        >
                          <span className="font-mono text-[10px] text-cyan-400 font-bold">
                            [{formatAudioDuration(m.timestamp)}]
                          </span>
                          <span>{m.label}</span>
                          <button
                            onClick={() => setCurrentMoments((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-zinc-500 hover:text-red-400 ml-1 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-500 italic">
                      No moments flagged yet. Click above during recording to mark ideas, questions, or highlights.
                    </p>
                  )}
                </div>
              </div>

              {/* Side Notebook Panel (Right 4 Cols) */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <div className="bg-[#0e121a] border border-cyan-900/40 rounded-3xl p-4 flex flex-col h-full shadow-lg">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <FileText className="w-4 h-4 text-violet-400" />
                      <span>Notes Beside Audio</span>
                    </div>

                    <button
                      onClick={handleInsertTimestampToNotes}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono font-semibold cursor-pointer"
                      title="Insert current timestamp into notes"
                    >
                      + Timestamp
                    </button>
                  </div>

                  <p className="text-[11px] text-zinc-400 mb-2 leading-relaxed">
                    Capture notes, meeting agendas, and key thoughts synchronized with your audio.
                  </p>

                  <textarea
                    rows={12}
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="Type notes for this session here... (e.g. [00:15] Review roadmap specifications)"
                    className="flex-1 w-full bg-[#05070a] border border-cyan-900/40 rounded-2xl p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400 font-mono leading-relaxed resize-none"
                  />

                  <div className="pt-3 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <span>Private sandbox storage</span>
                    <span>{sessionNotes.length} characters</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SMART LIBRARY */}
          {activeTab === 'library' && (
            <div className="space-y-4">

              {/* Search, Filter & Sort Controls */}
              <div className="bg-[#0e121a] border border-cyan-900/40 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xl">
                {/* Search Bar */}
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title, notes, or transcript..."
                    className="w-full bg-[#05070a] border border-cyan-900/50 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2 text-xs text-zinc-400 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Tag Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
                  {['All', 'Ideas', 'Study', 'Meetings', 'Personal', 'Other'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        soundEngine.playClick();
                        setSelectedCategory(cat);
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                          : 'bg-black/40 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Sort selector */}
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <ListFilter className="w-3.5 h-3.5 text-cyan-400" />
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="bg-[#05070a] border border-zinc-800 text-zinc-200 text-xs rounded-xl px-2.5 py-1.5 outline-none focus:border-cyan-400"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="longest">Longest Duration</option>
                    <option value="shortest">Shortest Duration</option>
                    <option value="title">Title (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Recordings Grid / List */}
              {filteredRecordings.length === 0 ? (
                <div className="py-20 text-center bg-[#0e121a] rounded-3xl border border-zinc-800/80 p-6 space-y-3">
                  <Headphones className="w-12 h-12 text-zinc-600 mx-auto" />
                  <h3 className="text-sm font-bold text-zinc-300">No Voice Recordings Found</h3>
                  <p className="text-xs text-zinc-500 max-w-md mx-auto">
                    {searchQuery || selectedCategory !== 'All'
                      ? 'No recordings match your current filters. Try resetting search or category.'
                      : 'You have not recorded any audio yet. Switch to Sound Studio and click Record to create your first voice note!'}
                  </p>
                  <button
                    onClick={() => setActiveTab('studio')}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                  >
                    Open Sound Studio
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredRecordings.map((rec) => {
                    const style = CATEGORY_COLORS[rec.tag] || CATEGORY_COLORS.Other;
                    const isCurrentPlaying = activeRecording?.id === rec.id;

                    return (
                      <div
                        key={rec.id}
                        onClick={() => handleLoadAndPlay(rec)}
                        className={`p-4 bg-[#0e121a] border rounded-2xl transition-all cursor-pointer space-y-3 hover:border-cyan-500/60 shadow-lg ${
                          isCurrentPlaying
                            ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)] bg-[#101624]'
                            : 'border-zinc-800/80'
                        }`}
                      >
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            {editingTitleId === rec.id ? (
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={editingTitleText}
                                  onChange={(e) => setEditingTitleText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveRename(rec.id);
                                    if (e.key === 'Escape') setEditingTitleId(null);
                                  }}
                                  autoFocus
                                  className="bg-black border border-cyan-400 rounded px-2 py-0.5 text-xs text-white outline-none w-full"
                                />
                                <button
                                  onClick={() => handleSaveRename(rec.id)}
                                  className="text-emerald-400 text-xs px-1 hover:text-emerald-300"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => setEditingTitleId(null)}
                                  className="text-zinc-400 text-xs px-1 hover:text-white"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 group">
                                <h4 className="text-xs font-extrabold text-white truncate">{rec.title}</h4>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTitleId(rec.id);
                                    setEditingTitleText(rec.title);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-cyan-300 transition-opacity"
                                  title="Rename recording"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono mt-0.5">
                              <span>{new Date(rec.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              <span>•</span>
                              <span>{formatAudioDuration(rec.duration)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${style.bg} ${style.text} ${style.border}`}>
                              {rec.tag}
                            </span>
                          </div>
                        </div>

                        {/* Waveform Peak Preview Bar */}
                        <div className="h-7 w-full bg-black/40 rounded-lg flex items-center gap-0.5 px-2 overflow-hidden border border-zinc-800/40">
                          {rec.waveformSamples && rec.waveformSamples.length > 0 ? (
                            rec.waveformSamples.map((sample, idx) => (
                              <div
                                key={idx}
                                className={`flex-1 rounded-sm transition-all ${
                                  isCurrentPlaying ? 'bg-cyan-400' : 'bg-cyan-900/60'
                                }`}
                                style={{
                                  height: `${Math.max(15, sample * 100)}%`
                                }}
                              />
                            ))
                          ) : (
                            <div className="w-full text-center text-[10px] text-zinc-600 font-mono">
                              Sound Studio Waveform
                            </div>
                          )}
                        </div>

                        {/* Moments preview chips */}
                        {rec.moments && rec.moments.length > 0 && (
                          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-0.5">
                            {rec.moments.map((m) => (
                              <button
                                key={m.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLoadAndPlay(rec, m.timestamp);
                                }}
                                className="px-2 py-0.5 bg-black/50 hover:bg-cyan-950/80 border border-zinc-800 hover:border-cyan-500/50 rounded-lg text-[10px] text-cyan-300 font-mono flex items-center gap-1 shrink-0 transition-colors"
                                title={`Jump to ${m.label} at ${formatAudioDuration(m.timestamp)}`}
                              >
                                <span className="text-cyan-400 font-bold">{formatAudioDuration(m.timestamp)}</span>
                                <span className="text-zinc-300 truncate max-w-[80px]">{m.label}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Notes Preview */}
                        {rec.notes && (
                          <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed bg-black/30 p-2 rounded-xl border border-zinc-800/40 font-mono">
                            {rec.notes}
                          </p>
                        )}

                        {/* Transcript snippet if available */}
                        {rec.transcript && (
                          <div className="p-2 bg-purple-950/30 border border-purple-500/30 rounded-xl text-[11px] text-purple-200 font-sans space-y-1">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                              <Sparkles className="w-3 h-3 text-purple-400" />
                              <span>AI Transcript</span>
                            </div>
                            <p className="line-clamp-2 leading-relaxed text-zinc-300">
                              {rec.transcript}
                            </p>
                          </div>
                        )}

                        {/* Card Actions Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLoadAndPlay(rec);
                            }}
                            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
                          >
                            {isCurrentPlaying && isPlaying ? (
                              <>
                                <Pause className="w-3.5 h-3.5" />
                                <span>Pause</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 fill-cyan-400" />
                                <span>Play Audio</span>
                              </>
                            )}
                          </button>

                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {/* Request Transcript Button */}
                            {!rec.transcript && (
                              <button
                                onClick={() => setTranscribeConfirmModal(rec)}
                                disabled={transcribingId === rec.id}
                                className="px-2 py-1 bg-purple-950/60 hover:bg-purple-900 border border-purple-500/40 text-purple-300 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                                title="Request Speech-to-Text Transcription via Google Gemini"
                              >
                                <Sparkles className={`w-3 h-3 ${transcribingId === rec.id ? 'animate-spin' : ''}`} />
                                <span>{transcribingId === rec.id ? 'Transcribing...' : 'AI Transcript'}</span>
                              </button>
                            )}

                            {/* Download Button */}
                            <button
                              onClick={() => downloadVoiceRecordingFile(rec)}
                              className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300 rounded-lg transition-colors cursor-pointer"
                              title="Download audio file"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={(e) => handleDelete(rec.id, e)}
                              className="p-1.5 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                              title="Delete recording"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

        </div>

        {/* --- PERSISTENT COMPACT MINI-PLAYER DOCK --- */}
        {activeRecording && (
          <div className="absolute bottom-0 left-0 right-0 z-30 bg-[#0e121a]/98 backdrop-blur-xl border-t border-cyan-500/40 px-4 py-3 flex flex-col gap-2 shadow-2xl">
            {/* Scrubber Bar */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-cyan-400 w-10 text-right">
                {formatAudioDuration(playbackCurrentTime)}
              </span>

              <div className="relative flex-1 group">
                <input
                  type="range"
                  min={0}
                  max={playbackDuration || activeRecording.duration || 100}
                  step={0.1}
                  value={playbackCurrentTime}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:h-2 transition-all"
                />

                {/* Moments dots along scrubber */}
                {activeRecording.moments && activeRecording.moments.map((m) => {
                  const pct = Math.min(100, Math.max(0, (m.timestamp / (playbackDuration || activeRecording.duration || 1)) * 100));
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleSeek(m.timestamp)}
                      style={{ left: `${pct}%` }}
                      className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-300 border border-black cursor-pointer hover:scale-150 transition-transform"
                      title={`${m.label} (${formatAudioDuration(m.timestamp)})`}
                    />
                  );
                })}
              </div>

              <span className="text-[10px] font-mono text-zinc-400 w-10">
                {formatAudioDuration(playbackDuration || activeRecording.duration)}
              </span>
            </div>

            {/* Bottom Controls Row */}
            <div className="flex items-center justify-between">
              {/* Playing Info */}
              <div className="flex items-center gap-2 min-w-0 max-w-[200px] sm:max-w-xs">
                <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <Music className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate">{activeRecording.title}</div>
                  <div className="text-[10px] text-cyan-400 font-mono truncate">{activeRecording.tag}</div>
                </div>
              </div>

              {/* Central Audio Transport Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSkipSeconds(-5)}
                  className="p-1.5 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs transition-colors cursor-pointer"
                  title="Rewind 5 seconds"
                >
                  <Rewind className="w-4 h-4" />
                </button>

                <button
                  onClick={handleTogglePlayPause}
                  className="w-9 h-9 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white flex items-center justify-center shadow-md shadow-cyan-500/25 cursor-pointer transition-all active:scale-95"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                </button>

                <button
                  onClick={() => handleSkipSeconds(5)}
                  className="p-1.5 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs transition-colors cursor-pointer"
                  title="Fast forward 5 seconds"
                >
                  <FastForward className="w-4 h-4" />
                </button>
              </div>

              {/* Audio Settings (Speed, Volume, Close) */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRateChange}
                  className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-cyan-300 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer"
                  title="Playback speed"
                >
                  {playbackRate}x
                </button>

                <div className="hidden sm:flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setIsMuted(!isMuted);
                      if (audioElementRef.current) {
                        audioElementRef.current.volume = isMuted ? volume : 0;
                      }
                    }}
                    className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setVolume(v);
                      setIsMuted(false);
                      if (audioElementRef.current) audioElementRef.current.volume = v;
                    }}
                    className="w-16 h-1 bg-zinc-800 rounded appearance-none accent-cyan-400 cursor-pointer"
                  />
                </div>

                <button
                  onClick={() => downloadVoiceRecordingFile(activeRecording)}
                  className="p-1.5 text-zinc-400 hover:text-cyan-300 cursor-pointer"
                  title="Download recording"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    if (audioElementRef.current) audioElementRef.current.pause();
                    setActiveRecording(null);
                    setIsPlaying(false);
                  }}
                  className="p-1.5 text-zinc-500 hover:text-white cursor-pointer"
                  title="Dismiss player"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- AI TRANSCRIPTION CONFIRMATION DIALOG --- */}
        {transcribeConfirmModal && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[#0e121a] border border-purple-500/80 rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-950/80 border border-purple-500/50 flex items-center justify-center text-purple-300 shadow-md">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Generate AI Transcript</h3>
                  <p className="text-[11px] text-purple-300/70">Powered by Google Gemini 2.5 Flash</p>
                </div>
              </div>

              <div className="p-3.5 bg-black/50 border border-zinc-800 rounded-2xl space-y-2 text-xs">
                <div>Title: <strong className="text-white">{transcribeConfirmModal.title}</strong></div>
                <div>Duration: <span className="font-mono text-cyan-300">{formatAudioDuration(transcribeConfirmModal.duration)}</span></div>
                <div>Category: <span className="text-zinc-300">{transcribeConfirmModal.tag}</span></div>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                Your audio recording will be sent to Google Gemini to transcribe spoken words into structured text with timestamps.
                <br /><br />
                <span className="text-[11px] text-zinc-400">
                  This action is only initiated upon your explicit request. The resulting transcript will be saved to your private sound vault.
                </span>
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  onClick={() => setTranscribeConfirmModal(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleExecuteTranscription(transcribeConfirmModal)}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-purple-500/25 cursor-pointer"
                >
                  Generate Transcript
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
