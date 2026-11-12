import React, { useState } from 'react';
import {
  Newspaper,
  Search,
  RefreshCw,
  Globe,
  Sun,
  Moon,
  Bookmark,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Clock,
  Sparkles,
  ShieldCheck,
  Flag,
  Cpu,
  Layers,
} from 'lucide-react';
import { NewsFilterOptions } from './NewsTypes';

interface NewsHeaderProps {
  activeTab: string;
  setActiveTab?: (tab: any) => void;
  onSelectTab?: (tab: string) => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  region?: string;
  setRegion?: (r: string) => void;
  layoutMode?: 'card' | 'compact';
  setLayoutMode?: (m: 'card' | 'compact') => void;
  onOpenPreferences?: () => void;
  filters?: NewsFilterOptions;
  onUpdateFilters?: (updates: Partial<NewsFilterOptions>) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  lastUpdated?: string;
  savedCount?: number;
  compactView?: boolean;
  onToggleCompactView?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onOpenSavedLibrary?: () => void;
  onOpenDailyBriefing?: () => void;
}

export const NewsHeader: React.FC<NewsHeaderProps> = ({
  activeTab,
  setActiveTab,
  onSelectTab,
  searchQuery = '',
  setSearchQuery,
  region = 'US',
  setRegion,
  layoutMode = 'card',
  setLayoutMode,
  onOpenPreferences,
  filters = {},
  onUpdateFilters,
  onRefresh,
  isLoading = false,
  lastUpdated = '',
  savedCount = 0,
  compactView = false,
  onToggleCompactView,
  theme = 'dark',
  onToggleTheme,
  onOpenSavedLibrary,
  onOpenDailyBriefing,
}) => {
  const handleTabChange = (tab: string) => {
    if (setActiveTab) setActiveTab(tab);
    if (onSelectTab) onSelectTab(tab);
  };

  const [searchInput, setSearchInput] = useState(searchQuery || filters.searchQuery || '');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchSuggestions = [
    'Artificial Intelligence model releases',
    'India economy and RBI policy',
    'Cricket World Cup & IPL updates',
    'Cybersecurity zero-day threats',
    'SpaceX and ISRO space missions',
    'Global stock markets and tech earnings',
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInput.trim();
    if (setSearchQuery) setSearchQuery(query);
    if (onUpdateFilters) onUpdateFilters({ searchQuery: query });
    setShowSuggestions(false);
  };

  const handleRegionChange = (newReg: string) => {
    if (setRegion) setRegion(newReg);
    if (onUpdateFilters) onUpdateFilters({ region: newReg as any });
  };

  const currentRegion = region || filters.region || 'US';

  return (
    <header className="flex flex-col gap-2.5 p-3 sm:p-4 border-b border-zinc-800/80 bg-[#080a0f] text-zinc-200 shrink-0 select-none">
      {/* Top Branding & Main Controls Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-600/20">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight uppercase italic flex items-center gap-1.5">
                SUPERAI <span className="text-cyan-400 not-italic">NEWS 2.0</span>
              </h1>
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                LIVE COMMAND CENTER
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono flex items-center gap-2">
              <span>Verified Multi-Source Intelligence</span>
              {lastUpdated && (
                <span className="text-zinc-500 hidden sm:inline flex items-center gap-1">
                  <Clock className="w-3 h-3 inline" /> Updated: {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
              title="Refresh News Feed"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          )}

          {/* Region Switcher */}
          <div className="flex items-center rounded-xl bg-zinc-900 border border-zinc-700/60 p-1 text-xs font-bold font-mono">
            <Globe className="w-3.5 h-3.5 text-cyan-400 ml-1.5 mr-1" />
            <button
              onClick={() => handleRegionChange('US')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                currentRegion === 'US' || currentRegion === 'global' ? 'bg-cyan-600 text-white font-extrabold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              GLOBAL
            </button>
            <button
              onClick={() => handleRegionChange('IN')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                currentRegion === 'IN' || currentRegion === 'india' ? 'bg-emerald-600 text-white font-extrabold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>🇮🇳 INDIA</span>
            </button>
          </div>

          {/* Daily Briefing CTA */}
          <button
            onClick={() => {
              if (onOpenDailyBriefing) onOpenDailyBriefing();
              else handleTabChange('briefing');
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-extrabold shadow-md shadow-amber-900/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>DAILY BRIEFING</span>
          </button>

          {/* Layout Mode Toggle */}
          <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => {
                if (setLayoutMode) setLayoutMode('card');
                if (onToggleCompactView) onToggleCompactView();
              }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                layoutMode === 'card' && !compactView ? 'bg-zinc-800 text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (setLayoutMode) setLayoutMode('compact');
                if (onToggleCompactView) onToggleCompactView();
              }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                layoutMode === 'compact' || compactView ? 'bg-zinc-800 text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Compact View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Saved Library Button */}
          <button
            onClick={() => {
              if (onOpenSavedLibrary) onOpenSavedLibrary();
              else handleTabChange('library');
            }}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer relative"
            title="Saved Reading Library"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="hidden md:inline">SAVED</span>
            {savedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black font-extrabold text-[9px]">
                {savedCount}
              </span>
            )}
          </button>

          {/* Personalization Settings */}
          {onOpenPreferences && (
            <button
              onClick={onOpenPreferences}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-400 hover:text-white transition-all cursor-pointer"
              title="Personalization Preferences"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search Field & Tab Navigation Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Field */}
        <div className="relative flex-1 max-w-xl">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search news by topic, keyword, or publisher..."
              className="w-full bg-zinc-950/90 border border-zinc-800 focus:border-cyan-500/80 rounded-xl pl-9 pr-20 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition-colors shadow-inner"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  if (setSearchQuery) setSearchQuery('');
                  if (onUpdateFilters) onUpdateFilters({ searchQuery: '' });
                }}
                className="absolute right-14 text-xs text-zinc-500 hover:text-zinc-300 px-1"
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-[11px] px-3 py-1 rounded-lg transition-colors cursor-pointer"
            >
              SEARCH
            </button>
          </form>

          {/* Auto Suggestions Dropdown */}
          {showSuggestions && !searchInput && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900/95 border border-zinc-800 rounded-xl p-2 shadow-2xl z-50 text-xs">
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1.5 px-2">
                Popular Intelligence Searches
              </div>
              <div className="flex flex-col gap-1">
                {searchSuggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSearchInput(s);
                      if (setSearchQuery) setSearchQuery(s);
                      if (onUpdateFilters) onUpdateFilters({ searchQuery: s });
                      setShowSuggestions(false);
                    }}
                    className="text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-cyan-300 transition-colors flex items-center justify-between"
                  >
                    <span>{s}</span>
                    <Sparkles className="w-3 h-3 text-cyan-500/60" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Specialized Hub Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold font-mono shrink-0">
          <button
            onClick={() => handleTabChange('home')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'home' || activeTab === 'center' ? 'bg-cyan-500 text-black font-extrabold shadow-md shadow-cyan-950' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>COMMAND CENTER</span>
          </button>

          <button
            onClick={() => handleTabChange('india')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'india' ? 'bg-emerald-600 text-white font-extrabold shadow-md shadow-emerald-950' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Flag className="w-3.5 h-3.5 text-emerald-400" />
            <span>INDIA HUB</span>
          </button>

          <button
            onClick={() => handleTabChange('tech')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tech' ? 'bg-indigo-600 text-white font-extrabold shadow-md shadow-indigo-950' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>TECH & AI HUB</span>
          </button>

          <button
            onClick={() => handleTabChange('verifier')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'verifier' || activeTab === 'verify' ? 'bg-amber-600 text-white font-extrabold shadow-md shadow-amber-950' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>VERIFY CLAIM</span>
          </button>

          <button
            onClick={() => handleTabChange('comparer')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'comparer' || activeTab === 'compare' ? 'bg-purple-600 text-white font-extrabold shadow-md shadow-purple-950' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>STORY COMPARE</span>
          </button>
        </div>
      </div>
    </header>
  );
};
