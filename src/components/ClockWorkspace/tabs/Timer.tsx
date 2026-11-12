import React, { useState, useEffect, useCallback } from 'react';
import { Hourglass, Play, Pause, RotateCcw, Volume2, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundEngine } from '../../../utils/audio';

export const TimerTab: React.FC = () => {
  const [duration, setDuration] = useState(60); // In seconds
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  
  const presets = [
    { label: '1m', value: 60 },
    { label: '5m', value: 300 },
    { label: '10m', value: 600 },
    { label: '15m', value: 900 },
    { label: '25m', value: 1500 },
    { label: '30m', value: 1800 },
    { label: '45m', value: 2700 },
    { label: '60m', value: 3600 },
  ];

  useEffect(() => {
    let interval: any;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      soundEngine.playSuccess();
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Timer Finished', { body: 'Your countdown has completed.' });
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const toggleTimer = () => {
    if (timeLeft === 0) setTimeLeft(duration);
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(duration);
  };

  const adjustDuration = (amount: number) => {
    const newDuration = Math.max(10, duration + amount);
    setDuration(newDuration);
    if (!isRunning) setTimeLeft(newDuration);
  };

  const setPreset = (value: number) => {
    setIsRunning(false);
    setDuration(value);
    setTimeLeft(value);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return {
      h: h.toString().padStart(2, '0'),
      m: m.toString().padStart(2, '0'),
      s: s.toString().padStart(2, '0')
    };
  };

  const { h, m, s } = formatTime(timeLeft);
  const progress = (timeLeft / duration) * 100;

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-12 py-8">
      {/* Circular Progress & Time */}
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle 
            cx="50%" cy="50%" r="48%" 
            className="stroke-emerald-950 fill-none" 
            strokeWidth="4" 
          />
          <motion.circle 
            cx="50%" cy="50%" r="48%" 
            className="stroke-emerald-500 fill-none" 
            strokeWidth="4" 
            strokeDasharray="100 100"
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: 100 - progress }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </svg>

        <div className="flex flex-col items-center">
          <div className="text-5xl sm:text-7xl font-mono font-black text-emerald-100 tracking-tighter">
            {h !== '00' && <span>{h}:</span>}{m}:{s}
          </div>
          <div className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.4em] mt-2">
            Remaining Time
          </div>
        </div>

        {/* Adjust Controls (only when not running) */}
        {!isRunning && (
          <>
            <button 
              onClick={() => adjustDuration(60)}
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 p-2 text-emerald-900 hover:text-emerald-500 transition-colors"
            >
              <Plus className="w-6 h-6" />
            </button>
            <button 
              onClick={() => adjustDuration(-60)}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-6 p-2 text-emerald-900 hover:text-emerald-500 transition-colors"
            >
              <Minus className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-8">
        <button 
          onClick={resetTimer}
          className="p-6 rounded-full bg-black/40 border border-emerald-500/20 text-emerald-800 hover:text-emerald-400 transition-all hover:scale-110"
        >
          <RotateCcw className="w-8 h-8" />
        </button>

        <button 
          onClick={toggleTimer}
          className={`p-10 rounded-full transition-all hover:scale-110 shadow-2xl ${
            isRunning 
              ? 'bg-red-500/20 border-red-500/40 text-red-400' 
              : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.3)]'
          } border`}
        >
          {isRunning ? <Pause className="w-12 h-12 fill-current" /> : <Play className="w-12 h-12 fill-current ml-2" />}
        </button>

        <button className="p-6 rounded-full bg-black/40 border border-emerald-500/20 text-emerald-800 hover:text-emerald-400 transition-all">
          <Volume2 className="w-8 h-8" />
        </button>
      </div>

      {/* Presets */}
      <div className="w-full max-w-lg grid grid-cols-4 gap-2">
        {presets.map(p => (
          <button 
            key={p.value}
            onClick={() => setPreset(p.value)}
            className={`py-3 text-[10px] font-black uppercase rounded-xl transition-all border ${
              duration === p.value 
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                : 'bg-black/40 border-emerald-500/5 text-emerald-900 hover:border-emerald-500/20 hover:text-emerald-600'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};
