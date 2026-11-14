import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Play,
  Heart,
  History,
  Flame,
  Music,
  GraduationCap,
  Cpu,
  Clapperboard,
  Gamepad2,
  Newspaper,
  Trophy,
  Sun,
  Moon,
  X,
  Maximize2,
  Minimize2,
  Trash2,
  AlertTriangle,
  KeyRound,
  ChevronDown,
  ChevronUp,
  Check,
  Copy,
  RefreshCw,
  Clock,
  Tv,
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { soundEngine } from '../utils/audio';
import {
  YouTubeVideoItem,
  YouTubeBrowseSection,
  YouTubeApiStatus,
  YouTubeClientError,
  fetchYouTubeStatus,
  searchYouTube,
  browseYouTube,
  fetchYouTubeVideo,
  fetchRelatedYouTube,
  fetchYouTubeSuggestions,
  loadYouTubeIframeAPI,
  loadYouTubeUserState,
  saveYouTubeUserState,
  extractYouTubeVideoId,
  formatRelativeDate,
} from '../services/YouTubeService';

interface YouTubePlayerModalProps {
  onClose: () => void;
  onLog: (text: string, tag: string) => void;
  voiceGender: 'Male' | 'Female';
  audioActive: boolean;
  currentUserId?: string | null;
  userEmail?: string | null;
}

type ActiveSection = YouTubeBrowseSection | 'search' | 'history' | 'favorites';

const BROWSE_TABS: Array<{ id: YouTubeBrowseSection; label: string; icon: React.FC<{ className?: string }> }> = [
  { id: 'trending', label: 'Trending', icon: Flame },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'education', label: 'Educational', icon: GraduationCap },
  { id: 'science_tech', label: 'Science & Tech', icon: Cpu },
  { id: 'entertainment', label: 'Entertainment', icon: Clapperboard },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'sports', label: 'Sports', icon: Trophy },
];

const QUICK_TOPICS = [
  'James Webb Space Telescope documentary',
  'Lofi hip hop beats to study',
  'MIT artificial intelligence lecture',
  'Acoustic guitar live session',
  'Formula 1 engineering explained',
];

function getYouTubeErrorDescription(code: number): string {
  switch (code) {
    case 2:
      return 'Invalid YouTube video ID. Please choose another video.';
    case 5:
      return 'The embedded HTML5 YouTube player encountered a playback error on this browser.';
    case 100:
      return 'This video was removed, deleted, or marked private by the uploader on YouTube.';
    case 101:
    case 150:
      return 'The video owner has disabled embedded playback outside YouTube. Please select another video to watch inside ISHAI.';
    default:
      return 'Playback failed or the video is restricted (age-restricted or unavailable in your region).';
  }
}

export const YouTubePlayerModal: React.FC<YouTubePlayerModalProps> = ({
  onClose,
  onLog,
  currentUserId = null,
  userEmail = null,
}) => {
  // User identity scope (Firebase Auth primary, local UID fallback)
  const [activeUid, setActiveUid] = useState<string | null>(() => auth.currentUser?.uid || currentUserId || null);
  const [cloudSynced, setCloudSynced] = useState<boolean>(false);

  // Per-user persisted lists & preferences
  const [favorites, setFavorites] = useState<YouTubeVideoItem[]>([]);
  const [history, setHistory] = useState<YouTubeVideoItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // API configuration status
  const [apiStatus, setApiStatus] = useState<YouTubeApiStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState<boolean>(true);

  // Navigation & discovery
  const [activeSection, setActiveSection] = useState<ActiveSection>('trending');
  const [searchInput, setSearchInput] = useState<string>('');
  const [activeSearchQuery, setActiveSearchQuery] = useState<string>('');
  const [searchOrder, setSearchOrder] = useState<'relevance' | 'viewCount' | 'date'>('relevance');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Video lists & loading/error states
  const [videos, setVideos] = useState<YouTubeVideoItem[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [listError, setListError] = useState<{ message: string; missingKey?: boolean } | null>(null);

  // Active playback state
  const [currentVideo, setCurrentVideo] = useState<YouTubeVideoItem | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<YouTubeVideoItem[]>([]);
  const [relatedLoading, setRelatedLoading] = useState<boolean>(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [playerReady, setPlayerReady] = useState<boolean>(false);
  const [theaterMode, setTheaterMode] = useState<boolean>(false);
  const [showFullDesc, setShowFullDesc] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [autoplayOnLoad, setAutoplayOnLoad] = useState<boolean>(false);
  const [dismissKeyNotice, setDismissKeyNotice] = useState<boolean>(false);
  const [iframeApiFallback, setIframeApiFallback] = useState<boolean>(false);

  const ytPlayerRef = useRef<any>(null);
  const ytPlayerReadyRef = useRef<boolean>(false);
  const playerHostRef = useRef<HTMLDivElement | null>(null);
  const playerStageRef = useRef<HTMLDivElement | null>(null);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);
  const stateLoadedRef = useRef<boolean>(false);
  const initialVideoSelectedRef = useRef<boolean>(false);
  const userStateRef = useRef<{
    favorites: YouTubeVideoItem[];
    history: YouTubeVideoItem[];
    recent_searches: string[];
    theme: 'dark' | 'light';
  }>({
    favorites: [],
    history: [],
    recent_searches: [],
    theme: 'dark',
  });

  // Keep user state isolated on Firebase Auth sign-in/sign-out changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      setActiveUid(fbUser?.uid || currentUserId || null);
    });
    return () => unsub();
  }, [currentUserId]);

  useEffect(() => {
    let cancelled = false;
    stateLoadedRef.current = false;
    loadYouTubeUserState(activeUid).then(({ state, syncedToCloud }) => {
      if (cancelled) return;
      userStateRef.current = state;
      setFavorites(state.favorites);
      setHistory(state.history);
      setRecentSearches(state.recent_searches);
      setTheme(state.theme);
      setCloudSynced(syncedToCloud);
      stateLoadedRef.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, [activeUid]);

  const persistUserState = useCallback(
    (next: {
      favorites?: YouTubeVideoItem[];
      history?: YouTubeVideoItem[];
      recent_searches?: string[];
      theme?: 'dark' | 'light';
    }) => {
      const payload = {
        favorites: next.favorites ?? userStateRef.current.favorites,
        history: next.history ?? userStateRef.current.history,
        recent_searches: next.recent_searches ?? userStateRef.current.recent_searches,
        theme: next.theme ?? userStateRef.current.theme,
      };
      userStateRef.current = payload;
      saveYouTubeUserState(payload, activeUid).then((synced) => {
        setCloudSynced(synced);
      });
    },
    [activeUid]
  );

  // Close suggestions dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Load browse section helper
  const loadBrowseSection = useCallback(
    async (section: YouTubeBrowseSection, pageToken?: string) => {
      if (pageToken) {
        setLoadingMore(true);
      } else {
        setListLoading(true);
        setListError(null);
      }
      try {
        const data = await browseYouTube(section, { maxResults: 16, pageToken });
        const loadedVideos = data.videos || [];
        setVideos((prev) => (pageToken ? [...prev, ...loadedVideos] : loadedVideos));
        setNextPageToken(data.nextPageToken);
        if (!pageToken && !initialVideoSelectedRef.current && loadedVideos.length > 0) {
          initialVideoSelectedRef.current = true;
          setAutoplayOnLoad(false);
          setCurrentVideo((prev) => prev || loadedVideos[0]);
        }
      } catch (err: any) {
        const isMissingKey = err instanceof YouTubeClientError && !err.configured;
        setListError({
          message: err?.message || 'Unable to load YouTube videos right now.',
          missingKey: isMissingKey,
        });
        if (!pageToken) setVideos([]);
      } finally {
        setListLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  // Check API configuration status and immediately load playable Trending videos
  useEffect(() => {
    let active = true;
    setStatusLoading(true);
    loadBrowseSection('trending');
    fetchYouTubeStatus()
      .then((status) => {
        if (!active) return;
        setApiStatus(status);
        setStatusLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setStatusLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadBrowseSection]);

  // Debounced live search suggestions
  useEffect(() => {
    const q = searchInput.trim();
    if (!q || extractYouTubeVideoId(q)) {
      setSuggestions([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      const items = await fetchYouTubeSuggestions(q);
      setSuggestions(items);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // Load related videos when currentVideo changes
  useEffect(() => {
    if (!currentVideo) {
      setRelatedVideos([]);
      return;
    }
    let cancelled = false;
    setRelatedLoading(true);
    fetchRelatedYouTube(currentVideo.id)
      .then((res) => {
        if (!cancelled) setRelatedVideos(res.videos || []);
      })
      .catch(() => {
        if (!cancelled) setRelatedVideos([]);
      })
      .finally(() => {
        if (!cancelled) setRelatedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentVideo?.id]);

  const destroyYouTubePlayer = useCallback(() => {
    ytPlayerReadyRef.current = false;
    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.destroy();
      } catch {}
      ytPlayerRef.current = null;
    }
    if (playerHostRef.current) {
      playerHostRef.current.innerHTML = '';
    }
  }, []);

  // Mount & control official YouTube IFrame Player API cleanly
  useEffect(() => {
    if (!currentVideo) {
      destroyYouTubePlayer();
      setIframeApiFallback(false);
      return;
    }

    if (currentVideo.embeddable === false) {
      destroyYouTubePlayer();
      setPlayerError('The video owner has disabled embedded playback outside YouTube.');
      return;
    }

    setPlayerError(null);

    // Fast path: switch video inside an already-ready YT.Player instance
    if (!iframeApiFallback && ytPlayerRef.current && ytPlayerReadyRef.current) {
      try {
        if (autoplayOnLoad && typeof ytPlayerRef.current.loadVideoById === 'function') {
          ytPlayerRef.current.loadVideoById(currentVideo.id);
          setPlayerReady(true);
          return;
        }
        if (!autoplayOnLoad && typeof ytPlayerRef.current.cueVideoById === 'function') {
          ytPlayerRef.current.cueVideoById(currentVideo.id);
          setPlayerReady(true);
          return;
        }
      } catch {
        destroyYouTubePlayer();
      }
    }

    if (iframeApiFallback) {
      setPlayerReady(false);
      return;
    }

    let cancelled = false;
    setPlayerReady(false);
    destroyYouTubePlayer();

    const readyFallbackTimer = window.setTimeout(() => {
      if (!cancelled && !ytPlayerReadyRef.current) {
        setPlayerReady(true);
      }
    }, 3500);

    loadYouTubeIframeAPI()
      .then((YT) => {
        if (cancelled || !playerHostRef.current) return;

        const mountEl = document.createElement('div');
        mountEl.className = 'w-full h-full';
        playerHostRef.current.innerHTML = '';
        playerHostRef.current.appendChild(mountEl);

        const httpOrigin =
          typeof window !== 'undefined' && window.location.origin.startsWith('http')
            ? window.location.origin
            : undefined;

        ytPlayerRef.current = new YT.Player(mountEl, {
          videoId: currentVideo.id,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: autoplayOnLoad ? 1 : 0,
            controls: 1,
            fs: 1,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            enablejsapi: 1,
            ...(httpOrigin ? { origin: httpOrigin } : {}),
          },
          events: {
            onReady: (event: any) => {
              if (cancelled) return;
              window.clearTimeout(readyFallbackTimer);
              ytPlayerReadyRef.current = true;
              setPlayerReady(true);
              try {
                const iframe = event?.target?.getIframe?.();
                if (iframe) {
                  iframe.setAttribute('allowfullscreen', 'true');
                  iframe.setAttribute(
                    'allow',
                    'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen'
                  );
                  iframe.className = 'w-full h-full border-0';
                }
              } catch {}
            },
            onError: (event: any) => {
              if (!cancelled) {
                window.clearTimeout(readyFallbackTimer);
                setPlayerReady(true);
                setPlayerError(getYouTubeErrorDescription(Number(event?.data)));
              }
            },
          },
        });
      })
      .catch(() => {
        if (!cancelled) {
          window.clearTimeout(readyFallbackTimer);
          setIframeApiFallback(true);
          setPlayerReady(true);
        }
      });

    return () => {
      cancelled = true;
      window.clearTimeout(readyFallbackTimer);
    };
  }, [currentVideo?.id, currentVideo?.embeddable, autoplayOnLoad, iframeApiFallback, destroyYouTubePlayer]);

  // Full cleanup on unmount
  useEffect(() => {
    return () => {
      destroyYouTubePlayer();
    };
  }, [destroyYouTubePlayer]);

  const recordWatchedVideo = useCallback(
    (video: YouTubeVideoItem) => {
      const entry: YouTubeVideoItem = {
        ...video,
        watchedAt: new Date().toISOString(),
      };
      const updated = [entry, ...userStateRef.current.history.filter((item) => item.id !== video.id)].slice(0, 100);
      setHistory(updated);
      persistUserState({ history: updated });
    },
    [persistUserState]
  );

  const handleSelectVideo = useCallback(
    (video: YouTubeVideoItem) => {
      soundEngine.playClick();
      setPlayerError(null);
      setShowFullDesc(false);
      if (currentVideo?.id === video.id) {
        try {
          if (ytPlayerRef.current && ytPlayerReadyRef.current) {
            ytPlayerRef.current.playVideo?.();
          } else {
            setAutoplayOnLoad(true);
          }
        } catch {}
      } else {
        setAutoplayOnLoad(true);
        setCurrentVideo(video);
      }
      recordWatchedVideo(video);
      onLog(`▶️ Playing YouTube video inside ISHAI: "${video.title}" (${video.channelTitle})`, 'MEDIA');
    },
    [currentVideo?.id, recordWatchedVideo, onLog]
  );

  const runSearch = useCallback(
    async (rawQuery: string, pageToken?: string, orderOverride?: 'relevance' | 'viewCount' | 'date') => {
      const query = rawQuery.trim();
      if (!query) return;

      setShowSuggestions(false);

      // Direct YouTube URL / Video ID shortcut — works with official IFrame Player inside ISHAI
      const directId = extractYouTubeVideoId(query);
      if (directId && !pageToken) {
        soundEngine.playClick();
        if (apiStatus?.configured) {
          setListLoading(true);
          try {
            const { video } = await fetchYouTubeVideo(directId);
            handleSelectVideo(video);
            setListLoading(false);
            return;
          } catch (err: any) {
            setListLoading(false);
            setPlayerError(err?.message || 'Unable to fetch video metadata from YouTube.');
          }
        }
        handleSelectVideo({
          id: directId,
          title: `YouTube Video (${directId})`,
          description: 'Loaded directly via YouTube video ID using the official YouTube IFrame Player.',
          channelId: '',
          channelTitle: 'YouTube',
          thumbnail: `https://i.ytimg.com/vi/${directId}/hqdefault.jpg`,
          publishedAt: '',
          duration: '',
          viewCount: '',
          embeddable: true,
        });
        return;
      }

      if (!pageToken) {
        soundEngine.playClick();
        setActiveSection('search');
        setActiveSearchQuery(query);
        setListLoading(true);
        setListError(null);
        setRecentSearches((prev) => {
          const updated = [query, ...prev.filter((item) => item.toLowerCase() !== query.toLowerCase())].slice(0, 20);
          persistUserState({ recent_searches: updated });
          return updated;
        });
      } else {
        setLoadingMore(true);
      }

      try {
        const order = orderOverride || searchOrder;
        const data = await searchYouTube(query, { maxResults: 16, pageToken, order });
        setVideos((prev) => (pageToken ? [...prev, ...data.videos] : data.videos));
        setNextPageToken(data.nextPageToken);
        onLog(`YouTube search: "${query}" (${data.videos.length} results)`, 'MEDIA');
      } catch (err: any) {
        const isMissingKey = err instanceof YouTubeClientError && !err.configured;
        setListError({
          message: err?.message || 'YouTube search failed.',
          missingKey: isMissingKey,
        });
        if (!pageToken) setVideos([]);
      } finally {
        setListLoading(false);
        setLoadingMore(false);
      }
    },
    [apiStatus?.configured, handleSelectVideo, onLog, persistUserState, searchOrder]
  );

  const handleBrowseTabClick = (section: ActiveSection) => {
    soundEngine.playClick();
    setActiveSection(section);
    setListError(null);
    if (section === 'history' || section === 'favorites' || section === 'search') {
      return;
    }
    loadBrowseSection(section);
  };

  const toggleFavorite = (video: YouTubeVideoItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    soundEngine.playClick();
    const exists = favorites.some((f) => f.id === video.id);
    const updated = exists
      ? favorites.filter((f) => f.id !== video.id)
      : [video, ...favorites].slice(0, 100);
    setFavorites(updated);
    persistUserState({ favorites: updated });
    if (!exists) soundEngine.playSuccess();
    onLog(
      exists
        ? `Removed "${video.title}" from YouTube favourites.`
        : `Saved "${video.title}" to YouTube favourites.`,
      'MEDIA'
    );
  };

  const removeHistoryItem = (videoId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    soundEngine.playClick();
    const updated = history.filter((v) => v.id !== videoId);
    setHistory(updated);
    persistUserState({ history: updated });
  };

  const clearWatchHistory = () => {
    soundEngine.playClick();
    setHistory([]);
    persistUserState({ history: [] });
    onLog('Cleared YouTube watch history.', 'MEDIA');
  };

  const removeRecentSearch = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== term);
    setRecentSearches(updated);
    persistUserState({ recent_searches: updated });
  };

  const toggleTheme = () => {
    soundEngine.playClick();
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    persistUserState({ theme: next });
  };

  const handleCopyVideoId = () => {
    if (!currentVideo) return;
    navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${currentVideo.id}`);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1800);
  };

  const isDark = theme === 'dark';
  const displayedList =
    activeSection === 'favorites'
      ? favorites
      : activeSection === 'history'
      ? history
      : videos;

  const isFavorite = (id?: string) => Boolean(id && favorites.some((f) => f.id === id));

  // Theme tokens (60-30-10 neutral hierarchy with red accent reserved strictly for YouTube brand actions)
  const bgShell = isDark ? 'bg-[#0b0d11] text-zinc-100 border-zinc-800' : 'bg-[#f8f9fb] text-zinc-900 border-zinc-200';
  const bgHeader = isDark ? 'bg-[#11141b] border-zinc-800/90' : 'bg-white border-zinc-200';
  const bgSurface = isDark ? 'bg-[#141821] border-zinc-800' : 'bg-white border-zinc-200 shadow-xs';
  const bgSubtle = isDark ? 'bg-zinc-900/80 border-zinc-800 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700';
  const textMuted = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const inputTheme = isDark
    ? 'bg-[#090b0f] border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-red-500'
    : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-500 focus:border-red-600';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="ISHAI YouTube Player"
    >
      <div
        className={`w-full ${
          theaterMode ? 'max-w-[98vw] h-[95dvh]' : 'max-w-7xl h-[92dvh]'
        } rounded-2xl border flex flex-col overflow-hidden transition-all duration-200 shadow-2xl ${bgShell}`}
      >
        {/* Top Bar (Clean Single-Row Workspace Header) */}
        <header className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b shrink-0 ${bgHeader}`}>
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-sm">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold tracking-tight leading-none">
                ISHAI YouTube Player
              </h2>
              <p className={`text-[11px] mt-1 ${textMuted}`}>
                {activeUid
                  ? cloudSynced
                    ? `Signed in · ${userEmail || 'Account synced'}`
                    : 'Signed in · Local sync active'
                  : 'Guest session · Sign in to sync across devices'}
              </p>
            </div>
          </div>

          {/* Search Input & Autocomplete */}
          <div ref={searchBoxRef} className="relative flex-1 min-w-[240px] max-w-2xl order-3 sm:order-2 w-full sm:w-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runSearch(searchInput);
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${textMuted}`} />
                <input
                  type="text"
                  value={searchInput}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setShowSuggestions(true);
                  }}
                  placeholder="Search YouTube videos, music, creators, or paste a YouTube URL..."
                  className={`w-full pl-9 pr-9 py-2 rounded-xl border text-xs sm:text-sm focus:outline-none transition-colors ${inputTheme}`}
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('');
                      setSuggestions([]);
                    }}
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-zinc-500/20 ${textMuted}`}
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={!searchInput.trim()}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Search
              </button>
            </form>

            {/* Live Suggestions & Recent Searches Popover */}
            {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
              <div
                className={`absolute left-0 right-0 top-full mt-1.5 rounded-xl border shadow-xl z-40 overflow-hidden ${bgSurface}`}
              >
                {suggestions.length > 0 && (
                  <div className="py-1.5">
                    <div className={`px-3 py-1 text-[11px] font-medium ${textMuted}`}>
                      Search suggestions
                    </div>
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setSearchInput(s);
                          runSearch(s);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                          isDark ? 'hover:bg-zinc-800/80 text-zinc-100' : 'hover:bg-zinc-100 text-zinc-900'
                        }`}
                      >
                        <Search className={`w-3.5 h-3.5 shrink-0 ${textMuted}`} />
                        <span className="truncate">{s}</span>
                      </button>
                    ))}
                  </div>
                )}

                {recentSearches.length > 0 && (
                  <div className={`py-1.5 ${suggestions.length > 0 ? (isDark ? 'border-t border-zinc-800' : 'border-t border-zinc-200') : ''}`}>
                    <div className={`px-3 py-1 text-[11px] font-medium ${textMuted}`}>
                      Recent searches
                    </div>
                    {recentSearches.slice(0, 6).map((term) => (
                      <div
                        key={term}
                        onClick={() => {
                          setSearchInput(term);
                          runSearch(term);
                        }}
                        className={`px-3 py-1.5 flex items-center justify-between text-xs cursor-pointer ${
                          isDark ? 'hover:bg-zinc-800/80' : 'hover:bg-zinc-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Clock className={`w-3.5 h-3.5 shrink-0 ${textMuted}`} />
                          <span className="truncate">{term}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => removeRecentSearch(term, e)}
                          className={`p-1 rounded hover:text-red-500 ${textMuted}`}
                          aria-label={`Remove ${term}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Controls: Theme & Close */}
          <div className="flex items-center gap-2 shrink-0 order-2 sm:order-3">
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${bgSubtle}`}
              title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
              <span className="hidden md:inline">{isDark ? 'Light' : 'Dark'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${bgSubtle} hover:border-red-500/60`}
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>
        </header>

        {/* Category & Personal Library Strip */}
        <nav
          aria-label="YouTube Categories and Library"
          className={`flex items-center gap-1.5 px-4 py-2.5 border-b overflow-x-auto shrink-0 ${bgHeader}`}
        >
          {BROWSE_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleBrowseTabClick(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-red-600 text-white shadow-xs'
                    : isDark
                    ? 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <div className={`h-5 w-px mx-1 shrink-0 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />

          <button
            type="button"
            onClick={() => handleBrowseTabClick('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              activeSection === 'history'
                ? 'bg-red-600 text-white'
                : isDark
                ? 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span className="tabular-nums">Recently Watched ({history.length})</span>
          </button>

          <button
            type="button"
            onClick={() => handleBrowseTabClick('favorites')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              activeSection === 'favorites'
                ? 'bg-red-600 text-white'
                : isDark
                ? 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${activeSection === 'favorites' ? 'fill-current' : ''}`} />
            <span className="tabular-nums">Favourites ({favorites.length})</span>
          </button>
        </nav>

        {/* Scrollable Workspace Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          {/* Subtle Non-Blocking Info Notice when optional YOUTUBE_API_KEY is not set */}
          {!statusLoading && !dismissKeyNotice && apiStatus && apiStatus.apiKeyConfigured === false && (
            <div className={`rounded-xl border px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs ${bgSurface}`}>
              <div className="flex items-center gap-2 min-w-0">
                <KeyRound className="w-4 h-4 text-amber-500 shrink-0" />
                <span className={`truncate ${textMuted}`}>
                  Standard YouTube playback &amp; search active. Add{' '}
                  <code className="font-mono">YOUTUBE_API_KEY</code> on the server for official YouTube Data API v3 quota mode.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDismissKeyNotice(true)}
                className={`p-1 rounded hover:bg-zinc-500/20 shrink-0 cursor-pointer ${textMuted}`}
                aria-label="Dismiss notice"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Active Video Player + Related Videos Section */}
          {currentVideo && (
            <section
              className={`grid grid-cols-1 gap-5 items-start ${
                theaterMode ? '' : 'lg:grid-cols-[minmax(0,1.75fr)_minmax(290px,1fr)]'
              }`}
            >
              {/* Main Video Stage */}
              <div className={`rounded-2xl border overflow-hidden ${bgSurface}`}>
                <div ref={playerStageRef} className="relative w-full aspect-video bg-black">
                  {iframeApiFallback ? (
                    <iframe
                      key={currentVideo.id}
                      id={`ishai-yt-iframe-${currentVideo.id}`}
                      src={`https://www.youtube.com/embed/${encodeURIComponent(
                        currentVideo.id
                      )}?enablejsapi=1&autoplay=${autoplayOnLoad ? 1 : 0}&controls=1&fs=1&rel=0&modestbranding=1&playsinline=1${
                        typeof window !== 'undefined' && window.location.origin.startsWith('http')
                          ? `&origin=${encodeURIComponent(window.location.origin)}`
                          : ''
                      }`}
                      title={currentVideo.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                      onLoad={() => setPlayerReady(true)}
                      className="w-full h-full border-0"
                    />
                  ) : (
                    <div ref={playerHostRef} className="w-full h-full" />
                  )}

                  {!playerReady && !playerError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 text-white gap-2 pointer-events-none">
                      <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium text-zinc-300">
                        Loading official YouTube Player...
                      </span>
                    </div>
                  )}

                  {playerError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/95 text-white p-6 text-center gap-3">
                      <AlertTriangle className="w-9 h-9 text-amber-400" />
                      <h4 className="text-sm sm:text-base font-bold">Video Playback Unavailable</h4>
                      <p className="text-xs sm:text-sm text-zinc-300 max-w-md">{playerError}</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPlayerError(null);
                            setIframeApiFallback(false);
                            destroyYouTubePlayer();
                            setCurrentVideo({ ...currentVideo });
                          }}
                          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold cursor-pointer"
                        >
                          Retry Player
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentVideo(null)}
                          className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold cursor-pointer"
                        >
                          Close Player
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Video Title, Channel & Action Bar */}
                <div className="p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <h3 className="text-base sm:text-lg font-bold leading-snug text-balance">
                        {currentVideo.title}
                      </h3>
                      <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs tabular-nums ${textMuted}`}>
                        <span className={`font-semibold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                          {currentVideo.channelTitle}
                        </span>
                        {currentVideo.viewCount && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{currentVideo.viewCount}</span>
                          </>
                        )}
                        {currentVideo.publishedAt && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{formatRelativeDate(currentVideo.publishedAt)}</span>
                          </>
                        )}
                        {currentVideo.duration && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{currentVideo.duration}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(currentVideo, e)}
                        className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isFavorite(currentVideo.id)
                            ? 'bg-red-600 border-red-600 text-white'
                            : `${bgSubtle} hover:border-red-500/60`
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFavorite(currentVideo.id) ? 'fill-current' : ''}`} />
                        <span>{isFavorite(currentVideo.id) ? 'Saved' : 'Save Favourite'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyVideoId}
                        className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${bgSubtle}`}
                        title="Copy YouTube watch URL"
                      >
                        {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId ? 'Copied' : 'Share'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const stage = playerStageRef.current;
                          if (!stage) return;
                          if (document.fullscreenElement) {
                            document.exitFullscreen?.().catch(() => {});
                          } else {
                            stage.requestFullscreen?.().catch(() => {});
                          }
                        }}
                        className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${bgSubtle}`}
                        title="Toggle player fullscreen"
                      >
                        <Tv className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Fullscreen</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTheaterMode((t) => !t)}
                        className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${bgSubtle}`}
                        title={theaterMode ? 'Default layout' : 'Theater layout'}
                      >
                        {theaterMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{theaterMode ? 'Compact' : 'Expand'}</span>
                      </button>
                    </div>
                  </div>

                  {currentVideo.description && (
                    <div className={`pt-3 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                      <p
                        className={`text-xs leading-relaxed whitespace-pre-line ${textMuted} ${
                          showFullDesc ? '' : 'line-clamp-2'
                        }`}
                      >
                        {currentVideo.description}
                      </p>
                      {currentVideo.description.length > 140 && (
                        <button
                          type="button"
                          onClick={() => setShowFullDesc((s) => !s)}
                          className="mt-1.5 text-xs font-semibold text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {showFullDesc ? (
                            <>
                              <span>Show less</span>
                              <ChevronUp className="w-3.5 h-3.5" />
                            </>
                          ) : (
                            <>
                              <span>Show more</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Related Videos Rail */}
              <aside className={`rounded-2xl border p-4 space-y-3 ${bgSurface}`}>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold">Related Videos</h4>
                  <button
                    type="button"
                    onClick={() => setCurrentVideo(null)}
                    className={`text-xs hover:underline cursor-pointer ${textMuted}`}
                  >
                    Hide Player
                  </button>
                </div>

                {relatedLoading ? (
                  <div className="space-y-3">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-2.5 animate-pulse">
                        <div className="w-32 aspect-video rounded-lg bg-zinc-500/20 shrink-0" />
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-3 rounded bg-zinc-500/20 w-5/6" />
                          <div className="h-2.5 rounded bg-zinc-500/20 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : relatedVideos.length === 0 ? (
                  <p className={`text-xs ${textMuted}`}>No related videos found for this title.</p>
                ) : (
                  <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                    {relatedVideos.map((rv) => (
                      <div
                        key={rv.id}
                        onClick={() => handleSelectVideo(rv)}
                        className={`group flex gap-2.5 p-1.5 rounded-xl cursor-pointer transition-colors ${
                          isDark ? 'hover:bg-zinc-800/80' : 'hover:bg-zinc-100'
                        }`}
                      >
                        <div className="relative w-32 aspect-video rounded-lg overflow-hidden bg-black shrink-0">
                          <img
                            src={rv.thumbnail}
                            alt={rv.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          {rv.duration && (
                            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/85 text-white text-[10px] font-semibold tabular-nums">
                              {rv.duration}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 py-0.5">
                          <div className="text-xs font-semibold line-clamp-2 leading-snug group-hover:text-red-500 transition-colors">
                            {rv.title}
                          </div>
                          <div className={`text-[11px] truncate mt-1 ${textMuted}`}>
                            {rv.channelTitle}
                          </div>
                          {rv.viewCount && (
                            <div className={`text-[11px] truncate tabular-nums ${textMuted}`}>
                              {rv.viewCount}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </aside>
            </section>
          )}

          {/* Section Toolbar & Quick Topic Suggestions */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold">
                  {activeSection === 'search'
                    ? `Search results for "${activeSearchQuery}"`
                    : activeSection === 'history'
                    ? 'Recently Watched Videos'
                    : activeSection === 'favorites'
                    ? 'Saved Favourites'
                    : BROWSE_TABS.find((t) => t.id === activeSection)?.label || 'Discover'}
                </h3>
                {activeSection === 'search' && recentSearches.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className={`text-[11px] ${textMuted}`}>Recent:</span>
                    {recentSearches.slice(0, 5).map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => {
                          setSearchInput(term);
                          runSearch(term);
                        }}
                        className={`px-2 py-0.5 rounded-md border text-[11px] cursor-pointer ${bgSubtle}`}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Contextual Controls: Search Sort OR Clear History */}
              <div className="flex items-center gap-2">
                {activeSection === 'search' && activeSearchQuery && (
                  <select
                    value={searchOrder}
                    onChange={(e) => {
                      const nextOrder = e.target.value as 'relevance' | 'viewCount' | 'date';
                      setSearchOrder(nextOrder);
                      runSearch(activeSearchQuery, undefined, nextOrder);
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer ${inputTheme}`}
                    aria-label="Sort search results"
                  >
                    <option value="relevance">Sort: Relevance</option>
                    <option value="viewCount">Sort: Most Viewed</option>
                    <option value="date">Sort: Upload Date</option>
                  </select>
                )}

                {activeSection === 'history' && history.length > 0 && (
                  <button
                    type="button"
                    onClick={clearWatchHistory}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 text-red-500 hover:bg-red-500/10 cursor-pointer ${
                      isDark ? 'border-zinc-800' : 'border-zinc-200'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear History</span>
                  </button>
                )}
              </div>
            </div>

            {/* Suggested Search Starters */}
            {activeSection !== 'history' && activeSection !== 'favorites' && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className={`text-[11px] whitespace-nowrap ${textMuted}`}>Try searching:</span>
                {QUICK_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => {
                      setSearchInput(topic);
                      runSearch(topic);
                    }}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap shrink-0 transition-colors cursor-pointer ${bgSubtle} hover:border-red-500/50`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            )}

            {/* Error State */}
            {listError && activeSection !== 'history' && activeSection !== 'favorites' && (
              <div className={`rounded-xl border p-4 flex items-center justify-between gap-3 ${bgSurface}`}>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-amber-500">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{listError.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    activeSection === 'search'
                      ? runSearch(activeSearchQuery)
                      : loadBrowseSection(activeSection)
                  }
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold shrink-0 cursor-pointer ${bgSubtle}`}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading Skeleton Grid */}
            {listLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className={`rounded-2xl border overflow-hidden animate-pulse ${bgSurface}`}>
                    <div className="aspect-video bg-zinc-500/20" />
                    <div className="p-3 space-y-2">
                      <div className="h-3.5 bg-zinc-500/20 rounded w-5/6" />
                      <div className="h-3 bg-zinc-500/20 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayedList.length === 0 ? (
              <div className={`rounded-2xl border p-8 text-center space-y-2 ${bgSurface}`}>
                <Tv className={`w-8 h-8 mx-auto ${textMuted}`} />
                <h4 className="text-sm font-bold">
                  {activeSection === 'history'
                    ? 'No Watch History Yet'
                    : activeSection === 'favorites'
                    ? 'No Saved Favourites Yet'
                    : apiStatus?.configured === false
                    ? 'Waiting for YouTube Data API Configuration'
                    : 'No Videos Found'}
                </h4>
                <p className={`text-xs max-w-md mx-auto ${textMuted}`}>
                  {activeSection === 'history'
                    ? 'Videos you play inside ISHAI YouTube Player will appear here for quick replay.'
                    : activeSection === 'favorites'
                    ? 'Click the heart icon on any video card or below the player to save it to your personal favourites.'
                    : apiStatus?.configured === false
                    ? 'Configure YOUTUBE_API_KEY on the server or paste a direct YouTube video URL above to watch inside ISHAI.'
                    : 'Try another search query, creator name, or category tab above.'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {displayedList.map((video) => {
                    const isPlayingThis = currentVideo?.id === video.id;
                    const fav = isFavorite(video.id);
                    return (
                      <article
                        key={`${activeSection}-${video.id}`}
                        onClick={() => handleSelectVideo(video)}
                        className={`group rounded-2xl border overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-0.5 flex flex-col ${bgSurface} ${
                          isPlayingThis ? 'ring-2 ring-red-600 border-red-600' : ''
                        }`}
                      >
                        <div className="relative aspect-video bg-black overflow-hidden">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {video.duration && (
                            <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/85 text-white text-[11px] font-semibold tabular-nums">
                              {video.duration}
                            </span>
                          )}
                          {isPlayingThis && (
                            <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                              <span className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-bold flex items-center gap-1.5">
                                <Play className="w-3.5 h-3.5 fill-current" />
                                Playing
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-3.5 flex-1 flex flex-col justify-between gap-2.5">
                          <div className="space-y-1">
                            <h4 className="text-xs sm:text-sm font-bold line-clamp-2 leading-snug group-hover:text-red-500 transition-colors">
                              {video.title}
                            </h4>
                            <div className={`text-[11px] flex flex-wrap items-center gap-x-1.5 tabular-nums ${textMuted}`}>
                              <span className="font-medium truncate max-w-[180px]">{video.channelTitle}</span>
                              {video.viewCount && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span>{video.viewCount}</span>
                                </>
                              )}
                              {video.publishedAt && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span>{formatRelativeDate(video.publishedAt)}</span>
                                </>
                              )}
                            </div>
                            {video.description && (
                              <p className={`text-[11px] line-clamp-2 leading-relaxed pt-0.5 ${textMuted}`}>
                                {video.description}
                              </p>
                            )}
                          </div>

                          <div
                            className={`flex items-center justify-between pt-2 border-t ${
                              isDark ? 'border-zinc-800/80' : 'border-zinc-100'
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleSelectVideo(video)}
                              className="text-xs font-semibold text-red-500 hover:text-red-400 flex items-center gap-1 cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Watch</span>
                            </button>

                            <div className="flex items-center gap-1.5">
                              {activeSection === 'history' && (
                                <button
                                  type="button"
                                  onClick={(e) => removeHistoryItem(video.id, e)}
                                  className={`p-1.5 rounded-lg hover:text-red-500 transition-colors cursor-pointer ${textMuted}`}
                                  title="Remove from watch history"
                                  aria-label="Remove from watch history"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => toggleFavorite(video, e)}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  fav ? 'text-red-500' : `${textMuted} hover:text-red-500`
                                }`}
                                title={fav ? 'Remove from favourites' : 'Save to favourites'}
                                aria-label={fav ? 'Remove from favourites' : 'Save to favourites'}
                              >
                                <Heart className={`w-4 h-4 ${fav ? 'fill-current' : ''}`} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Pagination Load More for Search / Browse */}
                {nextPageToken && activeSection !== 'history' && activeSection !== 'favorites' && (
                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      disabled={loadingMore}
                      onClick={() =>
                        activeSection === 'search'
                          ? runSearch(activeSearchQuery, nextPageToken)
                          : loadBrowseSection(activeSection, nextPageToken)
                      }
                      className={`px-5 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${bgSubtle}`}
                    >
                      {loadingMore ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Loading more videos...</span>
                        </>
                      ) : (
                        <span>Load More Videos</span>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

// Preserve existing import compatibility in App.tsx while renaming feature to YouTube Player
export const VideoCreatorModal = YouTubePlayerModal;
