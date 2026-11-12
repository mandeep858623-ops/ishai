export type ToolType =
  | 'chat'
  | 'writer'
  | 'coding'
  | 'math'
  | 'study'
  | 'documents'
  | 'translator'
  | 'productivity'
  | 'voice'
  | 'voice_ai'
  | 'ai_coder'
  | 'creative'
  | 'whatsapp'
  | 'camera'
  | 'news'
  | 'space_xplorer'
  | 'language_studio'
  | 'lens_x'
  | 'gmail'
  | 'voice_recorder'
  | '3d_lab'
  | 'whiteboard'
  | 'settings';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  error?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  theme: 'dark' | 'light';
  responseTone: 'balanced' | 'concise' | 'technical' | 'creative';
  fontSize: 'sm' | 'md' | 'lg';
  speechEnabled: boolean;
  voiceGender: 'male' | 'female';
  startupIntroEnabled?: boolean;
}

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}
