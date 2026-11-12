import React, { useState, useEffect } from 'react';
import { 
  Bell, Calendar, ListTodo, Clock, CheckCircle2, 
  AlertCircle, History, Filter, Plus, Search,
  ChevronRight, MoreVertical, Trash2, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClockService, CalendarEvent, PlannerTask } from '../../../services/ClockService';
import { format, isToday, isTomorrow, isPast, addDays, parseISO } from 'date-fns';

interface ReminderCenterTabProps {
  currentUser: any;
  onLog: (text: string, tag?: string) => void;
}

export const ReminderCenterTab: React.FC<ReminderCenterTabProps> = ({ currentUser, onLog }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (currentUser?.uid) {
      const unsubEvents = ClockService.subscribeEvents(currentUser.uid, setEvents);
      const unsubTasks = ClockService.subscribeTasks(currentUser.uid, setTasks);
      return () => {
        unsubEvents();
        unsubTasks();
      };
    }
  }, [currentUser]);

  const allReminders = [
    ...events.map(e => ({ 
      id: e.id!, 
      type: 'event' as const, 
      title: e.title, 
      time: e.start_time ? `${e.date}T${e.start_time}` : e.date,
      date: e.date,
      category: e.category,
      completed: false 
    })),
    ...tasks.map(t => ({ 
      id: t.id!, 
      type: 'task' as const, 
      title: t.title, 
      time: t.due_date, 
      date: t.due_date?.split('T')[0] || '',
      category: t.category,
      completed: t.completed 
    }))
  ].sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const filteredReminders = allReminders.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filter === 'all') return true;
    if (!r.time) return false;

    const date = parseISO(r.time);
    if (filter === 'today') return isToday(date);
    if (filter === 'upcoming') return !isPast(date) && !isToday(date);
    if (filter === 'overdue') return isPast(date) && !r.completed && !isToday(date);

    return true;
  });

  const getDayLabel = (dateStr: string) => {
    if (!dateStr) return 'No Date';
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEEE, MMM d');
  };

  const handleCompleteTask = async (taskId: string, currentStatus: boolean) => {
    try {
      await ClockService.updateTask(currentUser.uid, taskId, { completed: !currentStatus });
      onLog(`Task marked ${!currentStatus ? 'complete' : 'incomplete'}`, 'REMINDERS');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-emerald-100 flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-500" />
            REMINDER CENTER
          </h3>
          <p className="text-xs text-emerald-700 font-medium">Your unified inbox for tasks, events, and alarms.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-800" />
            <input 
              type="text"
              placeholder="Search reminders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-emerald-950/20 border border-emerald-500/20 rounded-lg pl-10 pr-4 py-2 text-xs font-bold text-emerald-100 focus:outline-none focus:border-emerald-500/50 w-48 sm:w-64 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {[
          { id: 'all', label: 'All', icon: Bell },
          { id: 'today', label: 'Today', icon: Clock },
          { id: 'upcoming', label: 'Upcoming', icon: Calendar },
          { id: 'overdue', label: 'Overdue', icon: AlertCircle },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setFilter(btn.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${
              filter === btn.id 
                ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                : 'bg-emerald-950/20 text-emerald-700 border border-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-500'
            }`}
          >
            <btn.icon className="w-3.5 h-3.5" />
            {btn.label.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredReminders.length > 0 ? (
          filteredReminders.map((reminder) => (
            <motion.div
              key={`${reminder.type}-${reminder.id}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`bg-emerald-950/5 border border-emerald-500/10 rounded-xl p-4 flex items-center justify-between hover:border-emerald-500/30 transition-all group ${reminder.completed ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => reminder.type === 'task' && handleCompleteTask(reminder.id, reminder.completed)}
                  disabled={reminder.type === 'event'}
                  className={`w-6 h-6 flex items-center justify-center rounded-lg border transition-all ${
                    reminder.completed 
                      ? 'bg-emerald-500 border-emerald-500 text-black' 
                      : reminder.type === 'event'
                      ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500 cursor-default'
                      : 'border-emerald-500/30 text-emerald-800 hover:border-emerald-500'
                  }`}
                >
                  {reminder.completed ? <Check className="w-4 h-4" /> : reminder.type === 'event' ? <Calendar className="w-3 h-3" /> : null}
                </button>
                <div>
                  <h4 className={`text-sm font-bold transition-all ${reminder.completed ? 'text-emerald-900 line-through' : 'text-emerald-100'}`}>
                    {reminder.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-emerald-800 font-black uppercase flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {reminder.time ? format(parseISO(reminder.time), 'HH:mm') : 'No Time'}
                    </span>
                    <span className="text-[10px] text-emerald-800 font-black uppercase flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {getDayLabel(reminder.date)}
                    </span>
                    {reminder.category && (
                      <span className="text-[10px] text-emerald-500 font-black uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        {reminder.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 text-emerald-900 hover:text-emerald-500">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-emerald-900 border-2 border-dashed border-emerald-500/10 rounded-2xl">
            <Bell className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-bold uppercase tracking-widest text-sm">No reminders found</p>
            <p className="text-xs opacity-50">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
};
