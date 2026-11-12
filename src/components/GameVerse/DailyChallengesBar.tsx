import React from 'react';
import { GameVerseProfile } from './GameVerseTypes';
import { Zap, CheckCircle2 } from 'lucide-react';

interface DailyChallengesBarProps {
  profile: GameVerseProfile;
  onClaimReward: (challengeId: string, xpReward: number) => void;
  onPlayGame?: (gameId: string) => void;
}

export const DailyChallengesBar: React.FC<DailyChallengesBarProps> = ({
  profile,
  onClaimReward,
  onPlayGame,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const challenges = [
    {
      id: `dc_1_${todayStr}`,
      title: 'Neon Dash Survivor',
      description: 'Score at least 250 points in Neon Dash',
      gameId: 'neondash',
      targetScore: 250,
      currentProgress: Math.min(250, profile.gameStats['neondash']?.highScore || 0),
      completed: profile.completedDailyChallenges.includes(`dc_1_${todayStr}`),
      xpReward: 100,
    },
    {
      id: `dc_2_${todayStr}`,
      title: 'Cyber Snake Master',
      description: 'Score at least 120 points in Cyber Snake',
      gameId: 'cybersnake',
      targetScore: 120,
      currentProgress: Math.min(120, profile.gameStats['cybersnake']?.highScore || 0),
      completed: profile.completedDailyChallenges.includes(`dc_2_${todayStr}`),
      xpReward: 100,
    },
    {
      id: `dc_3_${todayStr}`,
      title: 'Space Defender Ace',
      description: 'Score at least 300 points in Space Defender',
      gameId: 'spacedefender',
      targetScore: 300,
      currentProgress: Math.min(300, profile.gameStats['spacedefender']?.highScore || 0),
      completed: profile.completedDailyChallenges.includes(`dc_3_${todayStr}`),
      xpReward: 120,
    },
  ];

  return (
    <div className="bg-slate-900/90 border border-purple-500/30 rounded-3xl p-5 space-y-4 shadow-xl text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-100">Daily Quest Challenges</h3>
            <p className="text-[11px] text-slate-400">Complete tasks to earn bonus XP & level up!</p>
          </div>
        </div>

        <span className="text-[10px] font-mono text-purple-400 bg-purple-950 px-2.5 py-1 rounded-full border border-purple-800">
          Resets Daily
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {challenges.map((c) => {
          const isReadyToClaim = c.currentProgress >= c.targetScore && !c.completed;

          return (
            <div
              key={c.id}
              className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-all ${
                c.completed
                  ? 'bg-slate-950/60 border-emerald-500/30 opacity-70'
                  : isReadyToClaim
                  ? 'bg-purple-950/80 border-purple-500/80 shadow-lg shadow-purple-950'
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">{c.title}</span>
                  <span className="font-mono text-[10px] text-purple-300 font-bold">
                    +{c.xpReward} XP
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{c.description}</p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Progress</span>
                  <span>{c.currentProgress} / {c.targetScore}</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full transition-all"
                    style={{ width: `${Math.min(100, (c.currentProgress / c.targetScore) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Action Button */}
              {c.completed ? (
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 pt-1">
                  <CheckCircle2 className="w-4 h-4" /> Quest Claimed!
                </div>
              ) : isReadyToClaim ? (
                <button
                  onClick={() => onClaimReward(c.id, c.xpReward)}
                  className="w-full py-2 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-slate-950 font-extrabold rounded-xl text-xs transition shadow-md shadow-purple-500/20"
                >
                  CLAIM +{c.xpReward} XP ⚡
                </button>
              ) : (
                <button
                  onClick={() => onPlayGame && onPlayGame(c.gameId)}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/20 hover:border-purple-500/40 font-semibold rounded-xl text-xs transition"
                >
                  Play Game 🎮
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
