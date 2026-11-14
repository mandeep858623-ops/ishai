import type { IncomingMessage, ServerResponse } from 'http';
import {
  getYouTubeStatus,
  searchYouTubeVideos,
  browseYouTubeCategory,
  getYouTubeVideoDetails,
  getRelatedYouTubeVideos,
  getYouTubeSearchSuggestions,
  YouTubeServiceError,
  YouTubeBrowseSection,
} from '../server/youtubeService';

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end(JSON.stringify(body));
}

function handleError(res: ServerResponse, err: any): void {
  if (err instanceof YouTubeServiceError) {
    sendJson(res, err.status, {
      success: false,
      error: err.message,
      code: err.code,
      configured: err.configured,
    });
    return;
  }
  console.error('[Vercel YouTube API Error]:', err);
  sendJson(res, 500, {
    success: false,
    error: err?.message || 'YouTube service failed.',
    code: 'YOUTUBE_INTERNAL_ERROR',
    configured: true,
  });
}

export default async function handler(req: IncomingMessage & { query?: Record<string, any> }, res: ServerResponse) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, { success: false, error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
    return;
  }

  try {
    const parsedUrl = new URL(req.url || '/api/youtube/status', 'http://localhost');
    const searchParams = parsedUrl.searchParams;

    // Resolve route either from Vercel rewrite query (__yt_path) or direct URL pathname
    let routePath = String(searchParams.get('__yt_path') || req.query?.__yt_path || '').replace(/^\/+|\/+$/g, '');
    if (!routePath) {
      const stripped = parsedUrl.pathname.replace(/^\/api\/youtube\/?/, '').replace(/^\/+|\/+$/g, '');
      routePath = stripped;
    }

    if (!routePath || routePath === 'status') {
      sendJson(res, 200, { success: true, ...getYouTubeStatus() });
      return;
    }

    if (routePath === 'search') {
      const q = String(searchParams.get('q') || '').trim();
      const maxResults = Number(searchParams.get('maxResults') || 16);
      const pageToken = searchParams.get('pageToken') || undefined;
      const categoryId = searchParams.get('categoryId') || undefined;
      const order = (searchParams.get('order') as 'relevance' | 'date' | 'viewCount' | 'rating') || 'relevance';

      const result = await searchYouTubeVideos({ query: q, maxResults, pageToken, categoryId, order });
      sendJson(res, 200, { success: true, configured: true, ...result });
      return;
    }

    if (routePath === 'browse') {
      const section = String(searchParams.get('category') || searchParams.get('section') || 'trending') as YouTubeBrowseSection;
      const regionCode = searchParams.get('regionCode') || undefined;
      const maxResults = Number(searchParams.get('maxResults') || 16);
      const pageToken = searchParams.get('pageToken') || undefined;

      const result = await browseYouTubeCategory({ section, regionCode, maxResults, pageToken });
      sendJson(res, 200, { success: true, configured: true, ...result });
      return;
    }

    if (routePath.startsWith('video/')) {
      const videoId = decodeURIComponent(routePath.slice('video/'.length).split('/')[0] || '');
      const video = await getYouTubeVideoDetails(videoId);
      sendJson(res, 200, { success: true, configured: true, video });
      return;
    }

    if (routePath.startsWith('related/')) {
      const videoId = decodeURIComponent(routePath.slice('related/'.length).split('/')[0] || '');
      const result = await getRelatedYouTubeVideos(videoId);
      sendJson(res, 200, { success: true, configured: true, ...result });
      return;
    }

    if (routePath === 'suggestions') {
      const q = String(searchParams.get('q') || '').trim();
      try {
        const suggestions = await getYouTubeSearchSuggestions(q);
        sendJson(res, 200, { success: true, query: q, suggestions });
      } catch {
        sendJson(res, 200, { success: true, query: q, suggestions: [] });
      }
      return;
    }

    sendJson(res, 404, { success: false, error: `Unknown YouTube API route: /api/youtube/${routePath}`, code: 'NOT_FOUND' });
  } catch (err: any) {
    handleError(res, err);
  }
}
