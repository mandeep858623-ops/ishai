export type RecordingCategory = 'Ideas' | 'Study' | 'Meetings' | 'Personal' | 'Other';

export interface VoiceRecordingMoment {
  id: string;
  timestamp: number; // in seconds
  label: string;
  type: 'idea' | 'question' | 'action' | 'note' | 'custom';
}

export interface VoiceRecording {
  id: string;
  userId: string;
  title: string;
  duration: number; // in seconds
  createdAt: number;
  updatedAt: number;
  tag: RecordingCategory;
  notes: string;
  moments: VoiceRecordingMoment[];
  audioBlob?: Blob;
  audioUrl?: string; // transient ObjectURL
  mimeType: string;
  waveformSamples: number[]; // normalized 0..1 peak samples
  lastPlayedPosition: number;
  transcript?: string;
  sizeBytes?: number;
}
