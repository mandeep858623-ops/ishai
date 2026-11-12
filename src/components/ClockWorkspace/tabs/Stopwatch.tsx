import React, { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw, Flag, List } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const StopwatchTab: React.FC = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = performance.now() - time;
      const update = () => {
        setTime(performance.now() - startTimeRef.current);
        animationFrameRef.current = requestAnimationFrame(update);
      };
      animationFrameRef.current = requestAnimationFrame(update);
    } else {
      cancelAnimationFrame(animationFrameRef.current);
    }
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isRunning]);

  const toggleStopwatch = () => setIsRunning(!isRunning);

  const resetStopwatch = () => {
    setIsRunning(false);
    setTime(0);
    setLaps([]);
  };

  const recordLap = () => {
    if (isRunning) {
      setLaps([time, ...laps]);
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);
    
    return {
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0'),
      ms: centiseconds.toString().padStart(2, '0')
    };
  };

  const { minutes, seconds, ms } = formatTime(time);

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-12 py-8">
      {/* Time Display */}
      <div className="relative group">
        <div className="absolute inset-0 bg-emerald-500/5 blur-[100px] rounded-full group-hover:bg-emerald-500/10 transition-all" />
        <div className="relative flex items-baseline gap-2 text-7xl sm:text-9xl font-mono font-black text-emerald-100 tracking-tighter drop-shadow-[0_0_35px_rgba(16,185,129,0.2)]">
          <span>{minutes}</span>
          <span className="text-emerald-900">:</span>
          <span>{seconds}</span>
          <span className="text-3xl sm:text-5xl text-emerald-600 ml-2">{ms}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-8">
        <button 
          onClick={resetStopwatch}
          className="p-6 rounded-full bg-black/40 border border-emerald-500/20 text-emerald-800 hover:text-emerald-400 hover:border-emerald-500/50 transition-all hover:scale-110"
        >
          <RotateCcw className="w-8 h-8" />
        </button>

        <button 
          onClick={toggleStopwatch}
          className={`p-10 rounded-full transition-all hover:scale-110 shadow-2xl ${
            isRunning 
              ? 'bg-red-500/20 border-red-500/40 text-red-400' 
              : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.3)]'
          } border`}
        >
          {isRunning ? <Pause className="w-12 h-12 fill-current" /> : <Play className="w-12 h-12 fill-current ml-2" />}
        </button>

        <button 
          onClick={recordLap}
          disabled={!isRunning}
          className="p-6 rounded-full bg-black/40 border border-emerald-500/20 text-emerald-800 hover:text-emerald-400 hover:border-emerald-500/50 transition-all hover:scale-110 disabled:opacity-20 disabled:scale-100"
        >
          <Flag className="w-8 h-8" />
        </button>
      </div>

      {/* Laps List */}
      <div className="w-full max-w-md flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 border-b border-emerald-500/10 text-[10px] font-black text-emerald-700 uppercase tracking-widest">
          <span className="flex items-center gap-2"><List className="w-3 h-3" /> Lap History</span>
          <span>Time</span>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
          <AnimatePresence initial={false}>
            {laps.map((lapTime, idx) => {
              const f = formatTime(lapTime);
              return (
                <motion.div 
                  key={laps.length - idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between px-4 py-3 bg-emerald-950/5 border border-emerald-500/5 rounded-xl hover:border-emerald-500/20 transition-colors"
                >
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-tighter">Lap {laps.length - idx}</span>
                  <span className="font-mono text-sm text-emerald-300">
                    {f.minutes}:{f.seconds}.<span className="text-[10px] text-emerald-600">{f.ms}</span>
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {laps.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-10 text-[10px] font-black uppercase tracking-[0.3em]">
              Precision Timing Ready
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
