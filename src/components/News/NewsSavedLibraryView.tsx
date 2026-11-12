import React, { useState, useEffect } from 'react';
import { NewsArticle, ArticleNote } from './NewsTypes';
import { NewsService } from './NewsService';
import { NewsArticleCard } from './NewsArticleCard';
import { Bookmark, Folder, FileText, Download, Trash2, Edit3, Plus, Search, ExternalLink, Sparkles } from 'lucide-react';

interface NewsSavedLibraryViewProps {
  onSelectArticle: (article: NewsArticle) => void;
  onSelectClaimToVerify?: (claim: string) => void;
  onSelectStoryToCompare?: (article: NewsArticle) => void;
}

export const NewsSavedLibraryView: React.FC<NewsSavedLibraryViewProps> = ({
  onSelectArticle,
  onSelectClaimToVerify,
  onSelectStoryToCompare,
}) => {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'notes' | 'collections'>('bookmarks');
  const [bookmarkedArticles, setBookmarkedArticles] = useState<NewsArticle[]>([]);
  const [notes, setNotes] = useState<ArticleNote[]>([]);
  const [collections, setCollections] = useState<string[]>(['Research', 'Tech & AI', 'Market Watch', 'Reading List']);
  const [selectedCollection, setSelectedCollection] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showAddCollection, setShowAddCollection] = useState(false);

  const refreshLibrary = () => {
    setBookmarkedArticles(NewsService.getBookmarks());
    setNotes(NewsService.getAllNotes());
  };

  useEffect(() => {
    refreshLibrary();
  }, []);

  const handleToggleBookmark = (article: NewsArticle) => {
    NewsService.toggleBookmark(article);
    refreshLibrary();
  };

  const handleDeleteNote = (articleId: string) => {
    NewsService.saveNote(articleId, '');
    refreshLibrary();
  };

  const handleAddCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    if (!collections.includes(newCollectionName.trim())) {
      setCollections([...collections, newCollectionName.trim()]);
    }
    setNewCollectionName('');
    setShowAddCollection(false);
  };

  const exportLibrary = (format: 'json' | 'txt') => {
    const data = {
      exportedAt: new Date().toISOString(),
      bookmarksCount: bookmarkedArticles.length,
      bookmarks: bookmarkedArticles,
      notes: notes,
    };

    let blob: Blob;
    let filename: string;

    if (format === 'json') {
      blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      filename = `superai_news_library_${Date.now()}.json`;
    } else {
      let textContent = `SUPERAI NEWS 2.0 - KNOWLEDGE LIBRARY EXPORT\nGenerated: ${new Date().toLocaleString()}\n\n`;
      textContent += `=== SAVED ARTICLES (${bookmarkedArticles.length}) ===\n\n`;
      bookmarkedArticles.forEach((a, i) => {
        textContent += `${i + 1}. ${a.title}\nSource: ${a.source} | Date: ${a.publishedAt}\nURL: ${a.link}\nSummary: ${a.snippet}\n\n`;
      });
      textContent += `\n=== PERSONAL NOTES (${notes.length}) ===\n\n`;
      notes.forEach((n, i) => {
        textContent += `${i + 1}. Article ID: ${n.articleId}\nLast Modified: ${n.updatedAt}\nNotes:\n${n.note}\n\n`;
      });

      blob = new Blob([textContent], { type: 'text/plain' });
      filename = `superai_news_library_${Date.now()}.txt`;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredBookmarks = bookmarkedArticles.filter((a) => {
    const titleMatch = a.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const snippetMatch = (a.snippet || a.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const sourceMatch = (a.source || a.sourceName || '').toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || snippetMatch || sourceMatch;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-amber-400" /> Read Later & Knowledge Library
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Access your saved articles, notes, research collections, and exported briefings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportLibrary('txt')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <Download className="w-3.5 h-3.5" /> Export Text
          </button>
          <button
            onClick={() => exportLibrary('json')}
            className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export JSON
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
              activeTab === 'bookmarks'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            Bookmarked Articles ({bookmarkedArticles.length})
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
              activeTab === 'notes'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Personal Notes ({notes.length})
          </button>
          <button
            onClick={() => setActiveTab('collections')}
            className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
              activeTab === 'collections'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            Collections ({collections.length})
          </button>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved items..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-500"
          />
        </div>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'bookmarks' && (
        <div className="space-y-4">
          {filteredBookmarks.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-3">
              <Bookmark className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-slate-300 font-semibold text-base">No saved articles yet</h3>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">
                Click the bookmark icon on any article in NEWS 2.0 to add it to your reading library.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredBookmarks.map((article) => (
                <NewsArticleCard
                  key={article.id}
                  article={article}
                  isBookmarked={true}
                  onSelect={onSelectArticle}
                  onToggleBookmark={handleToggleBookmark}
                  onVerifyClaim={onSelectClaimToVerify}
                  onCompareStory={onSelectStoryToCompare}
                  layout="card"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="space-y-4">
          {notes.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-3">
              <FileText className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-slate-300 font-semibold text-base">No article notes found</h3>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">
                Open an article detail modal and use the Personal Notes box to jot down your key insights and research.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {notes.map((n) => {
                const matchingArticle = bookmarkedArticles.find((a) => a.id === n.articleId);
                return (
                  <div
                    key={n.articleId}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-3 shadow-sm transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                          Article Note
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(n.updatedAt).toLocaleDateString()}
                        </span>
                      </div>

                      {matchingArticle ? (
                        <h4
                          onClick={() => onSelectArticle(matchingArticle)}
                          className="font-bold text-slate-200 text-sm hover:text-blue-400 cursor-pointer line-clamp-1"
                        >
                          {matchingArticle.title}
                        </h4>
                      ) : (
                        <h4 className="font-bold text-slate-400 text-xs">Article ID: {n.articleId}</h4>
                      )}

                      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {n.note}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      {matchingArticle && (
                        <button
                          onClick={() => onSelectArticle(matchingArticle)}
                          className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                        >
                          Open Article <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNote(n.articleId)}
                        className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'collections' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Custom Research Collections</h3>
            <button
              onClick={() => setShowAddCollection(!showAddCollection)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> New Collection
            </button>
          </div>

          {showAddCollection && (
            <form onSubmit={handleAddCollection} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex gap-3">
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Collection name (e.g. AI Ethics, Macro Economy)..."
                className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg"
              >
                Save
              </button>
            </form>
          )}

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {collections.map((col, idx) => (
              <div
                key={idx}
                className="bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 p-5 rounded-2xl space-y-3 cursor-pointer transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Folder className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200 text-sm group-hover:text-blue-400 transition-colors">
                    {col}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Organized research folder
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
