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

  constructor(
    message: string,
    status = 500,
    code = 'YOUTUBE_ERROR',
    configured = true
  ) {
    super(message);
    this.name = 'YouTubeServiceError';
    this.status = status;
    this.code = code;
    this.configured = configured;
  }
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const MAX_CACHE_ENTRIES = 250;
const responseCache = new Map<string, CacheEntry<any>>();

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

// ============================================================
// Keyless Public YouTube Discovery & Official oEmbed Metadata
// Zero API keys, zero downloader links, zero invented mock videos
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
  order: 'relevance' | 'date' | 'viewCount' | 'rating',
  regionCode = 'US'
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
            gl: regionCode,
          },
        },
        query,
        ...(spMap[order] ? { params: decodeURIComponent(spMap[order]!) } : {}),
      }),
    });

    if (!res.ok) {
      throw new YouTubeServiceError(
        `Public YouTube search returned HTTP ${res.status}.`,
        res.status,
        'YOUTUBE_SEARCH_UNAVAILABLE',
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
      throw new YouTubeServiceError(
        `Public YouTube search returned HTTP ${res.status}.`,
        res.status,
        'YOUTUBE_SEARCH_UNAVAILABLE',
        true
      );
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
  order: 'relevance' | 'date' | 'viewCount' | 'rating' = 'relevance',
  regionCode = 'US'
): Promise<YouTubeVideoItem[]> {
  let upstreamErr: any = null;
  try {
    const videos = await searchYouTubeInnertube(query, maxResults, order, regionCode);
    if (videos.length > 0) return videos;
  } catch (err) {
    upstreamErr = err;
  }

  let parsedHtmlData = false;
  try {
    const htmlResult = await searchYouTubeResultsHtml(query, maxResults, order);
    parsedHtmlData = htmlResult.parsedInitialData;
    if (htmlResult.videos.length > 0 || parsedHtmlData) {
      return htmlResult.videos;
    }
  } catch (htmlErr) {
    if (!upstreamErr) upstreamErr = htmlErr;
  }

  if (upstreamErr || !parsedHtmlData) {
    throw new YouTubeServiceError(
      'Public YouTube keyword search is currently restricted by YouTube for this server. Use "Open YouTube Search" to find a video or paste any YouTube URL / Video ID to watch inside ISHAI.',
      503,
      'YOUTUBE_SEARCH_UNAVAILABLE',
      true
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
// Public Service Functions (100% Keyless)
// ============================================================
export function getYouTubeStatus() {
  return {
    configured: true,
    mode: 'keyless_iframe_player',
    regionCode: 'US',
    setupInstructions: 'Keyless YouTube IFrame Player is active. Paste any YouTube URL/Video ID or use public discovery.',
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
  const cacheKey = `search:nokey:${cleanQuery.toLowerCase()}:${maxResults}:${order}`;
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;

  const videos = await searchYouTubePublicWeb(cleanQuery, maxResults, order);
  const payload = {
    videos,
    nextPageToken: null,
    totalResults: videos.length,
    query: cleanQuery,
    mode: 'keyless_iframe_player',
  };
  setCached(cacheKey, payload, 5 * 60 * 1000);
  return payload;
}

const SECTION_CONFIG: Record<
  YouTubeBrowseSection,
  { label: string; query: string }
> = {
  trending: { label: 'Trending', query: 'trending popular videos' },
  music: { label: 'Music', query: 'official music video acoustic performance' },
  education: { label: 'Educational', query: 'science documentary educational lecture explained' },
  science_tech: { label: 'Science & Tech', query: 'science engineering technology breakthrough' },
  entertainment: { label: 'Entertainment', query: 'cinema film animation comedy showcase' },
  gaming: { label: 'Gaming', query: 'gaming gameplay showcase review' },
  news: { label: 'News', query: 'world news analysis live briefing' },
  sports: { label: 'Sports', query: 'sports highlights championship match' },
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
  const regionCode = (options.regionCode || 'US').toUpperCase();
  const maxResults = Math.min(Math.max(Number(options.maxResults) || 16, 1), 25);

  const cacheKey = `browse:nokey:${section}:${regionCode}:${maxResults}`;
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;

  const videos = await searchYouTubePublicWeb(cfg.query, maxResults, 'relevance', regionCode);
  const payload = {
    section,
    label: cfg.label,
    videos,
    nextPageToken: null,
    mode: 'keyless_iframe_player',
  };

  setCached(cacheKey, payload, 10 * 60 * 1000);
  return payload;
}

export async function getYouTubeVideoDetails(videoId: string): Promise<YouTubeVideoItem> {
  const cleanId = (videoId || '').trim();
  if (!/^[a-zA-Z0-9_-]{11}$/.test(cleanId)) {
    throw new YouTubeServiceError('Invalid YouTube video ID. A valid ID is 11 characters.', 400, 'INVALID_VIDEO_ID', true);
  }

  const cacheKey = `video:oembed:${cleanId}`;
  const cached = getCached<YouTubeVideoItem>(cacheKey);
  if (cached) return cached;

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

  const cacheKey = `related:nokey:${cleanId}`;
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
  try {
    const searchResult = await searchYouTubeVideos({
      query: searchQuery,
      maxResults: 12,
      order: 'relevance',
    });

    const related = searchResult.videos.filter((v) => v.id !== cleanId).slice(0, 10);
    const payload = { videos: related, sourceVideoId: cleanId };
    setCached(cacheKey, payload, 10 * 60 * 1000);
    return payload;
  } catch {
    return { videos: [], sourceVideoId: cleanId };
  }
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
