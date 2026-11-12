import React, { useState, useEffect } from 'react';
import { Clock as ClockIcon, Calendar as CalendarIcon, ListTodo, ChevronRight, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { ClockSettings, ClockService, CalendarEvent, PlannerTask } from '../../../services/ClockService';

interface OverviewTabProps {
  currentUser: any;
  settings: ClockSettings;
  onNavigate: (tab: any) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ currentUser, settings, onNavigate }) => {
  const [time, setTime] = useState(new Date());
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [todayTasks, setTodayTasks] = useState<PlannerTask[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  const [countdowns, setCountdowns] = useState<any[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    let unsubEvents: any;
    let unsubTasks: any;
    let unsubHabits: any;
    let unsubCountdowns: any;

    if (currentUser?.uid) {
      unsubEvents = ClockService.subscribeEvents(currentUser.uid, (events) => {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        setTodayEvents(events.filter(e => e.date === todayStr).slice(0, 3));
      });
      unsubTasks = ClockService.subscribeTasks(currentUser.uid, (tasks) => {
        setTodayTasks(tasks.filter(t => !t.completed).slice(0, 3));
      });
      unsubHabits = ClockService.subscribeHabits(currentUser.uid, (data) => {
        setHabits(data.filter(h => !h.archived).slice(0, 2));
      });
      unsubCountdowns = ClockService.subscribeCountdowns(currentUser.uid, (data) => {
        setCountdowns(data.slice(0, 2));
      });
    }

    return () => {
      clearInterval(timer);
      if (unsubEvents) unsubEvents();
      if (unsubTasks) unsubTasks();
      if (unsubHabits) unsubHabits();
      if (unsubCountdowns) unsubCountdowns();
    };
  }, [currentUser]);

  const getGreeting = () => {
    const hour = time.getHours();
    if (hour < 12) return 'GOOD MORNING';
    if (hour < 17) return 'GOOD AFTERNOON';
    if (hour < 21) return 'GOOD EVENING';
    return 'GOOD NIGHT';
  };

  const timeString = format(time, settings.format_24h ? 'HH:mm:ss' : 'hh:mm:ss a');
  const dateString = format(time, 'EEEE, MMMM do, yyyy');

  return (
    <div className="h-full flex flex-col space-y-8 pb-12">
      {/* Hero Clock Section */}
      <section className="flex flex-col items-center justify-center py-12 bg-emerald-950/5 rounded-3xl border border-emerald-500/10 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-bold text-emerald-600 tracking-[0.4em] mb-4 uppercase"
        >
          {getGreeting()}, {currentUser?.fullName?.split(' ')[0] || 'OPERATOR'}
        </motion.div>

        <div className={`text-6xl sm:text-8xl font-black tracking-tighter text-emerald-100 drop-shadow-[0_0_25px_rgba(16,185,129,0.3)] ${settings.clock_style === 'neon' ? 'animate-pulse text-emerald-400' : ''}`}>
          {timeString}
        </div>

        <div className="mt-4 text-emerald-500 font-bold tracking-widest text-sm">
          {dateString}
        </div>
      </section>

      {/* Grid Layout for Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upcoming Events */}
            <div className="bg-black/40 border border-emerald-500/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-black text-emerald-200 uppercase tracking-wider">
                  <CalendarIcon className="w-4 h-4 text-emerald-500" />
                  Today's Agenda
                </h3>
                <button 
                  onClick={() => onNavigate('CALENDAR')}
                  className="text-[10px] text-emerald-700 hover:text-emerald-400 transition-colors flex items-center gap-1 font-bold"
                >
                  VIEW FULL <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-3">
                {todayEvents.length > 0 ? todayEvents.map((event, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-emerald-950/10 border border-emerald-500/5 rounded-xl hover:border-emerald-500/20 transition-all group">
                    <div className="w-1 h-8 bg-emerald-500 rounded-full group-hover:scale-y-125 transition-transform" />
                    <div className="flex-1">
                      <div className="text-xs font-black text-emerald-300 uppercase truncate">{event.title}</div>
                      <div className="text-[10px] text-emerald-700">{event.start_time || 'All Day'}</div>
                    </div>
                  </div>
                )) : (
                  <div className="py-8 text-center text-[10px] text-emerald-900 uppercase font-bold tracking-widest opacity-20">
                    No events scheduled
                  </div>
                )}
              </div>
            </div>

            {/* Top Tasks */}
            <div className="bg-black/40 border border-emerald-500/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-black text-emerald-200 uppercase tracking-wider">
                  <ListTodo className="w-4 h-4 text-emerald-500" />
                  Priority Tasks
                </h3>
                <button 
                  onClick={() => onNavigate('PLANNER')}
                  className="text-[10px] text-emerald-700 hover:text-emerald-400 transition-colors flex items-center gap-1 font-bold"
                >
                  MANAGE <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-3">
                {todayTasks.length > 0 ? todayTasks.map((task, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-emerald-950/10 border border-emerald-500/5 rounded-xl hover:border-emerald-500/20 transition-all group">
                    <div className={`w-1 h-8 rounded-full ${task.priority === 'high' ? 'bg-red-500' : 'bg-emerald-500'} group-hover:scale-y-125 transition-transform`} />
                    <div className="flex-1">
                      <div className="text-xs font-black text-emerald-300 uppercase truncate">{task.title}</div>
                      <div className="text-[10px] text-emerald-700 uppercase tracking-tighter">{task.category || 'General'}</div>
                    </div>
                    <button onClick={() => onNavigate('FOCUS')} className="p-2 text-emerald-800 hover:text-emerald-400"><Play className="w-4 h-4" /></button>
                  </div>
                )) : (
                  <div className="py-8 text-center text-[10px] text-emerald-900 uppercase font-bold tracking-widest opacity-20">
                    All tasks completed
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Weather Mini Dashboard */}
          <div className="bg-emerald-950/5 border border-emerald-500/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-8 group hover:border-emerald-500/30 transition-all cursor-pointer" onClick={() => onNavigate('WEATHER')}>
             <div className="flex items-center gap-6">
                <SunIcon className="w-16 h-16 text-yellow-500 animate-spin-slow" />
                <div>
                   <h4 className="text-3xl font-black text-emerald-100">22°C</h4>
                   <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Partly Cloudy • New York</p>
                </div>
             </div>
             <div className="flex-1 w-full sm:w-auto grid grid-cols-3 gap-4">
                <div className="text-center">
                   <p className="text-[8px] text-emerald-800 font-black uppercase">Humidity</p>
                   <p className="text-xs font-bold text-emerald-300">45%</p>
                </div>
                <div className="text-center">
                   <p className="text-[8px] text-emerald-800 font-black uppercase">Wind</p>
                   <p className="text-xs font-bold text-emerald-300">12km/h</p>
                </div>
                <div className="text-center">
                   <p className="text-[8px] text-emerald-800 font-black uppercase">UV Index</p>
                   <p className="text-xs font-bold text-emerald-300">5</p>
                </div>
             </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
           {/* Habits Widget */}
           <div className="bg-black/40 border border-emerald-500/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-black text-emerald-200 uppercase tracking-wider">
                  <Repeat className="w-4 h-4 text-emerald-500" />
                  Habit Tracker
                </h3>
                <button onClick={() => onNavigate('HABITS')} className="p-1.5 hover:bg-emerald-500/10 rounded-lg text-emerald-700 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                 {habits.length > 0 ? habits.map(h => (
                   <div key={h.id} className="flex items-center justify-between p-3 bg-emerald-950/10 border border-emerald-500/5 rounded-xl">
                      <span className="text-xs font-bold text-emerald-300 uppercase truncate pr-4">{h.name}</span>
                      <div className="flex gap-1">
                         {Array.from({ length: 5 }).map((_, i) => (
                           <div key={i} className={`w-2 h-2 rounded-full ${i < 3 ? 'bg-emerald-500' : 'bg-emerald-950'}`} />
                         ))}
                      </div>
                   </div>
                 )) : (
                   <div className="py-4 text-center text-[10px] text-emerald-900 uppercase font-bold tracking-widest opacity-20">No active habits</div>
                 )}
              </div>
           </div>

           {/* Countdown Widget */}
           <div className="bg-black/40 border border-emerald-500/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-black text-emerald-200 uppercase tracking-wider">
                  <Hourglass className="w-4 h-4 text-emerald-500" />
                  Upcoming
                </h3>
                <button onClick={() => onNavigate('COUNTDOWNS')} className="p-1.5 hover:bg-emerald-500/10 rounded-lg text-emerald-700 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                 {countdowns.length > 0 ? countdowns.map(cd => (
                   <div key={cd.id} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-black uppercase">
                         <span className="text-emerald-400">{cd.title}</span>
                         <span className="text-emerald-800">12 Days</span>
                      </div>
                      <div className="h-1 bg-emerald-950 rounded-full overflow-hidden">
                         <div className="h-full bg-emerald-500" style={{ width: '65%' }} />
                      </div>
                   </div>
                 )) : (
                   <div className="py-4 text-center text-[10px] text-emerald-900 uppercase font-bold tracking-widest opacity-20">No countdowns set</div>
                 )}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

const SunIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
);

const Repeat = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
);

const Hourglass = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>
);

