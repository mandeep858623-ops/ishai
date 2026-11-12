import React, { useState, useEffect, useMemo } from 'react';
import { NewsArticle, NewsCategory, NewsPreferences, NEWS_CATEGORIES } from './NewsTypes';
import { NewsService } from './NewsService';
import { NewsHeader } from './NewsHeader';
import { NewsTickerBar } from './NewsTickerBar';
import { NewsCategoryBar } from './NewsCategoryBar';
import { NewsArticleCard } from './NewsArticleCard';
import { NewsDetailModal } from './NewsDetailModal';
import { NewsClaimVerifier } from './NewsClaimVerifier';
import { NewsStoryComparer } from './NewsStoryComparer';
import { NewsDailyBriefingView } from './NewsDailyBriefingView';
import { NewsSavedLibraryView } from './NewsSavedLibraryView';
import { NewsPreferencesModal } from './NewsPreferencesModal';
import { NewsAudioPlayerBar } from './NewsAudioPlayerBar';
import { Sparkles, RefreshCw, Layers, Sliders, ShieldCheck, Newspaper, Compass, AlertCircle, ArrowUpRight } from 'lucide-react';

export const NewsCommandCenter: React.FC<{
  initialTab?: 'home' | 'india' | 'tech' | 'verifier' | 'comparer' | 'briefing' | 'library';
  initialSearch?: string;
}> = ({ initialTab, initialSearch }) => {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState<'home' | 'india' | 'tech' | 'verifier' | 'comparer' | 'briefing' | 'library'>(initialTab || 'home');
  const [selectedCategory, setSelectedCategory] = useState<string>('top');
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch || '');

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (initialSearch) setSearchQuery(initialSearch);
  }, [initialSearch]);
  const [layoutMode, setLayoutMode] = useState<'card' | 'compact'>('card');
  const [preferences, setPreferences] = useState<NewsPreferences>(NewsService.getPreferences());

  // Data State
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [bookmarks, setBookmarks] = useState<NewsArticle[]>([]);

  // Modals & Panels
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [showPreferences, setShowPreferences] = useState<boolean>(false);
  const [claimToVerify, setClaimToVerify] = useState<string>('');
  const [storyToCompare, setStoryToCompare] = useState<NewsArticle | null>(null);
  
  // Audio Player State
  const [audioState, setAudioState] = useState<{ title: string; text: string } | null>(null);

  // Load Preferences & Bookmarks
  useEffect(() => {
    setBookmarks(NewsService.getBookmarks());
    setLayoutMode(preferences.defaultLayout || 'card');
  }, []);

  // Main Feed Fetching Engine
  const fetchNewsFeed = async (cat: string, query: string, reg: string = 'US') => {
    setLoading(true);
    setError(null);
    try {
      const data = await NewsService.fetchNewsFeed({
        category: cat,
        query: query,
        region: reg,
      });
      setArticles(data);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Failed to fetch news feed', err);
      setError('Unable to fetch live news stream. Please check connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger Fetching on Category, Search, Region or Tab Switch
  useEffect(() => {
    const currentRegion = preferences.region || 'US';
    if (activeTab === 'home') {
      fetchNewsFeed(selectedCategory, searchQuery, currentRegion);
    } else if (activeTab === 'india') {
      fetchNewsFeed('india', searchQuery, 'IN');
    } else if (activeTab === 'tech') {
      fetchNewsFeed('technology', searchQuery, currentRegion);
    }
  }, [selectedCategory, searchQuery, activeTab, preferences.region]);

  const handleRefresh = () => {
    const currentRegion = preferences.region || 'US';
    if (activeTab === 'india') {
      fetchNewsFeed('india', searchQuery, 'IN');
    } else if (activeTab === 'tech') {
      fetchNewsFeed('technology', searchQuery, currentRegion);
    } else {
      fetchNewsFeed(selectedCategory, searchQuery, currentRegion);
    }
  };

  const handleToggleBookmark = (article: NewsArticle) => {
    const updated = NewsService.toggleBookmark(article);
    setBookmarks(updated);
  };

  const isBookmarked = (articleId: string) => {
    return bookmarks.some((b) => b.id === articleId);
  };

  // Featured Article computation
  const featuredArticle = useMemo(() => {
    if (articles.length === 0) return null;
    return articles.find((a) => a.urlToImage || a.imageUrl) || articles[0];
  }, [articles]);

  const remainingArticles = useMemo(() => {
    if (!featuredArticle) return articles;
    return articles.filter((a) => a.id !== featuredArticle.id);
  }, [articles, featuredArticle]);

  // Audio Play Handler
  const handlePlayAudio = (text: string, title: string) => {
    setAudioState({ title, text });
  };

  // Verify Claim Handler from card
  const handleVerifyClaimFromCard = (claimText: string) => {
    setClaimToVerify(claimText);
    setActiveTab('verifier');
  };

  // Compare Story Handler from card
  const handleCompareStoryFromCard = (article: NewsArticle) => {
    setStoryToCompare(article);
    setActiveTab('comparer');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar */}
      <NewsHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        region={preferences.region || 'US'}
        setRegion={(r: string) => {
          const newPrefs = { ...preferences, region: r };
          setPreferences(newPrefs);
          NewsService.savePreferences(newPrefs);
        }}
        layoutMode={layoutMode}
        setLayoutMode={setLayoutMode}
        onOpenPreferences={() => setShowPreferences(true)}
      />

      {/* Breaking News Ticker Bar */}
      <NewsTickerBar
        onSelectArticle={(article) => setSelectedArticle(article)}
      />

      {/* Primary Category Bar (Only on Home View) */}
      {activeTab === 'home' && (
        <NewsCategoryBar
          selectedCategory={selectedCategory as any}
          onSelectCategory={(catId) => {
            setSelectedCategory(catId);
            setSearchQuery('');
          }}
        />
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Status Bar */}
        {(activeTab === 'home' || activeTab === 'india' || activeTab === 'tech') && (
          <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-300 uppercase tracking-wider">
                {activeTab === 'india'
                  ? '🇮🇳 India Special Hub Feed'
                  : activeTab === 'tech'
                  ? '⚡ Tech & AI Intelligence Stream'
                  : `Feed: ${NEWS_CATEGORIES.find((c) => c.id === selectedCategory)?.title || 'Top Headlines'}`}
              </span>
              <span className="text-slate-600">|</span>
              <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-lg text-xs font-medium border border-slate-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        )}

        {/* HOME / INDIA / TECH FEEDS */}
        {(activeTab === 'home' || activeTab === 'india' || activeTab === 'tech') && (
          <div className="space-y-6">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
                  <Sparkles className="w-5 h-5 text-blue-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <p className="text-xs font-medium animate-pulse text-slate-300">
                  Fetching verified news articles...
                </p>
              </div>
            ) : error ? (
              <div className="bg-rose-950/40 border border-rose-800/60 p-6 rounded-2xl text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                <h3 className="text-rose-200 font-bold text-base">{error}</h3>
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500 transition-colors"
                >
                  Retry Stream
                </button>
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-3">
                <Newspaper className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-slate-300 font-semibold text-base">No articles found</h3>
                <p className="text-slate-500 text-xs">
                  Try searching for a different keyword or selecting another topic category.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Featured Headline Hero Card */}
                {featuredArticle && !searchQuery && (
                  <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl hover:border-blue-500/40 transition-all group">
                    <div className="grid md:grid-cols-12 gap-0">
                      <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Featured Lead Story
                            </span>
                            <span className="text-xs font-medium text-slate-400">
                              • {featuredArticle.source}
                            </span>
                          </div>

                          <h2
                            onClick={() => setSelectedArticle(featuredArticle)}
                            className="text-2xl sm:text-3xl font-extrabold text-slate-100 hover:text-blue-400 cursor-pointer transition-colors leading-tight"
                          >
                            {featuredArticle.title}
                          </h2>

                          <p className="text-slate-300 text-sm leading-relaxed line-clamp-3">
                            {featuredArticle.snippet}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
                          <div className="text-xs text-slate-400">
                            Published: {new Date(featuredArticle.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedArticle(featuredArticle)}
                              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 flex items-center gap-1.5 transition-all"
                            >
                              Read Full Coverage <ArrowUpRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {featuredArticle.urlToImage && (
                        <div className="md:col-span-5 relative min-h-[240px] md:min-h-full bg-slate-950">
                          <img
                            src={featuredArticle.urlToImage}
                            alt={featuredArticle.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent md:bg-gradient-to-r md:from-slate-900 md:via-transparent md:to-transparent" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Article Grid / Compact List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                      <Compass className="w-5 h-5 text-blue-400" />
                      {searchQuery ? `Search Results for "${searchQuery}"` : 'Latest World & Local Reports'}
                    </h3>
                    <span className="text-xs text-slate-400 font-medium">
                      Showing {remainingArticles.length} Stories
                    </span>
                  </div>

                  <div
                    className={
                      layoutMode === 'card'
                        ? 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3'
                        : 'space-y-3'
                    }
                  >
                    {remainingArticles.map((article) => (
                      <NewsArticleCard
                        key={article.id}
                        article={article}
                        isBookmarked={isBookmarked(article.id)}
                        onSelect={(art) => setSelectedArticle(art)}
                        onToggleBookmark={handleToggleBookmark}
                        onVerifyClaim={handleVerifyClaimFromCard}
                        onCompareStory={handleCompareStoryFromCard}
                        layout={layoutMode}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FACT VERIFIER TAB */}
        {activeTab === 'verifier' && (
          <NewsClaimVerifier
            initialClaim={claimToVerify}
            onSelectArticle={(art) => setSelectedArticle(art)}
          />
        )}

        {/* MULTI-SOURCE COMPARER TAB */}
        {activeTab === 'comparer' && (
          <NewsStoryComparer
            initialArticle={storyToCompare}
            onSelectArticle={(art) => setSelectedArticle(art)}
          />
        )}

        {/* DAILY BRIEFING TAB */}
        {activeTab === 'briefing' && (
          <NewsDailyBriefingView
            preferences={preferences}
            onSelectArticle={(art) => setSelectedArticle(art)}
            onPlayAudio={handlePlayAudio}
          />
        )}

        {/* SAVED LIBRARY TAB */}
        {activeTab === 'library' && (
          <NewsSavedLibraryView
            onSelectArticle={(art) => setSelectedArticle(art)}
            onSelectClaimToVerify={handleVerifyClaimFromCard}
            onSelectStoryToCompare={handleCompareStoryFromCard}
          />
        )}
      </main>

      {/* Detail & Reading Modal */}
      {selectedArticle && (
        <NewsDetailModal
          article={selectedArticle}
          isBookmarked={isBookmarked(selectedArticle.id)}
          onClose={() => setSelectedArticle(null)}
          onToggleBookmark={handleToggleBookmark}
          onVerifyClaim={handleVerifyClaimFromCard}
          onCompareStory={handleCompareStoryFromCard}
          onPlayAudio={handlePlayAudio}
        />
      )}

      {/* Preferences Modal */}
      {showPreferences && (
        <NewsPreferencesModal
          preferences={preferences}
          onSavePreferences={(newPrefs) => {
            setPreferences(newPrefs);
            NewsService.savePreferences(newPrefs);
          }}
          onClose={() => setShowPreferences(false)}
        />
      )}

      {/* Sticky Bottom Audio Player Bar */}
      {audioState && (
        <NewsAudioPlayerBar
          title={audioState.title}
          textToSpeak={audioState.text}
          playbackSpeed={preferences.playbackSpeed}
          onClose={() => setAudioState(null)}
        />
      )}
    </div>
  );
};
