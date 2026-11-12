import { VoiceRecording } from '../types/voiceRecorder';

const DB_NAME = 'IshaiVoiceRecorderDB';
const DB_VERSION = 1;
const STORE_NAME = 'recordings';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('tag', 'tag', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Save or overwrite a voice recording in IndexedDB
 */
export async function saveVoiceRecording(recording: VoiceRecording): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Clone object, preserving Blob
    const dataToSave = {
      ...recording,
      audioUrl: undefined // Transient URL should not be persisted
    };

    const req = store.put(dataToSave);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieve all recordings belonging to a specific user (or guest)
 */
export async function getUserVoiceRecordings(userId: string): Promise<VoiceRecording[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('userId');
    const req = index.getAll(userId);

    req.onsuccess = () => {
      const list: VoiceRecording[] = req.result || [];
      // Generate object URLs for audio playback
      const mapped = list.map((item) => {
        let audioUrl: string | undefined = undefined;
        if (item.audioBlob) {
          try {
            audioUrl = URL.createObjectURL(item.audioBlob);
          } catch (e) {
            console.warn('Failed to create Object URL for audio blob', e);
          }
        }
        return {
          ...item,
          audioUrl
        };
      });
      // Sort newest first
      mapped.sort((a, b) => b.createdAt - a.createdAt);
      resolve(mapped);
    };

    req.onerror = () => reject(req.error);
  });
}

/**
 * Update metadata or notes for an existing recording
 */
export async function updateVoiceRecording(
  id: string,
  updates: Partial<VoiceRecording>
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      if (!getReq.result) {
        reject(new Error(`Recording ${id} not found.`));
        return;
      }
      const updated = {
        ...getReq.result,
        ...updates,
        updatedAt: Date.now(),
        audioUrl: undefined
      };
      const putReq = store.put(updated);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Delete a recording by ID
 */
export async function deleteVoiceRecording(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Download recording as an audio file (.webm or .wav)
 */
export function downloadVoiceRecordingFile(recording: VoiceRecording): void {
  if (!recording.audioBlob && !recording.audioUrl) {
    alert('No audio data available for download.');
    return;
  }

  const url = recording.audioUrl || (recording.audioBlob ? URL.createObjectURL(recording.audioBlob) : null);
  if (!url) return;

  const a = document.createElement('a');
  a.href = url;
  const ext = recording.mimeType.includes('wav') ? 'wav' : recording.mimeType.includes('mp4') ? 'm4a' : 'webm';
  const sanitizedTitle = recording.title.replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = `${sanitizedTitle || 'ishai_recording'}_${new Date(recording.createdAt).toISOString().slice(0, 10)}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Format seconds into MM:SS or HH:MM:SS
 */
export function formatAudioDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Helper to convert Blob to Base64
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
