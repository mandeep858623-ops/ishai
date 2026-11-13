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
  rawViewCount?: number;
  likeCount?: string;
  categoryId?: string;
  embeddable: boolean;
  privacyStatus?: string;
  ageRestricted?: boolean;
  liveBroadcastContent?: string;
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

export class YouTubeServiceError extends Error {
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
    this.name = 'YouTubeServiceError';
    this.status = status;
    this.code = code;
    this.configured = configured;
    this.requiredEnvVar = requiredEnvVar;
  }
}

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const MAX_CACHE_ENTRIES = 250;
const responseCache = new Map<string, CacheEntry<any>>();

function getApiKey(): string {
  return (process.env.YOUTUBE_API_KEY || process.env.GOOGLE_YOUTUBE_API_KEY || '').trim();
}

function getCached<T>(key: string): T | null {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    responseCache.delete(key);
    return null;
  }
  return entry.value as T;
}

function setCached<T>(key: string, value: T, ttlMs: number): void {
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = responseCache.keys().next().value;
    if (firstKey) responseCache.delete(firstKey);
  }
  responseCache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function formatIsoDuration(iso?: string): string {
  if (!iso || typeof iso !== 'string') return '';
  if (iso === 'P0D' || iso === 'PT0S') return 'LIVE';
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!match) return '';
  const hours = Number(match[1] || 0);
  const mins = Number(match[2] || 0);
  const secs = Number(match[3] || 0);
  if (hours > 0) {
    return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function formatViewCount(raw?: string | number): string {
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) return '';
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B views`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M views`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K views`;
  return `${num.toLocaleString()} views`;
}

function formatCompactCount(raw?: string | number): string {
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) return '';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return `${num}`;
}

function pickThumbnail(thumbnails: any, videoId: string): string {
  return (
    thumbnails?.maxres?.url ||
    thumbnails?.standard?.url ||
    thumbnails?.high?.url ||
    thumbnails?.medium?.url ||
    thumbnails?.default?.url ||
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
  );
}

function mapVideoResource(item: any): YouTubeVideoItem {
  const id = typeof item.id === 'string' ? item.id : item.id?.videoId || '';
  const snippet = item.snippet || {};
  const contentDetails = item.contentDetails || {};
  const statistics = item.statistics || {};
  const status = item.status || {};
  const rawViews = Number(statistics.viewCount || 0);
  const live = snippet.liveBroadcastContent && snippet.liveBroadcastContent !== 'none';

  return {
    id,
    title: snippet.title || 'Untitled YouTube Video',
    description: snippet.description || '',
    channelId: snippet.channelId || '',
    channelTitle: snippet.channelTitle || 'YouTube Creator',
    thumbnail: pickThumbnail(snippet.thumbnails, id),
    publishedAt: snippet.publishedAt || '',
    duration: live ? 'LIVE' : formatIsoDuration(contentDetails.duration),
    viewCount: formatViewCount(rawViews),
    rawViewCount: Number.isFinite(rawViews) ? rawViews : undefined,
    likeCount: formatCompactCount(statistics.likeCount),
    categoryId: snippet.categoryId,
    embeddable: status.embeddable !== false,
    privacyStatus: status.privacyStatus || 'public',
    ageRestricted: contentDetails?.contentRating?.ytRating === 'ytAgeRestricted',
    liveBroadcastContent: snippet.liveBroadcastContent || 'none',
  };
}

function requireYouTubeApiKey(): string {
  const key = getApiKey();
  if (!key) {
    throw new YouTubeServiceError(
      'YouTube Data API v3 key is not configured on the server. Set YOUTUBE_API_KEY in your .env file or Vercel Environment Variables to enable real YouTube search, trending, and category discovery.',
      503,
      'YOUTUBE_API_KEY_MISSING',
      false,
      'YOUTUBE_API_KEY'
    );
  }
  return key;
}

async function ytFetch(endpoint: string, params: Record<string, string | number | undefined>): Promise<any> {
  const apiKey = requireYouTubeApiKey();
  const url = new URL(`${YOUTUBE_API_BASE}/${endpoint}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, String(v));
    }
  }
  url.searchParams.set('key', apiKey);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const apiErr = data?.error;
      const reason = apiErr?.errors?.[0]?.reason || '';
      const msg = apiErr?.message || `YouTube API request failed (HTTP ${res.status})`;

      if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded') {
        throw new YouTubeServiceError(
          'YouTube Data API v3 daily quota exceeded. Please try again later or check your Google Cloud Console quota.',
          429,
          'YOUTUBE_QUOTA_EXCEEDED',
          true
        );
      }
      if (reason === 'keyInvalid' || reason === 'ipRefererBlocked' || res.status === 403) {
        throw new YouTubeServiceError(
          `YouTube Data API v3 key error: ${msg}`,
          res.status,
          'YOUTUBE_API_AUTH_ERROR',
          true,
          'YOUTUBE_API_KEY'
        );
      }
      throw new YouTubeServiceError(msg, res.status, 'YOUTUBE_API_ERROR', true);
    }

    return data;
  } catch (err: any) {
    if (err instanceof YouTubeServiceError) throw err;
    if (err?.name === 'AbortError') {
      throw new YouTubeServiceError('YouTube Data API request timed out.', 504, 'YOUTUBE_TIMEOUT', true);
    }
    throw new YouTubeServiceError(
      err?.message || 'Failed to connect to YouTube Data API.',
      502,
      'YOUTUBE_NETWORK_ERROR',
      true
    );
  } finally {
    clearTimeout(timer);
  }
}

async function enrichVideoIds(videoIds: string[]): Promise<YouTubeVideoItem[]> {
  const cleanIds = videoIds.filter((id) => /^[a-zA-Z0-9_-]{11}$/.test(id)).slice(0, 50);
  if (cleanIds.length === 0) return [];

  const data = await ytFetch('videos', {
    part: 'snippet,contentDetails,statistics,status',
    id: cleanIds.join(','),
    maxResults: cleanIds.length,
  });

  const items = Array.isArray(data?.items) ? data.items : [];
  return items
    .map(mapVideoResource)
    .filter((v: YouTubeVideoItem) => v.privacyStatus !== 'private');
}

export function getYouTubeStatus() {
  const configured = Boolean(getApiKey());
  return {
    configured,
    requiredEnvVar: 'YOUTUBE_API_KEY',
    regionCode: process.env.YOUTUBE_REGION_CODE || 'US',
    setupInstructions: configured
      ? 'YouTube Data API v3 is connected on the server.'
      : 'Add YOUTUBE_API_KEY (with YouTube Data API v3 enabled in Google Cloud Console) to your server environment variables (.env locally or Vercel Project Settings) and restart/redeploy.',
  };
}

export async function searchYouTubeVideos(options: {
  query: string;
  maxResults?: number;
  pageToken?: string;
  categoryId?: string;
  order?: 'relevance' | 'date' | 'viewCount' | 'rating';
}): Promise<{
  videos: YouTubeVideoItem[];
  nextPageToken: string | null;
  totalResults: number;
  query: string;
}> {
  const cleanQuery = (options.query || '').trim();
  if (!cleanQuery) {
    throw new YouTubeServiceError('Search query is required.', 400, 'QUERY_REQUIRED', Boolean(getApiKey()));
  }

  const maxResults = Math.min(Math.max(Number(options.maxResults) || 16, 1), 25);
  const order = options.order || 'relevance';
  const cacheKey = `search:${cleanQuery.toLowerCase()}:${maxResults}:${options.pageToken || ''}:${options.categoryId || ''}:${order}`;
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;

  const searchData = await ytFetch('search', {
    part: 'snippet',
    type: 'video',
    q: cleanQuery,
    maxResults,
    pageToken: options.pageToken,
    videoCategoryId: options.categoryId,
    videoEmbeddable: 'true',
    safeSearch: 'moderate',
    order,
  });

  const rawItems = Array.isArray(searchData?.items) ? searchData.items : [];
  const ids = rawItems.map((it: any) => it?.id?.videoId).filter(Boolean);
  const enriched = await enrichVideoIds(ids);

  const enrichedById = new Map(enriched.map((v) => [v.id, v]));
  const ordered: YouTubeVideoItem[] = ids
    .map((id: string) => enrichedById.get(id))
    .filter((v: YouTubeVideoItem | undefined): v is YouTubeVideoItem => Boolean(v && v.embeddable));

  const payload = {
    videos: ordered,
    nextPageToken: searchData?.nextPageToken || null,
    totalResults: Number(searchData?.pageInfo?.totalResults || ordered.length),
    query: cleanQuery,
  };

  setCached(cacheKey, payload, 5 * 60 * 1000);
  return payload;
}

const SECTION_CONFIG: Record<
  YouTubeBrowseSection,
  { label: string; categoryId?: string; fallbackQuery: string }
> = {
  trending: { label: 'Trending', fallbackQuery: 'trending popular videos' },
  music: { label: 'Music', categoryId: '10', fallbackQuery: 'official music video acoustic performance' },
  education: { label: 'Educational', categoryId: '27', fallbackQuery: 'science documentary educational lecture explained' },
  science_tech: { label: 'Science & Tech', categoryId: '28', fallbackQuery: 'science engineering technology breakthrough' },
  entertainment: { label: 'Entertainment', categoryId: '24', fallbackQuery: 'cinema film animation comedy showcase' },
  gaming: { label: 'Gaming', categoryId: '20', fallbackQuery: 'indie game showcase gameplay esports' },
  news: { label: 'News', categoryId: '25', fallbackQuery: 'world news analysis technology briefing' },
  sports: { label: 'Sports', categoryId: '17', fallbackQuery: 'sports highlights championship analysis' },
};

export async function browseYouTubeCategory(options: {
  section: YouTubeBrowseSection;
  regionCode?: string;
  maxResults?: number;
  pageToken?: string;
}): Promise<{
  section: YouTubeBrowseSection;
  label: string;
  videos: YouTubeVideoItem[];
  nextPageToken: string | null;
}> {
  const section: YouTubeBrowseSection = SECTION_CONFIG[options.section] ? options.section : 'trending';
  const cfg = SECTION_CONFIG[section];
  const regionCode = (options.regionCode || process.env.YOUTUBE_REGION_CODE || 'US').toUpperCase();
  const maxResults = Math.min(Math.max(Number(options.maxResults) || 16, 1), 25);

  const cacheKey = `browse:${section}:${regionCode}:${maxResults}:${options.pageToken || ''}`;
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;

  let videos: YouTubeVideoItem[] = [];
  let nextPageToken: string | null = null;

  // Use low-quota (1 unit) videos.list mostPopular chart when supported
  try {
    const data = await ytFetch('videos', {
      part: 'snippet,contentDetails,statistics,status',
      chart: 'mostPopular',
      regionCode,
      videoCategoryId: cfg.categoryId,
      maxResults,
      pageToken: options.pageToken,
    });
    const items = Array.isArray(data?.items) ? data.items : [];
    videos = items
      .map(mapVideoResource)
      .filter((v: YouTubeVideoItem) => v.embeddable && v.privacyStatus !== 'private');
    nextPageToken = data?.nextPageToken || null;
  } catch (err: any) {
    // Some categories (like Education 27) do not have a mostPopular chart in every region.
    // Only rethrow auth/quota/config errors; otherwise fall back to category search.
    if (
      err instanceof YouTubeServiceError &&
      (err.code === 'YOUTUBE_API_KEY_MISSING' ||
        err.code === 'YOUTUBE_QUOTA_EXCEEDED' ||
        err.code === 'YOUTUBE_API_AUTH_ERROR')
    ) {
      throw err;
    }
  }

  if (videos.length === 0) {
    const fallback = await searchYouTubeVideos({
      query: cfg.fallbackQuery,
      categoryId: cfg.categoryId,
      maxResults,
      pageToken: options.pageToken,
      order: 'viewCount',
    });
    videos = fallback.videos;
    nextPageToken = fallback.nextPageToken;
  }

  const payload = {
    section,
    label: cfg.label,
    videos,
    nextPageToken,
  };

  setCached(cacheKey, payload, 10 * 60 * 1000);
  return payload;
}

export async function getYouTubeVideoDetails(videoId: string): Promise<YouTubeVideoItem> {
  const cleanId = (videoId || '').trim();
  if (!/^[a-zA-Z0-9_-]{11}$/.test(cleanId)) {
    throw new YouTubeServiceError('Invalid YouTube video ID.', 400, 'INVALID_VIDEO_ID', Boolean(getApiKey()));
  }

  const cacheKey = `video:${cleanId}`;
  const cached = getCached<YouTubeVideoItem>(cacheKey);
  if (cached) return cached;

  const data = await ytFetch('videos', {
    part: 'snippet,contentDetails,statistics,status',
    id: cleanId,
  });

  const raw = Array.isArray(data?.items) ? data.items[0] : null;
  if (!raw) {
    throw new YouTubeServiceError(
      'This video is unavailable, deleted, or private on YouTube.',
      404,
      'VIDEO_UNAVAILABLE',
      true
    );
  }

  const mapped = mapVideoResource(raw);
  if (mapped.privacyStatus === 'private') {
    throw new YouTubeServiceError(
      'This video is private on YouTube and cannot be played.',
      403,
      'VIDEO_PRIVATE',
      true
    );
  }

  setCached(cacheKey, mapped, 10 * 60 * 1000);
  return mapped;
}

export async function getRelatedYouTubeVideos(videoId: string): Promise<{
  videos: YouTubeVideoItem[];
  sourceVideoId: string;
}> {
  const cleanId = (videoId || '').trim();
  if (!/^[a-zA-Z0-9_-]{11}$/.test(cleanId)) {
    throw new YouTubeServiceError('Invalid YouTube video ID.', 400, 'INVALID_VIDEO_ID', Boolean(getApiKey()));
  }

  const cacheKey = `related:${cleanId}`;
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;

  const source = await getYouTubeVideoDetails(cleanId);
  const cleanedKeywords = source.title
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 6)
    .join(' ');

  const searchQuery = [cleanedKeywords, source.channelTitle].filter(Boolean).join(' ').trim() || source.title;
  const searchResult = await searchYouTubeVideos({
    query: searchQuery,
    categoryId: source.categoryId,
    maxResults: 12,
    order: 'relevance',
  });

  const related = searchResult.videos.filter((v) => v.id !== cleanId).slice(0, 10);
  const payload = { videos: related, sourceVideoId: cleanId };
  setCached(cacheKey, payload, 10 * 60 * 1000);
  return payload;
}

export async function getYouTubeSearchSuggestions(query: string): Promise<string[]> {
  const clean = (query || '').trim();
  if (!clean) return [];

  const cacheKey = `suggest:${clean.toLowerCase()}`;
  const cached = getCached<string[]>(cacheKey);
  if (cached) return cached;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(clean)}`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return [];
    const data = await res.json().catch(() => null);
    if (Array.isArray(data) && Array.isArray(data[1])) {
      const list = data[1]
        .filter((s: unknown): s is string => typeof s === 'string' && s.trim().length > 0)
        .slice(0, 8);
      setCached(cacheKey, list, 5 * 60 * 1000);
      return list;
    }
    return [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
