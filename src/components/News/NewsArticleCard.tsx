import React from 'react';
import {
  Clock,
  Bookmark,
  Volume2,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  Layers,
  Zap,
  Share2,
} from 'lucide-react';
import { NewsArticle } from './NewsTypes';

interface NewsArticleCardProps {
  article: NewsArticle;
  compactView?: boolean;
  layout?: 'card' | 'compact' | string;
  isSaved?: boolean;
  isBookmarked?: boolean;
  onSelectArticle?: (article: NewsArticle) => void;
  onSelect?: (article: NewsArticle) => void;
  onToggleSave?: (article: NewsArticle, e?: any) => void;
  onToggleBookmark?: (article: NewsArticle, e?: any) => void;
  onListenArticle?: (article: NewsArticle, e?: any) => void;
  onAskAI?: (article: NewsArticle, e?: any) => void;
  onVerifyClaim?: (statement: string, e?: any) => void;
  onCompareStory?: (article: NewsArticle, e?: any) => void;
  featured?: boolean;
}

export const NewsArticleCard: React.FC<NewsArticleCardProps> = ({
  article,
  compactView = false,
  layout,
  isSaved = false,
  isBookmarked = false,
  onSelectArticle,
  onSelect,
  onToggleSave,
  onToggleBookmark,
  onListenArticle,
  onAskAI,
  onVerifyClaim,
  onCompareStory,
  featured = false,
}) => {
  const isCompact = compactView || layout === 'compact';
  const savedState = isSaved || isBookmarked;

  const handleSelect = (art: NewsArticle) => {
    if (onSelect) onSelect(art);
    else if (onSelectArticle) onSelectArticle(art);
  };

  const handleSaveToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleBookmark) onToggleBookmark(article, e);
    else if (onToggleSave) onToggleSave(article, e);
  };
  const formattedTime = new Date(article.publishedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const formattedDate = new Date(article.publishedAt).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });

  if (compactView) {
    return (
      <div
        onClick={() => handleSelect(article)}
        className="group relative bg-[#090c12] border border-zinc-800/80 hover:border-cyan-500/60 rounded-xl p-3 flex items-start gap-3 transition-all hover:bg-zinc-900/60 cursor-pointer shadow-sm select-none"
      >
        {/* Compact Thumbnail Image */}
        {(article.imageUrl || article.urlToImage) && (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden shrink-0 bg-black border border-zinc-800 relative">
            <img
              src={article.imageUrl || article.urlToImage}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {article.isBreaking && (
              <span className="absolute top-1 left-1 bg-rose-600 text-white font-black text-[8px] uppercase px-1 rounded">
                LIVE
              </span>
            )}
          </div>
        )}

        {/* Compact Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
            <span className="font-extrabold text-cyan-400 uppercase truncate max-w-[120px]">
              {article.sourceName || article.source}
            </span>
            <span>•</span>
            <span className="truncate">{formattedTime} ({formattedDate})</span>
            <span>•</span>
            <span className="text-zinc-500">{article.readTimeMinutes || 3}m read</span>
          </div>

          <h3 className="text-xs sm:text-sm font-bold text-zinc-100 group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
            {article.title}
          </h3>

          <p className="text-[11px] text-zinc-400 line-clamp-1 leading-normal hidden sm:block">
            {article.description || article.snippet}
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSaveToggle}
              className={`p-1 rounded hover:bg-zinc-800 transition-colors ${
                savedState ? 'text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title={savedState ? 'Unbookmark' : 'Bookmark Article'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${savedState ? 'fill-cyan-400' : ''}`} />
            </button>

            {onListenArticle && (
              <button
                onClick={(e) => onListenArticle(article, e)}
                className="p-1 rounded text-zinc-500 hover:text-cyan-300 hover:bg-zinc-800 transition-colors"
                title="Listen to Audio"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            )}

            {onAskAI && (
              <button
                onClick={(e) => onAskAI(article, e)}
                className="text-[10px] bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/80 text-cyan-300 px-2 py-0.5 rounded flex items-center gap-1 font-bold transition-colors ml-auto"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>AI SUMMARY</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (featured) {
    return (
      <div
        onClick={() => handleSelect(article)}
        className="group relative bg-[#0a0d14] border border-cyan-500/40 hover:border-cyan-400 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer shadow-xl shadow-cyan-950/20 flex flex-col md:flex-row select-none"
      >
        {/* Featured Image Banner */}
        <div className="md:w-3/5 h-64 md:h-auto bg-black relative overflow-hidden shrink-0">
          {article.imageUrl || article.urlToImage ? (
            <img
              src={article.imageUrl || article.urlToImage}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-cyan-950 via-zinc-900 to-indigo-950 flex items-center justify-center p-8 text-cyan-400 font-mono text-sm font-bold">
              [SUPERAI VERIFIED INTELLIGENCE]
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/80" />

          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="bg-cyan-500 text-black font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-md">
              FEATURED HEADLINE
            </span>
            {article.isBreaking && (
              <span className="bg-rose-600 text-white font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg animate-pulse shadow-md">
                BREAKING
              </span>
            )}
          </div>
        </div>

        {/* Featured Content Details */}
        <div className="p-5 sm:p-6 md:w-2/5 flex flex-col justify-between space-y-4 bg-gradient-to-b from-[#0a0d14] to-[#07090e]">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
              <span className="font-black text-cyan-400 uppercase tracking-wide">
                {article.sourceName || article.source}
              </span>
              <span className="text-zinc-500">{formattedTime} • {article.readTimeMinutes || 3}m read</span>
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold text-white group-hover:text-cyan-300 transition-colors leading-snug">
              {article.title}
            </h2>

            <p className="text-xs sm:text-sm text-zinc-300 line-clamp-3 leading-relaxed">
              {article.description || article.snippet}
            </p>
          </div>

          {/* Featured Quick Actions */}
          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              {onAskAI && (
                <button
                  onClick={(e) => onAskAI(article, e)}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>30s AI SUMMARY</span>
                </button>
              )}

              {onListenArticle && (
                <button
                  onClick={(e) => onListenArticle(article, e)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 p-1.5 rounded-lg transition-colors cursor-pointer"
                  title="Listen to Article"
                >
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                </button>
              )}
            </div>

            <button
              onClick={handleSaveToggle}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                savedState ? 'bg-cyan-950 border-cyan-500 text-cyan-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
              title={savedState ? 'Unbookmark' : 'Bookmark'}
            >
              <Bookmark className={`w-4 h-4 ${savedState ? 'fill-cyan-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Standard Editorial Card
  return (
    <div
      onClick={() => handleSelect(article)}
      className="group relative bg-[#090c12] border border-zinc-800/80 hover:border-cyan-500/60 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:bg-zinc-900/40 cursor-pointer shadow-md select-none"
    >
      <div>
        {/* Card Header Image */}
        {(article.imageUrl || article.urlToImage) && (
          <div className="w-full h-40 bg-black relative overflow-hidden">
            <img
              src={article.imageUrl || article.urlToImage}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#090c12] via-transparent to-black/20" />

            {article.isBreaking && (
              <span className="absolute top-2 left-2 bg-rose-600 text-white font-extrabold text-[9px] uppercase px-2 py-0.5 rounded shadow">
                BREAKING
              </span>
            )}

            <div className="absolute bottom-2 left-2">
              <span className="text-[10px] font-mono font-bold bg-black/80 text-cyan-300 px-2 py-0.5 rounded border border-cyan-900">
                {article.sourceName || article.source}
              </span>
            </div>
          </div>
        )}

        {/* Card Body */}
        <div className="p-4 space-y-2">
          {!article.imageUrl && !article.urlToImage && (
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span className="font-black text-cyan-400 uppercase">{article.sourceName || article.source}</span>
              <span>{formattedTime}</span>
            </div>
          )}

          <h3 className="text-sm font-bold text-zinc-100 group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
            {article.title}
          </h3>

          <p className="text-xs text-zinc-400 line-clamp-2 leading-normal">
            {article.description || article.snippet}
          </p>
        </div>
      </div>

      {/* Card Footer & Action Toolbar */}
      <div className="px-4 pb-3.5 pt-2 border-t border-zinc-800/40 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
        <span>{article.readTimeMinutes || 3}m read</span>

        <div className="flex items-center gap-1.5">
          {onAskAI && (
            <button
              onClick={(e) => onAskAI(article, e)}
              className="p-1 rounded hover:bg-zinc-800 text-cyan-400 transition-colors"
              title="30s AI Summary"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}

          {onVerifyClaim && (
            <button
              onClick={(e) => onVerifyClaim(article.title, e)}
              className="p-1 rounded hover:bg-zinc-800 text-amber-400 transition-colors"
              title="Verify Claim"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </button>
          )}

          {onCompareStory && (
            <button
              onClick={(e) => onCompareStory(article, e)}
              className="p-1 rounded hover:bg-zinc-800 text-purple-400 transition-colors"
              title="Compare Perspectives"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          )}

          {onListenArticle && (
            <button
              onClick={(e) => onListenArticle(article, e)}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
              title="Listen Audio"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleSaveToggle}
            className={`p-1 rounded hover:bg-zinc-800 transition-colors ${
              savedState ? 'text-cyan-400' : 'text-zinc-500 hover:text-zinc-200'
            }`}
            title={savedState ? 'Unbookmark' : 'Bookmark'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${savedState ? 'fill-cyan-400' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
