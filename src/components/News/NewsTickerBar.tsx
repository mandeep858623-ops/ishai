import React, { useState } from 'react';
import { Zap, Bell, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { NewsArticle } from './NewsTypes';

interface NewsTickerBarProps {
  breakingArticles?: NewsArticle[];
  onSelectArticle: (article: NewsArticle) => void;
  followedEvents?: string[];
  onToggleFollowEvent?: (topic: string) => void;
}

const SAMPLE_BREAKING_ARTICLES: NewsArticle[] = [
  {
    id: 'brk_1',
    title: 'Global Tech Summit 2026: Major Breakthroughs in AI Governance & Infrastructure Announced',
    description: 'International leaders and tech pioneers convene to establish global standards for autonomous AI agents.',
    content: '',
    url: 'https://news.google.com',
    sourceName: 'SUPERAI Live',
    source: 'SUPERAI Live',
    category: 'top',
    publishedAt: new Date().toISOString(),
    readTimeMinutes: 2,
    isBreaking: true,
    region: 'global',
    tags: ['breaking', 'ai'],
    canonicalUrl: '',
  },
  {
    id: 'brk_2',
    title: 'India Space Mission Achieves Successful Lunar Rover Orbital Maneuver',
    description: 'ISRO reports nominal telemetry as next-generation lunar exploration suite enters scientific mapping phase.',
    content: '',
    url: 'https://news.google.com',
    sourceName: 'India News Bureau',
    source: 'India News Bureau',
    category: 'science',
    publishedAt: new Date().toISOString(),
    readTimeMinutes: 2,
    isBreaking: true,
    region: 'india',
    tags: ['space', 'isro'],
    canonicalUrl: '',
  },
];

export const NewsTickerBar: React.FC<NewsTickerBarProps> = ({
  breakingArticles = SAMPLE_BREAKING_ARTICLES,
  onSelectArticle,
  followedEvents = [],
  onToggleFollowEvent = () => {},
}) => {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!breakingArticles || breakingArticles.length === 0) return null;

  const current = breakingArticles[activeIdx % breakingArticles.length];
  const isFollowed = followedEvents.includes(current.title);

  return (
    <div className="bg-gradient-to-r from-rose-950/90 via-red-950/80 to-zinc-950 border-y border-rose-900/60 px-3 py-2 flex items-center justify-between gap-3 text-xs shrink-0 select-none shadow-md">
      {/* Ticker Badge & Navigation */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="flex items-center gap-1.5 bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full animate-pulse shadow-sm shadow-rose-950">
          <Zap className="w-3 h-3 fill-white" />
          <span>BREAKING INTELLIGENCE</span>
        </span>

        {breakingArticles.length > 1 && (
          <div className="flex items-center gap-1 text-[10px] text-rose-300 font-mono">
            <button
              onClick={() => setActiveIdx((prev) => (prev - 1 + breakingArticles.length) % breakingArticles.length)}
              className="hover:text-white px-1"
            >
              ◀
            </button>
            <span>
              {activeIdx + 1}/{breakingArticles.length}
            </span>
            <button
              onClick={() => setActiveIdx((prev) => (prev + 1) % breakingArticles.length)}
              className="hover:text-white px-1"
            >
              ▶
            </button>
          </div>
        )}
      </div>

      {/* Main Breaking Headline */}
      <div
        onClick={() => onSelectArticle(current)}
        className="flex-1 truncate cursor-pointer group flex items-center gap-2"
      >
        <span className="font-extrabold text-rose-100 group-hover:text-white transition-colors truncate">
          {current.title}
        </span>
        <span className="text-[10px] text-rose-400/80 shrink-0 font-mono hidden sm:inline">
          — {current.sourceName} • {new Date(current.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFollowEvent(current.title);
          }}
          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
            isFollowed
              ? 'bg-rose-500 text-white border-rose-400'
              : 'bg-black/60 text-rose-300 border-rose-900 hover:bg-rose-950'
          }`}
        >
          <Bell className="w-3 h-3" />
          <span className="hidden sm:inline">{isFollowed ? 'FOLLOWING' : 'FOLLOW EVENT'}</span>
        </button>

        <button
          onClick={() => onSelectArticle(current)}
          className="text-[10px] bg-rose-600 hover:bg-rose-500 text-white font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>READ</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
