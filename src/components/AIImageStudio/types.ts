export type StudioTab =
  | 'create'
  | 'edit'
  | 'design'
  | 'modes'
  | 'creations'
  | 'prompts'
  | 'settings';

export type AspectRatioType = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export interface GeneratedStudioImage {
  id: string;
  url: string;
  directUrl?: string;
  prompt: string;
  enhancedPrompt: string;
  aspectRatio: AspectRatioType;
  model: string;
  timestamp: string;
  type?: 'generated' | 'edited' | 'canvas_design' | 'poster' | 'thumbnail' | 'logo' | 'wallpaper' | 'social';
  canvasData?: any;
}

export type LayerType = 'background' | 'text' | 'shape' | 'sticker' | 'image';

export interface BaseLayer {
  id: string;
  type: LayerType;
  name: string;
  visible: boolean;
  locked: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold' | '800' | '900';
  fontStyle: 'normal' | 'italic';
  fill: string;
  textAlign: 'left' | 'center' | 'right';
  stroke?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  letterSpacing?: number;
  lineHeight?: number;
  backgroundColor?: string;
  backgroundPadding?: number;
  backgroundRadius?: number;
}

export interface ShapeLayer extends BaseLayer {
  type: 'shape';
  shapeType: 'rectangle' | 'circle' | 'pill' | 'badge' | 'border' | 'line';
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
}

export interface StickerLayer extends BaseLayer {
  type: 'sticker';
  text: string;
  category: 'badge' | 'star' | 'tag' | 'banner';
  backgroundColor: string;
  textColor: string;
}

export interface ImageLayer extends BaseLayer {
  type: 'image' | 'background';
  imageUrl: string;
  objectFit: 'cover' | 'contain' | 'fill';
  filterBrightness?: number;
  filterContrast?: number;
  filterSaturation?: number;
  filterBlur?: number;
  filterSepia?: number;
  filterGrayscale?: number;
  filterInvert?: number;
  filterHueRotate?: number;
}

export type CanvasLayer = TextLayer | ShapeLayer | StickerLayer | ImageLayer;

export interface CanvasProject {
  id: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: AspectRatioType;
  backgroundColor: string;
  layers: CanvasLayer[];
  updatedAt: string;
}

export interface ImageAdjustments {
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  blur: number; // 0 to 25
  sepia: number; // 0 to 100
  grayscale: number; // 0 to 100
  invert: number; // 0 to 100
  hueRotate: number; // 0 to 360
  rotation: number; // 0, 90, 180, 270
  flipHorizontal: boolean;
  flipVertical: boolean;
}

export interface PromptLibraryItem {
  id: string;
  title: string;
  prompt: string;
  category: string;
  style: string;
  aspectRatio: AspectRatioType;
  tags: string[];
  thumbnail?: string;
}
