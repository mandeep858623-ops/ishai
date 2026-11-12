import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, ArrowLeft, Trophy, Rocket, Shield, Crosshair, Volume2, VolumeX } from 'lucide-react';
import { soundEngine } from '../../../utils/audio';

interface SpaceDefenderProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
  highScore: number;
}

export const SpaceDefender: React.FC<SpaceDefenderProps> = ({ onGameOver, onExit, highScore }) => {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [currentHighScore, setCurrentHighScore] = useState(highScore);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);

  const playerXRef = useRef<number>(180);
  const bulletsRef = useRef<{ x: number; y: number }[]>([]);
  const enemiesRef = useRef<{ id: number; x: number; y: number; speed: number; hp: number }[]>([]);
  const frameCountRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  scoreRef.current = score;

  const startGame = () => {
    setScore(0);
    setLives(3);
    playerXRef.current = 180;
    bulletsRef.current = [];
    enemiesRef.current = [];
    frameCountRef.current = 0;
    setGameState('PLAYING');
    if (soundEnabled) soundEngine.playClick();
  };

  const movePlayer = (dir: -1 | 1) => {
    if (gameState !== 'PLAYING') return;
    playerXRef.current = Math.max(30, Math.min(330, playerXRef.current + dir * 25));
  };

  const shootLaser = () => {
    if (gameState !== 'PLAYING') return;
    bulletsRef.current.push({
      x: playerXRef.current,
      y: 420,
    });
    if (soundEnabled) soundEngine.playClick();
  };

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') movePlayer(-1);
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') movePlayer(1);
      else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') shootLaser();
      else if (e.key === 'p' || e.key === 'P') {
        setGameState((prev) => (prev === 'PLAYING' ? 'PAUSED' : prev === 'PAUSED' ? 'PLAYING' : prev));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Main Canvas Loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const update = () => {
      frameCountRef.current += 1;

      // Spawn Enemy Targets
      if (frameCountRef.current % 35 === 0) {
        enemiesRef.current.push({
          id: Date.now() + Math.random(),
          x: Math.random() * (width - 40) + 20,
          y: -20,
          speed: Math.random() * 2 + 2,
          hp: 1,
        });
      }

      // Move Bullets
      for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
        bulletsRef.current[i].y -= 9;
        if (bulletsRef.current[i].y < 0) {
          bulletsRef.current.splice(i, 1);
        }
      }

      // Move Enemies & Collisions
      for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
        const enemy = enemiesRef.current[i];
        enemy.y += enemy.speed;

        // Check Laser Hits
        for (let j = bulletsRef.current.length - 1; j >= 0; j--) {
          const bullet = bulletsRef.current[j];
          const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
          if (dist < 20) {
            bulletsRef.current.splice(j, 1);
            enemiesRef.current.splice(i, 1);
            setScore((s) => {
              const next = s + 25;
              scoreRef.current = next;
              setCurrentHighScore((prevHigh) => Math.max(prevHigh, next));
              return next;
            });
            if (soundEnabled) soundEngine.playSuccess();
            break;
          }
        }

        // Enemy Reached Bottom or Hit Player
        if (enemy && enemy.y > height - 60) {
          enemiesRef.current.splice(i, 1);
          setLives((l) => {
            const nextL = l - 1;
            if (nextL <= 0) {
              if (soundEnabled) soundEngine.playAlertBeep();
              setGameState('GAMEOVER');
              onGameOver(scoreRef.current);
            } else {
              if (soundEnabled) soundEngine.playAlertBeep();
            }
            return nextL;
          });
        }
      }

      // Render Scene
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // Starfield background
      ctx.fillStyle = '#ffffff';
      for (let k = 0; k < 20; k++) {
        const starX = (k * 37 + frameCountRef.current * 2) % width;
        const starY = (k * 61 + frameCountRef.current * 3) % height;
        ctx.fillRect(starX, starY, 2, 2);
      }

      // Render Bullets
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      bulletsRef.current.forEach((b) => {
        ctx.fillRect(b.x - 2, b.y - 8, 4, 16);
      });
      ctx.shadowBlur = 0;

      // Render Enemies
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 12;
      enemiesRef.current.forEach((e) => {
        ctx.beginPath();
        ctx.arc(e.x, e.y, 14, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Render Player Spacecraft
      const px = playerXRef.current;
      const py = height - 40;
      ctx.fillStyle = '#3b82f6';
      ctx.shadowColor = '#60a5fa';
      ctx.shadowBlur = 15;

      ctx.beginPath();
      ctx.moveTo(px, py - 20);
      ctx.lineTo(px - 18, py + 15);
      ctx.lineTo(px + 18, py + 15);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      requestRef.current = requestAnimationFrame(update);
    };

    requestRef.current = requestAnimationFrame(update);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, soundEnabled, onGameOver]);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-950 text-white rounded-3xl border border-blue-500/30 max-w-2xl mx-auto shadow-2xl space-y-4">
      {/* Header */}
      <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Exit
        </button>

        <div className="flex items-center gap-2">
          <Rocket className="w-5 h-5 text-blue-400" />
          <h2 className="font-extrabold text-base tracking-wider text-blue-400">
            SPACE DEFENDER
          </h2>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-400" /> : <VolumeX className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      {/* Game Canvas Container */}
      <div className="relative w-full max-w-md aspect-[3/4] bg-slate-950 rounded-2xl overflow-hidden border border-blue-500/30 flex flex-col items-center justify-center shadow-inner">
        {gameState === 'START' && (
          <div className="p-6 text-center space-y-4 z-10">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/40 animate-pulse">
              <Rocket className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white">SPACE DEFENDER</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Defend Earth orbit! Shoot down alien ships and asteroids before they bypass your perimeter.
            </p>
            <button
              onClick={startGame}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 flex items-center gap-2 mx-auto transition-all"
            >
              <Play className="w-4 h-4 fill-current" /> LAUNCH DEFENDER
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-slate-950/95 z-20 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="text-rose-500 font-extrabold text-xl">PERIMETER BREACHED</div>
            <div className="space-y-1">
              <p className="text-xs text-slate-400">FINAL SCORE</p>
              <p className="text-3xl font-black text-blue-400">{score}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              <Trophy className="w-3.5 h-3.5" /> High Score: {currentHighScore}
            </div>
            <button
              onClick={startGame}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" /> RETRY DEFENSE
            </button>
          </div>
        )}

        {/* Live Canvas */}
        <canvas ref={canvasRef} width={360} height={480} className="w-full h-full object-cover" />

        {/* Live Overlay */}
        {gameState === 'PLAYING' && (
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-xs font-mono font-bold z-10 pointer-events-none">
            <div className="bg-slate-950/80 border border-blue-500/40 text-blue-300 px-3 py-1 rounded-lg">
              SCORE: {score}
            </div>
            <div className="flex items-center gap-1 bg-slate-950/80 border border-rose-500/40 text-rose-400 px-3 py-1 rounded-lg">
              <span>LIVES:</span>
              {Array.from({ length: lives }).map((_, i) => (
                <span key={i}>❤️</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* On-Screen Controls */}
      {gameState === 'PLAYING' && (
        <div className="w-full max-w-md grid grid-cols-3 gap-2 pt-2">
          <button
            onClick={() => movePlayer(-1)}
            className="py-3 bg-slate-900 border border-blue-500/30 rounded-xl text-blue-300 font-extrabold active:bg-blue-600 active:text-white"
          >
            ◀ LEFT
          </button>
          <button
            onClick={shootLaser}
            className="py-3 bg-blue-600 border border-blue-400 rounded-xl text-white font-extrabold active:scale-95 flex items-center justify-center gap-1"
          >
            <Crosshair className="w-4 h-4" /> SHOOT
          </button>
          <button
            onClick={() => movePlayer(1)}
            className="py-3 bg-slate-900 border border-blue-500/30 rounded-xl text-blue-300 font-extrabold active:bg-blue-600 active:text-white"
          >
            RIGHT ▶
          </button>
        </div>
      )}
    </div>
  );
};
