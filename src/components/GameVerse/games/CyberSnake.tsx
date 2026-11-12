import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Pause, Volume2, VolumeX, ArrowLeft, Trophy, Sparkles } from 'lucide-react';
import { soundEngine } from '../../../utils/audio';

interface CyberSnakeProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
  highScore: number;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export const CyberSnake: React.FC<CyberSnakeProps> = ({ onGameOver, onExit, highScore }) => {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [currentHighScore, setCurrentHighScore] = useState(highScore);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const GRID_SIZE = 20;
  const [snake, setSnake] = useState<{ x: number; y: number }[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
  ]);
  const [food, setFood] = useState<{ x: number; y: number; isGold?: boolean }>({ x: 5, y: 5 });
  const directionRef = useRef<Direction>('UP');
  const lastDirectionRef = useRef<Direction>('UP');

  const generateFood = (currentSnake: { x: number; y: number }[]) => {
    let newX = Math.floor(Math.random() * GRID_SIZE);
    let newY = Math.floor(Math.random() * GRID_SIZE);

    while (currentSnake.some((s) => s.x === newX && s.y === newY)) {
      newX = Math.floor(Math.random() * GRID_SIZE);
      newY = Math.floor(Math.random() * GRID_SIZE);
    }

    return { x: newX, y: newY, isGold: Math.random() > 0.75 };
  };

  const startGame = () => {
    const initialSnake = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    directionRef.current = 'UP';
    lastDirectionRef.current = 'UP';
    setScore(0);
    setGameState('PLAYING');
    if (soundEnabled) soundEngine.playClick();
  };

  const changeDirection = (newDir: Direction) => {
    const last = lastDirectionRef.current;
    if (newDir === 'UP' && last === 'DOWN') return;
    if (newDir === 'DOWN' && last === 'UP') return;
    if (newDir === 'LEFT' && last === 'RIGHT') return;
    if (newDir === 'RIGHT' && last === 'LEFT') return;

    directionRef.current = newDir;
  };

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') changeDirection('UP');
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') changeDirection('DOWN');
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') changeDirection('LEFT');
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') changeDirection('RIGHT');
      else if (e.key === 'p' || e.key === 'P') {
        setGameState((prev) => (prev === 'PLAYING' ? 'PAUSED' : prev === 'PAUSED' ? 'PLAYING' : prev));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Main Game Loop Interval
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const speed = Math.max(70, 150 - Math.floor(score / 50) * 8);

    const interval = setInterval(() => {
      setSnake((prevSnake) => {
        const head = { ...prevSnake[0] };
        const dir = directionRef.current;
        lastDirectionRef.current = dir;

        if (dir === 'UP') head.y -= 1;
        else if (dir === 'DOWN') head.y += 1;
        else if (dir === 'LEFT') head.x -= 1;
        else if (dir === 'RIGHT') head.x += 1;

        // Collision with Wall
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          if (soundEnabled) soundEngine.playAlertBeep();
          setGameState('GAMEOVER');
          onGameOver(score);
          return prevSnake;
        }

        // Collision with Self
        if (prevSnake.some((segment) => segment.x === head.x && segment.y === head.y)) {
          if (soundEnabled) soundEngine.playAlertBeep();
          setGameState('GAMEOVER');
          onGameOver(score);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Eat Food
        if (head.x === food.x && head.y === food.y) {
          const points = food.isGold ? 30 : 10;
          setScore((s) => {
            const next = s + points;
            if (next > currentHighScore) setCurrentHighScore(next);
            return next;
          });
          setFood(generateFood(newSnake));
          if (soundEnabled) soundEngine.playSuccess();
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [gameState, food, score]);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-950 text-white rounded-3xl border border-emerald-500/30 max-w-2xl mx-auto shadow-2xl space-y-4">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Exit
        </button>

        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <h2 className="font-extrabold text-base tracking-wider text-emerald-400">
            CYBER SNAKE
          </h2>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      {/* Main Board */}
      <div className="relative w-full max-w-md aspect-square bg-slate-900 rounded-2xl overflow-hidden border border-emerald-500/30 p-2 shadow-inner flex flex-col items-center justify-center">
        {gameState === 'START' && (
          <div className="p-6 text-center space-y-4 z-10">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40 animate-pulse">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white">CYBER SNAKE</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Guide the cyber snake to collect energy nodes. Avoid wall impact and self-collision!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 flex items-center gap-2 mx-auto transition-all"
            >
              <Play className="w-4 h-4 fill-current" /> START GAME
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-slate-950/95 z-20 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="text-rose-500 font-extrabold text-xl">GRID OVERLOAD</div>
            <div className="space-y-1">
              <p className="text-xs text-slate-400">FINAL SCORE</p>
              <p className="text-3xl font-black text-emerald-400">{score}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              <Trophy className="w-3.5 h-3.5" /> High Score: {currentHighScore}
            </div>
            <button
              onClick={startGame}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" /> PLAY AGAIN
            </button>
          </div>
        )}

        {/* 20x20 Grid Display */}
        <div className="w-full h-full grid grid-cols-20 grid-rows-20 gap-0.5 bg-slate-950 p-1 rounded-xl">
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
            const x = idx % GRID_SIZE;
            const y = Math.floor(idx / GRID_SIZE);

            const isHead = snake[0].x === x && snake[0].y === y;
            const isBody = snake.slice(1).some((s) => s.x === x && s.y === y);
            const isFoodItem = food.x === x && food.y === y;

            return (
              <div
                key={idx}
                className={`rounded-sm transition-all ${
                  isHead
                    ? 'bg-emerald-400 shadow-md shadow-emerald-400'
                    : isBody
                    ? 'bg-emerald-600/80'
                    : isFoodItem
                    ? food.isGold
                      ? 'bg-amber-400 animate-ping'
                      : 'bg-cyan-400 animate-pulse'
                    : 'bg-slate-900/60'
                }`}
              />
            );
          })}
        </div>

        {/* Score overlay */}
        {gameState === 'PLAYING' && (
          <div className="absolute top-4 left-4 right-4 flex justify-between text-xs font-mono font-bold z-10">
            <span className="bg-slate-950/80 border border-emerald-500/40 text-emerald-300 px-3 py-1 rounded-lg">
              SCORE: {score}
            </span>
            <span className="bg-slate-950/80 border border-amber-500/40 text-amber-300 px-3 py-1 rounded-lg flex items-center gap-1">
              <Trophy className="w-3 h-3" /> BEST: {currentHighScore}
            </span>
          </div>
        )}
      </div>

      {/* On-Screen Touch Controls D-Pad */}
      {gameState === 'PLAYING' && (
        <div className="flex flex-col items-center gap-1 pt-1">
          <button
            onClick={() => changeDirection('UP')}
            className="w-12 h-10 bg-slate-900 border border-emerald-500/40 rounded-xl text-emerald-300 font-bold active:bg-emerald-600 active:text-white"
          >
            ▲
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => changeDirection('LEFT')}
              className="w-12 h-10 bg-slate-900 border border-emerald-500/40 rounded-xl text-emerald-300 font-bold active:bg-emerald-600 active:text-white"
            >
              ◀
            </button>
            <button
              onClick={() => changeDirection('DOWN')}
              className="w-12 h-10 bg-slate-900 border border-emerald-500/40 rounded-xl text-emerald-300 font-bold active:bg-emerald-600 active:text-white"
            >
              ▼
            </button>
            <button
              onClick={() => changeDirection('RIGHT')}
              className="w-12 h-10 bg-slate-900 border border-emerald-500/40 rounded-xl text-emerald-300 font-bold active:bg-emerald-600 active:text-white"
            >
              ▶
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
