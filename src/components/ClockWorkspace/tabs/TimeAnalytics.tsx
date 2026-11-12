import React, { useState, useEffect } from 'react';
import { 
  BarChart3, PieChart, Activity, TrendingUp, Calendar, 
  Clock, Target, CheckCircle2, ChevronLeft, ChevronRight,
  Filter, Download, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClockService, TimeRecord, PlannerTask } from '../../../services/ClockService';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays, startOfMonth, endOfMonth, isSameDay, subMonths, addDays, addMonths } from 'date-fns';

interface TimeAnalyticsTabProps {
  currentUser: any;
}

export const TimeAnalyticsTab: React.FC<TimeAnalyticsTabProps> = ({ currentUser }) => {
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [view, setView] = useState<'week' | 'month'>('week');
  const [selectedRange, setSelectedRange] = useState(new Date());

  useEffect(() => {
    if (currentUser?.uid) {
      const unsubRecords = ClockService.subscribeTimeRecords(currentUser.uid, setRecords);
      const unsubTasks = ClockService.subscribeTasks(currentUser.uid, setTasks);
      return () => {
        unsubRecords();
        unsubTasks();
      };
    }
  }, [currentUser]);

  const getRangeData = () => {
    const start = view === 'week' ? startOfWeek(selectedRange, { weekStartsOn: 1 }) : startOfMonth(selectedRange);
    const end = view === 'week' ? endOfWeek(selectedRange, { weekStartsOn: 1 }) : endOfMonth(selectedRange);
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      const dayRecords = records.filter(r => isSameDay(new Date(r.start_time), day));
      const focusTime = dayRecords.filter(r => r.type === 'focus').reduce((acc, r) => acc + r.duration, 0);
      const breakTime = dayRecords.filter(r => r.type === 'break').reduce((acc, r) => acc + r.duration, 0);
      const tasksCompleted = tasks.filter(t => t.completed && t.due_date && isSameDay(new Date(t.due_date), day)).length;

      return {
        date: day,
        label: format(day, view === 'week' ? 'eee' : 'd'),
        focusTime,
        breakTime,
        tasksCompleted
      };
    });
  };

  const data = getRangeData();
  const totalFocusTime = data.reduce((acc, d) => acc + d.focusTime, 0);
  const totalTasks = data.reduce((acc, d) => acc + d.tasksCompleted, 0);
  const avgFocusPerDay = totalFocusTime / data.length;

  const maxFocus = Math.max(...data.map(d => d.focusTime), 60);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-emerald-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            TIME ANALYTICS
          </h3>
          <p className="text-xs text-emerald-700 font-medium">Deep insights into your productivity and focus trends.</p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-emerald-950/20 rounded-xl border border-emerald-500/10">
          <button 
            onClick={() => setView('week')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${view === 'week' ? 'bg-emerald-500 text-black shadow-lg' : 'text-emerald-700 hover:text-emerald-500'}`}
          >
            Weekly
          </button>
          <button 
            onClick={() => setView('month')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${view === 'month' ? 'bg-emerald-500 text-black shadow-lg' : 'text-emerald-700 hover:text-emerald-500'}`}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between bg-emerald-950/10 p-4 rounded-2xl border border-emerald-500/10">
        <button 
          onClick={() => setSelectedRange(view === 'week' ? subDays(selectedRange, 7) : subMonths(selectedRange, 1))}
          className="p-2 hover:bg-emerald-500/10 rounded-lg text-emerald-500"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-black text-emerald-100 uppercase tracking-widest">
          {view === 'week' 
            ? `${format(startOfWeek(selectedRange, { weekStartsOn: 1 }), 'MMM d')} - ${format(endOfWeek(selectedRange, { weekStartsOn: 1 }), 'MMM d, yyyy')}`
            : format(selectedRange, 'MMMM yyyy')}
        </span>
        <button 
          onClick={() => setSelectedRange(view === 'week' ? addDays(selectedRange, 7) : addMonths(selectedRange, 1))}
          className="p-2 hover:bg-emerald-500/10 rounded-lg text-emerald-500"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-emerald-950/10 border border-emerald-500/20 rounded-2xl p-6">
          <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-8 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            FOCUS TIME DISTRIBUTION (MINS)
          </h4>
          
          <div className="h-64 flex items-end justify-between gap-2 px-2">
            {data.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full relative flex flex-col justify-end gap-1 h-48">
                   <motion.div 
                     initial={{ height: 0 }}
                     animate={{ height: `${(d.focusTime / maxFocus) * 100}%` }}
                     className="w-full bg-emerald-500 rounded-t-lg group-hover:bg-emerald-400 transition-colors relative"
                   >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-500 text-black text-[10px] font-black px-2 py-1 rounded shadow-lg whitespace-nowrap">
                        {d.focusTime} MIN
                      </div>
                   </motion.div>
                   {d.breakTime > 0 && (
                     <motion.div 
                       initial={{ height: 0 }}
                       animate={{ height: `${(d.breakTime / maxFocus) * 100}%` }}
                       className="w-full bg-emerald-900/50 rounded-t-lg group-hover:bg-emerald-800/50 transition-colors"
                     />
                   )}
                </div>
                <span className="text-[10px] font-black text-emerald-800 uppercase group-hover:text-emerald-500">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-emerald-950/10 border border-emerald-500/20 rounded-2xl p-6">
            <p className="text-[10px] text-emerald-800 font-black uppercase tracking-widest mb-4">Summary Metrics</p>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-emerald-700 font-bold uppercase">Total Focus</p>
                  <p className="text-2xl font-black text-emerald-100">{(totalFocusTime / 60).toFixed(1)} <span className="text-xs">HRS</span></p>
                </div>
                <ArrowUpRight className="w-8 h-8 text-emerald-500/20" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-emerald-700 font-bold uppercase">Avg / Day</p>
                  <p className="text-2xl font-black text-emerald-100">{avgFocusPerDay.toFixed(0)} <span className="text-xs">MIN</span></p>
                </div>
                <Activity className="w-8 h-8 text-emerald-500/20" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-emerald-700 font-bold uppercase">Tasks Done</p>
                  <p className="text-2xl font-black text-emerald-100">{totalTasks}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-emerald-500/20" />
              </div>
            </div>
          </div>

          <div className="bg-emerald-950/10 border border-emerald-500/20 rounded-2xl p-6">
             <h4 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-4">Focus Efficiency</h4>
             <div className="relative h-4 bg-emerald-950/50 rounded-full overflow-hidden border border-emerald-500/10">
                <div 
                  className="absolute h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  style={{ width: '78%' }}
                />
             </div>
             <div className="flex justify-between mt-2">
                <span className="text-[8px] text-emerald-900 font-black uppercase">78% Target Reached</span>
                <span className="text-[8px] text-emerald-900 font-black uppercase">Goal: 4h/Day</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

