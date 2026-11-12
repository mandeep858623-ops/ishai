import React, { useState } from 'react';
import { Bell, Plus, Trash2, Power, Music, Clock as ClockIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClockService, ClockSettings } from '../../../services/ClockService';

interface AlarmsTabProps {
  currentUser: any;
  settings: ClockSettings;
  onUpdateSettings: (settings: ClockSettings) => void;
}

export const AlarmsTab: React.FC<AlarmsTabProps> = ({ currentUser, settings, onUpdateSettings }) => {
  const [newAlarmTime, setNewAlarmTime] = useState('07:00');
  const [newAlarmLabel, setNewAlarmLabel] = useState('New Alarm');

  const alarms = settings.alarms || [];

  const addAlarm = async () => {
    const newAlarm = {
      id: Math.random().toString(36).substr(2, 9),
      time: newAlarmTime,
      label: newAlarmLabel,
      enabled: true,
      days: [0, 1, 2, 3, 4, 5, 6], // All days by default
    };
    
    const updatedAlarms = [...alarms, newAlarm];
    const updatedSettings = { ...settings, alarms: updatedAlarms };
    onUpdateSettings(updatedSettings);
    await ClockService.updateSettings(currentUser.uid, { alarms: updatedAlarms });
  };

  const toggleAlarm = async (id: string) => {
    const updatedAlarms = alarms.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a);
    const updatedSettings = { ...settings, alarms: updatedAlarms };
    onUpdateSettings(updatedSettings);
    await ClockService.updateSettings(currentUser.uid, { alarms: updatedAlarms });
  };

  const deleteAlarm = async (id: string) => {
    const updatedAlarms = alarms.filter(a => a.id !== id);
    const updatedSettings = { ...settings, alarms: updatedAlarms };
    onUpdateSettings(updatedSettings);
    await ClockService.updateSettings(currentUser.uid, { alarms: updatedAlarms });
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Quick Add Section */}
      <section className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Alarm Time</label>
            <input 
              type="time" 
              value={newAlarmTime}
              onChange={(e) => setNewAlarmTime(e.target.value)}
              className="w-full bg-black/40 border border-emerald-500/20 rounded-xl px-4 py-3 text-xl font-mono text-emerald-300 focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Label</label>
            <input 
              type="text" 
              value={newAlarmLabel}
              onChange={(e) => setNewAlarmLabel(e.target.value)}
              placeholder="Morning Wakeup..."
              className="w-full bg-black/40 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-300 placeholder:text-emerald-900 focus:outline-none focus:border-emerald-500/50 transition-all font-bold uppercase"
            />
          </div>
          <button 
            onClick={addAlarm}
            className="px-6 py-3 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 rounded-xl transition-all border border-emerald-500/30 flex items-center gap-2 font-black uppercase text-xs"
          >
            <Plus className="w-5 h-5" />
            Add Alarm
          </button>
        </div>
      </section>

      {/* Alarm List */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
        <AnimatePresence>
          {alarms.map((alarm) => (
            <motion.div 
              key={alarm.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`p-6 rounded-2xl border transition-all ${
                alarm.enabled 
                  ? 'bg-emerald-950/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                  : 'bg-black/40 border-emerald-500/5 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl font-mono font-black text-emerald-100 tracking-tighter">
                  {alarm.time}
                </div>
                <button 
                  onClick={() => toggleAlarm(alarm.id)}
                  className={`p-2 rounded-lg transition-all ${
                    alarm.enabled ? 'bg-emerald-500/30 text-emerald-300' : 'bg-emerald-900/10 text-emerald-900'
                  }`}
                >
                  <Power className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4 truncate">
                {alarm.label}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                    <div key={i} className={`w-5 h-5 rounded flex items-center justify-center text-[8px] font-bold border ${
                      alarm.days?.includes(i) ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-black/40 border-emerald-500/5 text-emerald-900'
                    }`}>
                      {day}
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => deleteAlarm(alarm.id)}
                  className="p-2 text-red-900 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {alarms.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-center space-y-4 opacity-30">
            <Bell className="w-12 h-12 text-emerald-500" />
            <div className="text-xs font-black uppercase tracking-[0.3em] text-emerald-500">No Alarms Set</div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 p-4 bg-emerald-950/20 rounded-xl border border-emerald-500/10">
        <ClockIcon className="w-4 h-4 text-emerald-600" />
        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
          SYSTEM NOTE: In-app alarms require the application to be active. Persistent background alarms depend on platform notification permissions.
        </span>
      </div>
    </div>
  );
};
