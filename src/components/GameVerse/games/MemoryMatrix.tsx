import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, ArrowLeft, Trophy, Brain, Check, Sparkles } from 'lucide-react';
import { soundEngine } from '../../../utils/audio';

interface MemoryMatrixProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
  highScore: number;
}

export const MemoryMatrix: React.FC<MemoryMatrixProps> = ({ onGameOver, onExit, highScore }) => {
  const GRID_SIZE = 16; // 4x4 grid
  const [gameState, setGameState] = useState<'START' | 'SHOWING' | 'USER_TURN' | 'SUCCESS' | 'GAMEOVER'>('START');
  const [sequence, setSequence] = useState<number[]>([]);
  const [userStep, setUserStep] = useState<number>(0);
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [currentHighScore, setCurrentHighScore] = useState(highScore);

  const startNewGame = () => {
    setScore(0);
    setLevel(1);
    startLevel(1, []);
  };

  const startLevel = (currentLevel: number, existingSeq: number[]) => {
    setUserStep(0);
    setActiveTile(null);
    setGameState('SHOWING');

    // Generate new sequence with length = currentLevel + 2
    const nextSeq = [...existingSeq];
    while (nextSeq.length < currentLevel + 2) {
      nextSeq.push(Math.floor(Math.random() * GRID_SIZE));
    }
    setSequence(nextSeq);

    // Playback sequence
    let i = 0;
    const interval = setInterval(() => {
      if (i < nextSeq.length) {
        setActiveTile(nextSeq[i]);
        soundEngine.playClick();
        setTimeout(() => setActiveTile(null), 350);
        i++;
      } else {
        clearInterval(interval);
        setGameState('USER_TURN');
      }
    }, 650);
  };

  const handleTileClick = (index: number) => {
    if (gameState !== 'USER_TURN') return;

    setActiveTile(index);
    soundEngine.playClick();
    setTimeout(() => setActiveTile(null), 200);

    const expected = sequence[userStep];

    if (index === expected) {
      const nextStep = userStep + 1;
      if (nextStep === sequence.length) {
        // Level Completed!
        soundEngine.playSuccess();
        const levelBonus = level * 50;
        const newScore = score + levelBonus;
        setScore(newScore);
        if (newScore > currentHighScore) setCurrentHighScore(newScore);

        setGameState('SUCCESS');
        setTimeout(() => {
          setLevel((l) => l + 1);
          startLevel(level + 1, sequence);
        }, 1200);
      } else {
        setUserStep(nextStep);
      }
    } else {
      // Wrong tile pressed!
      soundEngine.playAlertBeep();
      setGameState('GAMEOVER');
      onGameOver(score);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-950 text-white rounded-3xl border border-cyan-500/30 max-w-2xl mx-auto shadow-2xl space-y-4">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Exit
        </button>

        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-cyan-400" />
          <h2 className="font-extrabold text-base tracking-wider text-cyan-400">
            MEMORY MATRIX
          </h2>
        </div>

        <div className="text-xs font-mono text-cyan-300 bg-cyan-950/80 px-3 py-1 rounded-lg border border-cyan-800">
          LEVEL {level}
        </div>
      </div>

      {/* Grid Container */}
      <div className="relative w-full max-w-md aspect-square bg-slate-900 rounded-2xl p-4 border border-cyan-500/30 flex flex-col items-center justify-center shadow-inner">
        {gameState === 'START' && (
          <div className="p-6 text-center space-y-4 z-10">
            <div className="w-16 h-16 rounded-2xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/40 animate-pulse">
              <Brain className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white">MEMORY MATRIX</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Memorize the glowing tile matrix sequence and repeat it accurately!
            </p>
            <button
              onClick={startNewGame}
              className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-sm shadow-lg shadow-cyan-600/30 flex items-center gap-2 mx-auto transition-all"
            >
              <Play className="w-4 h-4 fill-current" /> START GAME
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-slate-950/95 z-20 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="text-rose-500 font-extrabold text-xl">PATTERN MISMATCH</div>
            <div className="space-y-1">
              <p className="text-xs text-slate-400">FINAL SCORE</p>
              <p className="text-3xl font-black text-cyan-400">{score}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              <Trophy className="w-3.5 h-3.5" /> High Score: {currentHighScore}
            </div>
            <button
              onClick={startNewGame}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" /> RETRY PATTERN
            </button>
          </div>
        )}

        {gameState === 'SUCCESS' && (
          <div className="absolute inset-0 bg-cyan-950/90 z-20 flex flex-col items-center justify-center text-center space-y-2 animate-in fade-in">
            <Check className="w-12 h-12 text-emerald-400 animate-bounce" />
            <h3 className="text-lg font-bold text-cyan-200">LEVEL {level} CLEARED!</h3>
            <p className="text-xs text-cyan-400">+ {level * 50} XP Points</p>
          </div>
        )}

        {/* 4x4 Grid Matrix */}
        {(gameState === 'SHOWING' || gameState === 'USER_TURN' || gameState === 'SUCCESS') && (
          <div className="w-full h-full grid grid-cols-4 grid-rows-4 gap-3">
            {Array.from({ length: GRID_SIZE }).map((_, idx) => {
              const isActive = activeTile === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleTileClick(idx)}
                  disabled={gameState !== 'USER_TURN'}
                  className={`rounded-2xl transition-all duration-150 border flex items-center justify-center ${
                    isActive
                      ? 'bg-cyan-400 border-white shadow-xl shadow-cyan-400 scale-105'
                      : 'bg-slate-950 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900'
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="text-xs text-slate-400 text-center font-mono">
        {gameState === 'SHOWING' && '🧠 Watch the glowing sequence carefully...'}
        {gameState === 'USER_TURN' && `⚡ Your turn! (${userStep} / ${sequence.length} tiles completed)`}
      </div>
    </div>
  );
};
