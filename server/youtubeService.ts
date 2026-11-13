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

// ============================================================
// Official YouTube Data API v3 Client (when YOUTUBE_API_KEY is set)
// ============================================================
async function ytFetch(endpoint: string, params: Record<string, string | number | undefined>): Promise<any> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new YouTubeServiceError(
      'YouTube Data API v3 key is not configured.',
      503,
      'YOUTUBE_API_KEY_MISSING',
      false,
      'YOUTUBE_API_KEY'
    );
  }
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
      const detailReason = apiErr?.details?.[0]?.reason || '';
      const msg = apiErr?.message || `YouTube API request failed (HTTP ${res.status})`;

      if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded') {
        throw new YouTubeServiceError(
          'YouTube Data API v3 daily quota exceeded. Try again later or increase quota in Google Cloud Console.',
          429,
          'YOUTUBE_QUOTA_EXCEEDED',
          true
        );
      }
      if (
        reason === 'ipRefererBlocked' ||
        detailReason === 'API_KEY_HTTP_REFERRER_BLOCKED' ||
        /referer|referrer/i.test(msg)
      ) {
        throw new YouTubeServiceError(
          'YouTube Data API v3 rejected this request because your Google Cloud API key has HTTP Referrer (website) restrictions enabled. Because ISHAI calls YouTube securely from the server, set Application restrictions to "None" and API restrictions to "YouTube Data API v3" in Google Cloud Console.',
          403,
          'YOUTUBE_API_REFERRER_BLOCKED',
          true,
          'YOUTUBE_API_KEY'
        );
      }
      if (reason === 'accessNotConfigured' || detailReason === 'SERVICE_DISABLED') {
        throw new YouTubeServiceError(
          'YouTube Data API v3 is not enabled in your Google Cloud project. Enable "YouTube Data API v3" in Google Cloud Console -> APIs & Services.',
          403,
          'YOUTUBE_API_DISABLED',
          true,
          'YOUTUBE_API_KEY'
        );
      }
      if (reason === 'keyInvalid' || detailReason === 'API_KEY_INVALID' || res.status === 403 || res.status === 401) {
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

// ============================================================
// Public YouTube Web Search & oEmbed Fallback (when API key unset)
// Zero downloader links, zero invented mock videos — real YouTube results
// ============================================================
const YT_CONSENT_COOKIE = 'SOCS=CAESEwgDEgk0ODE3Nzk3MjQaAmVuIAEaBgiA_LyaBg; CONSENT=YES+cb.20210328-17-p0.en+FX+100';
const YT_BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

function collectVideoRenderers(node: any, out: any[], depth = 0): void {
  if (!node || typeof node !== 'object' || depth > 16 || out.length >= 40) return;
  if (Array.isArray(node)) {
    for (const item of node) {
      collectVideoRenderers(item, out, depth + 1);
      if (out.length >= 40) break;
    }
    return;
  }
  if (node.videoRenderer && typeof node.videoRenderer === 'object' && node.videoRenderer.videoId) {
    out.push({ kind: 'videoRenderer', node: node.videoRenderer });
    return;
  }
  if (
    node.lockupViewModel &&
    typeof node.lockupViewModel === 'object' &&
    typeof node.lockupViewModel.contentId === 'string' &&
    /^[a-zA-Z0-9_-]{11}$/.test(node.lockupViewModel.contentId)
  ) {
    out.push({ kind: 'lockupViewModel', node: node.lockupViewModel });
    return;
  }
  for (const val of Object.values(node)) {
    if (val && typeof val === 'object') {
      collectVideoRenderers(val, out, depth + 1);
      if (out.length >= 40) break;
    }
  }
}

function readRunsText(obj: any): string {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (typeof obj.content === 'string') return obj.content;
  if (typeof obj.simpleText === 'string') return obj.simpleText;
  if (Array.isArray(obj.runs)) {
    return obj.runs.map((r: any) => r?.text || '').join('').trim();
  }
  return '';
}

function extractVideosFromYtData(rootData: any, maxResults: number): YouTubeVideoItem[] {
  const renderers: Array<{ kind: string; node: any }> = [];
  collectVideoRenderers(rootData?.contents ?? rootData, renderers);

  const videos: YouTubeVideoItem[] = [];
  const seen = new Set<string>();

  for (const entry of renderers) {
    if (entry.kind === 'lockupViewModel') {
      const vm = entry.node;
      const id = vm.contentId;
      if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id) || seen.has(id)) continue;
      seen.add(id);

      const meta = vm.metadata?.lockupMetadataViewModel || {};
      const title = readRunsText(meta.title) || 'YouTube Video';
      const rows = meta.metadata?.contentMetadataViewModel?.metadataRows || [];
      const channelTitle = readRunsText(rows?.[0]?.metadataParts?.[0]?.text) || 'YouTube Creator';
      const viewCount = readRunsText(rows?.[1]?.metadataParts?.[0]?.text) || '';
      const publishedAt = readRunsText(rows?.[1]?.metadataParts?.[1]?.text) || '';
      const thumbs = vm.contentImage?.thumbnailViewModel?.image?.sources;
      const thumbnail =
        (Array.isArray(thumbs) && thumbs.length > 0 ? thumbs[thumbs.length - 1]?.url : '') ||
        `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

      videos.push({
        id,
        title,
        description: '',
        channelId: '',
        channelTitle,
        thumbnail: thumbnail.startsWith('//') ? `https:${thumbnail}` : thumbnail,
        publishedAt,
        duration: '',
        viewCount,
        embeddable: true,
        privacyStatus: 'public',
      });
    } else {
      const v = entry.node;
      const id = v?.videoId;
      if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id) || seen.has(id)) continue;
      seen.add(id);

      const title = readRunsText(v.title) || 'YouTube Video';
      const channelTitle = readRunsText(v.ownerText) || readRunsText(v.longBylineText) || 'YouTube Creator';
      const channelId = v.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || '';
      const duration = readRunsText(v.lengthText) || '';
      const viewCount = readRunsText(v.viewCountText) || readRunsText(v.shortViewCountText) || '';
      const publishedAt = readRunsText(v.publishedTimeText) || '';
      const snippetFromDetailed = Array.isArray(v.detailedMetadataSnippets)
        ? readRunsText(v.detailedMetadataSnippets[0]?.snippetText)
        : '';
      const description = snippetFromDetailed || readRunsText(v.descriptionSnippet) || '';
      const thumbs = v.thumbnail?.thumbnails;
      const thumbnail =
        (Array.isArray(thumbs) && thumbs.length > 0 ? thumbs[thumbs.length - 1]?.url : '') ||
        `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

      videos.push({
        id,
        title,
        description,
        channelId,
        channelTitle,
        thumbnail: thumbnail.startsWith('//') ? `https:${thumbnail}` : thumbnail,
        publishedAt,
        duration: duration || (v.badges?.some((b: any) => b?.metadataBadgeRenderer?.style?.includes('LIVE')) ? 'LIVE' : ''),
        viewCount,
        embeddable: true,
        privacyStatus: 'public',
      });
    }

    if (videos.length >= maxResults) break;
  }

  return videos;
}

async function searchYouTubeInnertube(
  query: string,
  maxResults: number,
  order: 'relevance' | 'date' | 'viewCount' | 'rating'
): Promise<YouTubeVideoItem[]> {
  const spMap: Record<string, string | undefined> = {
    relevance: undefined,
    date: 'CAI%3D',
    viewCount: 'CAM%3D',
    rating: 'CAE%3D',
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch('https://www.youtube.com/youtubei/v1/search?prettyPrint=false', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': YT_BROWSER_UA,
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://www.youtube.com',
        'Referer': 'https://www.youtube.com/',
        'Cookie': YT_CONSENT_COOKIE,
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: '2.20240726.00.00',
            hl: 'en',
            gl: (process.env.YOUTUBE_REGION_CODE || 'US').toUpperCase(),
          },
        },
        query,
        ...(spMap[order] ? { params: decodeURIComponent(spMap[order]!) } : {}),
      }),
    });

    if (!res.ok) {
      throw new YouTubeServiceError(
        `YouTube search returned HTTP ${res.status}`,
        res.status,
        'YOUTUBE_UPSTREAM_ERROR',
        true
      );
    }

    const data = await res.json();
    return extractVideosFromYtData(data, maxResults);
  } finally {
    clearTimeout(timer);
  }
}

async function searchYouTubeResultsHtml(
  query: string,
  maxResults: number,
  order: 'relevance' | 'date' | 'viewCount' | 'rating'
): Promise<{ videos: YouTubeVideoItem[]; parsedInitialData: boolean }> {
  const sortParams: Record<string, string> = {
    relevance: '',
    date: '&sp=CAI%253D',
    viewCount: '&sp=CAM%253D',
    rating: '&sp=CAE%253D',
  };
  const sp = sortParams[order] || '';
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}${sp}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8500);
  try {
    const res = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': YT_BROWSER_UA,
        'Accept-Language': 'en-US,en;q=0.9',
        'Cookie': YT_CONSENT_COOKIE,
      },
    });
    if (!res.ok) {
      throw new YouTubeServiceError(`YouTube search returned HTTP ${res.status}`, res.status, 'YOUTUBE_UPSTREAM_ERROR', true);
    }

    const html = await res.text();
    const jsonMatch = html.match(/var ytInitialData\s*=\s*(\{[\s\S]*?\});\s*<\/script>/);
    if (!jsonMatch) {
      return { videos: [], parsedInitialData: false };
    }

    const data = JSON.parse(jsonMatch[1]);
    return { videos: extractVideosFromYtData(data, maxResults), parsedInitialData: true };
  } finally {
    clearTimeout(timer);
  }
}

async function searchYouTubePublicWeb(
  query: string,
  maxResults = 16,
  order: 'relevance' | 'date' | 'viewCount' | 'rating' = 'relevance'
): Promise<YouTubeVideoItem[]> {
  let innertubeErr: any = null;
  try {
    const videos = await searchYouTubeInnertube(query, maxResults, order);
    if (videos.length > 0) return videos;
  } catch (err) {
    innertubeErr = err;
  }

  try {
    const htmlResult = await searchYouTubeResultsHtml(query, maxResults, order);
    if (htmlResult.videos.length > 0 || htmlResult.parsedInitialData) {
      return htmlResult.videos;
    }
  } catch (htmlErr) {
    if (!innertubeErr) innertubeErr = htmlErr;
  }

  if (innertubeErr) {
    throw new YouTubeServiceError(
      'YouTube blocked unauthenticated search from this server IP. Add YOUTUBE_API_KEY in Vercel Environment Variables to enable official YouTube Data API v3 search.',
      503,
      'YOUTUBE_API_KEY_MISSING',
      false,
      'YOUTUBE_API_KEY'
    );
  }

  return [];
}

async function fetchYouTubeOEmbed(videoId: string): Promise<YouTubeVideoItem> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      `https://www.youtube.com/watch?v=${videoId}`
    )}&format=json`;
    const res = await fetch(url, { signal: controller.signal });
    if (res.status === 404) {
      throw new YouTubeServiceError(
        'This video is unavailable, deleted, or private on YouTube.',
        404,
        'VIDEO_UNAVAILABLE',
        true
      );
    }
    if (res.status === 401 || res.status === 403) {
      return {
        id: videoId,
        title: `YouTube Video (${videoId})`,
        description: 'Embedding disabled by owner on YouTube.',
        channelId: '',
        channelTitle: 'YouTube',
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        publishedAt: '',
        duration: '',
        viewCount: '',
        embeddable: false,
        privacyStatus: 'public',
      };
    }
    if (!res.ok) {
      throw new YouTubeServiceError(`YouTube metadata unavailable (HTTP ${res.status})`, res.status, 'YOUTUBE_OEMBED_ERROR', true);
    }
    const data = await res.json();
    return {
      id: videoId,
      title: data?.title || `YouTube Video (${videoId})`,
      description: '',
      channelId: '',
      channelTitle: data?.author_name || 'YouTube Creator',
      thumbnail: data?.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      publishedAt: '',
      duration: '',
      viewCount: '',
      embeddable: true,
      privacyStatus: 'public',
    };
  } finally {
    clearTimeout(timer);
  }
}

// ============================================================
// Public Service Functions
// ============================================================
export function getYouTubeStatus() {
  const apiKeyConfigured = Boolean(getApiKey());
  return {
    configured: true,
    apiKeyConfigured,
    mode: apiKeyConfigured ? 'youtube_data_api_v3' : 'youtube_web_discovery',
    requiredEnvVar: 'YOUTUBE_API_KEY',
    regionCode: process.env.YOUTUBE_REGION_CODE || 'US',
    setupInstructions: apiKeyConfigured
      ? 'YouTube Data API v3 is connected on the server.'
      : 'Live YouTube playback & discovery are active. Add server-side YOUTUBE_API_KEY (.env or Vercel Environment Variables) if you want official YouTube Data API v3 quota mode.',
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
  mode: string;
}> {
  const cleanQuery = (options.query || '').trim();
  if (!cleanQuery) {
    throw new YouTubeServiceError('Search query is required.', 400, 'QUERY_REQUIRED', true);
  }

  const maxResults = Math.min(Math.max(Number(options.maxResults) || 16, 1), 25);
  const order = options.order || 'relevance';
  const apiKeyConfigured = Boolean(getApiKey());
  const cacheKey = `search:${apiKeyConfigured ? 'v3' : 'web'}:${cleanQuery.toLowerCase()}:${maxResults}:${options.pageToken || ''}:${options.categoryId || ''}:${order}`;
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;

  if (apiKeyConfigured) {
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
      mode: 'youtube_data_api_v3',
    };

    setCached(cacheKey, payload, 5 * 60 * 1000);
    return payload;
  }

  const videos = await searchYouTubePublicWeb(cleanQuery, maxResults, order);
  const payload = {
    videos,
    nextPageToken: null,
    totalResults: videos.length,
    query: cleanQuery,
    mode: 'youtube_web_discovery',
  };
  setCached(cacheKey, payload, 5 * 60 * 1000);
  return payload;
}

const SECTION_CONFIG: Record<
  YouTubeBrowseSection,
  { label: string; categoryId?: string; fallbackQuery: string }
> = {
  trending: { label: 'Trending', fallbackQuery: 'trending popular videos 2026' },
  music: { label: 'Music', categoryId: '10', fallbackQuery: 'official music video acoustic performance' },
  education: { label: 'Educational', categoryId: '27', fallbackQuery: 'science documentary educational lecture explained' },
  science_tech: { label: 'Science & Tech', categoryId: '28', fallbackQuery: 'science engineering technology breakthrough' },
  entertainment: { label: 'Entertainment', categoryId: '24', fallbackQuery: 'cinema film animation comedy showcase' },
  gaming: { label: 'Gaming', categoryId: '20', fallbackQuery: 'gaming gameplay showcase review' },
  news: { label: 'News', categoryId: '25', fallbackQuery: 'world news analysis live briefing' },
  sports: { label: 'Sports', categoryId: '17', fallbackQuery: 'sports highlights championship match' },
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
  mode: string;
}> {
  const section: YouTubeBrowseSection = SECTION_CONFIG[options.section] ? options.section : 'trending';
  const cfg = SECTION_CONFIG[section];
  const regionCode = (options.regionCode || process.env.YOUTUBE_REGION_CODE || 'US').toUpperCase();
  const maxResults = Math.min(Math.max(Number(options.maxResults) || 16, 1), 25);
  const apiKeyConfigured = Boolean(getApiKey());

  const cacheKey = `browse:${apiKeyConfigured ? 'v3' : 'web'}:${section}:${regionCode}:${maxResults}:${options.pageToken || ''}`;
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;

  let videos: YouTubeVideoItem[] = [];
  let nextPageToken: string | null = null;

  if (apiKeyConfigured) {
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
      if (
        err instanceof YouTubeServiceError &&
        (err.code === 'YOUTUBE_QUOTA_EXCEEDED' ||
          err.code === 'YOUTUBE_API_AUTH_ERROR' ||
          err.code === 'YOUTUBE_API_REFERRER_BLOCKED' ||
          err.code === 'YOUTUBE_API_DISABLED')
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
  } else {
    videos = await searchYouTubePublicWeb(cfg.fallbackQuery, maxResults, 'relevance');
  }

  const payload = {
    section,
    label: cfg.label,
    videos,
    nextPageToken,
    mode: apiKeyConfigured ? 'youtube_data_api_v3' : 'youtube_web_discovery',
  };

  setCached(cacheKey, payload, 10 * 60 * 1000);
  return payload;
}

export async function getYouTubeVideoDetails(videoId: string): Promise<YouTubeVideoItem> {
  const cleanId = (videoId || '').trim();
  if (!/^[a-zA-Z0-9_-]{11}$/.test(cleanId)) {
    throw new YouTubeServiceError('Invalid YouTube video ID.', 400, 'INVALID_VIDEO_ID', true);
  }

  const apiKeyConfigured = Boolean(getApiKey());
  const cacheKey = `video:${apiKeyConfigured ? 'v3' : 'oembed'}:${cleanId}`;
  const cached = getCached<YouTubeVideoItem>(cacheKey);
  if (cached) return cached;

  if (apiKeyConfigured) {
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

  const oembedVideo = await fetchYouTubeOEmbed(cleanId);
  setCached(cacheKey, oembedVideo, 10 * 60 * 1000);
  return oembedVideo;
}

export async function getRelatedYouTubeVideos(videoId: string): Promise<{
  videos: YouTubeVideoItem[];
  sourceVideoId: string;
}> {
  const cleanId = (videoId || '').trim();
  if (!/^[a-zA-Z0-9_-]{11}$/.test(cleanId)) {
    throw new YouTubeServiceError('Invalid YouTube video ID.', 400, 'INVALID_VIDEO_ID', true);
  }

  const cacheKey = `related:${Boolean(getApiKey()) ? 'v3' : 'web'}:${cleanId}`;
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;

  const source = await getYouTubeVideoDetails(cleanId);
  if (!source.embeddable || source.title === `YouTube Video (${cleanId})`) {
    return { videos: [], sourceVideoId: cleanId };
  }

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
