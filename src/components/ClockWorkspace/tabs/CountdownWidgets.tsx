import React, { useState, useEffect } from 'react';
import { 
  Hourglass, Plus, Calendar, Clock, Trash2, 
  ChevronRight, AlertCircle, Repeat, Edit2, 
  Search, Filter, PartyPopper, Briefcase, GraduationCap, Plane, Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClockService, Countdown } from '../../../services/ClockService';
import { format, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, parseISO, isPast, addYears, isSameDay } from 'date-fns';

interface CountdownWidgetsTabProps {
  currentUser: any;
}

export const CountdownWidgetsTab: React.FC<CountdownWidgetsTabProps> = ({ currentUser }) => {
  const [countdowns, setCountdowns] = useState<Countdown[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newCountdown, setNewCountdown] = useState({
    title: '',
    target_date: '',
    category: 'Celebration',
    color: '#10b981',
    reminder_enabled: true,
    is_recurring_annual: false
  });

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (currentUser?.uid) {
      const unsubscribe = ClockService.subscribeCountdowns(currentUser.uid, setCountdowns);
      return () => unsubscribe();
    }
  }, [currentUser]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCountdown.title || !newCountdown.target_date) return;

    try {
      await ClockService.addCountdown(currentUser.uid, newCountdown);
      setIsAdding(false);
      setNewCountdown({
        title: '',
        target_date: '',
        category: 'Celebration',
        color: '#10b981',
        reminder_enabled: true,
        is_recurring_annual: false
      });
    } catch (err) {
      console.error(err);
    }
  };

  const getRemainingTime = (targetDateStr: string) => {
    const target = parseISO(targetDateStr);
    if (isPast(target)) {
      // If it's today, it might be exactly now or just passed
      if (isSameDay(target, now)) {
         return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false };
      }
      return null;
    }

    const days = differenceInDays(target, now);
    const hours = differenceInHours(target, now) % 24;
    const minutes = differenceInMinutes(target, now) % 60;
    const seconds = differenceInSeconds(target, now) % 60;

    return { days, hours, minutes, seconds, isPast: false };
  };

  const categories = [
    { id: 'Celebration', icon: PartyPopper },
    { id: 'Work', icon: Briefcase },
    { id: 'Education', icon: GraduationCap },
    { id: 'Travel', icon: Plane },
    { id: 'Competition', icon: Trophy }
  ];

  const colors = [
    '#10b981', // Emerald
    '#3b82f6', // Blue
    '#8b5cf6', // Violet
    '#f59e0b', // Amber
    '#ef4444', // Red
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-emerald-100 flex items-center gap-2">
            <Hourglass className="w-5 h-5 text-emerald-500" />
            COUNTDOWN WIDGETS
          </h3>
          <p className="text-xs text-emerald-700 font-medium">Track your upcoming milestones and events.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg border border-emerald-500/30 transition-all font-bold text-sm"
        >
          <Plus className="w-4 h-4" />
          ADD COUNTDOWN
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {countdowns.map((cd) => {
            const remaining = getRemainingTime(cd.target_date);
            const isFinished = !remaining;
            const CategoryIcon = categories.find(c => c.id === cd.category)?.icon || PartyPopper;

            return (
              <motion.div
                key={cd.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-emerald-950/10 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/40 transition-all shadow-lg"
              >
                <div 
                  className="absolute top-0 left-0 w-1 h-full"
                  style={{ backgroundColor: cd.color }}
                />
                
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                      <CategoryIcon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-black text-emerald-100 tracking-tight">{cd.title}</h4>
                      <p className="text-[10px] text-emerald-800 font-bold uppercase">{format(parseISO(cd.target_date), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => ClockService.deleteCountdown(currentUser.uid, cd.id!)}
                    className="p-1.5 text-emerald-900 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {!isFinished ? (
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'DAYS', value: remaining.days },
                      { label: 'HRS', value: remaining.hours },
                      { label: 'MIN', value: remaining.minutes },
                      { label: 'SEC', value: remaining.seconds }
                    ].map((unit) => (
                      <div key={unit.label} className="text-center">
                        <p className="text-2xl font-black text-emerald-100 font-mono tracking-tighter">
                          {unit.value.toString().padStart(2, '0')}
                        </p>
                        <p className="text-[8px] text-emerald-800 font-black uppercase">{unit.label}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                    <PartyPopper className="w-8 h-8 text-emerald-500 mb-2 animate-bounce" />
                    <p className="text-xs font-black text-emerald-100 uppercase tracking-widest">EVENT REACHED</p>
                    <button 
                      onClick={() => ClockService.deleteCountdown(currentUser.uid, cd.id!)}
                      className="mt-2 text-[10px] text-emerald-700 font-bold hover:text-emerald-500"
                    >
                      DISMISS
                    </button>
                  </div>
                )}

                <div className="mt-6 flex items-center justify-between">
                  {cd.is_recurring_annual && (
                    <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold uppercase">
                      <Repeat className="w-3 h-3" />
                      Annual
                    </div>
                  )}
                  <div className="flex-1" />
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-emerald-500 font-black uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      {cd.category}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {countdowns.length === 0 && !isAdding && (
        <div className="flex flex-col items-center justify-center py-20 text-emerald-900 border-2 border-dashed border-emerald-500/10 rounded-2xl">
          <Hourglass className="w-12 h-12 mb-4 opacity-20" />
          <p className="font-bold uppercase tracking-widest text-sm">No active countdowns</p>
          <p className="text-xs opacity-50">Create your first milestone tracker</p>
        </div>
      )}

      {/* Add Countdown Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-[#0d0d0e] border border-emerald-500/30 rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-xl font-black text-emerald-100 mb-6 flex items-center gap-3">
                <Plus className="w-6 h-6 text-emerald-500" />
                NEW COUNTDOWN
              </h3>
              
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={newCountdown.title}
                    onChange={(e) => setNewCountdown({ ...newCountdown, title: e.target.value })}
                    className="w-full bg-emerald-950/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-100 focus:outline-none focus:border-emerald-500/50 transition-all font-bold"
                    placeholder="e.g., Birthday, Project Deadline"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Target Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={newCountdown.target_date}
                    onChange={(e) => setNewCountdown({ ...newCountdown, target_date: e.target.value })}
                    className="w-full bg-emerald-950/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-100 focus:outline-none focus:border-emerald-500/50 transition-all font-bold cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Category</label>
                    <select
                      value={newCountdown.category}
                      onChange={(e) => setNewCountdown({ ...newCountdown, category: e.target.value })}
                      className="w-full bg-emerald-950/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-100 focus:outline-none focus:border-emerald-500/50 transition-all font-bold appearance-none cursor-pointer"
                    >
                      {categories.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Color Theme</label>
                    <div className="flex gap-2 p-2 bg-emerald-950/10 border border-emerald-500/20 rounded-xl">
                      {colors.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewCountdown({ ...newCountdown, color: c })}
                          className={`w-6 h-6 rounded-full transition-all ${newCountdown.color === c ? 'scale-125 ring-2 ring-white/20' : 'opacity-50 hover:opacity-100'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 py-2">
                   <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={newCountdown.is_recurring_annual}
                        onChange={(e) => setNewCountdown({...newCountdown, is_recurring_annual: e.target.checked})}
                        className="w-4 h-4 rounded border-emerald-500/20 bg-emerald-950/50 text-emerald-500 focus:ring-0" 
                      />
                      <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Recurring Annual</span>
                   </label>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-emerald-500/20 text-emerald-700 font-bold hover:bg-emerald-500/5 transition-all"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="flex-2 px-8 py-3 bg-emerald-500 text-black font-black rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  >
                    START COUNTDOWN
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
