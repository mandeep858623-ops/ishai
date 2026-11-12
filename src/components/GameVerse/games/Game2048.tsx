import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, ArrowLeft, Trophy, Zap, CheckCircle2 } from 'lucide-react';
import { soundEngine } from '../../../utils/audio';

interface Game2048Props {
  onGameOver: (score: number) => void;
  onExit: () => void;
  highScore: number;
}

export const Game2048: React.FC<Game2048Props> = ({ onGameOver, onExit, highScore }) => {
  const [board, setBoard] = useState<number[]>(Array(16).fill(0));
  const [score, setScore] = useState(0);
  const [currentHighScore, setCurrentHighScore] = useState(highScore);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'WIN' | 'GAMEOVER'>('START');

  const addRandomTile = (currentBoard: number[]) => {
    const emptyIndices = currentBoard
      .map((val, idx) => (val === 0 ? idx : null))
      .filter((val): val is number => val !== null);

    if (emptyIndices.length === 0) return currentBoard;

    const randomIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    const newBoard = [...currentBoard];
    newBoard[randomIdx] = Math.random() > 0.8 ? 4 : 2;
    return newBoard;
  };

  const startGame = () => {
    let b = Array(16).fill(0);
    b = addRandomTile(b);
    b = addRandomTile(b);
    setBoard(b);
    setScore(0);
    setGameState('PLAYING');
  };

  const slideRow = (row: number[]): { newRow: number[]; scoreGained: number } => {
    let nonZero = row.filter((val) => val !== 0);
    let scoreGained = 0;

    for (let i = 0; i < nonZero.length - 1; i++) {
      if (nonZero[i] === nonZero[i + 1]) {
        nonZero[i] *= 2;
        scoreGained += nonZero[i];
        nonZero.splice(i + 1, 1);
      }
    }

    while (nonZero.length < 4) {
      nonZero.push(0);
    }

    return { newRow: nonZero, scoreGained };
  };

  const move = (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (gameState !== 'PLAYING') return;

    let newBoard = [...board];
    let totalGained = 0;
    let moved = false;

    for (let i = 0; i < 4; i++) {
      let row: number[] = [];
      if (direction === 'LEFT') {
        row = [newBoard[i * 4], newBoard[i * 4 + 1], newBoard[i * 4 + 2], newBoard[i * 4 + 3]];
      } else if (direction === 'RIGHT') {
        row = [newBoard[i * 4 + 3], newBoard[i * 4 + 2], newBoard[i * 4 + 1], newBoard[i * 4]];
      } else if (direction === 'UP') {
        row = [newBoard[i], newBoard[i + 4], newBoard[i + 8], newBoard[i + 12]];
      } else if (direction === 'DOWN') {
        row = [newBoard[i + 12], newBoard[i + 8], newBoard[i + 4], newBoard[i]];
      }

      const { newRow, scoreGained } = slideRow(row);
      totalGained += scoreGained;

      for (let j = 0; j < 4; j++) {
        let idx = 0;
        if (direction === 'LEFT') idx = i * 4 + j;
        else if (direction === 'RIGHT') idx = i * 4 + (3 - j);
        else if (direction === 'UP') idx = j * 4 + i;
        else if (direction === 'DOWN') idx = (3 - j) * 4 + i;

        if (newBoard[idx] !== newRow[j]) moved = true;
        newBoard[idx] = newRow[j];
      }
    }

    if (moved) {
      soundEngine.playClick();
      newBoard = addRandomTile(newBoard);
      setBoard(newBoard);

      const newScore = score + totalGained;
      setScore(newScore);
      if (newScore > currentHighScore) setCurrentHighScore(newScore);

      // Check 2048 tile win
      if (newBoard.includes(2048) && (gameState as string) !== 'WIN') {
        soundEngine.playSuccess();
        setGameState('WIN');
      }

      // Check Game Over
      if (!canMove(newBoard)) {
        soundEngine.playAlertBeep();
        setGameState('GAMEOVER');
        onGameOver(newScore);
      }
    }
  };

  const canMove = (b: number[]): boolean => {
    if (b.includes(0)) return true;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const val = b[r * 4 + c];
        if (c < 3 && val === b[r * 4 + c + 1]) return true;
        if (r < 3 && val === b[(r + 1) * 4 + c]) return true;
      }
    }
    return false;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') move('LEFT');
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') move('RIGHT');
      else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') move('UP');
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') move('DOWN');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [board, gameState, score]);

  const getTileColor = (val: number) => {
    switch (val) {
      case 2: return 'bg-amber-900/60 text-amber-200 border-amber-800';
      case 4: return 'bg-amber-800/80 text-amber-100 border-amber-700';
      case 8: return 'bg-orange-700 text-white border-orange-600 shadow-md';
      case 16: return 'bg-orange-600 text-white border-orange-500 shadow-lg';
      case 32: return 'bg-rose-600 text-white border-rose-500 shadow-lg';
      case 64: return 'bg-rose-500 text-white border-rose-400 shadow-xl';
      case 128: return 'bg-yellow-500 text-slate-950 font-black shadow-xl';
      case 256: return 'bg-yellow-400 text-slate-950 font-black shadow-xl';
      case 512: return 'bg-yellow-300 text-slate-950 font-black shadow-2xl';
      case 1024: return 'bg-cyan-400 text-slate-950 font-black shadow-2xl';
      case 2048: return 'bg-purple-500 text-white font-black shadow-2xl animate-pulse';
      default: return 'bg-slate-950 text-transparent border-slate-900';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-950 text-white rounded-3xl border border-amber-500/30 max-w-2xl mx-auto shadow-2xl space-y-4">
      {/* Header */}
      <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Exit
        </button>

        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <h2 className="font-extrabold text-base tracking-wider text-amber-400">
            2048 CHALLENGE
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="bg-amber-950 border border-amber-800 text-amber-300 px-3 py-1 rounded-lg flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" /> BEST: {currentHighScore}
          </span>
        </div>
      </div>

      {/* Grid Board */}
      <div className="relative w-full max-w-md aspect-square bg-slate-900 rounded-2xl p-4 border border-amber-500/30 flex flex-col items-center justify-center shadow-inner">
        {gameState === 'START' && (
          <div className="p-6 text-center space-y-4 z-10">
            <div className="w-16 h-16 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/40 animate-pulse">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white">2048 MATRIX</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Slide tiles across the grid. Merge matching numbers to reach the legendary 2048 tile!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/30 flex items-center gap-2 mx-auto transition-all"
            >
              <Play className="w-4 h-4 fill-current" /> PLAY 2048
            </button>
          </div>
        )}

        {gameState === 'WIN' && (
          <div className="absolute inset-0 bg-slate-950/95 z-20 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-amber-400 animate-bounce" />
            <h3 className="text-2xl font-black text-amber-300">2048 UNLOCKED!</h3>
            <p className="text-xs text-slate-300">You achieved the legendary 2048 tile!</p>
            <div className="flex gap-3">
              <button
                onClick={() => setGameState('PLAYING')}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
              >
                KEEP PLAYING
              </button>
              <button
                onClick={startGame}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                NEW GAME
              </button>
            </div>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-slate-950/95 z-20 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="text-rose-500 font-extrabold text-xl">NO MOVES REMAINING</div>
            <div className="space-y-1">
              <p className="text-xs text-slate-400">FINAL SCORE</p>
              <p className="text-3xl font-black text-amber-400">{score}</p>
            </div>
            <button
              onClick={startGame}
              className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" /> RETRY 2048
            </button>
          </div>
        )}

        {/* 4x4 Grid */}
        <div className="w-full h-full grid grid-cols-4 grid-rows-4 gap-2.5 p-2 bg-slate-950 rounded-xl">
          {board.map((val, idx) => (
            <div
              key={idx}
              className={`rounded-xl border flex items-center justify-center font-black text-lg sm:text-2xl transition-all ${getTileColor(val)}`}
            >
              {val > 0 ? val : ''}
            </div>
          ))}
        </div>
      </div>

      {/* Touch Controls */}
      {gameState === 'PLAYING' && (
        <div className="flex flex-col items-center gap-1 pt-1">
          <button
            onClick={() => move('UP')}
            className="w-12 h-10 bg-slate-900 border border-amber-500/40 rounded-xl text-amber-300 font-bold active:bg-amber-500 active:text-slate-950"
          >
            ▲
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => move('LEFT')}
              className="w-12 h-10 bg-slate-900 border border-amber-500/40 rounded-xl text-amber-300 font-bold active:bg-amber-500 active:text-slate-950"
            >
              ◀
            </button>
            <button
              onClick={() => move('DOWN')}
              className="w-12 h-10 bg-slate-900 border border-amber-500/40 rounded-xl text-amber-300 font-bold active:bg-amber-500 active:text-slate-950"
            >
              ▼
            </button>
            <button
              onClick={() => move('RIGHT')}
              className="w-12 h-10 bg-slate-900 border border-amber-500/40 rounded-xl text-amber-300 font-bold active:bg-amber-500 active:text-slate-950"
            >
              ▶
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
