import React, { useState, useEffect, useRef, useCallback } from 'react';
import { soundEngine } from '../utils/audio';
import {
  VideoProject,
  TimelineClip,
  MediaAsset,
  AspectRatioType,
  ASPECT_RATIO_DIMENSIONS,
  ExportSettings,
  SubtitleSegment,
} from '../types/videoEditor';
import {
  renderCompositeFrame,
  formatTimecode,
  formatTimeShort,
  exportToSRT,
  parseSRT,
} from '../utils/videoCompositor';
import { renderAndExportVideo, ExportProgress } from '../utils/videoExporter';
import {
  Film,
  Play,
  Pause,
  RotateCcw,
  Scissors,
  Trash2,
  Copy,
  Download,
  Upload,
  Type,
  MessageSquare,
  Music,
  Sliders,
  Sparkles,
  Maximize2,
  Undo2,
  Redo2,
  Save,
  Plus,
  Volume2,
  VolumeX,
  X,
  Shield,
  Layers,
  Palette,
  FileVideo,
  FileAudio,
  Image as ImageIcon,
  Check,
  AlertCircle,
  HelpCircle,
  Mic,
  MicOff,
} from 'lucide-react';

interface AIVideoEditorModalProps {
  onClose: () => void;
  onLog: (text: string, tag: string) => void;
  currentUser?: any;
}

// Pre-bundled local sample footage from /videos/
const SAMPLE_VIDEOS: MediaAsset[] = [
  {
    id: 'sample-cyberpunk',
    name: 'Cyberpunk Metropolis (4K)',
    type: 'video',
    url: '/videos/cyberpunk.mp4',
    duration: 15,
    thumbnail: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400&auto=format&fit=crop',
  },
  {
    id: 'sample-mountain',
    name: 'Alpine Mountain Peak',
    type: 'video',
    url: '/videos/mountain.mp4',
    duration: 15,
    thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&auto=format&fit=crop',
  },
  {
    id: 'sample-ocean',
    name: 'Emerald Ocean Waves',
    type: 'video',
    url: '/videos/ocean.mp4',
    duration: 15,
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format&fit=crop',
  },
  {
    id: 'sample-supercar',
    name: 'Supercar Night Drift',
    type: 'video',
    url: '/videos/supercar.mp4',
    duration: 15,
    thumbnail: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&auto=format&fit=crop',
  },
  {
    id: 'sample-space',
    name: 'Cosmic Nebula Odyssey',
    type: 'video',
    url: '/videos/space.mp4',
    duration: 15,
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop',
  },
  {
    id: 'sample-robot',
    name: 'Cybernetic Robot Core',
    type: 'video',
    url: '/videos/robot.mp4',
    duration: 15,
    thumbnail: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&auto=format&fit=crop',
  },
];

const DEFAULT_AUDIO_TRACKS = [
  {
    name: 'Phonk Night Drift (Bass Boost)',
    url: 'https://archive.org/download/montagem-supersonic-slowed/Montagem%20Supersonic%20%28Slowed%29.mp3',
    duration: 134,
  },
  {
    name: 'Synthwave Highway Overdrive',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: 180,
  },
  {
    name: 'Cybernetic Lo-Fi Chill',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: 210,
  },
];

const STORAGE_PROJECT_KEY = 'superai_ai_video_editor_current_project';

export const AIVideoEditorModal: React.FC<AIVideoEditorModalProps> = ({
  onClose,
  onLog,
}) => {
  // =========================================================================
  // STATE: PROJECT & TIMELINE
  // =========================================================================
  const [project, setProject] = useState<VideoProject>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROJECT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.clips)) return parsed;
      }
    } catch (e) {
      console.warn('Could not restore saved video project:', e);
    }

    // Default starter project with Cyberpunk sample footage
    return {
      id: `proj_${Date.now()}`,
      name: 'Cyberpunk Epic Short',
      updatedAt: new Date().toISOString(),
      canvas: {
        aspectRatio: '16:9',
        width: 1280,
        height: 720,
        backgroundMode: 'blur',
        backgroundColor: '#05080c',
      },
      assets: [...SAMPLE_VIDEOS],
      clips: [
        {
          id: 'clip_v1_01',
          assetId: 'sample-cyberpunk',
          trackId: 'video-1',
          type: 'video',
          name: 'Cyberpunk Metropolis',
          sourceUrl: '/videos/cyberpunk.mp4',
          timelineStart: 0,
          sourceIn: 0,
          sourceOut: 7.5,
          duration: 7.5,
          sourceDuration: 15,
          layer: 1,
          opacity: 1,
          volume: 1,
          speed: 1,
          crop: { x: 0, y: 0, width: 1, height: 1 },
          transform: { x: 0, y: 0, scale: 1, rotation: 0 },
          filter: {
            brightness: 110,
            contrast: 115,
            saturation: 120,
            blur: 0,
            grayscale: 0,
            sepia: 0,
            vignette: 15,
            temperature: 0,
            invert: 0,
            presetName: 'Vivid Cyber',
          },
          transition: { type: 'none', duration: 0.5 },
        },
        {
          id: 'clip_v1_02',
          assetId: 'sample-supercar',
          trackId: 'video-1',
          type: 'video',
          name: 'Supercar Night Drift',
          sourceUrl: '/videos/supercar.mp4',
          timelineStart: 7.5,
          sourceIn: 2,
          sourceOut: 10,
          duration: 8,
          sourceDuration: 15,
          layer: 1,
          opacity: 1,
          volume: 1,
          speed: 1,
          crop: { x: 0, y: 0, width: 1, height: 1 },
          transform: { x: 0, y: 0, scale: 1, rotation: 0 },
          filter: {
            brightness: 100,
            contrast: 110,
            saturation: 110,
            blur: 0,
            grayscale: 0,
            sepia: 0,
            vignette: 20,
            temperature: 0,
            invert: 0,
          },
          transition: { type: 'fade-black', duration: 0.6 },
        },
        {
          id: 'clip_text_01',
          trackId: 'text-1',
          type: 'text',
          name: 'Main Title',
          sourceUrl: '',
          timelineStart: 0.5,
          sourceIn: 0,
          sourceOut: 4.5,
          duration: 4.0,
          sourceDuration: 4.0,
          layer: 10,
          opacity: 1,
          volume: 0,
          speed: 1,
          crop: { x: 0, y: 0, width: 1, height: 1 },
          transform: { x: 0, y: 0, scale: 1, rotation: 0 },
          filter: {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            blur: 0,
            grayscale: 0,
            sepia: 0,
            vignette: 0,
            temperature: 0,
            invert: 0,
          },
          transition: { type: 'none', duration: 0 },
          textData: {
            text: 'SUPERAI // STUDIO',
            fontFamily: 'Inter',
            fontSize: 48,
            color: '#10B981',
            fontWeight: '900',
            fontStyle: 'normal',
            alignment: 'center',
            outlineColor: '#000000',
            outlineWidth: 4,
            shadowColor: 'rgba(16,185,129,0.8)',
            shadowBlur: 16,
            backgroundColor: 'rgba(5, 8, 12, 0.75)',
            backgroundPadding: 12,
            animation: 'pop',
            posX: 50,
            posY: 25,
          },
        },
        {
          id: 'clip_cap_01',
          trackId: 'captions-1',
          type: 'caption',
          name: 'Caption 1',
          sourceUrl: '',
          timelineStart: 1.0,
          sourceIn: 0,
          sourceOut: 4.0,
          duration: 3.0,
          sourceDuration: 3.0,
          layer: 20,
          opacity: 1,
          volume: 0,
          speed: 1,
          crop: { x: 0, y: 0, width: 1, height: 1 },
          transform: { x: 0, y: 0, scale: 1, rotation: 0 },
          filter: {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            blur: 0,
            grayscale: 0,
            sepia: 0,
            vignette: 0,
            temperature: 0,
            invert: 0,
          },
          transition: { type: 'none', duration: 0 },
          captionData: {
            text: 'NEXT-GEN MULTITRACK EDITING',
            stylePreset: 'bold-creator',
            highlightColor: '#FFE600',
            fontSize: 34,
            positionY: 80,
            outlineColor: '#000000',
          },
        },
        {
          id: 'clip_cap_02',
          trackId: 'captions-1',
          type: 'caption',
          name: 'Caption 2',
          sourceUrl: '',
          timelineStart: 5.0,
          sourceIn: 0,
          sourceOut: 8.5,
          duration: 3.5,
          sourceDuration: 3.5,
          layer: 20,
          opacity: 1,
          volume: 0,
          speed: 1,
          crop: { x: 0, y: 0, width: 1, height: 1 },
          transform: { x: 0, y: 0, scale: 1, rotation: 0 },
          filter: {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            blur: 0,
            grayscale: 0,
            sepia: 0,
            vignette: 0,
            temperature: 0,
            invert: 0,
          },
          transition: { type: 'none', duration: 0 },
          captionData: {
            text: 'SYNCED IN REAL-TIME WITH AI',
            stylePreset: 'bold-creator',
            highlightColor: '#38BDF8',
            fontSize: 34,
            positionY: 80,
            outlineColor: '#000000',
          },
        },
      ],
      duration: 15.5,
    };
  });

  // Undo / Redo History Stacks
  const [history, setHistory] = useState<VideoProject[]>([]);
  const [redoStack, setRedoStack] = useState<VideoProject[]>([]);

  // Navigation & Tool tabs
  type ToolTab =
    | 'media'
    | 'text'
    | 'captions'
    | 'audio'
    | 'effects'
    | 'transitions'
    | 'canvas'
    | 'ai_tools'
    | 'creative';
  const [activeTab, setActiveTab] = useState<ToolTab>('media');

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadTime, setPlayheadTime] = useState(0);
  const [isLooping, setIsLooping] = useState(false);

  // Selection
  const [selectedClipId, setSelectedClipId] = useState<string | null>('clip_v1_01');
  const selectedClip = project.clips.find((c) => c.id === selectedClipId) || null;

  // Viewport / UI state
  const [timelineZoom, setTimelineZoom] = useState(40); // pixels per second
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [isAutosaved, setIsAutosaved] = useState(true);

  // Export State Modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    format: 'webm',
    resolution: '720p',
    fps: 30,
    quality: 'standard',
    includeAudio: true,
    burnCaptions: true,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const exportCancelRef = useRef(false);

  // Audio recording voiceover state
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const micMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const micChunksRef = useRef<Blob[]>([]);

  // Canvas Refs
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoElementsMapRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const imageElementsMapRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const animationFrameRef = useRef<number | null>(null);

  // Creative suggestions state
  const [creativeSuggestions, setCreativeSuggestions] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Helper to push history
  const pushHistory = useCallback(
    (newProject: VideoProject) => {
      setHistory((prev) => [...prev.slice(-25), project]);
      setRedoStack([]);
      setProject(newProject);
      setIsAutosaved(false);
    },
    [project]
  );

  const handleUndo = () => {
    if (history.length === 0) return;
    soundEngine.playClick();
    const previous = history[history.length - 1];
    setRedoStack((prev) => [project, ...prev]);
    setHistory((prev) => prev.slice(0, -1));
    setProject(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    soundEngine.playClick();
    const next = redoStack[0];
    setHistory((prev) => [...prev, project]);
    setRedoStack((prev) => prev.slice(1));
    setProject(next);
  };

  // Recalculate project total duration based on furthest clip end
  const recalculateDuration = (clips: TimelineClip[]): number => {
    if (clips.length === 0) return 5;
    const maxEnd = Math.max(...clips.map((c) => c.timelineStart + c.duration));
    return Math.max(3, Number(maxEnd.toFixed(2)));
  };

  // Autosave to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_PROJECT_KEY, JSON.stringify(project));
        setIsAutosaved(true);
      } catch (e) {
        console.warn('Autosave error:', e);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [project]);

  // Preload video elements when clips change
  useEffect(() => {
    project.clips.forEach((clip) => {
      if (clip.type === 'video' && clip.sourceUrl && !videoElementsMapRef.current.has(clip.sourceUrl)) {
        const v = document.createElement('video');
        v.crossOrigin = 'anonymous';
        v.src = clip.sourceUrl;
        v.muted = true;
        v.playsInline = true;
        v.preload = 'auto';
        videoElementsMapRef.current.set(clip.sourceUrl, v);
      } else if (clip.type === 'image' && clip.sourceUrl && !imageElementsMapRef.current.has(clip.sourceUrl)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = clip.sourceUrl;
        imageElementsMapRef.current.set(clip.sourceUrl, img);
      }
    });
  }, [project.clips]);

  // Sync video elements seek position to playhead
  const syncMediaPlayback = useCallback(
    (time: number) => {
      project.clips.forEach((clip) => {
        if (clip.type === 'video') {
          const v = videoElementsMapRef.current.get(clip.sourceUrl);
          if (v && v.readyState >= 1) {
            if (time >= clip.timelineStart && time < clip.timelineStart + clip.duration) {
              const localTime = clip.sourceIn + (time - clip.timelineStart) * (clip.speed || 1);
              if (Math.abs(v.currentTime - localTime) > 0.08) {
                v.currentTime = localTime;
              }
            }
          }
        }
      });
    },
    [project.clips]
  );

  // Render preview frame on canvas
  const drawCurrentFrame = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderCompositeFrame(
      ctx,
      project.canvas.width,
      project.canvas.height,
      project.canvas,
      project.clips,
      playheadTime,
      videoElementsMapRef.current,
      imageElementsMapRef.current,
      { showSafeZoneGuides: showSafeZones }
    );
  }, [project.canvas, project.clips, playheadTime, showSafeZones]);

  // Draw frame whenever playhead, canvas, or clips update
  useEffect(() => {
    syncMediaPlayback(playheadTime);
    drawCurrentFrame();
  }, [playheadTime, project.canvas, project.clips, syncMediaPlayback, drawCurrentFrame]);

  // Playback Loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    let lastTimestamp = performance.now();

    const loop = (timestamp: number) => {
      const deltaSec = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      setPlayheadTime((prev) => {
        const nextTime = prev + deltaSec;
        if (nextTime >= project.duration) {
          if (isLooping) return 0;
          setIsPlaying(false);
          return project.duration;
        }
        return nextTime;
      });

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, project.duration, isLooping]);

  // =========================================================================
  // KEYBOARD SHORTCUTS
  // =========================================================================
  const handleKeyDownRef = useRef<(e: KeyboardEvent) => void>(() => {});
  handleKeyDownRef.current = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

    if (e.code === 'Space') {
      e.preventDefault();
      setIsPlaying((p) => !p);
    } else if (e.code === 'KeyS' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      handleSplitClip();
    } else if (e.code === 'Delete' || e.code === 'Backspace') {
      e.preventDefault();
      handleDeleteClip();
    } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
      e.preventDefault();
      if (e.shiftKey) handleRedo();
      else handleUndo();
    } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') {
      e.preventDefault();
      handleRedo();
    } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
      e.preventDefault();
      localStorage.setItem(STORAGE_PROJECT_KEY, JSON.stringify(project));
      setIsAutosaved(true);
      soundEngine.playSuccess();
      onLog('[AI_VIDEO_EDITOR] Project successfully saved to storage.', 'DATABASE');
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => handleKeyDownRef.current(e);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // =========================================================================
  // TIMELINE EDITING OPERATIONS
  // =========================================================================

  // Split selected clip at playhead
  const handleSplitClip = () => {
    if (!selectedClip) return;
    if (playheadTime <= selectedClip.timelineStart || playheadTime >= selectedClip.timelineStart + selectedClip.duration) {
      soundEngine.playAlertBeep();
      return;
    }

    soundEngine.playClick();
    const splitOffset = playheadTime - selectedClip.timelineStart;
    const speed = selectedClip.speed || 1;
    const splitSourcePoint = selectedClip.sourceIn + splitOffset * speed;

    const firstHalf: TimelineClip = {
      ...selectedClip,
      duration: splitOffset,
      sourceOut: splitSourcePoint,
    };

    const secondHalf: TimelineClip = {
      ...selectedClip,
      id: `clip_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: `${selectedClip.name} (Part 2)`,
      timelineStart: playheadTime,
      sourceIn: splitSourcePoint,
      duration: selectedClip.duration - splitOffset,
    };

    const nextClips = project.clips
      .map((c) => (c.id === selectedClip.id ? firstHalf : c))
      .concat(secondHalf);

    pushHistory({
      ...project,
      clips: nextClips,
      duration: recalculateDuration(nextClips),
    });

    setSelectedClipId(secondHalf.id);
    onLog(`[AI_VIDEO_EDITOR] Split clip "${selectedClip.name}" at ${formatTimecode(playheadTime)}`, 'SYSTEM');
  };

  // Delete selected clip
  const handleDeleteClip = () => {
    if (!selectedClipId) return;
    soundEngine.playClick();
    const nextClips = project.clips.filter((c) => c.id !== selectedClipId);
    pushHistory({
      ...project,
      clips: nextClips,
      duration: recalculateDuration(nextClips),
    });
    setSelectedClipId(null);
    onLog(`[AI_VIDEO_EDITOR] Clip removed from timeline.`, 'SYSTEM');
  };

  // Duplicate selected clip
  const handleDuplicateClip = () => {
    if (!selectedClip) return;
    soundEngine.playClick();
    const newClip: TimelineClip = {
      ...selectedClip,
      id: `clip_${Date.now()}_dup`,
      name: `${selectedClip.name} (Copy)`,
      timelineStart: playheadTime,
    };
    const nextClips = [...project.clips, newClip];
    pushHistory({
      ...project,
      clips: nextClips,
      duration: recalculateDuration(nextClips),
    });
    setSelectedClipId(newClip.id);
  };

  // Close gaps between clips on track
  const handleRippleDeleteGaps = () => {
    soundEngine.playClick();
    const sorted = [...project.clips]
      .filter((c) => c.trackId === 'video-1')
      .sort((a, b) => a.timelineStart - b.timelineStart);

    let currentOffset = 0;
    const reorderedVideo1 = sorted.map((clip) => {
      const updated = { ...clip, timelineStart: currentOffset };
      currentOffset += clip.duration;
      return updated;
    });

    const otherClips = project.clips.filter((c) => c.trackId !== 'video-1');
    const nextClips = [...otherClips, ...reorderedVideo1];

    pushHistory({
      ...project,
      clips: nextClips,
      duration: recalculateDuration(nextClips),
    });
    onLog('[AI_VIDEO_EDITOR] Ripple gap closure complete: all video-1 cuts snapped flush.', 'SYSTEM');
  };

  // Trim Left Handle
  const handleTrimLeft = (deltaSec: number) => {
    if (!selectedClip) return;
    const newStart = Math.max(0, selectedClip.timelineStart + deltaSec);
    const newDuration = Math.max(0.5, selectedClip.duration - deltaSec);
    const speed = selectedClip.speed || 1;
    const newSourceIn = Math.max(0, selectedClip.sourceIn + deltaSec * speed);

    const updatedClips = project.clips.map((c) =>
      c.id === selectedClip.id
        ? {
            ...c,
            timelineStart: newStart,
            duration: newDuration,
            sourceIn: newSourceIn,
          }
        : c
    );

    setProject({
      ...project,
      clips: updatedClips,
      duration: recalculateDuration(updatedClips),
    });
  };

  // Trim Right Handle
  const handleTrimRight = (deltaSec: number) => {
    if (!selectedClip) return;
    const newDuration = Math.max(0.5, selectedClip.duration + deltaSec);
    const speed = selectedClip.speed || 1;
    const newSourceOut = selectedClip.sourceIn + newDuration * speed;

    const updatedClips = project.clips.map((c) =>
      c.id === selectedClip.id
        ? {
            ...c,
            duration: newDuration,
            sourceOut: newSourceOut,
          }
        : c
    );

    setProject({
      ...project,
      clips: updatedClips,
      duration: recalculateDuration(updatedClips),
    });
  };

  // =========================================================================
  // MEDIA ASSET HANDLERS
  // =========================================================================
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    soundEngine.playClick();
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video');
      const isAudio = file.type.startsWith('audio');
      const isImage = file.type.startsWith('image');

      const assetType = isVideo ? 'video' : isAudio ? 'audio' : isImage ? 'image' : 'video';

      const newAsset: MediaAsset = {
        id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        type: assetType,
        url,
        duration: isVideo || isAudio ? 10 : 5, // estimated initial duration
        size: file.size,
      };

      // Add to assets and timeline
      setProject((prev) => {
        const nextAssets = [newAsset, ...prev.assets];
        const newClip: TimelineClip = {
          id: `clip_${Date.now()}`,
          assetId: newAsset.id,
          trackId: isAudio ? 'audio-1' : isImage ? 'video-2' : 'video-1',
          type: assetType,
          name: file.name,
          sourceUrl: url,
          timelineStart: playheadTime,
          sourceIn: 0,
          sourceOut: isVideo || isAudio ? 10 : 5,
          duration: isVideo || isAudio ? 10 : 5,
          sourceDuration: isVideo || isAudio ? 10 : 5,
          layer: isImage ? 5 : 1,
          opacity: 1,
          volume: 1,
          speed: 1,
          crop: { x: 0, y: 0, width: 1, height: 1 },
          transform: { x: 0, y: 0, scale: 1, rotation: 0 },
          filter: {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            blur: 0,
            grayscale: 0,
            sepia: 0,
            vignette: 0,
            temperature: 0,
            invert: 0,
          },
          transition: { type: 'none', duration: 0 },
        };
        const nextClips = [...prev.clips, newClip];
        return {
          ...prev,
          assets: nextAssets,
          clips: nextClips,
          duration: recalculateDuration(nextClips),
        };
      });

      onLog(`[AI_VIDEO_EDITOR] Loaded media "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)} MB)`, 'SYSTEM');
    });
  };

  // Add Asset to Timeline
  const handleAddAssetToTimeline = (asset: MediaAsset) => {
    soundEngine.playClick();
    const newClip: TimelineClip = {
      id: `clip_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      assetId: asset.id,
      trackId: asset.type === 'audio' ? 'audio-1' : 'video-1',
      type: asset.type,
      name: asset.name,
      sourceUrl: asset.url,
      timelineStart: playheadTime,
      sourceIn: 0,
      sourceOut: Math.min(15, asset.duration || 10),
      duration: Math.min(15, asset.duration || 10),
      sourceDuration: asset.duration || 15,
      layer: 1,
      opacity: 1,
      volume: 1,
      speed: 1,
      crop: { x: 0, y: 0, width: 1, height: 1 },
      transform: { x: 0, y: 0, scale: 1, rotation: 0 },
      filter: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0,
        grayscale: 0,
        sepia: 0,
        vignette: 0,
        temperature: 0,
        invert: 0,
      },
      transition: { type: 'none', duration: 0 },
    };

    const nextClips = [...project.clips, newClip];
    pushHistory({
      ...project,
      clips: nextClips,
      duration: recalculateDuration(nextClips),
    });
    setSelectedClipId(newClip.id);
  };

  // =========================================================================
  // TEXT & TITLE ADDERS
  // =========================================================================
  const handleAddTextClip = (preset: {
    text: string;
    fontSize: number;
    color: string;
    fontWeight: 'normal' | 'bold' | '900';
    fontFamily: string;
    shadowColor: string;
    backgroundColor: string;
    animation: 'none' | 'fade' | 'slide-up' | 'pop' | 'typewriter';
  }) => {
    soundEngine.playClick();
    const newTextClip: TimelineClip = {
      id: `text_${Date.now()}`,
      trackId: 'text-1',
      type: 'text',
      name: preset.text,
      sourceUrl: '',
      timelineStart: playheadTime,
      sourceIn: 0,
      sourceOut: 4,
      duration: 4,
      sourceDuration: 4,
      layer: 10,
      opacity: 1,
      volume: 0,
      speed: 1,
      crop: { x: 0, y: 0, width: 1, height: 1 },
      transform: { x: 0, y: 0, scale: 1, rotation: 0 },
      filter: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        blur: 0,
        grayscale: 0,
        sepia: 0,
        vignette: 0,
        temperature: 0,
        invert: 0,
      },
      transition: { type: 'none', duration: 0 },
      textData: {
        text: preset.text,
        fontFamily: preset.fontFamily,
        fontSize: preset.fontSize,
        color: preset.color,
        fontWeight: preset.fontWeight,
        fontStyle: 'normal',
        alignment: 'center',
        outlineColor: '#000000',
        outlineWidth: 3,
        shadowColor: preset.shadowColor,
        shadowBlur: 10,
        backgroundColor: preset.backgroundColor,
        backgroundPadding: 10,
        animation: preset.animation,
        posX: 50,
        posY: 50,
      },
    };

    const nextClips = [...project.clips, newTextClip];
    pushHistory({
      ...project,
      clips: nextClips,
      duration: recalculateDuration(nextClips),
    });
    setSelectedClipId(newTextClip.id);
  };

  // =========================================================================
  // CAPTION STUDIO & AI TRANSCRIPTION
  // =========================================================================
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
  const [captionPromptContext, setCaptionPromptContext] = useState('');

  const handleGenerateAICaptions = async () => {
    soundEngine.playClick();
    setIsGeneratingCaptions(true);
    onLog('[AI_VIDEO_EDITOR] Requesting Gemini AI speech transcription and timed subtitle segmentation...', 'AI');

    try {
      const res = await fetch('/api/ai/video-editor/captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicOrAudioSummary: captionPromptContext || project.name,
          durationSeconds: project.duration,
          language: 'English',
          pacingStyle: 'creator',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.subtitles)) {
        soundEngine.playSuccess();

        // Convert subtitles into caption clips on track captions-1
        const newCaptionClips: TimelineClip[] = data.subtitles.map((sub: SubtitleSegment, idx: number) => ({
          id: `cap_ai_${Date.now()}_${idx}`,
          trackId: 'captions-1',
          type: 'caption',
          name: `Cap: ${sub.text.slice(0, 15)}...`,
          sourceUrl: '',
          timelineStart: sub.start,
          sourceIn: 0,
          sourceOut: sub.end - sub.start,
          duration: Math.max(0.8, sub.end - sub.start),
          sourceDuration: sub.end - sub.start,
          layer: 20,
          opacity: 1,
          volume: 0,
          speed: 1,
          crop: { x: 0, y: 0, width: 1, height: 1 },
          transform: { x: 0, y: 0, scale: 1, rotation: 0 },
          filter: {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            blur: 0,
            grayscale: 0,
            sepia: 0,
            vignette: 0,
            temperature: 0,
            invert: 0,
          },
          transition: { type: 'none', duration: 0 },
          captionData: {
            text: sub.text.toUpperCase(),
            stylePreset: 'bold-creator',
            highlightColor: idx % 2 === 0 ? '#FFE600' : '#38BDF8',
            fontSize: 34,
            positionY: 82,
            outlineColor: '#000000',
          },
        }));

        // Replace or append caption clips
        const nonCaptions = project.clips.filter((c) => c.type !== 'caption');
        const nextClips = [...nonCaptions, ...newCaptionClips];

        pushHistory({
          ...project,
          clips: nextClips,
          duration: recalculateDuration(nextClips),
        });

        onLog(`[AI_VIDEO_EDITOR] Generated ${newCaptionClips.length} synchronized creator captions.`, 'AI');
      }
    } catch (err: any) {
      soundEngine.playAlertBeep();
      onLog(`[AI_VIDEO_EDITOR] Subtitle transcription error: ${err.message}`, 'ERROR');
    } finally {
      setIsGeneratingCaptions(false);
    }
  };

  // Export SRT Subtitles Download
  const handleExportSRT = () => {
    soundEngine.playClick();
    const captionClips = project.clips.filter((c) => c.type === 'caption');
    const srt = exportToSRT(captionClips);
    const blob = new Blob([srt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_')}_subtitles.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onLog('[AI_VIDEO_EDITOR] Exported SRT subtitle file.', 'SYSTEM');
  };

  // Import SRT Subtitles
  const handleImportSRT = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;
      const parsed = parseSRT(content);
      if (parsed.length > 0) {
        soundEngine.playSuccess();
        const newCaptionClips: TimelineClip[] = parsed.map((sub, idx) => ({
          id: `cap_srt_${Date.now()}_${idx}`,
          trackId: 'captions-1',
          type: 'caption',
          name: `Cap: ${sub.text.slice(0, 15)}...`,
          sourceUrl: '',
          timelineStart: sub.start,
          sourceIn: 0,
          sourceOut: sub.end - sub.start,
          duration: Math.max(0.5, sub.end - sub.start),
          sourceDuration: sub.end - sub.start,
          layer: 20,
          opacity: 1,
          volume: 0,
          speed: 1,
          crop: { x: 0, y: 0, width: 1, height: 1 },
          transform: { x: 0, y: 0, scale: 1, rotation: 0 },
          filter: {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            blur: 0,
            grayscale: 0,
            sepia: 0,
            vignette: 0,
            temperature: 0,
            invert: 0,
          },
          transition: { type: 'none', duration: 0 },
          captionData: {
            text: sub.text,
            stylePreset: 'bold-creator',
            highlightColor: '#FFE600',
            fontSize: 32,
            positionY: 82,
            outlineColor: '#000000',
          },
        }));

        const nonCaptions = project.clips.filter((c) => c.type !== 'caption');
        const nextClips = [...nonCaptions, ...newCaptionClips];
        pushHistory({
          ...project,
          clips: nextClips,
          duration: recalculateDuration(nextClips),
        });
        onLog(`[AI_VIDEO_EDITOR] Imported ${parsed.length} captions from ${file.name}`, 'SYSTEM');
      }
    };
    reader.readAsText(file);
  };

  // =========================================================================
  // ASPECT RATIO / SMART RESIZE
  // =========================================================================
  const handleSetAspectRatio = (ratio: AspectRatioType) => {
    soundEngine.playClick();
    const dims = ASPECT_RATIO_DIMENSIONS[ratio];
    pushHistory({
      ...project,
      canvas: {
        ...project.canvas,
        aspectRatio: ratio,
        width: dims.width,
        height: dims.height,
      },
    });
    onLog(`[AI_VIDEO_EDITOR] Canvas converted to ${ratio} (${dims.width}x${dims.height})`, 'SYSTEM');
  };

  // =========================================================================
  // AI TOOLS: HOOKS, TRANSLATION, HIGHLIGHTS
  // =========================================================================
  const [aiIdeas, setAiIdeas] = useState<any | null>(null);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);

  const handleGenerateMetadataIdeas = async () => {
    soundEngine.playClick();
    setIsGeneratingIdeas(true);
    try {
      const res = await fetch('/api/ai/video-editor/metadata-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: project.name,
          targetPlatform: project.canvas.aspectRatio === '9:16' ? 'TikTok' : 'YouTube',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAiIdeas(data);
        soundEngine.playSuccess();
        onLog('[AI_VIDEO_EDITOR] Generated viral hooks & title recommendations with Gemini.', 'AI');
      }
    } catch (err: any) {
      soundEngine.playAlertBeep();
      onLog(`[AI_VIDEO_EDITOR] Idea generation error: ${err.message}`, 'ERROR');
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  // Translate Existing Subtitles
  const [targetLang, setTargetLang] = useState('Spanish');
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslateSubtitles = async () => {
    const captionClips = project.clips.filter((c) => c.type === 'caption' && c.captionData?.text);
    if (captionClips.length === 0) {
      soundEngine.playAlertBeep();
      return;
    }

    soundEngine.playClick();
    setIsTranslating(true);
    onLog(`[AI_VIDEO_EDITOR] Translating subtitles to ${targetLang}...`, 'AI');

    try {
      const payload = captionClips.map((c) => ({
        start: c.timelineStart,
        end: c.timelineStart + c.duration,
        text: c.captionData!.text,
        speaker: c.captionData?.speaker || 'Host',
      }));

      const res = await fetch('/api/ai/video-editor/translate-subtitles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subtitles: payload,
          targetLanguage: targetLang,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.subtitles)) {
        soundEngine.playSuccess();
        const updatedClips = project.clips.map((clip) => {
          if (clip.type === 'caption') {
            const match = data.subtitles.find(
              (s: any) => Math.abs(s.start - clip.timelineStart) < 0.2
            );
            if (match && clip.captionData) {
              return {
                ...clip,
                captionData: {
                  ...clip.captionData,
                  text: match.text,
                },
              };
            }
          }
          return clip;
        });

        pushHistory({
          ...project,
          clips: updatedClips,
        });
        onLog(`[AI_VIDEO_EDITOR] Subtitles successfully translated to ${targetLang}.`, 'AI');
      }
    } catch (err: any) {
      soundEngine.playAlertBeep();
      onLog(`[AI_VIDEO_EDITOR] Translation error: ${err.message}`, 'ERROR');
    } finally {
      setIsTranslating(false);
    }
  };

  // =========================================================================
  // MIC VOICEOVER RECORDING
  // =========================================================================
  const toggleMicRecording = async () => {
    if (isRecordingMic) {
      // Stop recording
      soundEngine.playClick();
      if (micMediaRecorderRef.current && micMediaRecorderRef.current.state !== 'inactive') {
        micMediaRecorderRef.current.stop();
      }
      setIsRecordingMic(false);
      return;
    }

    // Start recording
    soundEngine.playClick();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      micMediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) micChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(micChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Add to audio track
        const durationEst = Math.max(2, (micChunksRef.current.length * 0.25) || 5);
        const newAudioClip: TimelineClip = {
          id: `audio_voiceover_${Date.now()}`,
          trackId: 'audio-1',
          type: 'audio',
          name: '🎙️ Voiceover Recording',
          sourceUrl: audioUrl,
          timelineStart: playheadTime,
          sourceIn: 0,
          sourceOut: durationEst,
          duration: durationEst,
          sourceDuration: durationEst,
          layer: 1,
          opacity: 1,
          volume: 1,
          speed: 1,
          crop: { x: 0, y: 0, width: 1, height: 1 },
          transform: { x: 0, y: 0, scale: 1, rotation: 0 },
          filter: {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            blur: 0,
            grayscale: 0,
            sepia: 0,
            vignette: 0,
            temperature: 0,
            invert: 0,
          },
          transition: { type: 'none', duration: 0 },
        };

        const nextClips = [...project.clips, newAudioClip];
        pushHistory({
          ...project,
          clips: nextClips,
          duration: recalculateDuration(nextClips),
        });
        setSelectedClipId(newAudioClip.id);
        onLog('[AI_VIDEO_EDITOR] Voiceover recording captured and placed on timeline.', 'AUDIO');
      };

      recorder.start(100);
      setIsRecordingMic(true);
      onLog('[AI_VIDEO_EDITOR] Microphone recording started...', 'AUDIO');
    } catch (err: any) {
      soundEngine.playAlertBeep();
      onLog(`[AI_VIDEO_EDITOR] Microphone permission denied: ${err.message}`, 'ERROR');
    }
  };

  // =========================================================================
  // CREATIVE ASSISTANT HANDLERS
  // =========================================================================
  const handleFetchCreativeSuggestions = async () => {
    soundEngine.playClick();
    setIsAnalyzing(true);
    onLog('[AI_VIDEO_EDITOR] Creative Director is analyzing project structure, pacing, and visual style...', 'AI');

    try {
      const res = await fetch('/api/ai/video-editor/creative-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoName: project.name,
          durationSeconds: project.duration,
          clipCount: project.clips.length,
          aspectRatio: project.canvas.aspectRatio,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCreativeSuggestions(data.suggestions);
        soundEngine.playSuccess();
        onLog('[AI_VIDEO_EDITOR] Creative analysis complete. Suggestions loaded.', 'AI');
      }
    } catch (err: any) {
      soundEngine.playAlertBeep();
      onLog(`[AI_VIDEO_EDITOR] Analysis error: ${err.message}`, 'ERROR');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyAutoTransition = () => {
    soundEngine.playClick();
    const updatedClips = project.clips.map((clip) => {
      if (clip.type === 'video') {
        return {
          ...clip,
          transition: { type: 'fade-black' as any, duration: 0.5 },
        };
      }
      return clip;
    });

    pushHistory({
      ...project,
      clips: updatedClips,
    });
    onLog('[AI_VIDEO_EDITOR] Applied cinematic cross-fades to all video clips.', 'SYSTEM');
  };

  const applyVividPreset = () => {
    soundEngine.playClick();
    const updatedClips = project.clips.map((clip) => {
      if (clip.type === 'video') {
        return {
          ...clip,
          filter: {
            ...clip.filter,
            brightness: 110,
            contrast: 120,
            saturation: 115,
            vignette: 15,
            presetName: 'Vivid AI',
          },
        };
      }
      return clip;
    });

    pushHistory({
      ...project,
      clips: updatedClips,
    });
    onLog('[AI_VIDEO_EDITOR] Applied "Vivid AI" color grading to all video clips.', 'SYSTEM');
  };

  // =========================================================================
  // EXPORT ENGINE HANDLER
  // =========================================================================
  const handleStartExport = async () => {
    soundEngine.playClick();
    setIsExporting(true);
    setExportProgress({
      progress: 0,
      stage: 'Preparing rendering environment...',
      currentSecond: 0,
      totalSeconds: project.duration,
    });
    exportCancelRef.current = false;

    try {
      onLog(`[AI_VIDEO_EDITOR] Starting video render (${exportSettings.resolution}, ${exportSettings.fps}fps, ${exportSettings.format.toUpperCase()})...`, 'EXPORT');

      const result = await renderAndExportVideo(
        project,
        exportSettings,
        (p) => setExportProgress(p),
        () => exportCancelRef.current
      );

      soundEngine.playSuccess();
      onLog(`[AI_VIDEO_EDITOR] Video exported successfully: ${result.filename} (${(result.blob.size / (1024 * 1024)).toFixed(2)} MB)`, 'EXPORT');
    } catch (err: any) {
      soundEngine.playAlertBeep();
      onLog(`[AI_VIDEO_EDITOR] Render failed: ${err.message}`, 'ERROR');
    } finally {
      setIsExporting(false);
    }
  };

  // Cancel export
  const handleCancelExport = () => {
    exportCancelRef.current = true;
    setIsExporting(false);
    setExportProgress(null);
    onLog('[AI_VIDEO_EDITOR] Export process cancelled by user.', 'SYSTEM');
  };

  // Apply visual preset filter to selected clip
  const handleApplyFilterPreset = (presetName: string, filterValues: Partial<TimelineClip['filter']>) => {
    if (!selectedClip) return;
    soundEngine.playClick();
    const updatedClips = project.clips.map((c) =>
      c.id === selectedClip.id
        ? {
            ...c,
            filter: {
              ...c.filter,
              ...filterValues,
              presetName,
            },
          }
        : c
    );
    pushHistory({ ...project, clips: updatedClips });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#020408] text-zinc-200 flex flex-col font-sans select-none overflow-hidden">
      {/* =====================================================================
          TOP TOOLBAR
      ====================================================================== */}
      <header className="h-14 border-b border-white/[0.08] bg-[#0A0A0A] px-6 flex items-center justify-between gap-8 shrink-0 z-30">
        {/* Zone 1: Brand & Project Identity */}
        <div className="flex items-center gap-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Film className="w-5 h-5 text-black" />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="text-xs font-bold tracking-tight text-white uppercase">SuperAI Studio</span>
              <span className="text-[10px] font-medium text-emerald-500/80 uppercase tracking-widest">Video Engine</span>
            </div>
          </div>

          <div className="h-6 w-px bg-white/[0.1]" />

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={project.name}
              onChange={(e) => setProject({ ...project, name: e.target.value })}
              className="bg-transparent border-none text-sm text-zinc-100 font-semibold outline-none w-48 focus:text-white transition-colors"
              placeholder="Untitled Project"
            />
            <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-500">
              {isAutosaved ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-emerald-500" />
                  <span>Saved</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                  <span>Syncing...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Zone 2: Transport & Global Toggles */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 p-1 bg-white/[0.04] rounded-lg border border-white/[0.06]">
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className="p-1.5 rounded-md hover:bg-white/[0.08] disabled:opacity-20 text-zinc-400 hover:text-white transition-all"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1.5 rounded-md hover:bg-white/[0.08] disabled:opacity-20 text-zinc-400 hover:text-white transition-all"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 px-4 py-1.5 bg-white/[0.04] rounded-full border border-white/[0.06]">
            <button
              onClick={() => {
                soundEngine.playClick();
                setPlayheadTime(0);
              }}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isPlaying ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <div className="flex items-center gap-2 font-mono text-xs tabular-nums tracking-tight">
              <span className="text-zinc-100">{formatTimecode(playheadTime)}</span>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-500">{formatTimeShort(project.duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-white/[0.04] rounded-lg border border-white/[0.06]">
            {(['16:9', '9:16', '1:1'] as AspectRatioType[]).map((ratio) => (
              <button
                key={ratio}
                onClick={() => handleSetAspectRatio(ratio)}
                className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                  project.canvas.aspectRatio === ratio
                    ? 'bg-emerald-500 text-black shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowSafeZones(!showSafeZones)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-2 ${
              showSafeZones
                ? 'bg-red-500/10 border-red-500/50 text-red-400'
                : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>SAFE ZONES</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              setShowExportModal(true);
            }}
            className="h-9 px-5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg text-xs flex items-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.2)] transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>EXPORT VIDEO</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/[0.08] text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* =====================================================================
          MAIN WORKSPACE (LEFT TABS + CENTER PREVIEW + RIGHT INSPECTOR)
      ====================================================================== */}
      <div className="flex-1 flex overflow-hidden">
        {/* Pane 1: Slim Tool Sidebar */}
        <div className="w-16 bg-[#080808] border-r border-white/[0.06] flex flex-col items-center py-4 gap-2 shrink-0 z-20">
          {[
            { id: 'media', label: 'Media', icon: FileVideo },
            { id: 'text', label: 'Text', icon: Type },
            { id: 'captions', label: 'Captions', icon: MessageSquare },
            { id: 'audio', label: 'Audio', icon: Music },
            { id: 'effects', label: 'Visuals', icon: Sliders },
            { id: 'canvas', label: 'Canvas', icon: Maximize2 },
            { id: 'ai_tools', label: 'AI Studio', icon: Sparkles },
            { id: 'creative', label: 'Creative', icon: Palette },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundEngine.playClick();
                  setActiveTab(tab.id as ToolTab);
                }}
                className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-bold uppercase tracking-tighter">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Pane 2: Expanded Tool Drawer */}
        <div className="w-72 bg-[#0A0A0A] border-r border-white/[0.06] flex flex-col overflow-y-auto shrink-0 p-5 space-y-6">
          {/* MEDIA TAB */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white tracking-tight">Project Assets</h3>
                <label className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  <input type="file" multiple accept="video/*,audio/*,image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Library</span>
                  <div className="grid grid-cols-2 gap-3">
                    {SAMPLE_VIDEOS.map((sample) => (
                      <div
                        key={sample.id}
                        onClick={() => handleAddAssetToTimeline(sample)}
                        className="group relative aspect-video rounded-lg overflow-hidden bg-zinc-900 border border-white/5 hover:border-emerald-500/50 cursor-pointer transition-all"
                      >
                        <img src={sample.thumbnail} alt={sample.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                        <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[9px] font-mono text-zinc-300 border border-white/10">
                          {sample.duration}s
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {project.assets.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-white/5">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Recent Uploads</span>
                    <div className="space-y-2">
                      {project.assets.map((asset) => (
                        <div
                          key={asset.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-emerald-500/30 transition-colors"
                        >
                          <div className="flex items-center gap-3 truncate">
                            <div className="w-8 h-8 rounded bg-white/[0.04] flex items-center justify-center shrink-0">
                              {asset.type === 'video' ? <FileVideo className="w-4 h-4 text-emerald-400" /> : <FileAudio className="w-4 h-4 text-cyan-400" />}
                            </div>
                            <span className="text-xs text-zinc-300 truncate font-medium">{asset.name}</span>
                          </div>
                          <button onClick={() => handleAddAssetToTimeline(asset)} className="p-1.5 text-zinc-500 hover:text-emerald-400">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TEXT TAB */}
          {activeTab === 'text' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-white tracking-tight">Typography Studio</h3>
              <div className="space-y-3">
                {[
                  { name: 'Impact Headline', text: 'VIRAL HOOK', fontSize: 46, color: '#FFE600', fontWeight: '900' as const, fontFamily: 'Impact', shadowColor: 'rgba(0,0,0,0.9)', backgroundColor: 'transparent', animation: 'pop' as const },
                  { name: 'Editorial Minimal', text: 'A film by SuperAI', fontSize: 32, color: '#FFFFFF', fontWeight: 'bold' as const, fontFamily: 'Inter', shadowColor: 'rgba(0,0,0,0.5)', backgroundColor: 'transparent', animation: 'fade' as const },
                  { name: 'Modern Caption', text: 'Social Subtitle', fontSize: 34, color: '#FFFFFF', fontWeight: '900' as const, fontFamily: 'Inter', shadowColor: 'rgba(0,0,0,1)', backgroundColor: 'rgba(16,185,129,0.8)', animation: 'pop' as const },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAddTextClip(preset)}
                    className="w-full p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-emerald-500/30 text-left transition-all group"
                  >
                    <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{preset.name}</span>
                    <span className="block text-lg leading-tight" style={{ color: preset.color, fontFamily: preset.fontFamily, fontWeight: preset.fontWeight }}>
                      {preset.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CAPTIONS TAB */}
          {activeTab === 'captions' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-white tracking-tight">AI Caption Studio</h3>
              
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Gemini Intelligence</span>
                </div>
                <input
                  type="text"
                  placeholder="Identify video context..."
                  value={captionPromptContext}
                  onChange={(e) => setCaptionPromptContext(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500/50 transition-colors"
                />
                <button
                  onClick={handleGenerateAICaptions}
                  disabled={isGeneratingCaptions}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold py-2.5 rounded-lg text-xs transition-all"
                >
                  {isGeneratingCaptions ? 'Analyzing Speech...' : 'Generate Auto Captions'}
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Segments</span>
                  <div className="flex gap-2">
                    <button onClick={handleExportSRT} className="text-[10px] font-bold text-emerald-400 hover:underline">Export SRT</button>
                  </div>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  {project.clips.filter(c => c.type === 'caption').map(cap => (
                    <div
                      key={cap.id}
                      onClick={() => { setSelectedClipId(cap.id); setPlayheadTime(cap.timelineStart); }}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        selectedClipId === cap.id ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-white/[0.02] border-white/[0.06] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-2">
                        <span>{formatTimeShort(cap.timelineStart)}</span>
                        <span className="text-emerald-500/60 uppercase">{cap.captionData?.stylePreset}</span>
                      </div>
                      <p className="text-xs text-zinc-200 line-clamp-2 leading-relaxed">{cap.captionData?.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* AUDIO TAB */}
          {activeTab === 'audio' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-white tracking-tight">Audio Engineering</h3>
              
              <button
                onClick={toggleMicRecording}
                className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  isRecordingMic ? 'bg-red-500 text-white animate-pulse' : 'bg-white/[0.04] border border-white/[0.06] text-zinc-300 hover:bg-white/[0.08]'
                }`}
              >
                {isRecordingMic ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{isRecordingMic ? 'Recording Voice...' : 'Record Voiceover'}</span>
              </button>

              <div className="space-y-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Stock Library</span>
                {DEFAULT_AUDIO_TRACKS.map((track, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-emerald-500/30 flex items-center justify-between gap-4 transition-all">
                    <div className="truncate">
                      <span className="block text-xs font-semibold text-zinc-200 truncate">{track.name}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">{track.duration}s</span>
                    </div>
                    <button
                      onClick={() => handleAddAssetToTimeline({ id: `music_${idx}`, name: track.name, type: 'audio', url: track.url, duration: track.duration })}
                      className="shrink-0 p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EFFECTS TAB */}
          {activeTab === 'effects' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-white tracking-tight">Color Grading</h3>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { name: 'Vivid Cinematic', filter: { brightness: 110, contrast: 120, saturation: 130, blur: 0, grayscale: 0, sepia: 0, invert: 0 } },
                  { name: 'Teal & Orange', filter: { brightness: 105, contrast: 125, saturation: 115, blur: 0, grayscale: 0, sepia: 15, invert: 0 } },
                  { name: 'Noir Monolith', filter: { brightness: 110, contrast: 140, saturation: 0, blur: 0, grayscale: 100, sepia: 0, invert: 0 } },
                  { name: 'Warm Sunset', filter: { brightness: 105, contrast: 110, saturation: 120, blur: 0, grayscale: 0, sepia: 40, invert: 0 } },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleApplyFilterPreset(preset.name, preset.filter)}
                    className="w-full p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500 text-left transition-all group"
                  >
                    <span className="text-xs font-bold text-zinc-300 group-hover:text-emerald-400">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CANVAS TAB */}
          {activeTab === 'canvas' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-white tracking-tight">Project Configuration</h3>
              <div className="space-y-3">
                {[
                  { ratio: '16:9' as AspectRatioType, title: 'YouTube HD', desc: '1280 × 720' },
                  { ratio: '9:16' as AspectRatioType, title: 'Reels / TikTok', desc: '720 × 1280' },
                  { ratio: '1:1' as AspectRatioType, title: 'Instagram Square', desc: '1080 × 1080' },
                ].map((item) => (
                  <button
                    key={item.ratio}
                    onClick={() => handleSetAspectRatio(item.ratio)}
                    className={`w-full p-4 rounded-xl text-left border transition-all ${
                      project.canvas.aspectRatio === item.ratio ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-white/[0.02] border-white/[0.06] hover:border-white/20 text-zinc-400'
                    }`}
                  >
                    <span className="block font-bold text-xs text-white mb-1">{item.title}</span>
                    <span className="text-[10px] font-mono opacity-60">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI STUDIO TAB */}
          {activeTab === 'ai_tools' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-white tracking-tight">AI Creative Studio</h3>
              
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-4">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Viral Optimization</span>
                </div>
                <button
                  onClick={handleGenerateMetadataIdeas}
                  disabled={isGeneratingIdeas}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2.5 rounded-lg text-xs transition-all"
                >
                  {isGeneratingIdeas ? 'Processing...' : 'Generate Viral Hooks'}
                </button>

                {aiIdeas && (
                  <div className="space-y-3 pt-3 border-t border-white/10">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Suggested Hooks</span>
                    <div className="space-y-2">
                      {aiIdeas.titles?.slice(0, 3).map((title: string, i: number) => (
                        <div key={i} className="p-2 rounded bg-black/40 text-[10px] text-zinc-300 leading-relaxed italic border border-white/5">
                          "{title}"
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-4">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Global Localization</span>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs text-emerald-400 outline-none focus:border-emerald-500/50"
                >
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="Japanese">Japanese</option>
                  <option value="German">German</option>
                </select>
                <button
                  onClick={handleTranslateSubtitles}
                  disabled={isTranslating}
                  className="w-full py-2.5 rounded-lg border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500 hover:text-black transition-all"
                >
                  {isTranslating ? 'Translating...' : `Translate Subtitles`}
                </button>
              </div>
            </div>
          )}

          {/* CREATIVE TAB */}
          {activeTab === 'creative' && (
            <div className="space-y-6 overflow-y-auto max-h-full pr-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white tracking-tight">Creative Director</h3>
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/5 space-y-3">
                <p className="text-[11px] text-zinc-400 leading-relaxed text-center">
                  Our AI Creative Director analyzes your timeline to suggest professional pacing, transitions, and style improvements.
                </p>
                <button
                  onClick={handleFetchCreativeSuggestions}
                  disabled={isAnalyzing}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    isAnalyzing ? 'bg-zinc-800 text-zinc-500' : 'bg-emerald-500 text-black hover:bg-emerald-400'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
                      <span>ANALYZING PROJECT...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>GET AI SUGGESTIONS</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Auto-Enhance</span>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={applyAutoTransition}
                    className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-emerald-500/50 flex items-center gap-3 transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-xs text-white font-bold">Auto-Transitions</div>
                      <div className="text-[10px] text-zinc-500">Apply fades to all clips</div>
                    </div>
                  </button>

                  <button
                    onClick={applyVividPreset}
                    className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-emerald-500/50 flex items-center gap-3 transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded bg-purple-500/10 flex items-center justify-center shrink-0">
                      <Palette className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-xs text-white font-bold">AI Color Grade</div>
                      <div className="text-[10px] text-zinc-500">Apply Vivid AI to all clips</div>
                    </div>
                  </button>
                </div>
              </div>

              {creativeSuggestions.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">AI Recommendations</span>
                  <div className="space-y-2">
                    {creativeSuggestions.map((s, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-zinc-900/50 border border-white/5 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                            s.type === 'transition' ? 'bg-blue-500/20 text-blue-400' :
                            s.type === 'text' ? 'bg-emerald-500/20 text-emerald-400' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>
                            {s.type}
                          </span>
                          <span className="text-[11px] font-bold text-zinc-200">{s.suggestion}</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 italic leading-tight">{s.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pane 3: Central Viewport */}
        <div className="flex-1 bg-[#050505] flex items-center justify-center p-8 relative overflow-hidden">
          <div
            className="relative bg-black rounded-lg overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] border border-white/5 flex items-center justify-center"
            style={{
              aspectRatio: `${project.canvas.width} / ${project.canvas.height}`,
              maxWidth: '100%',
              maxHeight: '100%',
              height: project.canvas.aspectRatio === '9:16' ? '95%' : '88%',
            }}
          >
            <canvas
              ref={previewCanvasRef}
              width={project.canvas.width}
              height={project.canvas.height}
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Pane 4: Inspector Panel */}
        <div className="w-80 bg-[#0A0A0A] border-l border-white/[0.06] flex flex-col shrink-0 overflow-y-auto">
          {selectedClip ? (
            <div className="p-6 space-y-8">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Properties</span>
                  <h3 className="text-sm font-bold text-white truncate w-48">{selectedClip.name}</h3>
                </div>
                <button onClick={() => setSelectedClipId(null)} className="p-2 rounded-lg hover:bg-white/5 text-zinc-500">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* VIDEO / IMAGE PROPERTIES */}
              {(selectedClip.type === 'video' || selectedClip.type === 'image') && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Transform</span>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs text-zinc-400">Scale</label>
                        <span className="text-xs font-mono text-emerald-400 tabular-nums">{(selectedClip.transform?.scale || 1).toFixed(2)}x</span>
                      </div>
                      <input
                        type="range" min="0.1" max="3" step="0.01"
                        value={selectedClip.transform?.scale || 1}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setProject(p => ({ ...p, clips: p.clips.map(c => c.id === selectedClip.id ? { ...c, transform: { ...c.transform, scale: val } } : c) }));
                        }}
                        className="w-full accent-emerald-500"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs text-zinc-400">Opacity</label>
                        <span className="text-xs font-mono text-emerald-400 tabular-nums">{Math.round((selectedClip.opacity ?? 1) * 100)}%</span>
                      </div>
                      <input
                        type="range" min="0" max="1" step="0.01"
                        value={selectedClip.opacity ?? 1}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setProject(p => ({ ...p, clips: p.clips.map(c => c.id === selectedClip.id ? { ...c, opacity: val } : c) }));
                        }}
                        className="w-full accent-emerald-500"
                      />
                    </div>
                  </div>

                  {selectedClip.type === 'video' && (
                    <div className="space-y-4 pt-6 border-t border-white/5">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Playback</span>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-xs text-zinc-400">Volume</label>
                          <span className="text-xs font-mono text-emerald-400 tabular-nums">{Math.round((selectedClip.volume ?? 1) * 100)}%</span>
                        </div>
                        <input
                          type="range" min="0" max="1" step="0.01"
                          value={selectedClip.volume ?? 1}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setProject(p => ({ ...p, clips: p.clips.map(c => c.id === selectedClip.id ? { ...c, volume: val } : c) }));
                          }}
                          className="w-full accent-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-4 gap-1.5">
                        {[0.5, 1, 1.5, 2].map((spd) => (
                          <button
                            key={spd}
                            onClick={() => setProject(p => ({ ...p, clips: p.clips.map(c => c.id === selectedClip.id ? { ...c, speed: spd } : c) }))}
                            className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${
                              selectedClip.speed === spd ? 'bg-emerald-500 border-emerald-500 text-black' : 'bg-transparent border-white/10 text-zinc-500 hover:border-white/30'
                            }`}
                          >
                            {spd}x
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TEXT PROPERTIES */}
              {selectedClip.type === 'text' && selectedClip.textData && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Content</span>
                    <textarea
                      value={selectedClip.textData.text}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProject(p => ({ ...p, clips: p.clips.map(c => c.id === selectedClip.id && c.textData ? { ...c, textData: { ...c.textData, text: val } } : c) }));
                      }}
                      className="w-full h-24 bg-white/[0.04] border border-white/[0.08] rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500/50 resize-none"
                    />
                  </div>

                  <div className="space-y-4 pt-6 border-t border-white/5">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Styling</span>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs text-zinc-400">Size</label>
                        <span className="text-xs font-mono text-emerald-400 tabular-nums">{selectedClip.textData.fontSize}px</span>
                      </div>
                      <input
                        type="range" min="12" max="120"
                        value={selectedClip.textData.fontSize}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setProject(p => ({ ...p, clips: p.clips.map(c => c.id === selectedClip.id && c.textData ? { ...c, textData: { ...c.textData, fontSize: val } } : c) }));
                        }}
                        className="w-full accent-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Fill</label>
                        <div className="flex items-center gap-2 p-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg">
                          <input
                            type="color" value={selectedClip.textData.color}
                            onChange={(e) => {
                              const val = e.target.value;
                              setProject(p => ({ ...p, clips: p.clips.map(c => c.id === selectedClip.id && c.textData ? { ...c, textData: { ...c.textData, color: val } } : c) }));
                            }}
                            className="w-8 h-8 rounded-md border-none bg-transparent cursor-pointer"
                          />
                          <span className="text-[10px] font-mono text-zinc-400 uppercase">{selectedClip.textData.color}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Glow</label>
                        <div className="flex items-center gap-2 p-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg">
                          <input
                            type="color" value={selectedClip.textData.shadowColor.startsWith('#') ? selectedClip.textData.shadowColor : '#10B981'}
                            onChange={(e) => {
                              const val = e.target.value;
                              setProject(p => ({ ...p, clips: p.clips.map(c => c.id === selectedClip.id && c.textData ? { ...c, textData: { ...c.textData, shadowColor: val } } : c) }));
                            }}
                            className="w-8 h-8 rounded-md border-none bg-transparent cursor-pointer"
                          />
                          <span className="text-[10px] font-mono text-zinc-400 uppercase">Glow</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TIMING SUMMARY */}
              <div className="pt-8 border-t border-white/5 space-y-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Timeline Data</span>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <span className="block text-[10px] text-zinc-500 mb-1">In Point</span>
                    <span className="text-xs font-mono text-zinc-200 tabular-nums">{formatTimecode(selectedClip.timelineStart)}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <span className="block text-[10px] text-zinc-500 mb-1">Duration</span>
                    <span className="text-xs font-mono text-zinc-200 tabular-nums">{selectedClip.duration.toFixed(2)}s</span>
                  </div>
                </div>
              </div>

              {/* Quick Clip Actions */}
              <div className="pt-8 border-t border-white/5 flex flex-col gap-3">
                <button
                  onClick={handleDuplicateClip}
                  className="w-full py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-300 font-bold flex items-center justify-center gap-2 text-[11px] transition-all hover:bg-white/[0.08]"
                >
                  <Copy className="w-4 h-4" />
                  <span>DUPLICATE CLIP</span>
                </button>
                <button
                  onClick={handleDeleteClip}
                  className="w-full py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 font-bold flex items-center justify-center gap-2 text-[11px] transition-all hover:bg-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>DELETE CLIP</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center text-zinc-600">
                <Layers className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">No Clip Selected</h4>
                <p className="text-[10px] text-zinc-600 leading-relaxed">Select a clip on the timeline to reveal granular properties and AI tools.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          BOTTOM MULTITRACK TIMELINE
      ====================================================================== */}
      <div className="h-72 bg-[#080808] border-t border-white/[0.06] flex flex-col shrink-0 z-30 select-none">
        {/* Timeline Utility Bar */}
        <div className="h-10 border-b border-white/[0.04] px-6 flex items-center justify-between bg-[#0A0A0A] shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 p-1 bg-white/[0.04] rounded-md border border-white/[0.06]">
              <button
                onClick={handleSplitClip}
                disabled={!selectedClip}
                className="px-3 py-1 rounded hover:bg-white/5 disabled:opacity-20 text-xs font-bold text-zinc-300 flex items-center gap-2 transition-all"
                title="Split (S)"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Split</span>
              </button>
              <button
                onClick={handleDeleteClip}
                disabled={!selectedClip}
                className="px-3 py-1 rounded hover:bg-red-500/10 disabled:opacity-20 text-xs font-bold text-zinc-300 hover:text-red-400 flex items-center gap-2 transition-all"
                title="Delete (Backspace)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
            
            <button
              onClick={handleRippleDeleteGaps}
              className="px-3 py-1 rounded bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] text-[10px] font-bold text-zinc-400 uppercase tracking-widest transition-all"
            >
              Close Gaps
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Zoom</span>
              <input
                type="range" min="15" max="150"
                value={timelineZoom}
                onChange={(e) => setTimelineZoom(parseInt(e.target.value))}
                className="w-32 accent-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Multitrack Editor Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* Track Headers (Pinned Left) */}
          <div className="w-24 bg-[#080808] border-r border-white/[0.06] flex flex-col pt-8 shrink-0 select-none">
            {[
              { id: 'v1', label: 'Video 1', icon: Film, color: 'text-emerald-500' },
              { id: 'v2', label: 'Overlay', icon: ImageIcon, color: 'text-purple-500' },
              { id: 't1', label: 'Titles', icon: Type, color: 'text-yellow-500' },
              { id: 'c1', label: 'Captions', icon: MessageSquare, color: 'text-sky-500' },
              { id: 'a1', label: 'Audio', icon: Music, color: 'text-cyan-500' },
            ].map((track) => (
              <div key={track.id} className="h-10 px-3 flex items-center gap-2 border-b border-white/[0.04]">
                <track.icon className={`w-3.5 h-3.5 ${track.color}`} />
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">{track.label}</span>
              </div>
            ))}
          </div>

          {/* Scrolable Timeline Grid */}
          <div
            className="flex-1 overflow-x-auto overflow-y-hidden relative bg-[#050505] custom-scrollbar"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left + e.currentTarget.scrollLeft;
              setPlayheadTime(Math.max(0, Math.min(project.duration, clickX / timelineZoom)));
            }}
          >
            {/* Time Ruler */}
            <div className="h-8 border-b border-white/[0.04] relative flex items-end font-mono text-[9px] text-zinc-600" style={{ width: `${Math.max(2000, project.duration * timelineZoom + 400)}px` }}>
              {Array.from({ length: Math.ceil(project.duration + 10) }).map((_, sec) => (
                <div key={sec} className="absolute bottom-0 flex flex-col items-center" style={{ left: `${sec * timelineZoom}px` }}>
                  <div className="h-2 w-px bg-white/10" />
                  <span className="text-[8px] pl-1 pb-1 tabular-nums">{sec}s</span>
                </div>
              ))}
            </div>

            {/* Content Tracks */}
            <div className="relative" style={{ width: `${Math.max(2000, project.duration * timelineZoom + 400)}px` }}>
              {/* Playhead Indicator */}
              <div
                className="absolute top-0 bottom-0 w-px bg-white z-40 pointer-events-none shadow-[0_0_15px_white]"
                style={{ left: `${playheadTime * timelineZoom}px`, height: '240px' }}
              >
                <div className="w-3 h-3 bg-white rounded-sm -ml-[5.5px] -mt-1 rotate-45" />
              </div>

              {/* Clip Rendering (Map by Track ID) */}
              {[
                { id: 'video-1', color: 'emerald' },
                { id: 'video-2', color: 'purple' },
                { id: 'text-1', color: 'yellow' },
                { id: 'captions-1', color: 'sky' },
                { id: 'audio-1', color: 'cyan' },
              ].map((track) => (
                <div key={track.id} className="h-10 border-b border-white/[0.04] relative group hover:bg-white/[0.01]">
                  {project.clips.filter(c => c.trackId === track.id).map(clip => {
                    const isSelected = selectedClipId === clip.id;
                    const colorMap: Record<string, string> = {
                      emerald: isSelected ? 'bg-emerald-500 text-black' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
                      purple: isSelected ? 'bg-purple-500 text-black' : 'bg-purple-500/10 border-purple-500/30 text-purple-400',
                      yellow: isSelected ? 'bg-yellow-500 text-black' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
                      sky: isSelected ? 'bg-sky-500 text-black' : 'bg-sky-500/10 border-sky-500/30 text-sky-400',
                      cyan: isSelected ? 'bg-cyan-500 text-black' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
                    };

                    return (
                      <div
                        key={clip.id}
                        onClick={(e) => { e.stopPropagation(); setSelectedClipId(clip.id); }}
                        className={`absolute top-1 bottom-1 rounded px-3 text-[10px] font-bold flex items-center truncate cursor-pointer transition-all border ${colorMap[track.color]}`}
                        style={{ left: `${clip.timelineStart * timelineZoom}px`, width: `${Math.max(24, clip.duration * timelineZoom)}px` }}
                      >
                        {isSelected && (
                          <div
                            onMouseDown={(e) => { e.stopPropagation(); handleTrimLeft(-0.5); }}
                            className="w-1.5 h-full absolute left-0 top-0 bg-white/20 hover:bg-white/40 cursor-ew-resize"
                          />
                        )}
                        <span className="truncate w-full">{clip.name}</span>
                        {isSelected && (
                          <div
                            onMouseDown={(e) => { e.stopPropagation(); handleTrimRight(0.5); }}
                            className="w-1.5 h-full absolute right-0 top-0 bg-white/20 hover:bg-white/40 cursor-ew-resize"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          EXPORT MODAL (REFINED STUDIO STYLE)
      ====================================================================== */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
          <div className="bg-[#0A0A0A] border border-white/[0.08] rounded-2xl p-8 w-full max-w-lg space-y-8 shadow-[0_0_100px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white tracking-tight">Finalize Video</h3>
                <p className="text-xs text-zinc-500 font-medium">Export high-fidelity assets for social publishing.</p>
              </div>
              {!isExporting && (
                <button onClick={() => setShowExportModal(false)} className="p-2 rounded-full hover:bg-white/5 text-zinc-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {!isExporting ? (
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Resolution</span>
                    <div className="flex flex-col gap-2">
                      {(['720p', '1080p'] as const).map((res) => (
                        <button
                          key={res}
                          onClick={() => setExportSettings({ ...exportSettings, resolution: res })}
                          className={`w-full py-3 rounded-xl font-bold text-xs border transition-all ${
                            exportSettings.resolution === res ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:border-white/20'
                          }`}
                        >
                          {res === '1080p' ? 'Full HD (1080p)' : 'Standard (720p)'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Format</span>
                    <div className="flex flex-col gap-2">
                      {(['mp4', 'webm'] as const).map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => setExportSettings({ ...exportSettings, format: fmt })}
                          className={`w-full py-3 rounded-xl font-bold text-xs border transition-all uppercase ${
                            exportSettings.format === fmt ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:border-white/20'
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="block text-xs font-bold text-zinc-200">Burn Subtitles</span>
                    <span className="block text-[10px] text-zinc-500">Embed captions directly into frames</span>
                  </div>
                  <button
                    onClick={() => setExportSettings({ ...exportSettings, burnCaptions: !exportSettings.burnCaptions })}
                    className={`w-12 h-6 rounded-full relative transition-all ${exportSettings.burnCaptions ? 'bg-emerald-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${exportSettings.burnCaptions ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="flex-1 py-4 rounded-xl font-bold text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStartExport}
                    className="flex-[2] py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    <span>Start Rendering</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center space-y-8">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="64" cy="64" r="60" className="fill-none stroke-white/5 stroke-[4]" />
                    <circle
                      cx="64" cy="64" r="60"
                      className="fill-none stroke-emerald-500 stroke-[4] transition-all duration-300"
                      strokeDasharray="377"
                      strokeDashoffset={377 - (377 * (exportProgress?.progress || 0)) / 100}
                    />
                  </svg>
                  <span className="absolute text-2xl font-mono font-bold text-emerald-400 tabular-nums">
                    {exportProgress?.progress || 0}%
                  </span>
                </div>
                <div className="text-center space-y-2">
                  <span className="block text-xs font-bold text-zinc-200 uppercase tracking-widest animate-pulse">
                    {exportProgress?.stage || 'Preparing Renders...'}
                  </span>
                  <span className="block text-[10px] font-mono text-zinc-500 tabular-nums">
                    Frame {Math.round((exportProgress?.currentSecond || 0) * (exportSettings.fps || 30))} / {Math.round((exportProgress?.totalSeconds || 1) * (exportSettings.fps || 30))}
                  </span>
                </div>
                <button
                  onClick={handleCancelExport}
                  className="px-6 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all"
                >
                  Cancel Export
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
