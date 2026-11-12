import {
  NewsArticle,
  NewsFilterOptions,
  UserNewsPreferences,
  NewsPreferences,
  ArticleNote,
} from './NewsTypes';
import { db, auth } from '../../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

const NEWS_CACHE_PREFIX = 'SUPERAI_NewsCache_v2';
const NEWS_SAVED_PREFIX = 'SUPERAI_NewsSaved_v2';
const NEWS_PREFS_PREFIX = 'SUPERAI_NewsPrefs_v2';
const NEWS_NOTES_PREFIX = 'SUPERAI_NewsNotes_v2';

export const DEFAULT_USER_PREFERENCES: NewsPreferences = {
  favoriteCategories: ['top', 'latest', 'technology', 'ai', 'india'],
  favoriteTopics: ['Artificial Intelligence', 'Cricket', 'Indian Economy', 'Space Exploration'],
  followedRegions: ['india', 'global'],
  region: 'US',
  hiddenCategories: [],
  followedTopics: ['Artificial Intelligence', 'Cricket', 'Indian Economy', 'Space Exploration'],
  savedArticleIds: [],
  readingHistory: [],
  articleNotes: {},
  customCollections: [
    { id: 'must_read', name: 'Must Read', articleIds: [] },
    { id: 'tech_deep_dives', name: 'Tech Deep Dives', articleIds: [] },
  ],
  compactView: false,
  defaultLayout: 'card',
  playbackSpeed: 1,
  textSize: 'md',
  readingTextSize: 'base',
  theme: 'dark',
  notificationsEnabled: true,
  notificationTopics: ['Breaking News', 'Artificial Intelligence', 'India Special'],
};

export const NewsService = {
  /**
   * Fetches real live news articles from backend /api/news/feed
   */
  async fetchNewsFeed(options: NewsFilterOptions = {}, forceRefresh = false): Promise<NewsArticle[]> {
    const category = options.category || 'top';
    const region = options.region || 'global';
    const query = options.query || options.searchQuery || '';
    const cacheKey = `${NEWS_CACHE_PREFIX}_${category}_${region}_${encodeURIComponent(query)}`;

    // Check memory / localStorage cache if not forced
    if (!forceRefresh) {
      try {
        const cachedStr = localStorage.getItem(cacheKey);
        if (cachedStr) {
          const cachedObj = JSON.parse(cachedStr);
          const ageMinutes = (Date.now() - new Date(cachedObj.timestamp).getTime()) / (1000 * 60);
          if (ageMinutes < 15 && Array.isArray(cachedObj.articles) && cachedObj.articles.length > 0) {
            return cachedObj.articles.map((a: any) => ({
              ...a,
              source: a.source || a.sourceName,
              snippet: a.snippet || a.description,
              link: a.link || a.url,
              urlToImage: a.urlToImage || a.imageUrl,
            }));
          }
        }
      } catch {
        // Cache miss
      }
    }

    try {
      const url = new URL('/api/news/feed', window.location.origin);
      if (category) url.searchParams.set('category', category as string);
      if (region) url.searchParams.set('region', region as string);
      if (query) url.searchParams.set('query', query);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (data.success && Array.isArray(data.articles) && data.articles.length > 0) {
        const normalized = data.articles.map((a: any) => ({
          ...a,
          source: a.source || a.sourceName,
          snippet: a.snippet || a.description,
          link: a.link || a.url,
          urlToImage: a.urlToImage || a.imageUrl,
        }));

        try {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({ timestamp: new Date().toISOString(), articles: normalized })
          );
        } catch {}
        return normalized;
      }

      throw new Error(data.error || 'Empty news feed response');
    } catch (err: any) {
      console.warn('[NewsService] Primary backend RSS fetch failed, checking fallback:', err?.message || err);

      // Return stale cache if available
      try {
        const staleStr = localStorage.getItem(cacheKey);
        if (staleStr) {
          const staleObj = JSON.parse(staleStr);
          if (Array.isArray(staleObj.articles) && staleObj.articles.length > 0) {
            return staleObj.articles;
          }
        }
      } catch {}

      // Fallback: HackerNews Top Stories API for technology/top fallback
      if (category === 'technology' || category === 'top' || category === 'latest') {
        try {
          const hnRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
          const ids: number[] = await hnRes.json();
          const top5 = ids.slice(0, 10);
          const stories = await Promise.all(
            top5.map((id) =>
              fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then((r) => r.json())
            )
          );

          const fallbackArticles: NewsArticle[] = stories.map((s, idx) => ({
            id: `hn_${s.id}`,
            title: s.title,
            description: `Hacker News top story with ${s.score || 0} points and ${s.descendants || 0} discussion comments.`,
            snippet: `Hacker News top story with ${s.score || 0} points and ${s.descendants || 0} discussion comments.`,
            content: s.title,
            url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
            link: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
            sourceName: s.by ? `HackerNews (@${s.by})` : 'HackerNews',
            source: s.by ? `HackerNews (@${s.by})` : 'HackerNews',
            category: 'technology',
            publishedAt: new Date(s.time * 1000).toISOString(),
            imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000&auto=format&fit=crop',
            urlToImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000&auto=format&fit=crop',
            readTimeMinutes: 3,
            isBreaking: idx === 0,
            region: 'global',
            tags: ['technology', 'hn', 'developer'],
            canonicalUrl: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
          }));

          return fallbackArticles;
        } catch {}
      }

      return [];
    }
  },

  /**
   * User Saved Articles / Bookmarks Management
   */
  getSavedArticles(userId = 'guest_default'): NewsArticle[] {
    try {
      const key = `${NEWS_SAVED_PREFIX}_${userId}`;
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  },

  getBookmarks(userId = 'guest_default'): NewsArticle[] {
    return this.getSavedArticles(userId);
  },

  saveArticle(article: NewsArticle, userId = 'guest_default'): NewsArticle[] {
    const key = `${NEWS_SAVED_PREFIX}_${userId}`;
    const current = this.getSavedArticles(userId);
    const exists = current.some((a) => a.id === article.id || a.url === article.url);
    if (exists) return current;

    const updated = [article, ...current];
    try {
      localStorage.setItem(key, JSON.stringify(updated));
      if (auth.currentUser && userId !== 'guest_default') {
        setDoc(doc(db, 'user_news_library', userId), { savedArticles: updated, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
      }
    } catch {}
    return updated;
  },

  removeSavedArticle(articleId: string, userId = 'guest_default'): NewsArticle[] {
    const key = `${NEWS_SAVED_PREFIX}_${userId}`;
    const current = this.getSavedArticles(userId);
    const updated = current.filter((a) => a.id !== articleId);
    try {
      localStorage.setItem(key, JSON.stringify(updated));
      if (auth.currentUser && userId !== 'guest_default') {
        setDoc(doc(db, 'user_news_library', userId), { savedArticles: updated, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
      }
    } catch {}
    return updated;
  },

  toggleBookmark(article: NewsArticle, userId = 'guest_default'): NewsArticle[] {
    const current = this.getSavedArticles(userId);
    const isSaved = current.some((a) => a.id === article.id || a.url === article.url);
    if (isSaved) {
      return this.removeSavedArticle(article.id, userId);
    } else {
      return this.saveArticle(article, userId);
    }
  },

  /**
   * User Preferences Management
   */
  getUserPreferences(userId = 'guest_default'): NewsPreferences {
    try {
      const key = `${NEWS_PREFS_PREFIX}_${userId}`;
      const saved = localStorage.getItem(key);
      if (saved) return { ...DEFAULT_USER_PREFERENCES, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_USER_PREFERENCES;
  },

  getPreferences(userId = 'guest_default'): NewsPreferences {
    return this.getUserPreferences(userId);
  },

  saveUserPreferences(prefs: NewsPreferences, userId = 'guest_default'): void {
    const key = `${NEWS_PREFS_PREFIX}_${userId}`;
    try {
      localStorage.setItem(key, JSON.stringify(prefs));
      if (auth.currentUser && userId !== 'guest_default') {
        setDoc(doc(db, 'user_news_prefs', userId), { preferences: prefs, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
      }
    } catch {}
  },

  savePreferences(prefs: NewsPreferences, userId = 'guest_default'): void {
    this.saveUserPreferences(prefs, userId);
  },

  /**
   * Article Personal Notes Management
   */
  getArticleNote(articleId: string, userId = 'guest_default'): string {
    try {
      const key = `${NEWS_NOTES_PREFIX}_${userId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const notesMap = JSON.parse(saved);
        return notesMap[articleId] || '';
      }
    } catch {}
    return '';
  },

  getAllNotes(userId = 'guest_default'): ArticleNote[] {
    try {
      const key = `${NEWS_NOTES_PREFIX}_${userId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const notesMap = JSON.parse(saved);
        return Object.entries(notesMap).map(([articleId, note]) => ({
          articleId,
          note: note as string,
          updatedAt: new Date().toISOString(),
        }));
      }
    } catch {}
    return [];
  },

  saveArticleNote(articleId: string, noteText: string, userId = 'guest_default'): void {
    try {
      const key = `${NEWS_NOTES_PREFIX}_${userId}`;
      const current = JSON.parse(localStorage.getItem(key) || '{}');
      current[articleId] = noteText;
      localStorage.setItem(key, JSON.stringify(current));
    } catch {}
  },

  saveNote(articleId: string, noteText: string, userId = 'guest_default'): void {
    this.saveArticleNote(articleId, noteText, userId);
  },
};
