import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebaseConfig';

export interface YouTubeVideoItem {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  thumbnail: string;
  publishedAt: string;
  duration: string;
  viewCount: string;
  likeCount?: string;
  categoryId?: string;
  embeddable: boolean;
  privacyStatus?: string;
  ageRestricted?: boolean;
  watchedAt?: string;
}

export type YouTubeBrowseSection =
  | 'trending'
  | 'music'
  | 'education'
  | 'science_tech'
  | 'entertainment'
  | 'gaming'
  | 'news'
  | 'sports';

export interface YouTubeApiStatus {
  configured: boolean;
  apiKeyConfigured?: boolean;
  mode?: string;
  requiredEnvVar: string;
  regionCode: string;
  setupInstructions: string;
}

export interface YouTubeUserState {
  favorites: YouTubeVideoItem[];
  history: YouTubeVideoItem[];
  recent_searches: string[];
  theme: 'dark' | 'light';
}

export class YouTubeClientError extends Error {
  status: number;
  code: string;
  configured: boolean;
  requiredEnvVar?: string;

  constructor(
    message: string,
    status = 500,
    code = 'YOUTUBE_ERROR',
    configured = true,
    requiredEnvVar?: string
  ) {
    super(message);
    this.name = 'YouTubeClientError';
    this.status = status;
    this.code = code;
    this.configured = configured;
    this.requiredEnvVar = requiredEnvVar;
  }
}

export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = (input || '').trim();
  if (!trimmed) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const normalized = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    const url = new URL(normalized);
    const host = url.hostname.toLowerCase();
    if (host.includes('youtu.be')) {
      const candidate = url.pathname.replace(/^\/+/, '').split('/')[0];
      return /^[a-zA-Z0-9_-]{11}$/.test(candidate) ? candidate : null;
    }
    if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
      const v = url.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length >= 2 && ['embed', 'shorts', 'live', 'v'].includes(parts[0])) {
        return /^[a-zA-Z0-9_-]{11}$/.test(parts[1]) ? parts[1] : null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function formatRelativeDate(iso?: string): string {
  if (!iso) return '';
  if (/ago|streamed|premiered/i.test(iso)) return iso;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} mo ago`;
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} yr${diffYears > 1 ? 's' : ''} ago`;
}

// ============================================================
// Official YouTube IFrame Player API Singleton Loader
// ============================================================
let ytApiPromise: Promise<any> | null = null;

export function loadYouTubeIframeAPI(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('YouTube IFrame API requires a browser environment.'));
  }

  const w = window as any;
  if (w.YT && w.YT.Player) {
    return Promise.resolve(w.YT);
  }

  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve, reject) => {
    const existingReady = w.onYouTubeIframeAPIReady;
    const timeout = window.setTimeout(() => {
      ytApiPromise = null;
      reject(new Error('Timed out loading official YouTube IFrame Player API.'));
    }, 12000);

    w.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timeout);
      if (typeof existingReady === 'function') {
        try {
          existingReady();
        } catch {}
      }
      resolve(w.YT);
    };

    const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.onerror = () => {
        window.clearTimeout(timeout);
        ytApiPromise = null;
        reject(new Error('Failed to load https://www.youtube.com/iframe_api (network or blocker).'));
      };
      document.head.appendChild(tag);
    }
  });

  return ytApiPromise;
}

// ============================================================
// Server API Clients (No client-side YouTube API keys)
// ============================================================
async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.success === false) {
    throw new YouTubeClientError(
      data?.error || `Request failed (HTTP ${res.status})`,
      res.status,
      data?.code || 'YOUTUBE_ERROR',
      data?.configured ?? res.status !== 503,
      data?.requiredEnvVar
    );
  }
  return data as T;
}

export async function fetchYouTubeStatus(): Promise<YouTubeApiStatus> {
  return apiGet<YouTubeApiStatus & { success: boolean }>('/api/youtube/status');
}

export async function searchYouTube(
  query: string,
  options: { maxResults?: number; pageToken?: string; order?: 'relevance' | 'date' | 'viewCount' | 'rating' } = {}
): Promise<{
  videos: YouTubeVideoItem[];
  nextPageToken: string | null;
  totalResults: number;
  query: string;
}> {
  const params = new URLSearchParams({
    q: query,
    maxResults: String(options.maxResults || 16),
    order: options.order || 'relevance',
  });
  if (options.pageToken) params.set('pageToken', options.pageToken);
  return apiGet(`/api/youtube/search?${params.toString()}`);
}

export async function browseYouTube(
  section: YouTubeBrowseSection,
  options: { maxResults?: number; pageToken?: string } = {}
): Promise<{
  section: YouTubeBrowseSection;
  label: string;
  videos: YouTubeVideoItem[];
  nextPageToken: string | null;
}> {
  const params = new URLSearchParams({
    category: section,
    maxResults: String(options.maxResults || 16),
  });
  if (options.pageToken) params.set('pageToken', options.pageToken);
  return apiGet(`/api/youtube/browse?${params.toString()}`);
}

export async function fetchYouTubeVideo(videoId: string): Promise<{ video: YouTubeVideoItem }> {
  return apiGet(`/api/youtube/video/${encodeURIComponent(videoId)}`);
}

export async function fetchRelatedYouTube(videoId: string): Promise<{ videos: YouTubeVideoItem[] }> {
  return apiGet(`/api/youtube/related/${encodeURIComponent(videoId)}`);
}

export async function fetchYouTubeSuggestions(query: string): Promise<string[]> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(`/api/youtube/suggestions?q=${encodeURIComponent(query.trim())}`);
    const data = await res.json();
    return Array.isArray(data?.suggestions) ? data.suggestions : [];
  } catch {
    return [];
  }
}

// ============================================================
// Per-User Isolated Watch History, Favourites & Recent Searches
// ============================================================
const COLLECTION_NAME = 'user_youtube_records';
const DEFAULT_USER_STATE: YouTubeUserState = {
  favorites: [],
  history: [],
  recent_searches: [],
  theme: 'dark',
};

function sanitizeVideoForStorage(v: YouTubeVideoItem): YouTubeVideoItem {
  return {
    id: String(v.id || '').slice(0, 32),
    title: String(v.title || 'Untitled Video').slice(0, 200),
    description: String(v.description || '').slice(0, 600),
    channelId: String(v.channelId || '').slice(0, 64),
    channelTitle: String(v.channelTitle || 'YouTube').slice(0, 120),
    thumbnail: String(v.thumbnail || '').slice(0, 500),
    publishedAt: String(v.publishedAt || '').slice(0, 64),
    duration: String(v.duration || '').slice(0, 24),
    viewCount: String(v.viewCount || '').slice(0, 40),
    likeCount: v.likeCount ? String(v.likeCount).slice(0, 32) : undefined,
    categoryId: v.categoryId ? String(v.categoryId).slice(0, 16) : undefined,
    embeddable: v.embeddable !== false,
    ...(v.watchedAt ? { watchedAt: String(v.watchedAt).slice(0, 64) } : {}),
  };
}

function getLocalStorageKey(scopeId?: string | null): string {
  const cleanScope = (scopeId || 'guest').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `ISHAI_YouTube_UserState_${cleanScope}`;
}

function readLocalState(scopeId?: string | null): YouTubeUserState {
  try {
    const raw = localStorage.getItem(getLocalStorageKey(scopeId));
    if (!raw) return { ...DEFAULT_USER_STATE };
    const parsed = JSON.parse(raw);
    return {
      favorites: Array.isArray(parsed?.favorites) ? parsed.favorites : [],
      history: Array.isArray(parsed?.history) ? parsed.history : [],
      recent_searches: Array.isArray(parsed?.recent_searches) ? parsed.recent_searches : [],
      theme: parsed?.theme === 'light' ? 'light' : 'dark',
    };
  } catch {
    return { ...DEFAULT_USER_STATE };
  }
}

function writeLocalState(scopeId: string | null | undefined, state: YouTubeUserState): void {
  try {
    localStorage.setItem(getLocalStorageKey(scopeId), JSON.stringify(state));
  } catch {}
}

export async function loadYouTubeUserState(fallbackUserId?: string | null): Promise<{
  state: YouTubeUserState;
  uid: string | null;
  syncedToCloud: boolean;
}> {
  const firebaseUid = auth.currentUser?.uid || null;
  const scopeId = firebaseUid || fallbackUserId || 'guest';
  const local = readLocalState(scopeId);

  if (!firebaseUid) {
    return { state: local, uid: fallbackUserId || null, syncedToCloud: false };
  }

  const docPath = `${COLLECTION_NAME}/${firebaseUid}`;
  try {
    const snap = await getDoc(doc(db, COLLECTION_NAME, firebaseUid));
    if (snap.exists()) {
      const data = snap.data();
      const cloudState: YouTubeUserState = {
        favorites: Array.isArray(data?.favorites) ? data.favorites : [],
        history: Array.isArray(data?.history) ? data.history : [],
        recent_searches: Array.isArray(data?.recent_searches) ? data.recent_searches : [],
        theme: data?.theme === 'light' ? 'light' : 'dark',
      };
      writeLocalState(firebaseUid, cloudState);
      return { state: cloudState, uid: firebaseUid, syncedToCloud: true };
    }
    return { state: local, uid: firebaseUid, syncedToCloud: true };
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.GET, docPath);
    } catch {
      // Logged in handleFirestoreError; fall back cleanly to user-scoped local cache
    }
    return { state: local, uid: firebaseUid, syncedToCloud: false };
  }
}

export async function saveYouTubeUserState(
  state: YouTubeUserState,
  fallbackUserId?: string | null
): Promise<boolean> {
  const firebaseUid = auth.currentUser?.uid || null;
  const scopeId = firebaseUid || fallbackUserId || 'guest';

  const normalized: YouTubeUserState = {
    favorites: state.favorites.slice(0, 100).map(sanitizeVideoForStorage),
    history: state.history.slice(0, 100).map(sanitizeVideoForStorage),
    recent_searches: state.recent_searches
      .map((s) => String(s || '').trim().slice(0, 120))
      .filter(Boolean)
      .slice(0, 30),
    theme: state.theme === 'light' ? 'light' : 'dark',
  };

  writeLocalState(scopeId, normalized);

  if (!firebaseUid) return false;

  const docPath = `${COLLECTION_NAME}/${firebaseUid}`;
  try {
    await setDoc(doc(db, COLLECTION_NAME, firebaseUid), {
      user_id: firebaseUid,
      favorites: normalized.favorites,
      history: normalized.history,
      recent_searches: normalized.recent_searches,
      theme: normalized.theme,
      updated_at: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.WRITE, docPath);
    } catch {
      // Logged in handleFirestoreError
    }
    return false;
  }
}
