import React, { useState } from 'react';
import { Repeat, Plus, Trash2, CheckCircle2, Circle, Play, Coffee, Dumbbell, Book, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClockService, ClockSettings } from '../../../services/ClockService';

interface RoutinesTabProps {
  currentUser: any;
  settings: ClockSettings;
  onUpdateSettings: (settings: ClockSettings) => void;
}

const ROUTINE_TEMPLATES = [
  { id: 'morning', label: 'Morning Ritual', icon: Coffee, tasks: ['Hydrate', 'Meditate', 'Morning Stretch', 'Review Goals'] },
  { id: 'work', label: 'Work Routine', icon: Briefcase, tasks: ['Email Triage', 'Deep Work Block', 'Team Sync', 'Update Roadmap'] },
  { id: 'exercise', label: 'Exercise', icon: Dumbbell, tasks: ['Warmup', 'Core Session', 'Main Workout', 'Cool Down'] },
  { id: 'study', label: 'Deep Study', icon: Book, tasks: ['Active Recall', 'Note Review', 'Practice Problems', 'Summary'] },
];

export const RoutinesTab: React.FC<RoutinesTabProps> = ({ currentUser, settings, onUpdateSettings }) => {
  const [newRoutineName, setNewRoutineName] = useState('');

  const routines = settings.routines || [];

  const addRoutine = async (name: string, tasks: string[] = []) => {
    const newRoutine = {
      id: Math.random().toString(36).substr(2, 9),
      name: name || newRoutineName,
      tasks: tasks.map(t => ({ id: Math.random().toString(36).substr(2, 9), title: t, completed: false })),
      active: true
    };
    
    const updatedRoutines = [...routines, newRoutine];
    const updatedSettings = { ...settings, routines: updatedRoutines };
    onUpdateSettings(updatedSettings);
    await ClockService.updateSettings(currentUser.uid, { routines: updatedRoutines });
    setNewRoutineName('');
  };

  const deleteRoutine = async (id: string) => {
    const updatedRoutines = routines.filter(r => r.id !== id);
    const updatedSettings = { ...settings, routines: updatedRoutines };
    onUpdateSettings(updatedSettings);
    await ClockService.updateSettings(currentUser.uid, { routines: updatedRoutines });
  };

  const toggleTask = async (routineId: string, taskId: string) => {
    const updatedRoutines = routines.map(r => {
      if (r.id === routineId) {
        return {
          ...r,
          tasks: r.tasks.map((t: any) => t.id === taskId ? { ...t, completed: !t.completed } : t)
        };
      }
      return r;
    });
    const updatedSettings = { ...settings, routines: updatedRoutines };
    onUpdateSettings(updatedSettings);
    await ClockService.updateSettings(currentUser.uid, { routines: updatedRoutines });
  };

  return (
    <div className="h-full flex flex-col space-y-8">
      {/* Templates Section */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.3em]">Quick Launch Templates</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {ROUTINE_TEMPLATES.map(template => (
            <button 
              key={template.id}
              onClick={() => addRoutine(template.label, template.tasks)}
              className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex flex-col items-center gap-3 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all group"
            >
              <div className="p-3 bg-emerald-950/20 rounded-xl group-hover:scale-110 transition-transform">
                <template.icon className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-[10px] font-black text-emerald-300 uppercase tracking-wider">{template.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Routine Management */}
      <div className="flex-1 space-y-6">
        <div className="flex gap-4">
          <input 
            type="text"
            value={newRoutineName}
            onChange={(e) => setNewRoutineName(e.target.value)}
            placeholder="CUSTOM ROUTINE NAME..."
            className="flex-1 bg-black/40 border border-emerald-500/20 rounded-xl px-6 py-4 text-sm text-emerald-300 placeholder:text-emerald-900 focus:outline-none focus:border-emerald-500/50 transition-all font-bold uppercase tracking-widest"
          />
          <button 
            onClick={() => addRoutine(newRoutineName)}
            className="px-8 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 rounded-xl transition-all border border-emerald-500/30 font-black uppercase text-xs"
          >
            Create
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
          <AnimatePresence>
            {routines.map((routine) => (
              <motion.div 
                key={routine.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-black/40 border border-emerald-500/10 rounded-2xl overflow-hidden"
              >
                <div className="p-5 border-b border-emerald-500/10 flex items-center justify-between bg-emerald-950/5">
                  <div className="flex items-center gap-3">
                    <Repeat className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-black text-emerald-200 uppercase tracking-wider">{routine.name}</span>
                  </div>
                  <button 
                    onClick={() => deleteRoutine(routine.id)}
                    className="p-1 text-emerald-900 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-3">
                  {routine.tasks.map((task: any) => (
                    <button 
                      key={task.id}
                      onClick={() => toggleTask(routine.id, task.id)}
                      className="w-full flex items-center gap-3 p-3 bg-emerald-950/10 border border-emerald-500/5 rounded-xl hover:border-emerald-500/20 transition-all text-left group"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-emerald-900 group-hover:text-emerald-600" />
                      )}
                      <span className={`text-xs font-bold uppercase tracking-wide ${task.completed ? 'text-emerald-800 line-through' : 'text-emerald-400'}`}>
                        {task.title}
                      </span>
                    </button>
                  ))}
                  {routine.tasks.length === 0 && (
                    <div className="py-4 text-center text-[10px] text-emerald-900 font-bold uppercase tracking-widest">No tasks added to this routine</div>
                  )}
                </div>

                <div className="px-5 py-3 bg-emerald-500/5 border-t border-emerald-500/5 flex items-center justify-between">
                  <div className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">
                    Progress: {Math.round((routine.tasks.filter((t: any) => t.completed).length / routine.tasks.length) * 100 || 0)}%
                  </div>
                  <button className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-300 transition-colors">
                    <Play className="w-3 h-3" /> Reset Routine
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
