import React from 'react';
import { GameVerseProfile, getRankTitle, getLevelProgress } from './GameVerseTypes';

interface GameVerseHeaderProps {
  activeTab: 'hub' | 'builtin' | 'webportals' | 'aicreator' | 'profile';
  onSelectTab: (tab: 'hub' | 'builtin' | 'webportals' | 'aicreator' | 'profile') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  profile: GameVerseProfile;
  soundMuted: boolean;
  onToggleSound: () => void;
  onClose: () => void;
}

export const GameVerseHeader: React.FC<GameVerseHeaderProps> = ({
  activeTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  profile,
  soundMuted,
  onToggleSound,
  onClose,
}) => {
  const { currentLevelXp, xpForNext, progressPct } = getLevelProgress(profile.xp);
  const rankTitle = getRankTitle(profile.level);

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl border-b border-purple-500/30 px-4 py-3 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Level Badge */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-cyan-500 to-indigo-500 p-0.5 shadow-lg shadow-cyan-500/30 flex items-center justify-center animate-pulse">
              <span className="text-xl">🎮</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-300 to-emerald-400">
                  GAME X
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40">
                  GAMEVERSE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">Play • Compete • Create • Level Up</p>
            </div>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onToggleSound}
              className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-xs"
              title={soundMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {soundMuted ? '🔇' : '🔊'}
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-red-950/60 border border-red-500/40 hover:bg-red-900 text-red-300 rounded-xl text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800/80 overflow-x-auto max-w-full">
          <button
            onClick={() => onSelectTab('hub')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'hub'
                ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🏠</span>
            <span>Gameverse Hub</span>
          </button>

          <button
            onClick={() => onSelectTab('builtin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'builtin'
                ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🕹️</span>
            <span>Built-In Games (10)</span>
          </button>

          <button
            onClick={() => onSelectTab('webportals')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'webportals'
                ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🌐</span>
            <span>Web Portals</span>
          </button>

          <button
            onClick={() => onSelectTab('aicreator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'aicreator'
                ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>⚡</span>
            <span>AI Game Creator</span>
          </button>

          <button
            onClick={() => onSelectTab('profile')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>👤</span>
            <span>Profile</span>
          </button>
        </nav>

        {/* Right Search & Profile XP HUD */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* Search input */}
          <div className="relative flex-1 md:w-48">
            <input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
          </div>

          {/* Level / XP Pill */}
          <button
            onClick={() => onSelectTab('profile')}
            className="hidden sm:flex items-center gap-2 bg-slate-900/90 border border-purple-500/30 hover:border-cyan-500/50 p-1.5 rounded-xl transition"
            title={`${rankTitle} - ${currentLevelXp}/${xpForNext} XP`}
          >
            <div className="w-7 h-7 rounded-lg bg-purple-900/80 border border-purple-500/40 flex items-center justify-center text-sm font-black text-cyan-300">
              {profile.level}
            </div>
            <div className="text-left pr-1 hidden lg:block">
              <div className="text-[10px] font-bold text-slate-200">{profile.username}</div>
              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="hidden md:flex p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-300 text-xs transition"
            title={soundMuted ? 'Unmute Audio Engine' : 'Mute Audio Engine'}
          >
            {soundMuted ? '🔇' : '🔊'}
          </button>

          {/* Close Modal */}
          <button
            onClick={onClose}
            className="hidden md:flex p-2 bg-red-950/40 border border-red-500/30 hover:bg-red-900/80 hover:text-white text-red-400 rounded-xl text-xs font-bold transition"
            title="Close Game X"
          >
            ✕
          </button>
        </div>
      </div>
    </header>
  );
};
