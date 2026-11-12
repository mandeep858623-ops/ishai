import React, { useState } from 'react';
import {
  GameVerseProfile,
  BUILT_IN_GAMES,
  GAME_ACHIEVEMENTS,
  getRankTitle,
  getLevelProgress,
} from './GameVerseTypes';
import { resetGameVerseProfile, saveGameVerseProfile } from './GameVerseService';

interface PlayerProfileViewProps {
  profile: GameVerseProfile;
  onProfileUpdate: (updated: GameVerseProfile) => void;
  onLaunchGame: (gameId: string) => void;
}

export const PlayerProfileView: React.FC<PlayerProfileViewProps> = ({
  profile,
  onProfileUpdate,
  onLaunchGame,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'highscores' | 'achievements' | 'bookmarks'>('overview');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [newBookmarkTitle, setNewBookmarkTitle] = useState('');
  const [newBookmarkUrl, setNewBookmarkUrl] = useState('');
  const [bookmarkError, setBookmarkError] = useState('');

  const rankTitle = getRankTitle(profile.level);
  const { currentLevelXp, xpForNext, progressPct } = getLevelProgress(profile.xp);

  const handleResetProfile = () => {
    const fresh = resetGameVerseProfile();
    onProfileUpdate(fresh);
    setShowResetConfirm(false);
  };

  const handleAddBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    setBookmarkError('');
    if (!newBookmarkTitle.trim()) {
      setBookmarkError('Please enter a website title.');
      return;
    }
    let url = newBookmarkUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    try {
      new URL(url);
    } catch {
      setBookmarkError('Please enter a valid HTTP/HTTPS web address.');
      return;
    }

    const updatedBookmarks = [
      ...profile.customBookmarks,
      {
        id: `bm_${Date.now()}`,
        title: newBookmarkTitle.trim(),
        url,
        icon: '🔗',
        addedAt: new Date().toLocaleDateString(),
      },
    ];

    const updatedProfile: GameVerseProfile = {
      ...profile,
      customBookmarks: updatedBookmarks,
    };

    saveGameVerseProfile(updatedProfile);
    onProfileUpdate(updatedProfile);
    setNewBookmarkTitle('');
    setNewBookmarkUrl('');
  };

  const handleDeleteBookmark = (id: string) => {
    const updatedBookmarks = profile.customBookmarks.filter((b) => b.id !== id);
    const updatedProfile: GameVerseProfile = {
      ...profile,
      customBookmarks: updatedBookmarks,
    };
    saveGameVerseProfile(updatedProfile);
    onProfileUpdate(updatedProfile);
  };

  const totalWins = Object.values(profile.gameStats).reduce((acc, curr) => acc + (curr.victories || 0), 0);
  const totalPlayed = Object.values(profile.gameStats).reduce((acc, curr) => acc + (curr.played || 0), 0);
  const unlockedCount = profile.unlockedAchievements.length;
  const totalAchievements = GAME_ACHIEVEMENTS.length;

  return (
    <div className="space-y-6 animate-fadeIn text-white">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-cyan-950/80 p-6 border border-purple-500/30 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-600 via-cyan-500 to-indigo-500 p-1 shadow-lg shadow-cyan-500/20">
                <div className="w-full h-full bg-slate-950 rounded-xl flex items-center justify-center text-4xl">
                  {profile.avatar}
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-slate-950 font-black text-xs px-2 py-0.5 rounded-full border border-slate-950 shadow">
                LVL {profile.level}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-purple-300">
                  {profile.username}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-900/60 text-purple-300 border border-purple-500/40">
                  {rankTitle}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Joined GameVerse • Streak: <span className="text-amber-400 font-bold">{profile.streakDays} Days 🔥</span>
              </p>

              {/* Level progress bar */}
              <div className="mt-3 w-64 md:w-80">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Level {profile.level}</span>
                  <span className="text-cyan-400 font-mono">{currentLevelXp} / {xpForNext} XP</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
            <div className="bg-slate-900/80 border border-purple-500/20 rounded-xl p-3 text-center min-w-[90px]">
              <div className="text-xl font-black text-cyan-400">{profile.xp}</div>
              <div className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Total XP</div>
            </div>
            <div className="bg-slate-900/80 border border-purple-500/20 rounded-xl p-3 text-center min-w-[90px]">
              <div className="text-xl font-black text-purple-400">{totalWins}</div>
              <div className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Victories</div>
            </div>
            <div className="bg-slate-900/80 border border-purple-500/20 rounded-xl p-3 text-center min-w-[90px]">
              <div className="text-xl font-black text-amber-400">{unlockedCount}/{totalAchievements}</div>
              <div className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Badges</div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'overview'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          🎮 Career Stats
        </button>
        <button
          onClick={() => setActiveTab('highscores')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'highscores'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          🏆 High Scores
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'achievements'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          🎖️ Badges & Rewards ({unlockedCount})
        </button>
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'bookmarks'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          🔖 Web Bookmarks ({profile.customBookmarks.length})
        </button>
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-base font-bold text-cyan-400 flex items-center gap-2">
              <span>📊</span> Career Summary
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Total Games Played</div>
                <div className="text-lg font-bold text-white mt-0.5">{totalPlayed}</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Total Victories</div>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">{totalWins}</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Win Rate</div>
                <div className="text-lg font-bold text-purple-400 mt-0.5">
                  {totalPlayed > 0 ? Math.round((totalWins / totalPlayed) * 100) : 0}%
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400">Daily Login Streak</div>
                <div className="text-lg font-bold text-amber-400 mt-0.5">{profile.streakDays} Days</div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase">Recently Played</span>
              </div>
              {profile.recentlyPlayed.length === 0 ? (
                <div className="text-xs text-slate-500 italic py-2 text-center">No recently played games yet.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.recentlyPlayed.map((gId) => {
                    const game = BUILT_IN_GAMES.find((g) => g.id === gId);
                    if (!game) return null;
                    return (
                      <button
                        key={gId}
                        onClick={() => onLaunchGame(gId)}
                        className="flex items-center gap-2 bg-slate-950 hover:bg-slate-800 border border-purple-500/30 px-3 py-1.5 rounded-lg text-xs transition"
                      >
                        <span>{game.icon}</span>
                        <span className="font-medium text-slate-200">{game.title}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Reset profile section */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-base font-bold text-purple-400 flex items-center gap-2">
                <span>⚙️</span> GameVerse Settings & Reset
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your progress, XP level, unlocked badges, and personal records are automatically saved to your local profile.
                If you wish to restart your journey or reset high scores, click below.
              </p>
            </div>

            <div className="pt-6 border-t border-slate-800/80">
              {showResetConfirm ? (
                <div className="bg-red-950/40 border border-red-500/40 p-4 rounded-xl space-y-3">
                  <p className="text-xs text-red-300 font-semibold">
                    Are you sure? This will permanently reset all XP, high scores, and unlocked achievements.
                  </p>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleResetProfile}
                      className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-xs text-white font-semibold"
                    >
                      Confirm Reset
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="px-4 py-2 bg-red-950/30 hover:bg-red-900/40 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold transition"
                >
                  ⚠️ Reset All Progress & High Scores
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: High Scores */}
      {activeTab === 'highscores' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {BUILT_IN_GAMES.map((game) => {
            const stats = profile.gameStats[game.id] || { highScore: 0, victories: 0, played: 0 };
            return (
              <div
                key={game.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all rounded-2xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{game.icon}</span>
                      <div>
                        <div className="text-sm font-bold text-white">{game.title}</div>
                        <div className="text-[10px] text-cyan-400 font-mono">{game.category}</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-center">
                    <div>
                      <div className="text-[10px] text-slate-400">High Score</div>
                      <div className="text-sm font-black text-amber-400">{stats.highScore}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Victories</div>
                      <div className="text-sm font-black text-emerald-400">{stats.victories}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Played</div>
                      <div className="text-sm font-black text-cyan-400">{stats.played}</div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onLaunchGame(game.id)}
                  className="mt-4 w-full py-2 bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/50 rounded-xl text-xs font-semibold transition"
                >
                  Play Game 🎮
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB CONTENT: Achievements */}
      {activeTab === 'achievements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GAME_ACHIEVEMENTS.map((ach) => {
            const isUnlocked = profile.unlockedAchievements.includes(ach.id);
            return (
              <div
                key={ach.id}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                  isUnlocked
                    ? 'bg-gradient-to-r from-purple-950/40 via-slate-900 to-cyan-950/40 border-purple-500/40'
                    : 'bg-slate-900/40 border-slate-800 opacity-60'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                    isUnlocked ? 'bg-purple-900/60 border border-purple-500/50 text-amber-300' : 'bg-slate-950 border border-slate-800 text-slate-600'
                  }`}
                >
                  {ach.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-bold ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>
                      {ach.title}
                    </h4>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                        isUnlocked ? 'bg-amber-950 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      +{ach.xpReward} XP
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{ach.description}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-[10px]">
                    {isUnlocked ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        ✓ UNLOCKED
                      </span>
                    ) : (
                      <span className="text-slate-500 font-medium">🔒 Locked</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB CONTENT: Bookmarks */}
      {activeTab === 'bookmarks' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
              <span>➕</span> Add Custom Gaming Portal or Web Link
            </h3>
            <form onSubmit={handleAddBookmark} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Site Title (e.g., itch.io Indie Corner)"
                value={newBookmarkTitle}
                onChange={(e) => setNewBookmarkTitle(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
              <input
                type="text"
                placeholder="URL (e.g., itch.io)"
                value={newBookmarkUrl}
                onChange={(e) => setNewBookmarkUrl(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 font-bold rounded-xl py-2 text-xs transition"
              >
                Save Bookmark
              </button>
            </form>
            {bookmarkError && <p className="text-xs text-red-400 mt-2">{bookmarkError}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.customBookmarks.length === 0 ? (
              <div className="col-span-full py-8 text-center text-slate-500 text-xs italic bg-slate-900/20 rounded-2xl border border-slate-800/50">
                No custom bookmarks added yet. Add your favorite web game links above!
              </div>
            ) : (
              profile.customBookmarks.map((bm) => (
                <div
                  key={bm.id}
                  className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-center justify-between hover:border-cyan-500/40 transition"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="text-2xl">{bm.icon || '🔗'}</span>
                    <div className="truncate">
                      <div className="text-sm font-bold text-white truncate">{bm.title}</div>
                      <a
                        href={bm.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-cyan-400 hover:underline truncate block"
                      >
                        {bm.url}
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteBookmark(bm.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                    title="Delete bookmark"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
