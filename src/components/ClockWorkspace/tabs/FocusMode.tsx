import React, { useState, useEffect } from 'react';
import { Target, Play, Pause, RotateCcw, Coffee, Brain, Trophy, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundEngine } from '../../../utils/audio';
import { ClockService } from '../../../services/ClockService';

interface FocusModeTabProps {
  currentUser: any;
  onLog: (text: string, tag?: string) => void;
}

export const FocusModeTab: React.FC<FocusModeTabProps> = ({ currentUser, onLog }) => {
  const [mode, setMode] = useState<'FOCUS' | 'BREAK'>('FOCUS');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [startTime, setStartTime] = useState<string | null>(null);

  useEffect(() => {
    let interval: any;
    if (isRunning && timeLeft > 0) {
      if (!startTime) setStartTime(new Date().toISOString());
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      soundEngine.playSuccess();
      
      const sessionDuration = mode === 'FOCUS' ? 25 : 5;
      if (currentUser?.uid) {
        ClockService.addTimeRecord(currentUser.uid, {
          category: mode === 'FOCUS' ? 'Deep Work' : 'Break',
          duration: sessionDuration,
          type: mode === 'FOCUS' ? 'focus' : 'break',
          start_time: startTime || new Date().toISOString(),
          end_time: new Date().toISOString()
        });
      }
      setStartTime(null);

      if (mode === 'FOCUS') {
        setSessionsCompleted(prev => prev + 1);
        onLog('Focus session completed. Time for a break.', 'SUCCESS');
        setMode('BREAK');
        setTimeLeft(5 * 60);
      } else {
        onLog('Break finished. Back to focus mode.', 'INFO');
        setMode('FOCUS');
        setTimeLeft(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, currentUser, startTime]);


  const toggleSession = () => setIsRunning(!isRunning);

  const resetSession = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'FOCUS' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-12">
      <div className="flex items-center gap-4 p-1 bg-emerald-950/20 rounded-full border border-emerald-500/10">
        <button 
          onClick={() => { setMode('FOCUS'); setTimeLeft(25 * 60); setIsRunning(false); }}
          className={`px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all ${mode === 'FOCUS' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-emerald-700 hover:text-emerald-400'}`}
        >
          Focus Session
        </button>
        <button 
          onClick={() => { setMode('BREAK'); setTimeLeft(5 * 60); setIsRunning(false); }}
          className={`px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all ${mode === 'BREAK' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-emerald-700 hover:text-emerald-400'}`}
        >
          Short Break
        </button>
      </div>

      <div className="relative flex flex-col items-center">
        <motion.div 
          animate={{ scale: isRunning ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 4, repeat: Infinity }}
          className={`text-[120px] sm:text-[180px] font-black tracking-tighter leading-none ${mode === 'FOCUS' ? 'text-emerald-100' : 'text-blue-100'} drop-shadow-[0_0_50px_rgba(16,185,129,0.2)]`}
        >
          {formatTime(timeLeft)}
        </motion.div>
        <div className="text-sm font-black text-emerald-800 uppercase tracking-[0.5em] mt-4">
          {mode === 'FOCUS' ? 'Deep Work In Progress' : 'System Cooling Down'}
        </div>
      </div>

      <div className="flex items-center gap-8">
        <button 
          onClick={resetSession}
          className="p-6 rounded-full bg-black/40 border border-emerald-500/20 text-emerald-800 hover:text-emerald-400 transition-all hover:scale-110"
        >
          <RotateCcw className="w-8 h-8" />
        </button>

        <button 
          onClick={toggleSession}
          className={`p-12 rounded-full transition-all hover:scale-110 shadow-2xl ${
            isRunning 
              ? 'bg-red-500/20 border-red-500/40 text-red-400' 
              : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.3)]'
          } border`}
        >
          {isRunning ? <Pause className="w-16 h-16 fill-current" /> : <Play className="w-16 h-16 fill-current ml-3" />}
        </button>

        <button className="p-6 rounded-full bg-black/40 border border-emerald-500/20 text-emerald-800 hover:text-emerald-400 transition-all">
          <History className="w-8 h-8" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-8 w-full max-w-2xl">
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 flex flex-col items-center text-center">
          <Trophy className="w-6 h-6 text-emerald-500 mb-2" />
          <div className="text-2xl font-black text-emerald-100">{sessionsCompleted}</div>
          <div className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Sessions</div>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 flex flex-col items-center text-center">
          <Brain className="w-6 h-6 text-emerald-500 mb-2" />
          <div className="text-2xl font-black text-emerald-100">{sessionsCompleted * 25}</div>
          <div className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Focus Min</div>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 flex flex-col items-center text-center">
          <Target className="w-6 h-6 text-emerald-500 mb-2" />
          <div className="text-2xl font-black text-emerald-100">85%</div>
          <div className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Efficiency</div>
        </div>
      </div>
    </div>
  );
};
