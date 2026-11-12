import React, { useState } from 'react';
import {
  BuiltInGame,
  BUILT_IN_GAMES,
  WEB_PORTAL_HUBS,
  GameVerseProfile,
  GAME_CATEGORIES,
} from './GameVerseTypes';
import { DailyChallengesBar } from './DailyChallengesBar';

interface GameVerseHubProps {
  profile: GameVerseProfile;
  searchQuery: string;
  onLaunchBuiltInGame: (gameId: string) => void;
  onLaunchWebPortal: (url: string, title: string) => void;
  onOpenAICreator: () => void;
  onClaimChallengeReward: (challengeId: string, xpReward: number) => void;
  onToggleFavorite: (gameId: string) => void;
}

export const GameVerseHub: React.FC<GameVerseHubProps> = ({
  profile,
  searchQuery,
  onLaunchBuiltInGame,
  onLaunchWebPortal,
  onOpenAICreator,
  onClaimChallengeReward,
  onToggleFavorite,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Featured Game (Default: Neon Dash)
  const featuredGame = BUILT_IN_GAMES.find((g) => g.id === 'neondash') || BUILT_IN_GAMES[0];

  // Filter built-in games
  const filteredBuiltInGames = BUILT_IN_GAMES.filter((game) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' || game.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Filter web portals
  const filteredWebPortals = WEB_PORTAL_HUBS.filter((portal) => {
    return (
      searchQuery.trim() === '' ||
      portal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      portal.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      portal.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-8 animate-fadeIn pb-12 text-white">
      {/* 1. Hero Spotlight: Featured Game */}
      {searchQuery.trim() === '' && selectedCategory === 'All' && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950/90 via-slate-900 to-cyan-950/90 border border-purple-500/40 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mt-20 -mr-20" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -mb-20 -ml-20" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  🔥 FEATURED BUILT-IN GAME
                </span>
                <span className="text-xs text-amber-400 font-bold">★ {featuredGame.rating}</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-purple-200">
                {featuredGame.title}
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed">
                {featuredGame.description} Dodge glowing cyber hazards, time your jumps, collect power-up crystals, and compete for the top high score in SUPERAI!
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onLaunchBuiltInGame(featuredGame.id)}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 font-black rounded-2xl shadow-lg shadow-cyan-500/30 hover:scale-105 transition-all flex items-center gap-2 text-sm"
                >
                  <span>PLAY NOW</span>
                  <span className="text-lg">🎮</span>
                </button>

                <button
                  onClick={() => onToggleFavorite(featuredGame.id)}
                  className={`px-4 py-3 rounded-2xl border text-xs font-bold transition flex items-center gap-1.5 ${
                    profile.favoriteGames.includes(featuredGame.id)
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <span>{profile.favoriteGames.includes(featuredGame.id) ? '★ Favorited' : '☆ Favorite'}</span>
                </button>
              </div>
            </div>

            {/* Featured Game Visual Card */}
            <div className="relative shrink-0 w-full md:w-80 h-52 rounded-2xl overflow-hidden bg-slate-950 border border-cyan-500/30 shadow-2xl flex items-center justify-center p-6 group cursor-pointer"
                 onClick={() => onLaunchBuiltInGame(featuredGame.id)}>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-cyan-900/30 to-slate-950 group-hover:scale-105 transition duration-500" />
              <div className="relative z-10 text-center space-y-3">
                <div className="text-6xl animate-bounce">{featuredGame.icon}</div>
                <div className="text-xs font-black tracking-widest text-cyan-400 uppercase">
                  ENTER GAMEVERSE
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Daily Challenges Bar */}
      <DailyChallengesBar
        profile={profile}
        onClaimReward={onClaimChallengeReward}
      />

      {/* 3. Category Filter Selector */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 flex items-center gap-2">
            <span>🎯</span> Discover Games & Categories
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {filteredBuiltInGames.length} Games Found
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {GAME_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-slate-950 font-bold border-cyan-400 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Built-In Playable Games Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>⚡</span> Built-In Playable Games
        </h3>

        {filteredBuiltInGames.length === 0 ? (
          <div className="py-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-400 text-sm">
            No built-in games found matching &quot;{searchQuery}&quot;. Try adjusting your search query or category filter!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBuiltInGames.map((game) => {
              const isFav = profile.favoriteGames.includes(game.id);
              const stats = profile.gameStats[game.id] || { highScore: 0, victories: 0, played: 0 };

              return (
                <div
                  key={game.id}
                  className="group relative bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10 overflow-hidden"
                >
                  <div className="space-y-3">
                    {/* Top Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 group-hover:border-cyan-500/40 flex items-center justify-center text-2xl transition">
                          {game.icon}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-white group-hover:text-cyan-300 transition text-base">
                            {game.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                              {game.category}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {game.difficulty}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(game.id);
                        }}
                        className={`text-lg p-1 transition ${isFav ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'}`}
                        title={isFav ? 'Remove Favorite' : 'Add Favorite'}
                      >
                        {isFav ? '★' : '☆'}
                      </button>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {game.description}
                    </p>

                    {/* Stats pill */}
                    <div className="flex items-center justify-between text-[11px] bg-slate-950 p-2 rounded-xl border border-slate-800/80 font-mono">
                      <span className="text-slate-400">Personal Best:</span>
                      <span className="text-amber-400 font-bold">{stats.highScore} pts</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">★ {game.rating} • {game.playersCount}</span>
                    <button
                      onClick={() => onLaunchBuiltInGame(game.id)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-1.5"
                    >
                      <span>PLAY</span>
                      <span>▶</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. External Web Portals Section */}
      <div className="space-y-4 pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>🌐</span> Explore External Web Gaming Portals
          </h3>
          <span className="text-xs text-slate-400">In-App Browser Integration</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {filteredWebPortals.map((portal) => (
            <div
              key={portal.id}
              onClick={() => onLaunchWebPortal(portal.url, portal.title)}
              className="group bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 p-4 rounded-2xl cursor-pointer transition hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="text-3xl group-hover:scale-110 transition">{portal.icon}</div>
                <div className="font-bold text-sm text-white group-hover:text-purple-300 transition">
                  {portal.title}
                </div>
                <div className="text-[10px] text-cyan-400 font-mono">{portal.category}</div>
                <p className="text-[11px] text-slate-400 line-clamp-2">{portal.description}</p>
              </div>
              <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-semibold flex items-center justify-between">
                <span>OPEN PORTAL</span>
                <span className="group-hover:translate-x-1 transition">→</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. AI Game Creator Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-purple-500/40 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 max-w-xl">
          <span className="px-3 py-0.5 rounded-full text-[10px] font-black tracking-widest bg-purple-500/20 text-purple-300 border border-purple-500/40">
            🤖 SYNTHESIZE CUSTOM GAMES
          </span>
          <h3 className="text-2xl font-black text-white">AI Game Creator Engine</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Describe any game concept in plain English (e.g., &quot;A retro space shooter with particle trails&quot;), and SUPERAI will generate a fully playable HTML5 canvas game on the fly!
          </p>
        </div>
        <button
          onClick={onOpenAICreator}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-purple-500/20 hover:scale-105 transition text-xs whitespace-nowrap"
        >
          GENERATE A GAME NOW ⚡
        </button>
      </div>
    </div>
  );
};
