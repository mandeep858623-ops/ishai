import React, { useState } from 'react';
import { EXTERNAL_WEBSITES, ExternalGamingWebsite, UserGameProfile } from './GameVerseTypes';
import { Globe, Search, Plus, ExternalLink, Bookmark, ShieldCheck, Sparkles, AlertCircle, Play } from 'lucide-react';

interface WebPortalViewProps {
  profile: UserGameProfile;
  onLaunchWebGame: (title: string, url: string, embedUrl?: string, altGameId?: string) => void;
  onAddBookmark: (name: string, url: string, category: string) => void;
  onLaunchNativeGame: (gameId: string) => void;
}

export const WebPortalView: React.FC<WebPortalViewProps> = ({
  profile,
  onLaunchWebGame,
  onAddBookmark,
  onLaunchNativeGame,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const handleLaunchCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError(null);

    let target = customUrl.trim();
    if (!target) return;

    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }

    try {
      const parsed = new URL(target);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setUrlError('Only HTTP and HTTPS URLs are permitted for security reasons.');
        return;
      }

      onLaunchWebGame(customName.trim() || parsed.hostname, target);
      setCustomUrl('');
      setCustomName('');
      setShowAddModal(false);
    } catch {
      setUrlError('Invalid web address. Please enter a valid URL (e.g. https://poki.com).');
    }
  };

  const filteredWebsites = EXTERNAL_WEBSITES.filter((site) => {
    const q = searchQuery.toLowerCase();
    return (
      site.name.toLowerCase().includes(q) ||
      site.category.toLowerCase().includes(q) ||
      site.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-950 p-6 sm:p-8 border border-blue-500/20 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 text-xs font-semibold border border-blue-500/20">
              <Globe className="w-3.5 h-3.5" /> Universal Web Connector
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              GAME X WEB PORTAL
            </h2>
            <p className="text-slate-300 text-xs max-w-xl leading-relaxed">
              Discover web gaming platforms, custom game URLs, and launch playable experiences inside SUPERAI.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(!showAddModal)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all self-start md:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Custom Game Bookmark
          </button>
        </div>
      </div>

      {/* Custom Bookmark Modal */}
      {showAddModal && (
        <form onSubmit={handleLaunchCustomUrl} className="bg-slate-900 border border-blue-500/40 p-5 rounded-2xl space-y-3 animate-in fade-in">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" /> Connect Custom Gaming URL
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Portal / Game Title (e.g. My Favorite Game)"
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="URL (e.g. https://poki.com)"
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {urlError && <p className="text-xs text-rose-400 font-medium">{urlError}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow"
            >
              Launch Portal
            </button>
          </div>
        </form>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search gaming web portals or categories..."
          className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-500"
        />
      </div>

      {/* Curated Directory */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-400" /> Curated Web Gaming Directory
        </h3>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredWebsites.map((site) => (
            <div
              key={site.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-5 space-y-4 transition-all shadow-md flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-bold">
                    {site.category}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Safe SSL
                  </span>
                </div>

                <h4 className="font-extrabold text-slate-100 text-base group-hover:text-blue-400 transition-colors">
                  {site.name}
                </h4>

                <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                  {site.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => onLaunchWebGame(site.name, site.url, (site as any).embedUrl, site.recommendedAlternativeGameId)}
                  className="flex-1 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Connect Portal
                </button>

                {site.recommendedAlternativeGameId && (
                  <button
                    onClick={() => onLaunchNativeGame(site.recommendedAlternativeGameId!)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-purple-900/60 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all"
                    title="Play SUPERAI Native Alternative"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Saved Bookmarks */}
      {profile.customBookmarks && profile.customBookmarks.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-amber-400" /> Saved Custom Bookmarks
          </h3>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {profile.customBookmarks.map((bm) => (
              <div
                key={bm.id}
                onClick={() => onLaunchWebGame(bm.title || (bm as any).name, bm.url)}
                className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-4 rounded-xl flex items-center justify-between cursor-pointer transition-all group"
              >
                <div>
                  <h4 className="font-bold text-slate-200 text-xs group-hover:text-amber-400">
                    {bm.title || (bm as any).name}
                  </h4>
                  <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{bm.url}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
