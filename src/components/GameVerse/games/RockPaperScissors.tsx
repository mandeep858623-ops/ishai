import React, { useState } from 'react';
import { ArrowLeft, Trophy, Sparkles, RotateCcw } from 'lucide-react';
import { soundEngine } from '../../../utils/audio';

interface RockPaperScissorsProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
  highScore: number;
}

type Choice = 'ROCK' | 'PAPER' | 'SCISSORS';

export const RockPaperScissors: React.FC<RockPaperScissorsProps> = ({ onGameOver, onExit, highScore }) => {
  const [userChoice, setUserChoice] = useState<Choice | null>(null);
  const [aiChoice, setAiChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<'WIN' | 'LOSE' | 'DRAW' | null>(null);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [currentHighScore, setCurrentHighScore] = useState(highScore);

  const choices: { id: Choice; emoji: string; label: string }[] = [
    { id: 'ROCK', emoji: '🪨', label: 'ROCK' },
    { id: 'PAPER', emoji: '📄', label: 'PAPER' },
    { id: 'SCISSORS', emoji: '✂️', label: 'SCISSORS' },
  ];

  const playRound = (playerPick: Choice) => {
    setUserChoice(playerPick);
    soundEngine.playClick();

    const options: Choice[] = ['ROCK', 'PAPER', 'SCISSORS'];
    const compPick = options[Math.floor(Math.random() * options.length)];
    setAiChoice(compPick);

    if (playerPick === compPick) {
      setResult('DRAW');
    } else if (
      (playerPick === 'ROCK' && compPick === 'SCISSORS') ||
      (playerPick === 'PAPER' && compPick === 'ROCK') ||
      (playerPick === 'SCISSORS' && compPick === 'PAPER')
    ) {
      setResult('WIN');
      soundEngine.playSuccess();
      const newStreak = streak + 1;
      const points = 50 * newStreak;
      const newScore = score + points;
      setStreak(newStreak);
      setScore(newScore);
      if (newScore > currentHighScore) setCurrentHighScore(newScore);
      onGameOver(newScore);
    } else {
      setResult('LOSE');
      soundEngine.playAlertBeep();
      setStreak(0);
    }
  };

  const resetGame = () => {
    setUserChoice(null);
    setAiChoice(null);
    setResult(null);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-950 text-white rounded-3xl border border-pink-500/30 max-w-2xl mx-auto shadow-2xl space-y-4">
      {/* Header */}
      <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Exit
        </button>

        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-pink-400" />
          <h2 className="font-extrabold text-base tracking-wider text-pink-400">
            ROCK PAPER SCISSORS X
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="bg-pink-950 border border-pink-800 text-pink-300 px-3 py-1 rounded-lg">
            STREAK: 🔥 {streak}x
          </span>
        </div>
      </div>

      {/* Play Area */}
      <div className="relative w-full max-w-md aspect-square bg-slate-900 rounded-2xl p-6 border border-pink-500/30 flex flex-col items-center justify-between shadow-inner">
        {/* Opponent AI Display */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">AI OPPONENT</span>
          <div className="w-24 h-24 rounded-2xl bg-slate-950 border border-pink-500/40 flex items-center justify-center text-4xl shadow-lg">
            {aiChoice ? choices.find((c) => c.id === aiChoice)?.emoji : '🤖'}
          </div>
        </div>

        {/* Result Message */}
        <div className="text-center my-2">
          {result === 'WIN' && (
            <div className="text-emerald-400 font-black text-xl animate-bounce">
              VICTORY! +{50 * streak} XP
            </div>
          )}
          {result === 'LOSE' && (
            <div className="text-rose-400 font-black text-xl">
              ROUND LOST!
            </div>
          )}
          {result === 'DRAW' && (
            <div className="text-amber-400 font-black text-xl">
              DRAW GAME!
            </div>
          )}
          {!result && (
            <div className="text-xs font-mono text-slate-400">
              Select your hand gesture below
            </div>
          )}
        </div>

        {/* User Choice Buttons */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {choices.map((c) => (
            <button
              key={c.id}
              onClick={() => playRound(c.id)}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-pink-500/60 hover:bg-slate-800/80 flex flex-col items-center gap-2 transition-all active:scale-95 shadow-md"
            >
              <span className="text-3xl">{c.emoji}</span>
              <span className="text-[10px] font-mono font-bold text-slate-300">{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Score Stats */}
      <div className="flex items-center justify-between w-full max-w-md text-xs font-mono bg-slate-900 p-3 rounded-xl border border-slate-800">
        <span className="text-slate-300">TOTAL SCORE: <strong className="text-pink-400">{score}</strong></span>
        <span className="text-amber-400 font-bold flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5" /> BEST: {currentHighScore}
        </span>
      </div>
    </div>
  );
};
