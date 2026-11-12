import React, { useState, useEffect } from 'react';
import { 
  Plus, Target, Flame, Calendar, Trophy, Trash2, 
  ChevronLeft, ChevronRight, CheckCircle2, Circle, 
  Archive, MoreHorizontal, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClockService, Habit } from '../../../services/ClockService';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, subDays, addDays, startOfMonth, endOfMonth } from 'date-fns';

interface HabitTrackerTabProps {
  currentUser: any;
  onLog: (text: string, tag?: string) => void;
}

export const HabitTrackerTab: React.FC<HabitTrackerTabProps> = ({ currentUser, onLog }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newHabit, setNewHabit] = useState({
    name: '',
    category: 'Health',
    schedule: 'daily' as const,
    target: 1
  });

  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (currentUser?.uid) {
      const unsubscribe = ClockService.subscribeHabits(currentUser.uid, setHabits);
      return () => unsubscribe();
    }
  }, [currentUser]);

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.name.trim()) return;

    try {
      await ClockService.addHabit(currentUser.uid, newHabit);
      setIsAdding(false);
      setNewHabit({ name: '', category: 'Health', schedule: 'daily', target: 1 });
      onLog('New habit added', 'HABITS');
    } catch (err) {
      console.error(err);
    }
  };

  const toggleHabit = async (habit: Habit, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    let newCompletedDates = [...habit.completed_dates];
    
    if (newCompletedDates.includes(dateStr)) {
      newCompletedDates = newCompletedDates.filter(d => d !== dateStr);
    } else {
      newCompletedDates.push(dateStr);
    }

    try {
      await ClockService.updateHabit(currentUser.uid, habit.id!, { completed_dates: newCompletedDates });
    } catch (err) {
      console.error(err);
    }
  };

  const calculateStreak = (habit: Habit) => {
    if (habit.completed_dates.length === 0) return 0;
    
    const sortedDates = [...habit.completed_dates].sort((a, b) => b.localeCompare(a));
    let streak = 0;
    let currentDate = new Date();
    
    // If today is not completed, check if yesterday was. If neither, streak is 0
    const todayStr = format(currentDate, 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(currentDate, 1), 'yyyy-MM-dd');
    
    if (!habit.completed_dates.includes(todayStr) && !habit.completed_dates.includes(yesterdayStr)) {
      return 0;
    }

    // Simple streak calculation: consecutive days
    let checkDate = habit.completed_dates.includes(todayStr) ? currentDate : subDays(currentDate, 1);
    
    while (habit.completed_dates.includes(format(checkDate, 'yyyy-MM-dd'))) {
      streak++;
      checkDate = subDays(checkDate, 1);
    }

    return streak;
  };

  const getWeekDays = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  };

  const categories = ['Health', 'Work', 'Personal', 'Fitness', 'Mindset'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-emerald-100 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-500" />
            HABIT TRACKER
          </h3>
          <p className="text-xs text-emerald-700 font-medium">Build consistency and track your progress.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg border border-emerald-500/30 transition-all font-bold text-sm"
        >
          <Plus className="w-4 h-4" />
          NEW HABIT
        </button>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/10">
        <button onClick={() => setSelectedDate(subDays(selectedDate, 7))} className="p-2 hover:bg-emerald-500/10 rounded-lg text-emerald-500">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 flex justify-around px-4">
          {getWeekDays().map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-emerald-800 font-bold uppercase">{format(day, 'eee')}</span>
              <button 
                onClick={() => setSelectedDate(day)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                  isSameDay(day, selectedDate) 
                    ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                    : isSameDay(day, new Date())
                    ? 'border border-emerald-500/50 text-emerald-400'
                    : 'text-emerald-700 hover:text-emerald-500'
                }`}
              >
                {format(day, 'd')}
              </button>
            </div>
          ))}
        </div>
        <button onClick={() => setSelectedDate(addDays(selectedDate, 7))} className="p-2 hover:bg-emerald-500/10 rounded-lg text-emerald-500">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Habit List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {habits.filter(h => !h.archived).map((habit) => {
            const streak = calculateStreak(habit);
            const isCompleted = habit.completed_dates.includes(format(selectedDate, 'yyyy-MM-dd'));
            
            return (
              <motion.div
                key={habit.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-emerald-950/10 border border-emerald-500/20 rounded-xl p-4 group hover:border-emerald-500/40 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => toggleHabit(habit, selectedDate)}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                        isCompleted 
                          ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                          : 'border border-emerald-500/20 text-emerald-800 hover:border-emerald-500/50 hover:text-emerald-500'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                    </button>
                    <div>
                      <h4 className={`font-bold transition-all ${isCompleted ? 'text-emerald-400' : 'text-emerald-100'}`}>
                        {habit.name}
                      </h4>
                      <span className="text-[10px] text-emerald-800 font-black uppercase tracking-wider">{habit.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                      <Flame className={`w-3 h-3 ${streak > 0 ? 'text-orange-500' : 'text-emerald-900'}`} />
                      <span className="text-[10px] font-bold text-emerald-400">{streak}</span>
                    </div>
                    <button className="p-1.5 text-emerald-900 hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Indicators (Last 7 Days) */}
                <div className="flex justify-between gap-1">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const date = subDays(new Date(), 6 - i);
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const done = habit.completed_dates.includes(dateStr);
                    return (
                      <div 
                        key={i} 
                        className={`flex-1 h-1.5 rounded-full ${
                          done ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-emerald-950/50'
                        }`}
                        title={format(date, 'MMM d')}
                      />
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {habits.length === 0 && !isAdding && (
        <div className="flex flex-col items-center justify-center py-20 text-emerald-900 border-2 border-dashed border-emerald-500/10 rounded-2xl">
          <Target className="w-12 h-12 mb-4 opacity-20" />
          <p className="font-bold uppercase tracking-widest text-sm">No active habits</p>
          <p className="text-xs opacity-50">Start building consistency today</p>
        </div>
      )}

      {/* Add Habit Modal */}
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
                NEW HABIT
              </h3>
              
              <form onSubmit={handleAddHabit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Habit Name</label>
                  <input
                    type="text"
                    required
                    value={newHabit.name}
                    onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                    className="w-full bg-emerald-950/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-100 focus:outline-none focus:border-emerald-500/50 transition-all font-bold"
                    placeholder="e.g., Read for 30 mins"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Category</label>
                    <select
                      value={newHabit.category}
                      onChange={(e) => setNewHabit({ ...newHabit, category: e.target.value })}
                      className="w-full bg-emerald-950/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-100 focus:outline-none focus:border-emerald-500/50 transition-all font-bold appearance-none cursor-pointer"
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Frequency</label>
                    <select
                      value={newHabit.schedule}
                      onChange={(e) => setNewHabit({ ...newHabit, schedule: e.target.value as any })}
                      className="w-full bg-emerald-950/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-100 focus:outline-none focus:border-emerald-500/50 transition-all font-bold appearance-none cursor-pointer"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
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
                    CREATE HABIT
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
