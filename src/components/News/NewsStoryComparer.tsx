import React, { useState, useEffect } from 'react';
import { Layers, ExternalLink, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import { NewsArticle, StoryComparison } from './NewsTypes';
import { NewsAIService } from './NewsAIService';

interface NewsStoryComparerProps {
  articles?: NewsArticle[];
  initialArticle?: NewsArticle | null;
  selectedStoryTopic?: string;
  onSelectArticle?: (article: NewsArticle) => void;
}

export const NewsStoryComparer: React.FC<NewsStoryComparerProps> = ({
  articles = [],
  initialArticle,
  selectedStoryTopic,
  onSelectArticle,
}) => {
  const [topic, setTopic] = useState(
    initialArticle ? initialArticle.title : selectedStoryTopic || 'Global Economic & Technology Trends'
  );
  const [comparison, setComparison] = useState<StoryComparison | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    runComparison();
  }, [topic, articles]);

  const runComparison = async () => {
    if (!articles || articles.length === 0) return;
    setLoading(true);

    const relevant = articles.slice(0, 5);
    const data = await NewsAIService.compareStorySources(topic, relevant);
    setComparison(data);
    setLoading(false);
  };

  return (
    <div className="bg-[#080b10] border border-purple-500/40 rounded-2xl p-4 sm:p-6 space-y-5 font-sans text-zinc-200 shadow-xl select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>ONE STORY, MULTIPLE PERSPECTIVES</span>
              <span className="text-[9px] font-mono uppercase bg-purple-950 text-purple-400 border border-purple-800 px-2 py-0.5 rounded-full font-bold">
                MULTI-PUBLISHER COMPARISON
              </span>
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Compare headline framing, shared core facts, and differences in focus angles
            </p>
          </div>
        </div>

        <button
          onClick={runComparison}
          disabled={loading}
          className="bg-purple-950 hover:bg-purple-900 border border-purple-800 text-purple-300 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>RE-ANALYZE PERSPECTIVES</span>
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-12 text-center text-xs font-mono text-purple-400 space-y-3 bg-black/40 rounded-2xl border border-zinc-800">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Analyzing coverage angles across {articles.length} news publishers...</p>
        </div>
      )}

      {/* Main Comparison Output */}
      {comparison && !loading && (
        <div className="space-y-4">
          {/* Overview */}
          <div className="p-4 bg-purple-950/20 border border-purple-800/40 rounded-2xl space-y-1.5">
            <span className="text-[10px] font-mono font-bold text-purple-400 uppercase">
              Balanced Coverage Synthesis:
            </span>
            <p className="text-xs text-zinc-200 leading-relaxed">{comparison.overview}</p>
          </div>

          {/* Shared Facts Section */}
          <div className="p-4 bg-black/50 border border-zinc-800 rounded-2xl space-y-2 text-xs">
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Shared Facts Verified Across All Outlets:
            </span>
            <ul className="list-disc list-inside space-y-1 text-zinc-300 font-mono">
              {comparison.sharedFacts.map((fact, idx) => (
                <li key={idx}>{fact}</li>
              ))}
            </ul>
          </div>

          {/* Publisher Angle Cards Grid */}
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase">
              Publisher Headline & Framing Comparison:
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {comparison.perspectiveDifferences.map((p, idx) => (
                <div key={idx} className="p-3.5 bg-[#0a0e16] border border-zinc-800 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-cyan-400 font-mono text-[11px] uppercase">
                      {p.publisher}
                    </span>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-500 hover:text-cyan-300"
                      title="Read Original"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <p className="font-bold text-zinc-100 leading-snug">"{p.headline}"</p>

                  <div className="text-[11px] text-zinc-400 font-mono bg-black/40 p-2 rounded border border-zinc-800">
                    <span className="text-purple-400 font-bold">Focus Angle: </span>
                    <span>{p.focusAngle}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Differences or Disagreements */}
          {comparison.keyDisagreements && comparison.keyDisagreements.length > 0 && (
            <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-2xl space-y-1 text-xs">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">
                Differences in Emphasis & Interpretation:
              </span>
              <ul className="list-disc list-inside space-y-1 text-zinc-300 font-mono">
                {comparison.keyDisagreements.map((d, idx) => (
                  <li key={idx}>{d}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
