import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, ArrowLeft, Trophy, Puzzle, CheckCircle2, Lightbulb } from 'lucide-react';
import { soundEngine } from '../../../utils/audio';

interface PuzzleMasterProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
  highScore: number;
}

export const PuzzleMaster: React.FC<PuzzleMasterProps> = ({ onGameOver, onExit, highScore }) => {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'WIN'>('START');
  const [gridSize, setGridSize] = useState<3 | 4>(3); // 3x3 or 4x4
  const [tiles, setTiles] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);

  const initializePuzzle = (size: 3 | 4) => {
    const total = size * size;
    let arr = Array.from({ length: total }, (_, i) => (i === total - 1 ? 0 : i + 1));

    // Shuffle solvable puzzle
    for (let i = 0; i < 100; i++) {
      const zeroIdx = arr.indexOf(0);
      const validSwaps: number[] = [];
      const row = Math.floor(zeroIdx / size);
      const col = zeroIdx % size;

      if (row > 0) validSwaps.push(zeroIdx - size);
      if (row < size - 1) validSwaps.push(zeroIdx + size);
      if (col > 0) validSwaps.push(zeroIdx - 1);
      if (col < size - 1) validSwaps.push(zeroIdx + 1);

      const target = validSwaps[Math.floor(Math.random() * validSwaps.length)];
      [arr[zeroIdx], arr[target]] = [arr[target], arr[zeroIdx]];
    }

    setTiles(arr);
    setMoves(0);
    setTimeSeconds(0);
    setHintsUsed(0);
    setGameState('PLAYING');
  };

  // Timer
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const timer = setInterval(() => {
      setTimeSeconds((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  const handleTileClick = (index: number) => {
    if (gameState !== 'PLAYING') return;

    const zeroIdx = tiles.indexOf(0);
    const size = gridSize;
    const row = Math.floor(index / size);
    const col = index % size;
    const zeroRow = Math.floor(zeroIdx / size);
    const zeroCol = zeroIdx % size;

    // Adjacent check
    const isAdjacent =
      (Math.abs(row - zeroRow) === 1 && col === zeroCol) ||
      (Math.abs(col - zeroCol) === 1 && row === zeroRow);

    if (isAdjacent) {
      soundEngine.playClick();
      const newTiles = [...tiles];
      [newTiles[index], newTiles[zeroIdx]] = [newTiles[zeroIdx], newTiles[index]];
      setTiles(newTiles);
      setMoves((m) => m + 1);

      // Check Win Condition
      const isSolved = newTiles.every((val, i) =>
        i === newTiles.length - 1 ? val === 0 : val === i + 1
      );

      if (isSolved) {
        soundEngine.playSuccess();
        const basePoints = gridSize === 3 ? 300 : 600;
        const timeDeduction = Math.min(150, timeSeconds * 2);
        const finalScore = Math.max(50, basePoints - moves * 5 - timeDeduction - hintsUsed * 30);

        setGameState('WIN');
        onGameOver(finalScore);
      }
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
          <Puzzle className="w-5 h-5 text-amber-400" />
          <h2 className="font-extrabold text-base tracking-wider text-amber-400">
            PUZZLE MASTER
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setGridSize(gridSize === 3 ? 4 : 3)}
            className="px-3 py-1 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-300 text-xs font-bold"
          >
            {gridSize}x{gridSize} Mode
          </button>
        </div>
      </div>

      {/* Main Board */}
      <div className="relative w-full max-w-md aspect-square bg-slate-900 rounded-2xl p-4 border border-amber-500/30 flex flex-col items-center justify-center shadow-inner">
        {gameState === 'START' && (
          <div className="p-6 text-center space-y-4 z-10">
            <div className="w-16 h-16 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/40 animate-pulse">
              <Puzzle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white">SLIDING LOGIC PUZZLE</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Slide tiles into numerical sequence (1, 2, 3...) using the empty space.
            </p>
            <button
              onClick={() => initializePuzzle(gridSize)}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-600/30 flex items-center gap-2 mx-auto transition-all"
            >
              <Play className="w-4 h-4 fill-current" /> START PUZZLE
            </button>
          </div>
        )}

        {gameState === 'WIN' && (
          <div className="absolute inset-0 bg-slate-950/95 z-20 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
            <h3 className="text-xl font-black text-amber-300">PUZZLE SOLVED!</h3>
            <p className="text-xs text-slate-300">
              Completed in {moves} moves and {timeSeconds}s!
            </p>
            <button
              onClick={() => initializePuzzle(gridSize)}
              className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" /> NEXT PUZZLE
            </button>
          </div>
        )}

        {/* Tiles Matrix */}
        {gameState === 'PLAYING' && (
          <div
            className={`w-full h-full grid gap-2.5 p-2 bg-slate-950 rounded-xl ${
              gridSize === 3 ? 'grid-cols-3 grid-rows-3' : 'grid-cols-4 grid-rows-4'
            }`}
          >
            {tiles.map((num, idx) => {
              if (num === 0) {
                return <div key={idx} className="bg-slate-900/40 rounded-xl border border-dashed border-slate-800" />;
              }
              return (
                <button
                  key={idx}
                  onClick={() => handleTileClick(idx)}
                  className="bg-gradient-to-br from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black text-lg sm:text-2xl rounded-2xl shadow-lg shadow-amber-950/50 flex items-center justify-center border border-amber-400/40 active:scale-95 transition-all"
                >
                  {num}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats Bar */}
      {gameState === 'PLAYING' && (
        <div className="flex items-center justify-between w-full max-w-md text-xs font-mono bg-slate-900 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-300">MOVES: <strong className="text-amber-400">{moves}</strong></span>
          <span className="text-slate-300">TIME: <strong className="text-amber-400">{timeSeconds}s</strong></span>
          <button
            onClick={() => initializePuzzle(gridSize)}
            className="text-amber-400 hover:underline font-bold"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
};
