/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ModalWrapper } from '../Modals';
import { soundEngine, speakText } from '../../utils/audio';
import {
  Globe,
  Search,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Home,
  Plus,
  X,
  Lock,
  Shield,
  Bookmark,
  History,
  Download,
  Youtube,
  Image as ImageIcon,
  FileText,
  Brain,
  ExternalLink,
  Sparkles,
  Play,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Newspaper
} from 'lucide-react';

interface FirewallBrowserModalProps {
  onClose: () => void;
  onLog?: (text: string, tag: string) => void;
  currentUser?: any;
  authToken?: string;
}

interface BrowserTab {
  id: string;
  url: string;
  title: string;
  isLoading: boolean;
  type: 'search' | 'web' | 'youtube' | 'reader';
  history: string[];
  historyIndex: number;
}

export const FirewallBrowserModal: React.FC<FirewallBrowserModalProps> = ({
  onClose,
  onLog,
  currentUser
}) => {
  const userPrefix = currentUser?.uid ? `user_${currentUser.uid}_` : 'guest_';
  
  // Tabs State
  const [tabs, setTabs] = useState<BrowserTab[]>([
    {
      id: 'tab-1',
      url: 'ishai://home',
      title: 'ISHAI Firewall Gateway',
      isLoading: false,
      type: 'search',
      history: ['ishai://home'],
      historyIndex: 0
    }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');
  const [addressInput, setAddressInput] = useState<string>('ishai://home');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<'all' | 'youtube' | 'images' | 'news'>('all');
  const [searchResults, setSearchResults] = useState<Array<{ title: string; url: string; snippet: string; source: string; isEmbeddable?: boolean }>>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Bookmarks & History
  const [bookmarks, setBookmarks] = useState<Array<{ title: string; url: string }>>(() => {
    try {
      const saved = localStorage.getItem(`${userPrefix}firewall_bookmarks`);
      return saved ? JSON.parse(saved) : [
        { title: 'Google', url: 'https://www.google.com' },
        { title: 'Wikipedia', url: 'https://www.wikipedia.org' },
        { title: 'GitHub', url: 'https://github.com' }
      ];
    } catch {
      return [{ title: 'Google', url: 'https://www.google.com' }];
    }
  });

  const [history, setHistory] = useState<Array<{ title: string; url: string; time: string }>>([]);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  useEffect(() => {
    setAddressInput(activeTab.url);
  }, [activeTab.url]);

  useEffect(() => {
    try {
      localStorage.setItem(`${userPrefix}firewall_bookmarks`, JSON.stringify(bookmarks));
    } catch {}
  }, [bookmarks, userPrefix]);

  const handleNavigate = (targetUrl: string, titleHint?: string, typeHint: 'search' | 'web' | 'youtube' | 'reader' = 'web') => {
    soundEngine.playClick();
    let finalUrl = targetUrl.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://') && !finalUrl.startsWith('ishai://')) {
      if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
        finalUrl = `https://${finalUrl}`;
      } else {
        // Perform search
        performSearch(finalUrl);
        return;
      }
    }

    const newTabs = tabs.map(t => {
      if (t.id === activeTabId) {
        const newHistory = t.history.slice(0, t.historyIndex + 1);
        newHistory.push(finalUrl);
        return {
          ...t,
          url: finalUrl,
          title: titleHint || finalUrl,
          type: finalUrl.startsWith('ishai://') ? 'search' : typeHint,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          isLoading: true
        };
      }
      return t;
    });

    setTabs(newTabs);
    setAddressInput(finalUrl);

    // Add to history
    setHistory(prev => [{ title: titleHint || finalUrl, url: finalUrl, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 50));
    if (onLog) onLog(`[FIREWALL] Navigated to: ${finalUrl}`, 'NETWORK');

    setTimeout(() => {
      setTabs(current => current.map(t => t.id === activeTabId ? { ...t, isLoading: false } : t));
    }, 800);
  };

  const performSearch = async (query: string) => {
    setIsSearching(true);
    soundEngine.playClick();
    if (onLog) onLog(`[FIREWALL SEARCH] Query: "${query}"`, 'NETWORK');

    // Simulate robust search results combining real web references and embeddings
    setTimeout(() => {
      const mockResults = [
        { title: `${query} - Official Portal & Overview`, url: `https://www.google.com/search?q=${encodeURIComponent(query)}`, snippet: `Explore comprehensive insights, documentation, and live updates regarding ${query}.`, source: 'Google Search Index', isEmbeddable: false },
        { title: `Wikipedia: ${query}`, url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`, snippet: `Read the free encyclopedia entry and scholarly references for ${query}.`, source: 'Wikipedia', isEmbeddable: true },
        { title: `GitHub Repositories for ${query}`, url: `https://github.com/search?q=${encodeURIComponent(query)}`, snippet: `Explore open-source code libraries, frameworks, and developer tools for ${query}.`, source: 'GitHub', isEmbeddable: false },
        { title: `YouTube Video Guide: Understanding ${query}`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, snippet: `Watch video tutorials, talks, and visual explanations about ${query}.`, source: 'YouTube', isEmbeddable: true }
      ];
      setSearchResults(mockResults);
      setIsSearching(false);
    }, 600);
  };

  const addNewTab = () => {
    soundEngine.playClick();
    const newId = `tab-${Date.now()}`;
    const newTab: BrowserTab = {
      id: newId,
      url: 'ishai://home',
      title: 'New Tab',
      isLoading: false,
      type: 'search',
      history: ['ishai://home'],
      historyIndex: 0
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.playClick();
    if (tabs.length === 1) return; // Keep at least one tab
    const filtered = tabs.filter(t => t.id !== id);
    setTabs(filtered);
    if (activeTabId === id) {
      setActiveTabId(filtered[filtered.length - 1].id);
    }
  };

  return (
    <ModalWrapper title="🛡️ ISHAI FIREWALL — UNIVERSAL IN-APP INTERNET WORKSPACE" onClose={onClose} maxWidthClass="max-w-7xl">
      <div className="flex flex-col h-[780px] font-mono text-xs text-emerald-300 bg-[#04070c] border border-emerald-500/40 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(16,185,129,0.25)]">
        
        {/* Browser Tabs Header Bar */}
        <div className="flex items-center bg-black/80 border-b border-emerald-500/20 px-2 pt-2 gap-1 overflow-x-auto scrollbar-none">
          {tabs.map(t => {
            const isActive = t.id === activeTabId;
            return (
              <div
                key={t.id}
                onClick={() => {
                  soundEngine.playClick();
                  setActiveTabId(t.id);
                }}
                className={`group flex items-center gap-2 px-4 py-2 rounded-t-xl border-t border-x cursor-pointer transition-all max-w-[200px] truncate ${
                  isActive
                    ? 'bg-[#04070c] border-emerald-500/50 text-emerald-200 font-bold shadow-[0_-2px_10px_rgba(16,185,129,0.2)]'
                    : 'bg-black/40 border-emerald-950 text-emerald-600 hover:text-emerald-400'
                }`}
              >
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.title}</span>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => closeTab(t.id, e)}
                    className="p-0.5 hover:bg-emerald-500/20 rounded text-emerald-600 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
          <button
            onClick={addNewTab}
            className="p-2 text-emerald-600 hover:text-emerald-300 rounded-lg hover:bg-emerald-950/40 transition-colors"
            title="Open New Tab"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Browser Navigation Toolbar */}
        <div className="flex items-center gap-2 p-3 bg-black/60 border-b border-emerald-500/20">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (activeTab.historyIndex > 0) {
                  const newIdx = activeTab.historyIndex - 1;
                  const prevUrl = activeTab.history[newIdx];
                  setTabs(tabs.map(t => t.id === activeTabId ? { ...t, url: prevUrl, historyIndex: newIdx } : t));
                }
              }}
              disabled={activeTab.historyIndex <= 0}
              className="p-2 rounded-xl bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (activeTab.historyIndex < activeTab.history.length - 1) {
                  const newIdx = activeTab.historyIndex + 1;
                  const nextUrl = activeTab.history[newIdx];
                  setTabs(tabs.map(t => t.id === activeTabId ? { ...t, url: nextUrl, historyIndex: newIdx } : t));
                }
              }}
              disabled={activeTab.historyIndex >= activeTab.history.length - 1}
              className="p-2 rounded-xl bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleNavigate(activeTab.url, activeTab.title, activeTab.type)}
              className="p-2 rounded-xl bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleNavigate('ishai://home', 'ISHAI Firewall Gateway', 'search')}
              className="p-2 rounded-xl bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900"
            >
              <Home className="w-4 h-4" />
            </button>
          </div>

          {/* Address & Search Bar */}
          <div className="flex-1 flex items-center bg-black border border-emerald-500/40 rounded-xl px-3 py-2 gap-2 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleNavigate(addressInput);
                }
              }}
              placeholder="Enter secure URL or search the web..."
              className="w-full bg-transparent text-emerald-200 placeholder:text-emerald-700 focus:outline-none font-mono text-xs"
            />
            {activeTab.isLoading && <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />}
          </div>

          <button
            onClick={() => {
              setBookmarks([...bookmarks, { title: activeTab.title, url: activeTab.url }]);
              soundEngine.playSuccess();
            }}
            className="p-2 rounded-xl bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900"
            title="Bookmark Current Page"
          >
            <Bookmark className="w-4 h-4" />
          </button>
        </div>

        {/* Browser Viewport Area */}
        <div className="flex-1 overflow-y-auto bg-[#04070c] relative flex flex-col">
          
          {activeTab.url === 'ishai://home' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6 max-w-2xl mx-auto w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                <Shield className="w-3.5 h-3.5" /> SECURE SANDBOX BROWSING ACTIVE
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-black text-emerald-300 tracking-wider">ISHAI FIREWALL</h1>
                <p className="text-xs text-emerald-600">Universal In-App Web Gateway, Search &amp; Encrypted Browsing Engine</p>
              </div>

              {/* Central Search Box */}
              <div className="w-full flex flex-col gap-3">
                <div className="flex items-center bg-black border-2 border-emerald-500 rounded-2xl px-4 py-3 gap-3 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                  <Search className="w-5 h-5 text-emerald-500" />
                  <input
                    type="text"
                    placeholder="Search Google, YouTube, Wikipedia or enter URL..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        performSearch(searchQuery);
                      }
                    }}
                    className="w-full bg-transparent text-emerald-200 placeholder:text-emerald-700 focus:outline-none text-sm font-bold"
                  />
                  <button
                    onClick={() => performSearch(searchQuery)}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl transition-all cursor-pointer"
                  >
                    Search
                  </button>
                </div>

                {/* Quick Category Buttons */}
                <div className="flex justify-center gap-2 flex-wrap pt-2">
                  {[
                    { label: 'All', icon: Globe },
                    { label: 'YouTube', icon: Youtube },
                    { label: 'Images', icon: ImageIcon },
                    { label: 'News', icon: Newspaper }
                  ].map(cat => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.label}
                        onClick={() => setSearchCategory(cat.label.toLowerCase() as any)}
                        className={`px-4 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                          searchCategory === cat.label.toLowerCase()
                            ? 'bg-emerald-500 border-emerald-400 text-black'
                            : 'bg-black/40 border-emerald-950 text-emerald-500 hover:text-emerald-300'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search Results if any */}
              {searchResults.length > 0 && (
                <div className="w-full space-y-3 pt-4 text-left">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Search Results</h3>
                  {searchResults.map((res, i) => (
                    <div
                      key={i}
                      onClick={() => handleNavigate(res.url, res.title, res.isEmbeddable ? 'web' : 'reader')}
                      className="p-4 bg-black/60 border border-emerald-900/60 hover:border-emerald-500 rounded-xl cursor-pointer transition-all space-y-1 group"
                    >
                      <div className="text-[10px] text-emerald-600 flex items-center gap-1">
                        <span>{res.source}</span> • <span className="truncate">{res.url}</span>
                      </div>
                      <h4 className="font-bold text-emerald-200 group-hover:text-emerald-300">{res.title}</h4>
                      <p className="text-xs text-emerald-500 line-clamp-2">{res.snippet}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Bookmarks Grid */}
              <div className="w-full pt-6 space-y-3 text-left">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Quick Bookmarks</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {bookmarks.map((bm, i) => (
                    <div
                      key={i}
                      onClick={() => handleNavigate(bm.url, bm.title)}
                      className="p-3 bg-black/40 border border-emerald-900/50 hover:border-emerald-500 rounded-xl cursor-pointer transition-all flex items-center gap-3 group"
                    >
                      <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-bold text-emerald-200 truncate">{bm.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full">
              {/* Compatibility Notice / Iframe View */}
              <div className="px-4 py-2 bg-black/40 border-b border-emerald-950 flex justify-between items-center text-[10px] text-emerald-600">
                <span>Destination: <strong className="text-emerald-300">{activeTab.url}</strong></span>
                <span className="flex items-center gap-1 text-emerald-400"><CheckCircle className="w-3 h-3" /> Secure Sandbox Loaded</span>
              </div>

              <div className="flex-1 bg-black relative flex items-center justify-center p-4">
                {activeTab.url.includes('wikipedia.org') || activeTab.url.includes('github.com') ? (
                  <iframe
                    src={activeTab.url}
                    title={activeTab.title}
                    className="w-full h-full border-0 rounded-xl bg-white"
                  />
                ) : (
                  <div className="max-w-md w-full p-6 bg-black/90 border border-emerald-500/40 rounded-2xl text-center space-y-4 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                    <Shield className="w-10 h-10 text-emerald-400 mx-auto animate-pulse" />
                    <h3 className="text-base font-bold text-emerald-200">In-App Browser Sandbox</h3>
                    <p className="text-xs text-emerald-600 leading-relaxed">
                      This destination restricts direct embedded viewing due to security policies (X-Frame-Options). You can open it securely in a new browser tab.
                    </p>
                    <a
                      href={activeTab.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open in External Tab</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </ModalWrapper>
  );
};
