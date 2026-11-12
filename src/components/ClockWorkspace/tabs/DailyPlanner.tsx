import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, CheckCircle2, Circle, 
  Trash2, AlertCircle, Clock, Tag, ChevronDown, ChevronUp, ListTodo
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { PlannerTask, ClockService } from '../../../services/ClockService';
import { soundEngine } from '../../../utils/audio';

interface DailyPlannerTabProps {
  currentUser: any;
  onLog: (text: string, tag?: string) => void;
}

export const DailyPlannerTab: React.FC<DailyPlannerTabProps> = ({ currentUser, onLog }) => {
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState<Partial<PlannerTask>>({
    title: '',
    priority: 'medium',
    category: 'Work'
  });

  useEffect(() => {
    if (currentUser?.uid) {
      return ClockService.subscribeTasks(currentUser.uid, (data) => {
        setTasks(data);
      });
    }
  }, [currentUser]);

  const handleAddTask = async () => {
    if (!newTask.title || !currentUser?.uid) return;
    
    try {
      await ClockService.addTask(currentUser.uid, {
        title: newTask.title,
        priority: newTask.priority as any,
        category: newTask.category || 'General',
        description: newTask.description || '',
        due_date: newTask.due_date || format(new Date(), 'yyyy-MM-dd'),
        completed: false
      });
      
      setNewTask({ title: '', priority: 'medium', category: 'Work' });
      setIsAdding(false);
      onLog(`[PLANNER]: Task "${newTask.title}" added to queue.`, 'SUCCESS');
      soundEngine.playSuccess();
    } catch (err: any) {
      onLog(`[ERROR]: Failed to add task: ${err.message}`, 'ERROR');
    }
  };

  const toggleTask = async (task: PlannerTask) => {
    if (!currentUser?.uid || !task.id) return;
    soundEngine.playClick();
    await ClockService.updateTask(currentUser.uid, task.id, { completed: !task.completed });
  };

  const deleteTask = async (taskId: string) => {
    if (!currentUser?.uid) return;
    soundEngine.playClick();
    await ClockService.deleteTask(currentUser.uid, taskId);
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const completionRate = tasks.length > 0 
    ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) 
    : 0;

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-emerald-50 uppercase tracking-tight">Daily Planner</h2>
          <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-[0.2em] mt-1">
            Operational Objective Management
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-emerald-950/10 border border-emerald-500/10 rounded-2xl p-4 px-6">
          <div className="text-right">
            <div className="text-xs font-black text-emerald-500">{completionRate}%</div>
            <div className="text-[8px] text-emerald-800 font-bold uppercase tracking-widest text-nowrap">Efficiency Level</div>
          </div>
          <div className="w-32 h-2 bg-black border border-emerald-900 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
            />
          </div>
        </div>
      </div>

      {/* Task Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
        >
          <Plus className="w-4 h-4" /> Initialize New Task
        </button>
        
        <div className="flex bg-black/40 border border-emerald-500/10 p-1 rounded-xl">
          {['pending', 'completed', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                filter === f ? 'bg-emerald-500/20 text-emerald-300' : 'text-emerald-900 hover:text-emerald-500'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Adding Task Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-emerald-950/5 border border-emerald-500/20 rounded-2xl p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-1">Objective</label>
                  <input 
                    autoFocus
                    value={newTask.title}
                    onChange={e => setNewTask({...newTask, title: e.target.value})}
                    placeholder="Describe mission objective..."
                    className="w-full bg-black border border-emerald-500/20 focus:border-emerald-500/60 p-3 rounded-xl text-emerald-200 outline-none text-sm transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-1">Priority</label>
                    <select 
                      value={newTask.priority}
                      onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
                      className="w-full bg-black border border-emerald-500/20 p-3 rounded-xl text-emerald-200 outline-none text-sm"
                    >
                      <option value="low">LOW</option>
                      <option value="medium">MEDIUM</option>
                      <option value="high">HIGH</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest ml-1">Deadline</label>
                    <input 
                      type="date"
                      value={newTask.due_date}
                      onChange={e => setNewTask({...newTask, due_date: e.target.value})}
                      className="w-full bg-black border border-emerald-500/20 p-3 rounded-xl text-emerald-200 outline-none text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="px-5 py-2 text-[10px] font-black text-emerald-800 uppercase hover:text-emerald-500 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddTask}
                  className="px-8 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] uppercase rounded-lg shadow-lg"
                >
                  Deploy Task
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task List */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar space-y-3">
        {filteredTasks.length > 0 ? filteredTasks.map((task) => (
          <motion.div 
            layout
            key={task.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all ${
              task.completed 
                ? 'bg-black/20 border-emerald-500/5 opacity-50' 
                : 'bg-black/40 border-emerald-500/10 hover:border-emerald-500/30'
            }`}
          >
            <button 
              onClick={() => toggleTask(task)}
              className={`p-1 rounded-lg transition-colors ${task.completed ? 'text-emerald-500' : 'text-emerald-900 hover:text-emerald-400'}`}
            >
              {task.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
            </button>
            
            <div className="flex-1">
              <div className={`text-sm font-black uppercase tracking-tight ${task.completed ? 'line-through text-emerald-900' : 'text-emerald-200'}`}>
                {task.title}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                  task.priority === 'high' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                  task.priority === 'medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                  'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                }`}>
                  {task.priority}
                </span>
                <span className="flex items-center gap-1 text-[8px] text-emerald-800 font-black uppercase tracking-widest">
                  <Tag className="w-2.5 h-2.5" /> {task.category || 'General'}
                </span>
                <span className="flex items-center gap-1 text-[8px] text-emerald-900 font-black uppercase tracking-widest">
                  <Clock className="w-2.5 h-2.5" /> {task.due_date || 'No Date'}
                </span>
              </div>
            </div>

            <button 
              onClick={() => deleteTask(task.id!)}
              className="p-2 rounded-lg text-emerald-950 hover:text-red-500 hover:bg-red-500/5 transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </motion.div>
        )) : (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <ListTodo className="w-16 h-16 mb-4 text-emerald-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">Queue Data Empty</p>
          </div>
        )}
      </div>
    </div>
  );
};
