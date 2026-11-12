import React, { useState, useEffect } from 'react';
import {
  GameVerseProfile,
  BUILT_IN_GAMES,
  BuiltInGame,
} from './GameVerseTypes';
import {
  loadGameVerseProfile,
  saveGameVerseProfile,
  recordGameSession,
  claimDailyChallenge,
} from './GameVerseService';
import { GameVerseHeader } from './GameVerseHeader';
import { GameVerseHub } from './GameVerseHub';
import { PlayerProfileView } from './PlayerProfileView';
import { WebPortalView } from './WebPortalView';
import { AIGameCreatorView } from './AIGameCreatorView';
import { InAppGamePlayer } from './InAppGamePlayer';

// Import 10 built-in game components
import { NeonDash } from './games/NeonDash';
import { CyberSnake } from './games/CyberSnake';
import { MemoryMatrix } from './games/MemoryMatrix';
import { SpaceDefender } from './games/SpaceDefender';
import { PuzzleMaster } from './games/PuzzleMaster';
import { TicTacToeX } from './games/TicTacToeX';
import { RockPaperScissors } from './games/RockPaperScissors';
import { Game2048 } from './games/Game2048';
import { ReactionRush } from './games/ReactionRush';
import { WordQuest } from './games/WordQuest';

interface GameVerseModalProps {
  onClose: () => void;
  onLog?: (msg: string, tag?: string) => void;
  initialTab?: 'hub' | 'builtin' | 'webportals' | 'aicreator' | 'profile';
  initialGame?: string;
}

export const GameVerseModal: React.FC<GameVerseModalProps> = ({
  onClose,
  onLog,
  initialTab,
  initialGame,
}) => {
  const [profile, setProfile] = useState<GameVerseProfile>(() => loadGameVerseProfile());
  const [activeTab, setActiveTab] = useState<'hub' | 'builtin' | 'webportals' | 'aicreator' | 'profile'>(initialTab || 'hub');

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (initialGame) {
      setActiveBuiltInGameId(initialGame);
    }
  }, [initialGame]);

  const [searchQuery, setSearchQuery] = useState('');
  const [soundMuted, setSoundMuted] = useState(false);

  // Active playing game overlay state
  const [activeBuiltInGameId, setActiveBuiltInGameId] = useState<string | null>(null);

  // External Web Portal launch state
  const [activeWebPortal, setActiveWebPortal] = useState<{ url: string; title: string } | null>(null);

  // Sync profile state changes to persistence
  useEffect(() => {
    saveGameVerseProfile(profile);
  }, [profile]);

  // Log opening event once on mount
  useEffect(() => {
    onLog?.('GAME X ULTIMATE ENGINE ACTIVATED. GAMEVERSE MATRIX READY.', 'GAMEVERSE');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handlers for game ending / scoring
  const handleGameEnd = (gameId: string, score: number, victory: boolean) => {
    const game = BUILT_IN_GAMES.find((g) => g.id === gameId);
    const gameName = game ? game.title : gameId;

    const { updatedProfile, xpGained } = recordGameSession(profile, gameId, score, victory);
    setProfile(updatedProfile);

    onLog?.(
      `Game Over: ${gameName} | Score: ${score} | XP Earned: +${xpGained}`,
      'GAMEVERSE'
    );
  };

  const handleClaimChallengeReward = (challengeId: string, xpReward: number) => {
    const updated = claimDailyChallenge(profile, challengeId, xpReward);
    setProfile(updated);
    onLog?.(`Daily Quest Claimed: +${xpReward} XP`, 'GAMEVERSE');
  };

  const handleToggleFavorite = (gameId: string) => {
    const isFav = profile.favoriteGames.includes(gameId);
    const nextFavorites = isFav
      ? profile.favoriteGames.filter((id) => id !== gameId)
      : [...profile.favoriteGames, gameId];

    const updated = {
      ...profile,
      favoriteGames: nextFavorites,
    };
    setProfile(updated);
  };

  const handleLaunchBuiltInGame = (gameId: string) => {
    setActiveBuiltInGameId(gameId);

    // Track recently played
    const recent = [gameId, ...profile.recentlyPlayed.filter((id) => id !== gameId)].slice(0, 5);
    setProfile((prev) => ({
      ...prev,
      recentlyPlayed: recent,
    }));

    onLog?.(`Launched Built-In Game: ${gameId}`, 'GAMEVERSE');
  };

  const handleLaunchWebPortal = (url: string, title: string) => {
    setActiveWebPortal({ url, title });
    onLog?.(`Launched Web Portal: ${title} (${url})`, 'GAMEVERSE');
  };

  // Render active built-in game component
  const renderBuiltInGamePlayer = (gameId: string) => {
    const gameObj = BUILT_IN_GAMES.find((g) => g.id === gameId);
    if (!gameObj) return null;

    const highScore = profile.gameStats[gameId]?.highScore || 0;
    const gameProps = {
      onGameOver: (score: number) => handleGameEnd(gameId, score, true),
      onExit: () => setActiveBuiltInGameId(null),
      highScore,
    };

    switch (gameId) {
      case 'neondash':
        return <NeonDash {...gameProps} />;
      case 'cybersnake':
        return <CyberSnake {...gameProps} />;
      case 'memorymatrix':
        return <MemoryMatrix {...gameProps} />;
      case 'spacedefender':
        return <SpaceDefender {...gameProps} />;
      case 'puzzlemaster':
        return <PuzzleMaster {...gameProps} />;
      case 'tictactoex':
        return <TicTacToeX {...gameProps} />;
      case 'rockpaperscissors':
        return <RockPaperScissors {...gameProps} />;
      case '2048challenge':
        return <Game2048 {...gameProps} />;
      case 'reactionrush':
        return <ReactionRush {...gameProps} />;
      case 'wordquest':
        return <WordQuest {...gameProps} />;
      default:
        return (
          <div className="text-center py-12 text-white">
            <p>Game not found.</p>
            <button
              onClick={() => setActiveBuiltInGameId(null)}
              className="mt-4 px-4 py-2 bg-purple-600 rounded-xl"
            >
              Back to Hub
            </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl overflow-hidden p-2 sm:p-4">
      <div className="relative w-full h-full max-w-7xl max-h-[96vh] bg-slate-950 border border-purple-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header Bar */}
        <GameVerseHeader
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setActiveBuiltInGameId(null);
            setActiveWebPortal(null);
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          profile={profile}
          soundMuted={soundMuted}
          onToggleSound={() => setSoundMuted(!soundMuted)}
          onClose={onClose}
        />

        {/* Modal Scrollable Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-purple-900/50 scrollbar-track-transparent">
          {/* Active Overlay 1: Built-In Game Player */}
          {activeBuiltInGameId ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-800">
                <button
                  onClick={() => setActiveBuiltInGameId(null)}
                  className="flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-200 transition"
                >
                  <span>←</span>
                  <span>Exit Game & Back to Hub</span>
                </button>
                <div className="text-xs font-mono text-slate-400">
                  {BUILT_IN_GAMES.find((g) => g.id === activeBuiltInGameId)?.title}
                </div>
              </div>

              {renderBuiltInGamePlayer(activeBuiltInGameId)}
            </div>
          ) : activeWebPortal ? (
            /* Active Overlay 2: Web Portal In-App Player */
            <InAppGamePlayer
              title={activeWebPortal.title}
              url={activeWebPortal.url}
              onExit={() => setActiveWebPortal(null)}
              onLaunchNativeGame={(altGameId: string) => {
                setActiveWebPortal(null);
                handleLaunchBuiltInGame(altGameId);
              }}
            />
          ) : (
            /* Normal Tab Content */
            <>
              {activeTab === 'hub' && (
                <GameVerseHub
                  profile={profile}
                  searchQuery={searchQuery}
                  onLaunchBuiltInGame={handleLaunchBuiltInGame}
                  onLaunchWebPortal={(url, title) => handleLaunchWebPortal(url, title)}
                  onOpenAICreator={() => setActiveTab('aicreator')}
                  onClaimChallengeReward={handleClaimChallengeReward}
                  onToggleFavorite={handleToggleFavorite}
                />
              )}

              {activeTab === 'builtin' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-xl font-extrabold text-white">🕹️ All Built-In Playable Games</h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        100% interactive games running directly inside ISHAI OS without redirects or paid APIs.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {BUILT_IN_GAMES.filter(
                      (g) =>
                        searchQuery.trim() === '' ||
                        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        g.category.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map((game) => {
                      const stats = profile.gameStats[game.id] || { highScore: 0, victories: 0, played: 0 };
                      return (
                        <div
                          key={game.id}
                          className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 p-5 rounded-2xl flex flex-col justify-between transition hover:-translate-y-1 shadow-lg"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{game.icon}</span>
                              <div>
                                <h3 className="font-bold text-white text-base">{game.title}</h3>
                                <div className="text-[10px] text-cyan-400 font-mono">{game.category} • {game.difficulty}</div>
                              </div>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">{game.description}</p>
                            <div className="bg-slate-950 p-2 rounded-xl text-[11px] font-mono flex justify-between text-slate-400">
                              <span>High Score:</span>
                              <span className="text-amber-400 font-bold">{stats.highScore}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleLaunchBuiltInGame(game.id)}
                            className="mt-4 w-full py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs shadow transition"
                          >
                            Play Now 🎮
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'webportals' && (
                <WebPortalView
                  profile={profile}
                  onLaunchWebGame={(title: string, url: string) => handleLaunchWebPortal(url, title)}
                  onAddBookmark={(title: string, url: string) => {
                    const updated = {
                      ...profile,
                      customBookmarks: [
                        ...profile.customBookmarks,
                        { id: `bm_${Date.now()}`, title, url, icon: '🔗' },
                      ],
                    };
                    saveGameVerseProfile(updated);
                    setProfile(updated);
                  }}
                  onLaunchNativeGame={(gameId: string) => handleLaunchBuiltInGame(gameId)}
                />
              )}

              {activeTab === 'aicreator' && (
                <AIGameCreatorView
                  onLog={onLog}
                  onSaveCustomGame={(game: any) => {
                    onLog?.(`Saved Custom AI Game: ${game.title}`, 'GAMEVERSE');
                  }}
                />
              )}

              {activeTab === 'profile' && (
                <PlayerProfileView
                  profile={profile}
                  onProfileUpdate={(updated) => setProfile(updated)}
                  onLaunchGame={handleLaunchBuiltInGame}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};
