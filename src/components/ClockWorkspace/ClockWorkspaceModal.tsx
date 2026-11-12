import React, { useState, useEffect } from 'react';
import { 
  Clock, Calendar, ListTodo, Sparkles, Bell, Globe, Timer, Hourglass, 
  Target, Repeat, BookText, Settings, X, Menu, ChevronLeft, ChevronRight,
  Sun, Moon, Monitor, Maximize2, Minimize2, BarChart3, Milestone, Music, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClockService, ClockSettings } from '../../services/ClockService';
import { soundEngine } from '../../utils/audio';

// Views
import { OverviewTab } from './tabs/Overview';
import { CalendarTab } from './tabs/Calendar';
import { DailyPlannerTab } from './tabs/DailyPlanner';
import { AIPlannerTab } from './tabs/AIPlanner';
import { AlarmsTab } from './tabs/Alarms';
import { WorldClockTab } from './tabs/WorldClock';
import { StopwatchTab } from './tabs/Stopwatch';
import { TimerTab } from './tabs/Timer';
import { FocusModeTab } from './tabs/FocusMode';
import { RoutinesTab } from './tabs/Routines';
import { NotesTab } from './tabs/Notes';
import { ClockSettingsTab } from './tabs/ClockSettings';
import { HabitTrackerTab } from './tabs/HabitTracker';
import { ReminderCenterTab } from './tabs/ReminderCenter';
import { WeatherDashboardTab } from './tabs/WeatherDashboard';
import { CountdownWidgetsTab } from './tabs/CountdownWidgets';
import { TimeAnalyticsTab } from './tabs/TimeAnalytics';
import { LifeTimelineTab } from './tabs/LifeTimeline';
import { FocusSoundStudioTab } from './tabs/FocusSoundStudio';

interface ClockWorkspaceModalProps {
  onClose: () => void;
  onLog: (text: string, tag?: string) => void;
  currentUser: any;
}

export type ClockTab = 
  | 'OVERVIEW' | 'CALENDAR' | 'PLANNER' | 'AI_PLANNER' 
  | 'ALARMS' | 'WORLD' | 'STOPWATCH' | 'TIMER' 
  | 'FOCUS' | 'ROUTINES' | 'NOTES' | 'SETTINGS'
  | 'HABITS' | 'WEATHER' | 'COUNTDOWNS' | 'ANALYTICS' 
  | 'TIMELINE' | 'REMINDERS' | 'SOUNDS';

export const ClockWorkspaceModal: React.FC<ClockWorkspaceModalProps> = ({
  onClose,
  onLog,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<ClockTab>('OVERVIEW');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [settings, setSettings] = useState<ClockSettings>({
    theme: 'dark',
    clock_style: 'digital',
    format_24h: false,
    updated_at: new Date().toISOString()
  });

  useEffect(() => {
    if (currentUser?.uid) {
      ClockService.getSettings(currentUser.uid).then(s => {
        if (s) setSettings(s);
      });
    }
  }, [currentUser]);

  const navItems = [
    { id: 'OVERVIEW', label: 'Overview', icon: Clock },
    { id: 'CALENDAR', label: 'Calendar', icon: Calendar },
    { id: 'PLANNER', label: 'Daily Planner', icon: ListTodo },
    { id: 'HABITS', label: 'Habit Tracker', icon: Repeat },
    { id: 'AI_PLANNER', label: 'AI Day Planner', icon: Sparkles },
    { id: 'REMINDERS', label: 'Reminder Center', icon: Bell },
    { id: 'WEATHER', label: 'Weather & Sunlight', icon: Sun },
    { id: 'COUNTDOWNS', label: 'Countdowns', icon: Hourglass },
    { id: 'FOCUS', label: 'Focus Mode', icon: Target },
    { id: 'SOUNDS', label: 'Focus Sounds', icon: Music },
    { id: 'ANALYTICS', label: 'Time Analytics', icon: BarChart3 },
    { id: 'TIMELINE', label: 'Life Timeline', icon: Milestone },
    { id: 'WORLD', label: 'World Clock', icon: Globe },
    { id: 'STOPWATCH', label: 'Stopwatch', icon: Timer },
    { id: 'TIMER', label: 'Timer', icon: Hourglass },
    { id: 'ROUTINES', label: 'Routines', icon: Repeat },
    { id: 'NOTES', label: 'Daily Journal', icon: BookText },
    { id: 'SETTINGS', label: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'OVERVIEW': return <OverviewTab currentUser={currentUser} settings={settings} onNavigate={setActiveTab} />;
      case 'CALENDAR': return <CalendarTab currentUser={currentUser} onLog={onLog} />;
      case 'PLANNER': return <DailyPlannerTab currentUser={currentUser} onLog={onLog} />;
      case 'HABITS': return <HabitTrackerTab currentUser={currentUser} onLog={onLog} />;
      case 'AI_PLANNER': return <AIPlannerTab currentUser={currentUser} onLog={onLog} />;
      case 'REMINDERS': return <ReminderCenterTab currentUser={currentUser} onLog={onLog} />;
      case 'WEATHER': return <WeatherDashboardTab currentUser={currentUser} />;
      case 'COUNTDOWNS': return <CountdownWidgetsTab currentUser={currentUser} />;
      case 'FOCUS': return <FocusModeTab currentUser={currentUser} onLog={onLog} />;
      case 'SOUNDS': return <FocusSoundStudioTab />;
      case 'ANALYTICS': return <TimeAnalyticsTab currentUser={currentUser} />;
      case 'TIMELINE': return <LifeTimelineTab currentUser={currentUser} />;
      case 'ALARMS': return <AlarmsTab currentUser={currentUser} settings={settings} onUpdateSettings={setSettings} />;
      case 'WORLD': return <WorldClockTab currentUser={currentUser} settings={settings} onUpdateSettings={setSettings} />;
      case 'STOPWATCH': return <StopwatchTab />;
      case 'TIMER': return <TimerTab />;
      case 'ROUTINES': return <RoutinesTab currentUser={currentUser} settings={settings} onUpdateSettings={setSettings} />;
      case 'NOTES': return <NotesTab currentUser={currentUser} onLog={onLog} />;
      case 'SETTINGS': return <ClockSettingsTab currentUser={currentUser} settings={settings} onUpdateSettings={setSettings} />;
      default: return null;
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md overflow-hidden ${settings.theme === 'light' ? 'light-theme' : ''}`}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`relative w-full h-full sm:max-w-6xl sm:h-[90vh] flex flex-col sm:flex-row bg-[#0a0a0b] text-emerald-400 border border-emerald-500/30 rounded-none sm:rounded-2xl overflow-hidden shadow-2xl ${isFullscreen ? 'sm:max-w-full sm:h-full sm:rounded-none sm:p-0' : ''}`}
      >
        {/* Mobile Header */}
        <div className="sm:hidden flex items-center justify-between p-4 border-b border-emerald-500/20 bg-emerald-950/10">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 text-emerald-500">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2 font-bold">
            <Clock className="w-5 h-5 text-emerald-400" />
            <span>CLOCK</span>
          </div>
          <button onClick={onClose} className="p-1 text-emerald-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <AnimatePresence>
          {(isSidebarOpen || window.innerWidth >= 640) && (
            <motion.aside 
              initial={{ x: -250 }}
              animate={{ x: 0 }}
              exit={{ x: -250 }}
              className={`absolute sm:relative z-40 w-64 h-full bg-[#0d0d0e] border-r border-emerald-500/20 flex flex-col transition-all duration-300 ${!isSidebarOpen && 'sm:w-20'}`}
            >
              <div className="p-6 hidden sm:flex items-center justify-between">
                {isSidebarOpen ? (
                  <div className="flex items-center gap-3 font-black tracking-tighter text-xl">
                    <Clock className="w-6 h-6 text-emerald-400 animate-pulse" />
                    <span>SUPERAI</span>
                  </div>
                ) : (
                  <Clock className="w-8 h-8 text-emerald-400 mx-auto" />
                )}
              </div>

              <nav className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as ClockTab);
                      if (window.innerWidth < 640) setIsSidebarOpen(false);
                      soundEngine.playClick();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                      activeTab === item.id 
                        ? 'bg-emerald-500/20 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                        : 'text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-500'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${activeTab === item.id ? 'text-emerald-400' : 'group-hover:text-emerald-400'}`} />
                    {isSidebarOpen && <span className="font-bold text-sm whitespace-nowrap">{item.label}</span>}
                  </button>
                ))}
              </nav>

              <div className="p-4 border-t border-emerald-500/10 space-y-2">
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="hidden sm:flex w-full items-center justify-center p-2 rounded-lg hover:bg-emerald-500/10 text-emerald-700 hover:text-emerald-400 transition-colors"
                >
                  {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                <div className="flex justify-around items-center gap-1">
                  <button className="p-2 text-emerald-800 hover:text-emerald-400"><Monitor className="w-4 h-4" /></button>
                  <button onClick={toggleFullscreen} className="p-2 text-emerald-800 hover:text-emerald-400">
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Content Area */}
        <main className="flex-1 flex flex-col h-full bg-[#0a0a0b] relative">
          {/* Header Actions (Desktop) */}
          <div className="hidden sm:flex items-center justify-between p-6 bg-transparent">
            <div>
              <h2 className="text-2xl font-black text-emerald-100 tracking-tight flex items-center gap-3">
                {navItems.find(n => n.id === activeTab)?.label}
                {activeTab === 'AI_PLANNER' && <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-400 border border-emerald-500/30">AI CORE</span>}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-emerald-500/10 text-emerald-600 hover:text-emerald-400 transition-all border border-transparent hover:border-emerald-500/20"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-8 pt-0 custom-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Status Bar */}
          <div className="px-6 py-2 border-t border-emerald-500/10 bg-black/40 flex items-center justify-between text-[10px] text-emerald-900 font-bold uppercase tracking-widest">
            <div className="flex items-center gap-4">
              <span>SYNC: ONLINE</span>
              <span>USER: {currentUser?.fullName || 'GUEST'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>SUPERAI-OS SYSTEM CLOCK v2.0</span>
            </div>
          </div>

          {/* Quick Add Floating Button */}
          <QuickAddMenu currentUser={currentUser} onLog={onLog} />
        </main>
      </motion.div>
    </div>
  );
};

const QuickAddMenu: React.FC<{ currentUser: any, onLog: (t: string, tag?: string) => void }> = ({ currentUser, onLog }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const actions = [
    { label: 'Task', icon: ListTodo, color: 'emerald', onClick: () => {/* Logic to open task modal */} },
    { label: 'Event', icon: Calendar, color: 'blue', onClick: () => {} },
    { label: 'Habit', icon: Repeat, color: 'violet', onClick: () => {} },
    { label: 'Countdown', icon: Hourglass, color: 'amber', onClick: () => {} },
    { label: 'Note', icon: BookText, color: 'rose', onClick: () => {} },
  ];

  return (
    <div className="absolute bottom-12 right-8 z-[100]">
       <AnimatePresence>
         {isOpen && (
           <motion.div 
             initial={{ opacity: 0, y: 20, scale: 0.9 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: 20, scale: 0.9 }}
             className="absolute bottom-16 right-0 mb-4 bg-[#0d0d0e] border border-emerald-500/30 rounded-2xl p-2 shadow-2xl min-w-[160px]"
           >
              <div className="p-3 border-b border-emerald-500/10 mb-2">
                 <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest text-center">Quick Add Operation</p>
              </div>
              <div className="space-y-1">
                 {actions.map((action) => (
                   <button
                     key={action.label}
                     onClick={() => {
                        setIsOpen(false);
                        onLog(`Quick add triggered for ${action.label}`, 'SYSTEM');
                     }}
                     className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-emerald-500/10 text-emerald-700 hover:text-emerald-400 transition-all text-xs font-bold"
                   >
                     <action.icon className="w-4 h-4" />
                     {action.label.toUpperCase()}
                   </button>
                 ))}
              </div>
           </motion.div>
         )}
       </AnimatePresence>
       
       <button 
         onClick={() => setIsOpen(!isOpen)}
         className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-2xl ${
           isOpen ? 'bg-red-500 rotate-45' : 'bg-emerald-500 hover:scale-110 active:scale-95'
         }`}
       >
         <Plus className={`w-8 h-8 ${isOpen ? 'text-white' : 'text-black'}`} />
       </button>
    </div>
  );
};

