export type SlideLayout = 
  | 'title' 
  | 'agenda'
  | 'section'
  | 'content' 
  | 'two_column' 
  | 'three_card'
  | 'image_text' 
  | 'full_image'
  | 'stats' 
  | 'timeline' 
  | 'process'
  | 'case_study'
  | 'quote'
  | 'quiz_activity'
  | 'conclusion'
  | 'thank_you';

export interface SlideElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  // Position as percentage of 16:9 canvas (0-100)
  x: number;
  y: number;
  w: number;
  h: number;

  // Text specific
  content?: string;
  fontSize?: number; // pt size e.g. 14, 18, 24, 32, 42
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  fontFamily?: string;
  color?: string; // hex
  align?: 'left' | 'center' | 'right';
  isBullet?: boolean;
  bulletItems?: string[];

  // Image specific
  imageUrl?: string;
  imageAlt?: string;
  objectFit?: 'cover' | 'contain';
  borderRadius?: number;

  // Shape specific
  shapeType?: 'rect' | 'roundRect' | 'circle' | 'card' | 'badge' | 'line';
  fillColor?: string;
  borderColor?: string;
  borderWidth?: number;
  opacity?: number;

  // Layer order
  zIndex?: number;
}

export interface StatItem {
  value: string;
  label: string;
}

export interface CardItem {
  title: string;
  description: string;
  tag?: string;
}

export interface TimelineStepItem {
  step: string;
  title: string;
  description: string;
}

export interface SlideData {
  id?: string;
  layout?: SlideLayout;
  title: string;
  subtitle?: string;
  categoryTag?: string;
  centralMessage?: string;
  bgType?: 'color' | 'gradient' | 'image';
  bgColor?: string;
  bgGradient?: string;
  bgImage?: string;
  bulletPoints: string[];
  columnTwoTitle?: string;
  columnTwoBullets?: string[];
  stats?: StatItem[];
  threeCards?: CardItem[];
  timelineSteps?: TimelineStepItem[];
  quoteText?: string;
  quoteAuthor?: string;
  quizQuestion?: string;
  quizOptions?: string[];
  imageUrl?: string;
  suggestedVisual?: string;
  takeaway?: string;
  speakerNotes?: string;
  elements?: SlideElement[];
}

export type PPTTheme = 
  | 'modern_minimalist'
  | 'premium_corporate'
  | 'creative_gradient'
  | 'dark_futuristic'
  | 'clean_light'
  | 'educational_colourful'
  | 'scientific_research'
  | 'elegant_luxury'
  | 'startup_pitch'
  | 'nature_sustainability'
  | 'history_culture'
  | 'technology_ai'
  | 'emerald'
  | 'navy'
  | 'slate'
  | 'violet'
  | 'amber'
  | 'obsidian';

export type PresentationPurpose =
  | 'business'
  | 'pitch_deck'
  | 'school_project'
  | 'educational_lesson'
  | 'research'
  | 'portfolio'
  | 'training'
  | 'other';

export type VisualStyle =
  | 'modern_clean'
  | 'bold_editorial'
  | 'high_contrast'
  | 'vibrant_illustrated'
  | 'corporate_classic';

export type DetailLevel = 'concise' | 'balanced' | 'detailed';

export interface PresentationProject {
  id: string;
  title: string;
  subtitle?: string;
  topic?: string;
  purpose?: PresentationPurpose;
  theme: PPTTheme;
  visualStyle?: VisualStyle;
  detailLevel?: DetailLevel;
  slides: SlideData[];
  createdAt: string;
  updatedAt: string;
}
