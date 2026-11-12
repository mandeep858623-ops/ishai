import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Pause, Volume2, VolumeX, ArrowLeft, Trophy, Zap, Shield, Sparkles } from 'lucide-react';
import { soundEngine } from '../../../utils/audio';

interface NeonDashProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
  highScore: number;
}

export const NeonDash: React.FC<NeonDashProps> = ({ onGameOver, onExit, highScore }) => {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [currentHighScore, setCurrentHighScore] = useState(highScore);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);

  // Player position (3 lanes: 0 = left, 1 = center, 2 = right)
  const playerLaneRef = useRef<number>(1);
  const isJumpingRef = useRef<boolean>(false);
  const jumpYRef = useRef<number>(0);
  const jumpVelocityRef = useRef<number>(0);

  // Game World
  const obstaclesRef = useRef<{ id: number; lane: number; y: number; type: 'barrier' | 'gem' | 'shield' }[]>([]);
  const speedRef = useRef<number>(5);
  const frameCountRef = useRef<number>(0);
  const hasShieldRef = useRef<boolean>(false);
  const scoreRef = useRef<number>(0);
  scoreRef.current = score;

  const startGame = () => {
    setScore(0);
    playerLaneRef.current = 1;
    isJumpingRef.current = false;
    jumpYRef.current = 0;
    obstaclesRef.current = [];
    speedRef.current = 5;
    frameCountRef.current = 0;
    hasShieldRef.current = false;
    setGameState('PLAYING');
    if (soundEnabled) soundEngine.playClick();
  };

  const moveLane = (dir: -1 | 1) => {
    if (gameState !== 'PLAYING') return;
    const newLane = Math.max(0, Math.min(2, playerLaneRef.current + dir));
    if (newLane !== playerLaneRef.current) {
      playerLaneRef.current = newLane;
      if (soundEnabled) soundEngine.playClick();
    }
  };

  const jump = () => {
    if (gameState !== 'PLAYING' || isJumpingRef.current) return;
    isJumpingRef.current = true;
    jumpVelocityRef.current = -12;
    if (soundEnabled) soundEngine.playSuccess();
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        moveLane(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        moveLane(1);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        jump();
      } else if (e.key === 'p' || e.key === 'P') {
        setGameState((prev) => (prev === 'PLAYING' ? 'PAUSED' : prev === 'PAUSED' ? 'PLAYING' : prev));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Main Canvas Game Loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const laneWidth = width / 3;

    const update = () => {
      frameCountRef.current += 1;
      
      // Speed increases gradually
      if (frameCountRef.current % 180 === 0) {
        speedRef.current += 0.5;
      }

      // Jump Physics
      if (isJumpingRef.current) {
        jumpYRef.current += jumpVelocityRef.current;
        jumpVelocityRef.current += 0.8; // Gravity
        if (jumpYRef.current >= 0) {
          jumpYRef.current = 0;
          isJumpingRef.current = false;
        }
      }

      // Spawn obstacles / gems
      if (frameCountRef.current % 30 === 0) {
        const lane = Math.floor(Math.random() * 3);
        const rand = Math.random();
        let type: 'barrier' | 'gem' | 'shield' = 'barrier';
        if (rand > 0.8) type = 'gem';
        else if (rand > 0.7) type = 'shield';

        obstaclesRef.current.push({
          id: Date.now() + Math.random(),
          lane,
          y: -40,
          type,
        });
      }

      // Move obstacles
      obstaclesRef.current.forEach((obs) => {
        obs.y += speedRef.current;
      });

      // Collision Check
      const playerY = height - 80 + jumpYRef.current;
      const playerLane = playerLaneRef.current;

      for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
        const obs = obstaclesRef.current[i];

        if (obs.y > height) {
          obstaclesRef.current.splice(i, 1);
          setScore((s) => {
            const next = s + 10;
            if (next > currentHighScore) setCurrentHighScore(next);
            return next;
          });
        } else if (
          obs.lane === playerLane &&
          obs.y >= playerY - 30 &&
          obs.y <= playerY + 30
        ) {
          if (obs.type === 'gem') {
            setScore((s) => s + 50);
            obstaclesRef.current.splice(i, 1);
            if (soundEnabled) soundEngine.playSuccess();
          } else if (obs.type === 'shield') {
            hasShieldRef.current = true;
            obstaclesRef.current.splice(i, 1);
            if (soundEnabled) soundEngine.playSuccess();
          } else if (obs.type === 'barrier' && !isJumpingRef.current) {
            if (hasShieldRef.current) {
              hasShieldRef.current = false;
              obstaclesRef.current.splice(i, 1);
              if (soundEnabled) soundEngine.playAlertBeep();
            } else {
              // Game Over!
              if (soundEnabled) soundEngine.playAlertBeep();
              setGameState('GAMEOVER');
              onGameOver(scoreRef.current);
              return;
            }
          }
        }
      }

      // Render Scene
      ctx.clearRect(0, 0, width, height);

      // Background Tunnel Grid
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;

      // Lane dividers
      ctx.beginPath();
      ctx.moveTo(laneWidth, 0);
      ctx.lineTo(laneWidth, height);
      ctx.moveTo(laneWidth * 2, 0);
      ctx.lineTo(laneWidth * 2, height);
      ctx.stroke();

      // Moving Grid Lines
      const gridOffset = (frameCountRef.current * speedRef.current) % 40;
      for (let y = gridOffset; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Render Obstacles
      obstaclesRef.current.forEach((obs) => {
        const obsX = obs.lane * laneWidth + laneWidth / 2;
        if (obs.type === 'barrier') {
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#f43f5e';
          ctx.shadowBlur = 12;
          ctx.fillRect(obsX - 25, obs.y - 15, 50, 30);
          ctx.shadowBlur = 0;
        } else if (obs.type === 'gem') {
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(obsX, obs.y, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (obs.type === 'shield') {
          ctx.fillStyle = '#a855f7';
          ctx.shadowColor = '#c084fc';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(obsX, obs.y, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Render Player (Neon Ship)
      const playerX = playerLane * laneWidth + laneWidth / 2;
      ctx.fillStyle = hasShieldRef.current ? '#c084fc' : '#a855f7';
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 20;

      ctx.beginPath();
      ctx.moveTo(playerX, playerY - 20);
      ctx.lineTo(playerX - 20, playerY + 20);
      ctx.lineTo(playerX + 20, playerY + 20);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Shield Aura
      if (hasShieldRef.current) {
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(playerX, playerY, 28, 0, Math.PI * 2);
        ctx.stroke();
      }

      requestRef.current = requestAnimationFrame(update);
    };

    requestRef.current = requestAnimationFrame(update);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, soundEnabled, currentHighScore]);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-950 text-white rounded-3xl border border-purple-500/30 max-w-2xl mx-auto shadow-2xl space-y-4">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Exit
        </button>

        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-400" />
          <h2 className="font-extrabold text-base tracking-wider bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            NEON DASH
          </h2>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-purple-400" /> : <VolumeX className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      {/* Main Canvas & HUD Container */}
      <div className="relative w-full max-w-md aspect-[3/4] bg-slate-900 rounded-2xl overflow-hidden border border-purple-500/30 shadow-inner flex flex-col items-center justify-center">
        {gameState === 'START' && (
          <div className="p-6 text-center space-y-4 z-10">
            <div className="w-16 h-16 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/40 animate-pulse">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white">NEON DASH</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Dodge red barriers, collect blue energy gems (+50 pts) and purple shield orbs! Survive as speed accelerates.
            </p>
            <div className="bg-slate-950/80 p-3 rounded-xl text-[11px] text-slate-300 border border-slate-800 space-y-1">
              <p>🎮 <strong>Controls:</strong> Left / Right Arrow Keys to switch lanes.</p>
              <p>🚀 <strong>Jump:</strong> Up Arrow or Spacebar.</p>
            </div>
            <button
              onClick={startGame}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-sm shadow-lg shadow-purple-600/30 flex items-center gap-2 mx-auto transition-all"
            >
              <Play className="w-4 h-4 fill-current" /> PLAY NOW
            </button>
          </div>
        )}

        {gameState === 'PAUSED' && (
          <div className="absolute inset-0 bg-slate-950/90 z-20 flex flex-col items-center justify-center space-y-4">
            <h3 className="text-xl font-bold text-amber-400">GAME PAUSED</h3>
            <button
              onClick={() => setGameState('PLAYING')}
              className="px-5 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold"
            >
              RESUME
            </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-slate-950/95 z-20 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="text-rose-500 font-extrabold text-2xl tracking-wider">COLLISION DETECTED</div>
            <div className="space-y-1">
              <p className="text-xs text-slate-400">FINAL SCORE</p>
              <p className="text-3xl font-black text-purple-400">{score}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              <Trophy className="w-3.5 h-3.5" /> Best: {currentHighScore}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={startGame}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" /> RESTART
              </button>
              <button
                onClick={onExit}
                className="px-5 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                EXIT
              </button>
            </div>
          </div>
        )}

        {/* Live Canvas */}
        <canvas
          ref={canvasRef}
          width={360}
          height={480}
          className="w-full h-full object-cover"
        />

        {/* HUD Score Overlay */}
        {gameState === 'PLAYING' && (
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-xs font-mono font-bold z-10 pointer-events-none">
            <div className="bg-slate-950/80 border border-purple-500/40 text-purple-300 px-3 py-1 rounded-lg">
              SCORE: {score}
            </div>
            <div className="bg-slate-950/80 border border-amber-500/40 text-amber-300 px-3 py-1 rounded-lg flex items-center gap-1">
              <Trophy className="w-3 h-3" /> {currentHighScore}
            </div>
          </div>
        )}
      </div>

      {/* On-Screen Touch Controls */}
      {gameState === 'PLAYING' && (
        <div className="w-full max-w-md grid grid-cols-3 gap-2 pt-2">
          <button
            onClick={() => moveLane(-1)}
            className="py-3 bg-slate-900 border border-purple-500/30 rounded-xl text-purple-300 font-extrabold active:bg-purple-600 active:text-white"
          >
            ◀ LEFT
          </button>
          <button
            onClick={jump}
            className="py-3 bg-purple-600 border border-purple-400 rounded-xl text-white font-extrabold active:scale-95"
          >
            ▲ JUMP
          </button>
          <button
            onClick={() => moveLane(1)}
            className="py-3 bg-slate-900 border border-purple-500/30 rounded-xl text-purple-300 font-extrabold active:bg-purple-600 active:text-white"
          >
            RIGHT ▶
          </button>
        </div>
      )}
    </div>
  );
};
