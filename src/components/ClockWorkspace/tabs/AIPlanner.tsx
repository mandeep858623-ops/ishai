import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Loader2, Calendar, ListTodo, Check, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClockService, CalendarEvent, PlannerTask } from '../../../services/ClockService';

interface AIPlannerTabProps {
  currentUser: any;
  onLog: (text: string, tag?: string) => void;
}

interface AIResponse {
  suggested_events?: any[];
  suggested_tasks?: any[];
  suggested_habits?: any[];
}

export const AIPlannerTab: React.FC<AIPlannerTabProps> = ({ currentUser, onLog }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ role: 'user' | 'assistant', content: string, data?: AIResponse }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  const [countdowns, setCountdowns] = useState<any[]>([]);

  useEffect(() => {
    if (currentUser?.uid) {
      const unsubTasks = ClockService.subscribeTasks(currentUser.uid, setTasks);
      const unsubEvents = ClockService.subscribeEvents(currentUser.uid, setEvents);
      const unsubHabits = ClockService.subscribeHabits(currentUser.uid, setHabits);
      const unsubCountdowns = ClockService.subscribeCountdowns(currentUser.uid, setCountdowns);
      return () => {
        unsubTasks();
        unsubEvents();
        unsubHabits();
        unsubCountdowns();
      };
    }
  }, [currentUser]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleSend = async () => {
    if (!prompt.trim() || loading) return;

    const userMessage = prompt;
    setPrompt('');
    setHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/clock/plan', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('superai_os_token') || ''
        },
        body: JSON.stringify({ 
          prompt: userMessage,
          existingTasks: tasks.slice(0, 10),
          existingEvents: events.slice(0, 10),
          existingHabits: habits.slice(0, 10),
          upcomingCountdowns: countdowns.slice(0, 10)
        })
      });

      const result = await res.json();
      if (result.success) {
        let content = result.plan;
        let data: AIResponse | undefined;

        // Try to extract JSON if present
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/{[\s\S]*?}/);
        if (jsonMatch) {
          try {
            data = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            content = content.replace(/```json[\s\S]*?```/, '').trim();
          } catch (e) {
            console.error('Failed to parse AI JSON', e);
          }
        }

        setHistory(prev => [...prev, { role: 'assistant', content, data }]);
      } else {
        throw new Error(result.error || 'AI processing failed');
      }
    } catch (err: any) {
      onLog(`AI Planner Error: ${err.message}`, 'ERROR');
      setHistory(prev => [...prev, { role: 'assistant', content: "SYSTEM ERROR: FAILED TO PROCESS PLAN." }]);
    } finally {
      setLoading(false);
    }
  };

  const applyPlan = async (data: AIResponse) => {
    try {
      if (data.suggested_events) {
        for (const e of data.suggested_events) {
          await ClockService.addEvent(currentUser.uid, {
            title: e.title,
            date: e.date || new Date().toISOString().split('T')[0],
            start_time: e.start_time,
            end_time: e.end_time,
            description: e.description
          });
        }
      }
      if (data.suggested_tasks) {
        for (const t of data.suggested_tasks) {
          await ClockService.addTask(currentUser.uid, {
            title: t.title,
            priority: t.priority || 'medium',
            completed: false,
            due_date: t.due_date,
            description: t.description
          });
        }
      }
      if (data.suggested_habits) {
        for (const h of data.suggested_habits) {
          await ClockService.addHabit(currentUser.uid, {
            name: h.name,
            category: h.category || 'Mindset',
            schedule: h.schedule || 'daily',
            target: h.target || 1
          });
        }
      }
      onLog('AI Plan applied successfully', 'SUCCESS');
      setHistory(prev => [...prev, { role: 'assistant', content: "PLAN APPLIED TO YOUR WORKSPACE." }]);
    } catch (err: any) {
      onLog(`Apply Plan Error: ${err.message}`, 'ERROR');
    }
  };


  return (
    <div className="h-full flex flex-col space-y-4">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 p-2 custom-scrollbar bg-emerald-950/5 rounded-2xl border border-emerald-500/10"
      >
        {history.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
            <Sparkles className="w-12 h-12 text-emerald-500/50" />
            <div>
              <h3 className="text-emerald-100 font-bold uppercase tracking-widest">Intelligent Scheduler</h3>
              <p className="text-emerald-800 text-xs mt-2 max-w-xs">
                Tell me about your goals, tasks, or habits. I'll help you organize them into a realistic timeline.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {['Help me plan tomorrow', 'I need to study for 4 hours', 'Organize my gym routine'].map(suggestion => (
                <button 
                  key={suggestion}
                  onClick={() => setPrompt(suggestion)}
                  className="text-[10px] px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 hover:bg-emerald-500/20 transition-all font-bold uppercase"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {history.map((msg, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-4 rounded-2xl border ${
                msg.role === 'user' 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100' 
                  : 'bg-black/60 border-emerald-500/10 text-emerald-400'
              }`}>
                <div className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                
                {msg.data && (
                  <div className="mt-4 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-3">
                    <div className="text-[10px] font-black text-emerald-600 tracking-widest uppercase flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      Suggested Optimization
                    </div>
                    
                    <div className="space-y-2">
                      {msg.data.suggested_events?.map((e: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-[10px] text-emerald-300">
                          <span className="w-1 h-3 bg-emerald-500 rounded-full" />
                          <span className="font-bold">[{e.start_time}]</span> {e.title}
                        </div>
                      ))}
                      {msg.data.suggested_tasks?.map((t: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-[10px] text-emerald-500">
                          <Check className="w-3 h-3" />
                          {t.title}
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={() => applyPlan(msg.data!)}
                      className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase rounded-lg transition-all border border-emerald-500/30"
                    >
                      Apply To Workspace
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <div className="flex justify-start">
            <div className="bg-black/60 border border-emerald-500/10 p-4 rounded-2xl flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
              <span className="text-[10px] font-black text-emerald-600 animate-pulse uppercase tracking-[0.2em]">Analyzing Timeline...</span>
            </div>
          </div>
        )}
      </div>

      <div className="relative group">
        <input 
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="ENTER PLANNING COMMAND..."
          className="w-full bg-black/40 border border-emerald-500/20 rounded-xl px-4 py-4 text-sm text-emerald-300 placeholder:text-emerald-900 focus:outline-none focus:border-emerald-500/50 transition-all pr-12 font-mono"
        />
        <button 
          onClick={handleSend}
          disabled={loading || !prompt.trim()}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 rounded-lg transition-all disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
