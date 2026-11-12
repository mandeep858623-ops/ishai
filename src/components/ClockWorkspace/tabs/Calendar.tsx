import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, 
  Search, Filter, MapPin, AlignLeft, Clock
} from 'lucide-react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, 
  eachDayOfInterval, parseISO, isWithinInterval
} from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarEvent, ClockService } from '../../../services/ClockService';
import { soundEngine } from '../../../utils/audio';

interface CalendarTabProps {
  currentUser: any;
  onLog: (text: string, tag?: string) => void;
}

export const CalendarTab: React.FC<CalendarTabProps> = ({ currentUser, onLog }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: '',
    category: 'Work',
    is_all_day: false,
    description: ''
  });

  useEffect(() => {
    if (currentUser?.uid) {
      return ClockService.subscribeEvents(currentUser.uid, (data) => {
        setEvents(data);
      });
    }
  }, [currentUser]);

  const nextMonth = () => {
    soundEngine.playClick();
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    soundEngine.playClick();
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const onDateClick = (day: Date) => {
    soundEngine.playClick();
    setSelectedDate(day);
  };

  const handleAddEvent = async () => {
    if (!newEvent.title || !currentUser?.uid) return;
    
    try {
      await ClockService.addEvent(currentUser.uid, {
        title: newEvent.title,
        date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: newEvent.start_time || '',
        end_time: newEvent.end_time || '',
        is_all_day: newEvent.is_all_day || false,
        category: newEvent.category || 'General',
        description: newEvent.description || '',
        location: newEvent.location || '',
      });
      
      setIsEventModalOpen(false);
      setNewEvent({ title: '', category: 'Work', is_all_day: false, description: '' });
      onLog(`[CALENDAR]: New event "${newEvent.title}" recorded for ${format(selectedDate, 'MMM do')}`, 'SUCCESS');
      soundEngine.playSuccess();
    } catch (err: any) {
      onLog(`[ERROR]: Failed to save event: ${err.message}`, 'ERROR');
    }
  };

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col">
          <h2 className="text-3xl font-black text-emerald-50 text-shadow-glow uppercase tracking-tight">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-[0.3em]">
            Temporal Node Navigation
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/10 hover:border-emerald-500/40 text-emerald-500 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setCurrentMonth(new Date())} className="px-4 py-2 rounded-lg bg-emerald-950/20 border border-emerald-500/10 hover:border-emerald-500/40 text-[10px] font-black uppercase text-emerald-300 transition-all">
            Today
          </button>
          <button onClick={nextMonth} className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/10 hover:border-emerald-500/40 text-emerald-500 transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 mb-2 border-b border-emerald-500/10 pb-4">
        {days.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-black uppercase text-emerald-800 tracking-widest">
            {d}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;
        const isSelected = isSameDay(day, selectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isToday = isSameDay(day, new Date());
        
        const dayEvents = events.filter(e => isSameDay(parseISO(e.date), cloneDay));

        days.push(
          <div
            key={day.toString()}
            className={`relative min-h-[100px] p-2 border-r border-b border-emerald-500/5 transition-all cursor-pointer group ${
              !isCurrentMonth ? 'bg-black/20 opacity-20' : 'bg-black/40 hover:bg-emerald-500/5'
            } ${isSelected ? 'ring-1 ring-inset ring-emerald-500/50 bg-emerald-500/5' : ''}`}
            onClick={() => onDateClick(cloneDay)}
          >
            <div className={`flex items-center justify-center w-6 h-6 rounded-md text-[11px] font-bold mb-1 ${
              isToday ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 
              isSelected ? 'text-emerald-300' : 'text-emerald-700'
            }`}>
              {formattedDate}
            </div>
            
            <div className="space-y-1">
              {dayEvents.slice(0, 3).map((e, idx) => (
                <div key={idx} className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] text-emerald-400 truncate uppercase font-bold">
                  {e.title}
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-[8px] text-emerald-800 font-bold ml-1">
                  + {dayEvents.length - 3} MORE
                </div>
              )}
            </div>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDateClick(cloneDay);
                setIsEventModalOpen(true);
              }}
              className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-emerald-500/20 text-emerald-500 transition-all"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="border-l border-t border-emerald-500/5 rounded-xl overflow-hidden">{rows}</div>;
  };

  return (
    <div className="h-full flex flex-col">
      {renderHeader()}
      
      <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
        {/* Calendar Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
          {renderDays()}
          {renderCells()}
        </div>

        {/* Side Panels */}
        <div className="w-full lg:w-80 shrink-0 space-y-6 flex flex-col h-full overflow-hidden">
          {/* Selected Date Details */}
          <div className="bg-emerald-950/10 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden flex flex-col max-h-[50%]">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <div className="text-xs font-black text-emerald-700 uppercase tracking-[0.2em] mb-1">Schedule for</div>
            <h3 className="text-xl font-black text-emerald-100 uppercase">{format(selectedDate, 'EEE, MMM do')}</h3>
            
            <div className="mt-6 space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {events.filter(e => isSameDay(parseISO(e.date), selectedDate)).length > 0 ? (
                events.filter(e => isSameDay(parseISO(e.date), selectedDate)).map((event, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={idx} 
                    className="p-3 bg-black/40 border border-emerald-500/10 rounded-xl space-y-2 group"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black text-emerald-500 uppercase px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                        {event.category || 'General'}
                      </span>
                      <button className="text-emerald-900 group-hover:text-red-500 transition-colors">
                        <X className="w-3 h-3" onClick={() => ClockService.deleteEvent(currentUser.uid, event.id!)} />
                      </button>
                    </div>
                    <div className="text-xs font-black text-emerald-200 uppercase">{event.title}</div>
                    <div className="flex items-center gap-2 text-[10px] text-emerald-800 font-bold uppercase tracking-tighter">
                      <Clock className="w-3 h-3" /> {event.start_time || 'ALL DAY'} {event.end_time ? `- ${event.end_time}` : ''}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-8 text-center opacity-50">
                  <CalendarIcon className="w-10 h-10 text-emerald-950 mx-auto mb-3 opacity-20" />
                  <p className="text-[10px] text-emerald-900 font-black uppercase tracking-widest">No activities detected</p>
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsEventModalOpen(true)}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] uppercase rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Log New Operation
            </button>
          </div>

          {/* Unscheduled Tasks Panel (Smart Time Blocking) */}
          <div className="bg-emerald-950/10 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden flex-1 flex flex-col min-h-0">
             <div className="text-xs font-black text-emerald-700 uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
                <span>Task Bin</span>
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">Unscheduled</span>
             </div>
             
             <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 space-y-3">
                {/* We'll need to fetch tasks here, but for now we'll simulate or use a hook if I add it to ClockService */}
                {/* I'll use a local state to fetch tasks if they are not already in events */}
                <UnscheduledTasksBin currentUser={currentUser} onBlock={(task) => {
                  setNewEvent({
                    title: task.title,
                    category: task.category,
                    description: task.description
                  });
                  setIsEventModalOpen(true);
                }} />
             </div>
          </div>

          <div className="bg-black/20 border border-emerald-500/5 rounded-2xl p-4 text-[9px] text-emerald-900 leading-relaxed uppercase font-bold tracking-wider">
            SYSTEM NOTE: Drag and drop task blocking is in BETA. Click a task to initialize temporal mapping.
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      <AnimatePresence>
        {isEventModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-[#0d0d0e] border border-emerald-500/30 rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-emerald-500/20 flex items-center justify-between bg-emerald-950/10">
                <h3 className="text-sm font-black text-emerald-100 uppercase tracking-widest">New Deployment Entry</h3>
                <button onClick={() => setIsEventModalOpen(false)} className="text-emerald-700 hover:text-emerald-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Operation Title</label>
                  <input 
                    autoFocus
                    value={newEvent.title}
                    onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                    placeholder="Enter event name..."
                    className="w-full bg-black border border-emerald-500/20 focus:border-emerald-500/60 p-3 rounded-xl text-emerald-200 outline-none text-sm transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Start Node</label>
                    <input 
                      type="time"
                      value={newEvent.start_time}
                      onChange={e => setNewEvent({...newEvent, start_time: e.target.value})}
                      className="w-full bg-black border border-emerald-500/20 p-3 rounded-xl text-emerald-200 outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">End Node</label>
                    <input 
                      type="time"
                      value={newEvent.end_time}
                      onChange={e => setNewEvent({...newEvent, end_time: e.target.value})}
                      className="w-full bg-black border border-emerald-500/20 p-3 rounded-xl text-emerald-200 outline-none text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Classification</label>
                  <select 
                    value={newEvent.category}
                    onChange={e => setNewEvent({...newEvent, category: e.target.value})}
                    className="w-full bg-black border border-emerald-500/20 p-3 rounded-xl text-emerald-200 outline-none text-sm"
                  >
                    <option value="Work">Work</option>
                    <option value="Personal">Personal</option>
                    <option value="Study">Study</option>
                    <option value="Health">Health</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Geo-Coordinates / Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-emerald-900" />
                    <input 
                      value={newEvent.location}
                      onChange={e => setNewEvent({...newEvent, location: e.target.value})}
                      placeholder="Meeting link or physical address..."
                      className="w-full bg-black border border-emerald-500/20 pl-10 p-3 rounded-xl text-emerald-200 outline-none text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-emerald-950/5 border-t border-emerald-500/10 flex justify-end gap-3">
                <button onClick={() => setIsEventModalOpen(false)} className="px-4 py-2 text-[10px] font-black text-emerald-800 uppercase hover:text-emerald-500 transition-colors">Abort</button>
                <button 
                  onClick={handleAddEvent}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] uppercase rounded-lg shadow-lg"
                >
                  Confirm Deployment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const X = ({ className, onClick }: { className?: string, onClick?: any }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    onClick={onClick}
  >
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);

const UnscheduledTasksBin = ({ currentUser, onBlock }: { currentUser: any, onBlock: (task: any) => void }) => {
  const [tasks, setTasks] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (currentUser?.uid) {
      return ClockService.subscribeTasks(currentUser.uid, (data) => {
        setTasks(data.filter(t => !t.completed));
      });
    }
  }, [currentUser]);

  if (tasks.length === 0) {
    return (
      <div className="py-8 text-center opacity-20">
        <ListTodo className="w-8 h-8 mx-auto mb-2" />
        <p className="text-[8px] font-black uppercase">Bin Empty</p>
      </div>
    );
  }

  return (
    <>
      {tasks.map((task) => (
        <button
          key={task.id}
          onClick={() => onBlock(task)}
          className="w-full text-left p-3 bg-black/40 border border-emerald-500/5 hover:border-emerald-500/20 rounded-xl transition-all group"
        >
          <div className="text-[10px] font-black text-emerald-100 uppercase mb-1 truncate">{task.title}</div>
          <div className="flex items-center justify-between">
             <span className="text-[8px] font-bold text-emerald-800 uppercase">{task.category}</span>
             <div className="w-4 h-4 rounded bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20">
                <ChevronRight className="w-2.5 h-2.5 text-emerald-900 group-hover:text-emerald-500" />
             </div>
          </div>
        </button>
      ))}
    </>
  );
};

const ListTodo = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="5" width="6" height="6" rx="1"/><path d="m3 17 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></svg>
);

