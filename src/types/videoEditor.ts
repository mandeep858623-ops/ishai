export type AspectRatioType = '16:9' | '9:16' | '1:1' | '4:5' | '4:3' | 'custom';

export interface CanvasDimensions {
  width: number;
  height: number;
}

export const ASPECT_RATIO_DIMENSIONS: Record<AspectRatioType, CanvasDimensions> = {
  '16:9': { width: 1280, height: 720 },
  '9:16': { width: 720, height: 1280 },
  '1:1': { width: 1080, height: 1080 },
  '4:5': { width: 1080, height: 1350 },
  '4:3': { width: 1024, height: 768 },
  'custom': { width: 1280, height: 720 },
};

export type TrackType = 'video-1' | 'video-2' | 'audio-1' | 'text-1' | 'captions-1';

export type ClipType = 'video' | 'image' | 'audio' | 'text' | 'caption';

export interface ClipFilter {
  brightness: number; // 50 - 200 (100 normal)
  contrast: number; // 50 - 200 (100 normal)
  saturation: number; // 0 - 200 (100 normal)
  blur: number; // 0 - 20px
  grayscale: number; // 0 - 100%
  sepia: number; // 0 - 100%
  vignette: number; // 0 - 100%
  temperature: number; // -50 to 50
  invert: number; // 0 - 100%
  presetName?: string;
}

export interface ClipTransition {
  type: 'none' | 'fade-black' | 'crossfade' | 'slide-left';
  duration: number; // seconds
}

export interface TextData {
  text: string;
  fontFamily: string;
  fontSize: number; // px relative to 720p base
  color: string;
  fontWeight: 'normal' | 'bold' | '900';
  fontStyle: 'normal' | 'italic';
  alignment: 'left' | 'center' | 'right';
  outlineColor: string;
  outlineWidth: number;
  shadowColor: string;
  shadowBlur: number;
  backgroundColor: string;
  backgroundPadding: number;
  animation: 'none' | 'fade' | 'slide-up' | 'pop' | 'typewriter';
  posX: number; // 0 - 100% of canvas
  posY: number; // 0 - 100% of canvas
}

export interface CaptionData {
  text: string;
  speaker?: string;
  stylePreset: 'bold-creator' | 'karaoke-glow' | 'minimal-sub' | 'high-contrast' | 'cinematic';
  highlightColor: string;
  fontSize: number;
  positionY: number; // 0 - 100%
  outlineColor: string;
}

export interface TimelineClip {
  id: string;
  assetId?: string;
  trackId: TrackType;
  type: ClipType;
  name: string;
  sourceUrl: string;
  timelineStart: number; // in seconds
  sourceIn: number; // in seconds (trim start)
  sourceOut: number; // in seconds (trim end)
  duration: number; // in seconds on timeline = (sourceOut - sourceIn) / speed
  sourceDuration: number; // total duration of raw source file
  layer: number;
  opacity: number; // 0 - 1
  volume: number; // 0 - 1
  speed: number; // 0.5, 0.75, 1, 1.25, 1.5, 2
  crop: { x: number; y: number; width: number; height: number };
  transform: { x: number; y: number; scale: number; rotation: number };
  filter: ClipFilter;
  transition: ClipTransition;
  textData?: TextData;
  captionData?: CaptionData;
}

export interface MediaAsset {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image';
  url: string;
  duration: number;
  width?: number;
  height?: number;
  thumbnail?: string;
  size?: number;
}

export interface CanvasSettings {
  aspectRatio: AspectRatioType;
  width: number;
  height: number;
  backgroundMode: 'blur' | 'color';
  backgroundColor: string;
}

export interface VideoProject {
  id: string;
  name: string;
  updatedAt: string;
  canvas: CanvasSettings;
  clips: TimelineClip[];
  assets: MediaAsset[];
  duration: number; // total duration
}

export interface ExportSettings {
  format: 'mp4' | 'webm';
  resolution: '480p' | '720p' | '1080p';
  fps: 24 | 30 | 60;
  quality: 'draft' | 'standard' | 'high';
  includeAudio: boolean;
  burnCaptions: boolean;
}

export interface SubtitleSegment {
  id: string;
  start: number; // seconds
  end: number; // seconds
  text: string;
  speaker?: string;
}
