import React, { useState, useRef } from 'react';
import { Play, RotateCcw, ArrowLeft, Trophy, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { soundEngine } from '../../../utils/audio';

interface ReactionRushProps {
  onGameOver: (score: number) => void;
  onExit: () => void;
  highScore: number;
}

export const ReactionRush: React.FC<ReactionRushProps> = ({ onGameOver, onExit, highScore }) => {
  const [state, setState] = useState<'IDLE' | 'WAITING' | 'CLICK_NOW' | 'RESULT' | 'TOO_EARLY'>('IDLE');
  const [reactionMs, setReactionMs] = useState<number | null>(null);
  const [bestTimeMs, setBestTimeMs] = useState<number | null>(highScore > 0 ? highScore : null);
  const [attempts, setAttempts] = useState<number[]>([]);

  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  const startTest = () => {
    soundEngine.playClick();
    setState('WAITING');
    setReactionMs(null);

    const randomDelay = Math.floor(Math.random() * 2500) + 1500;
    timerRef.current = window.setTimeout(() => {
      startTimeRef.current = performance.now();
      setState('CLICK_NOW');
      soundEngine.playAlertBeep();
    }, randomDelay);
  };

  const handleBoxClick = () => {
    if (state === 'WAITING') {
      if (timerRef.current) clearTimeout(timerRef.current);
      setState('TOO_EARLY');
      soundEngine.playAlertBeep();
    } else if (state === 'CLICK_NOW') {
      const elapsed = Math.round(performance.now() - startTimeRef.current);
      setReactionMs(elapsed);
      setState('RESULT');
      soundEngine.playSuccess();

      if (!bestTimeMs || elapsed < bestTimeMs) {
        setBestTimeMs(elapsed);
      }

      setAttempts((prev) => [elapsed, ...prev]);

      // Calculate score based on reaction time (faster = higher)
      const scoreGained = Math.max(10, 500 - elapsed);
      onGameOver(scoreGained);
    }
  };

  const getGrade = (ms: number) => {
    if (ms < 180) return { title: 'GODLIKE REFLEXES', color: 'text-purple-400' };
    if (ms < 220) return { title: 'ELITE GAMER', color: 'text-cyan-400' };
    if (ms < 280) return { title: 'FAST HUMAN', color: 'text-emerald-400' };
    if (ms < 350) return { title: 'AVERAGE LATENCY', color: 'text-amber-400' };
    return { title: 'LAGGING REFLEXES', color: 'text-rose-400' };
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-950 text-white rounded-3xl border border-rose-500/30 max-w-2xl mx-auto shadow-2xl space-y-4">
      {/* Header */}
      <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3">
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Exit
        </button>

        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-rose-400" />
          <h2 className="font-extrabold text-base tracking-wider text-rose-400">
            REACTION RUSH
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="bg-rose-950 border border-rose-800 text-rose-300 px-3 py-1 rounded-lg flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" /> BEST: {bestTimeMs ? `${bestTimeMs}ms` : 'None'}
          </span>
        </div>
      </div>

      {/* Main Signal Area */}
      <div
        onClick={state === 'WAITING' || state === 'CLICK_NOW' ? handleBoxClick : undefined}
        className={`relative w-full max-w-md aspect-square rounded-2xl p-6 border flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 select-none shadow-2xl ${
          state === 'IDLE'
            ? 'bg-slate-900 border-rose-500/30'
            : state === 'WAITING'
            ? 'bg-amber-950/80 border-amber-500 text-amber-200'
            : state === 'CLICK_NOW'
            ? 'bg-emerald-600 border-white text-white animate-pulse'
            : state === 'TOO_EARLY'
            ? 'bg-rose-950 border-rose-600 text-rose-200'
            : 'bg-slate-900 border-rose-500/40'
        }`}
      >
        {state === 'IDLE' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-600/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/40 animate-pulse">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white">REACTION RUSH</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Tap immediately when the screen turns glowing GREEN! Avoid false triggers.
            </p>
            <button
              onClick={startTest}
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm shadow-lg shadow-rose-600/30 flex items-center gap-2 mx-auto transition-all"
            >
              <Play className="w-4 h-4 fill-current" /> START TEST
            </button>
          </div>
        )}

        {state === 'WAITING' && (
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-full border-4 border-amber-400 border-t-transparent animate-spin mx-auto" />
            <h3 className="text-xl font-bold text-amber-300">WAIT FOR GREEN...</h3>
            <p className="text-xs text-amber-400/80">Keep fingers ready on screen!</p>
          </div>
        )}

        {state === 'CLICK_NOW' && (
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-white tracking-widest animate-bounce">
              TAP NOW!
            </h2>
          </div>
        )}

        {state === 'TOO_EARLY' && (
          <div className="space-y-4">
            <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
            <h3 className="text-xl font-bold text-rose-300">TOO EARLY!</h3>
            <p className="text-xs text-rose-400">You tapped before the green signal.</p>
            <button
              onClick={startTest}
              className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs"
            >
              TRY AGAIN
            </button>
          </div>
        )}

        {state === 'RESULT' && reactionMs && (
          <div className="space-y-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <div>
              <p className="text-xs text-slate-400">REACTION TIME</p>
              <p className="text-4xl font-black text-emerald-400">{reactionMs} ms</p>
            </div>
            <div className={`text-sm font-extrabold ${getGrade(reactionMs).color}`}>
              {getGrade(reactionMs).title}
            </div>
            <button
              onClick={startTest}
              className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 mx-auto shadow-lg shadow-rose-600/30"
            >
              <RotateCcw className="w-4 h-4" /> TEST AGAIN
            </button>
          </div>
        )}
      </div>

      {/* History Log */}
      {attempts.length > 0 && (
        <div className="w-full max-w-md bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs font-mono">
          <span className="text-slate-400 font-bold block mb-1">Recent Attempts:</span>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {attempts.slice(0, 5).map((ms, i) => (
              <span key={i} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-rose-300">
                #{attempts.length - i}: {ms}ms
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
