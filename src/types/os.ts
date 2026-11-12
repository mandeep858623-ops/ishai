export type UserMode = 'DEV' | 'GUEST';

export interface LogEntry {
  id: string;
  timestamp: string;
  tag: string;
  text: string;
  audioUrl?: string;
  songData?: {
    title: string;
    genre: string;
    mood: string;
    tempoBpm: number;
    musicalKey?: string;
    lyricsSnippet?: string;
  };
}

export interface Contact {
  name: string;
  phone: string;
}

export interface IntruderLog {
  id: string;
  timestamp: string;
  image?: string;
  status: string;
}
