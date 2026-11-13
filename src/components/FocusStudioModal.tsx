import React, { useState, useEffect, useRef } from 'react';
import { ModalWrapper } from './Modals';
import { soundEngine } from '../utils/audio';
import { UserProfile } from '../../server/authService';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  ListTodo, 
  Target, 
  BarChart3, 
  Settings, 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Flame, 
  ShieldCheck, 
  ArrowRight, 
  Calendar, 
  AlertCircle,
  Maximize2
} from 'lucide-react';

export type FocusTab = 'overview' | 'timer' | 'tasks' | 'goals' | 'progress' | 'settings';

export interface FocusTask {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: 'Low' | 'Medium' | 'High';
  estimatedMinutes: number;
  status: 'To Do' | 'In Progress' | 'Completed';
  category?: string;
  createdAt: string;
}

export interface DailyGoal {
  id: string;
  title: string;
  targetType: 'minutes' | 'sessions' | 'tasks';
  targetValue: number;
  currentValue: number;
  isCompleted: boolean;
}

export interface FocusSessionRecord {
  id: string;
  taskTitle: string;
  durationMinutes: number;
  completedAt: string;
  type: 'focus' | 'short_break' | 'long_break';
}

export interface FocusSettings {
  focusDuration: number; // minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  dailyMinutesTarget: number;
  routineName: string;
  soundEnabled: boolean;
}

const STORAGE_KEY_PREFIX = 'SUPERAI_FocusStudio_';

interface FocusStudioModalProps {
  onClose: () => void;
  currentUser: UserProfile;
  authToken: string;
  onLog?: (text: string, tag: string) => void;
}

export const FocusStudioModal: React.FC<FocusStudioModalProps> = ({
  onClose,
  currentUser,
  authToken,
  onLog,
}) => {
  const userKey = currentUser.uid;

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<FocusTab>('overview');

  // Distraction-free full screen mode
  const [distractionFree, setDistractionFree] = useState(false);

  // Focus Settings State
  const [settings, setSettings] = useState<FocusSettings>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}_settings_${userKey}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      focusDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsBeforeLongBreak: 4,
      dailyMinutesTarget: 120,
      routineName: 'Pomodoro Routine',
      soundEnabled: true,
    };
  });

  // Timer State
  const [mode, setMode] = useState<'focus' | 'short_break' | 'long_break'>('focus');
  const [timeLeft, setTimeLeft] = useState<number>(settings.focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTaskTitle, setActiveTaskTitle] = useState('General Deep Work Session');

  // Tasks State
  const [tasks, setTasks] = useState<FocusTask[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}_tasks_${userKey}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 't_1',
        title: 'Review System Architecture & Telemetry',
        description: 'Verify backend routes for user isolation and session tokens.',
        priority: 'High',
        estimatedMinutes: 45,
        status: 'In Progress',
        category: 'Engineering',
        createdAt: new Date().toISOString(),
      },
      {
        id: 't_2',
        title: 'Draft Project Milestone Report',
        description: 'Summarize Q4 deliverables for executive review.',
        priority: 'Medium',
        estimatedMinutes: 30,
        status: 'To Do',
        category: 'Management',
        createdAt: new Date().toISOString(),
      },
    ];
  });

  // Daily Goals State
  const [goals, setGoals] = useState<DailyGoal[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}_goals_${userKey}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 'g_1', title: 'Focus for 120 minutes', targetType: 'minutes', targetValue: 120, currentValue: 25, isCompleted: false },
      { id: 'g_2', title: 'Complete 3 focus sessions', targetType: 'sessions', targetValue: 3, currentValue: 1, isCompleted: false },
      { id: 'g_3', title: 'Complete 2 tasks', targetType: 'tasks', targetValue: 2, currentValue: 0, isCompleted: false },
    ];
  });

  // Sessions History State
  const [sessionHistory, setSessionHistory] = useState<FocusSessionRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}_history_${userKey}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Task creation/editing state
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<FocusTask['priority']>('Medium');
  const [newTaskEst, setNewTaskEst] = useState(25);
  const [newTaskCat, setNewTaskCat] = useState('General');

  // AI Focus Coach State
  const [aiCoachAdvice, setAiCoachAdvice] = useState<string | null>(null);
  const [loadingCoach, setLoadingCoach] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  // Load state from Firestore on mount
  useEffect(() => {
    async function loadFromFirestore() {
      if (!auth.currentUser || auth.currentUser.uid !== userKey) return;
      setIsCloudSyncing(true);
      try {
        const docRef = doc(db, 'user_focus_records', userKey);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const remoteData = docSnap.data();
          if (remoteData.settings) setSettings(remoteData.settings);
          if (remoteData.tasks) setTasks(remoteData.tasks);
          if (remoteData.goals) setGoals(remoteData.goals);
          if (remoteData.session_history) setSessionHistory(remoteData.session_history);
        }
      } catch (err) {
        console.warn('[Firestore Focus Load] Error:', err);
      } finally {
        setIsCloudSyncing(false);
      }
    }
    loadFromFirestore();
  }, [userKey]);

  // Persist state when updated to localStorage and sync with Firestore
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}_settings_${userKey}`, JSON.stringify(settings));
    localStorage.setItem(`${STORAGE_KEY_PREFIX}_tasks_${userKey}`, JSON.stringify(tasks));
    localStorage.setItem(`${STORAGE_KEY_PREFIX}_goals_${userKey}`, JSON.stringify(goals));
    localStorage.setItem(`${STORAGE_KEY_PREFIX}_history_${userKey}`, JSON.stringify(sessionHistory));

    // Firestore sync only when Firebase Auth UID matches userKey
    async function syncToFirestore() {
      if (!auth.currentUser || auth.currentUser.uid !== userKey) return;
      try {
        await setDoc(doc(db, 'user_focus_records', userKey), {
          user_id: userKey,
          settings,
          tasks,
          goals,
          session_history: sessionHistory,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('[Firestore Sync] Focus records sync error:', err);
      }
    }
    syncToFirestore();
  }, [settings, tasks, goals, sessionHistory, userKey]);

  // =========================================================================
  // TIMER ENGINE WITH TIMESTAMP ACCURACY
  // =========================================================================
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      if (!endTimeRef.current) {
        endTimeRef.current = Date.now() + timeLeft * 1000;
      }

      timerRef.current = setInterval(() => {
        if (!endTimeRef.current) return;
        const remaining = Math.round((endTimeRef.current - Date.now()) / 1000);

        if (remaining <= 0) {
          clearInterval(timerRef.current!);
          setIsRunning(false);
          endTimeRef.current = null;
          handleSessionComplete();
        } else {
          setTimeLeft(remaining);
        }
      }, 250);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      endTimeRef.current = null;
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const startTimer = () => {
    soundEngine.playClick();
    setIsRunning(true);
  };

  const pauseTimer = () => {
    soundEngine.playClick();
    setIsRunning(false);
  };

  const resetTimer = () => {
    soundEngine.playClick();
    setIsRunning(false);
    endTimeRef.current = null;
    const dur =
      mode === 'focus'
        ? settings.focusDuration
        : mode === 'short_break'
        ? settings.shortBreakDuration
        : settings.longBreakDuration;
    setTimeLeft(dur * 60);
  };

  const switchMode = (newMode: 'focus' | 'short_break' | 'long_break') => {
    soundEngine.playClick();
    setIsRunning(false);
    endTimeRef.current = null;
    setMode(newMode);
    const dur =
      newMode === 'focus'
        ? settings.focusDuration
        : newMode === 'short_break'
        ? settings.shortBreakDuration
        : settings.longBreakDuration;
    setTimeLeft(dur * 60);
  };

  const handleSessionComplete = () => {
    soundEngine.playSuccess();
    const durationMins = Math.round(
      (mode === 'focus'
        ? settings.focusDuration
        : mode === 'short_break'
        ? settings.shortBreakDuration
        : settings.longBreakDuration)
    );

    if (mode === 'focus') {
      // Record completed session
      const newRecord: FocusSessionRecord = {
        id: 'ses_' + Date.now(),
        taskTitle: activeTaskTitle,
        durationMinutes: durationMins,
        completedAt: new Date().toISOString(),
        type: 'focus',
      };

      setSessionHistory((prev) => [newRecord, ...prev]);

      // Update Daily Goals (minutes & sessions)
      setGoals((prev) =>
        prev.map((g) => {
          if (g.targetType === 'minutes') {
            const nextVal = Math.min(g.targetValue, g.currentValue + durationMins);
            return { ...g, currentValue: nextVal, isCompleted: nextVal >= g.targetValue };
          }
          if (g.targetType === 'sessions') {
            const nextVal = Math.min(g.targetValue, g.currentValue + 1);
            return { ...g, currentValue: nextVal, isCompleted: nextVal >= g.targetValue };
          }
          return g;
        })
      );

      if (onLog) {
        onLog(`[FOCUS_STUDIO] Completed focus session "${activeTaskTitle}" (${durationMins} mins)`, 'INTELLIGENCE');
      }

      // Switch to short break
      switchMode('short_break');
    } else {
      switchMode('focus');
    }
  };

  // =========================================================================
  // TASK MANAGEMENT
  // =========================================================================
  const handleSaveNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    soundEngine.playSuccess();

    const task: FocusTask = {
      id: 'task_' + Date.now(),
      title: newTaskTitle.trim(),
      description: newTaskDesc.trim() || undefined,
      priority: newTaskPriority,
      estimatedMinutes: Number(newTaskEst) || 25,
      status: 'To Do',
      category: newTaskCat.trim() || 'General',
      createdAt: new Date().toISOString(),
    };

    setTasks((prev) => [task, ...prev]);
    setIsEditingTask(false);
    setNewTaskTitle('');
    setNewTaskDesc('');
  };

  const handleToggleTaskComplete = (taskId: string) => {
    soundEngine.playClick();
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextStatus = t.status === 'Completed' ? 'To Do' : 'Completed';
          if (nextStatus === 'Completed') {
            // Update goals for completed task
            setGoals((gPrev) =>
              gPrev.map((g) => {
                if (g.targetType === 'tasks') {
                  const nextVal = Math.min(g.targetValue, g.currentValue + 1);
                  return { ...g, currentValue: nextVal, isCompleted: nextVal >= g.targetValue };
                }
                return g;
              })
            );
          }
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  const handleDeleteTask = (taskId: string) => {
    soundEngine.playClick();
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // =========================================================================
  // AI FOCUS COACH
  // =========================================================================
  const handleFetchAiCoach = async (taskTitle: string) => {
    soundEngine.playClick();
    setLoadingCoach(true);
    setAiCoachAdvice(null);
    setActiveTab('overview');

    try {
      const res = await fetch('/api/focus/coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          taskTitle,
          userRoutine: settings.routineName,
          totalTasksCount: tasks.length,
          completedTasksCount: tasks.filter((t) => t.status === 'Completed').length,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        soundEngine.playSuccess();
        setAiCoachAdvice(data.advice);
      } else {
        throw new Error(data.error || 'Coach request failed.');
      }
    } catch (err: any) {
      soundEngine.playAlertBeep();
      setAiCoachAdvice(`⚠️ AI Coach unavailable: ${err?.message || 'Network error'}`);
    } finally {
      setLoadingCoach(false);
    }
  };

  // Progress summary stats
  const totalFocusedMinutesToday = sessionHistory.reduce((acc, s) => acc + s.durationMinutes, 0);
  const completedSessionsToday = sessionHistory.length;
  const completedTasksToday = tasks.filter((t) => t.status === 'Completed').length;
  const goalsCompletedCount = goals.filter((g) => g.isCompleted).length;
  const goalCompletionPercentage = Math.round((goalsCompletedCount / Math.max(1, goals.length)) * 100);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  };

  return (
    <ModalWrapper title="🎯 FOCUS STUDIO — PRODUCTIVITY WORKSPACE" onClose={onClose} maxWidthClass={distractionFree ? 'max-w-7xl h-[95vh]' : 'max-w-6xl'}>
      <div className={`flex flex-col space-y-4 font-mono text-emerald-400 text-xs ${distractionFree ? 'bg-black p-6 rounded-xl' : 'min-h-[620px]'}`}>

        {/* --- TOP HEADER NAVIGATION TABS --- */}
        {!distractionFree && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-950 pb-3">
            <div>
              <h2 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400 animate-pulse" />
                FOCUS STUDIO
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Focus better, achieve daily goals, and track your progress.
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'timer', label: 'Focus Timer' },
                { id: 'tasks', label: 'My Tasks' },
                { id: 'goals', label: 'Daily Goals' },
                { id: 'progress', label: 'Progress' },
                { id: 'settings', label: 'Settings' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { soundEngine.playClick(); setActiveTab(tab.id as FocusTab); }}
                  className={`px-3 py-1.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                      : 'bg-black text-emerald-400 border border-emerald-950 hover:border-emerald-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              <button
                onClick={() => { soundEngine.playClick(); setDistractionFree(true); setActiveTab('timer'); }}
                className="bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-1"
                title="Enter Distraction-Free Focus Mode"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Zen Mode</span>
              </button>
            </div>
          </div>
        )}

        {/* Distraction Free Exit Bar */}
        {distractionFree && (
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
              Distraction-Free Zen Workspace
            </span>
            <button
              onClick={() => { soundEngine.playClick(); setDistractionFree(false); }}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1 rounded text-xs"
            >
              Exit Zen Mode
            </button>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 1: OVERVIEW DASHBOARD */}
        {/* ================================================================= */}
        {activeTab === 'overview' && !distractionFree && (
          <div className="space-y-4 flex-1">
            {/* Greeting & Quick Stats Banner */}
            <div className="bg-[#05080c] border border-emerald-950 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-emerald-200">
                  Welcome back, {currentUser.fullName}! 🚀
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Today&apos;s Goal Progress: <span className="text-emerald-400 font-bold">{goalCompletionPercentage}%</span> completed
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => { soundEngine.playClick(); setActiveTab('timer'); }}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-5 py-2 rounded text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>START FOCUS SESSION</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#05080c] border border-emerald-950 p-3.5 rounded-lg space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold">TODAY&apos;S FOCUSED TIME:</span>
                <div className="text-lg font-extrabold text-emerald-300">
                  {totalFocusedMinutesToday} <span className="text-xs text-zinc-500">mins</span>
                </div>
                <div className="text-[10px] text-zinc-500">Target: {settings.dailyMinutesTarget} mins</div>
              </div>

              <div className="bg-[#05080c] border border-emerald-950 p-3.5 rounded-lg space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold">SESSIONS COMPLETED:</span>
                <div className="text-lg font-extrabold text-cyan-300">{completedSessionsToday} sessions</div>
                <div className="text-[10px] text-zinc-500">Routine: {settings.routineName}</div>
              </div>

              <div className="bg-[#05080c] border border-emerald-950 p-3.5 rounded-lg space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold">TASKS FINISHED:</span>
                <div className="text-lg font-extrabold text-amber-300">
                  {completedTasksToday} / {tasks.length} tasks
                </div>
                <div className="text-[10px] text-zinc-500">Active Task Manager</div>
              </div>
            </div>

            {/* Active Task & AI Coach Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Current Focus Task */}
              <div className="bg-[#05080c] border border-emerald-950 rounded-lg p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <ListTodo className="w-4 h-4 text-emerald-400" /> ACTIVE FOCUS TASK
                    </span>
                    <button
                      onClick={() => setActiveTab('tasks')}
                      className="text-[10px] text-zinc-500 hover:text-emerald-300 flex items-center gap-1"
                    >
                      Change <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="bg-black border border-emerald-900 p-3 rounded space-y-1.5">
                    <div className="font-bold text-emerald-200">{activeTaskTitle}</div>
                    <p className="text-[11px] text-zinc-400">
                      Select a task from your task manager to begin timed focus sessions.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleFetchAiCoach(activeTaskTitle)}
                  disabled={loadingCoach}
                  className="w-full bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 font-bold py-2 rounded text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{loadingCoach ? 'AI COACH ANALYZING...' : 'GET AI COACH TASK BREAKDOWN'}</span>
                </button>
              </div>

              {/* AI Coach Advice Box */}
              <div className="bg-[#05080c] border border-cyan-950 rounded-lg p-4 space-y-2 flex flex-col">
                <div className="flex items-center gap-2 font-bold text-xs text-cyan-300 border-b border-cyan-950 pb-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>AI FOCUS COACH ADVICE</span>
                </div>
                <div className="text-[11px] text-zinc-300 leading-relaxed overflow-y-auto max-h-44 pr-1 font-mono whitespace-pre-wrap">
                  {aiCoachAdvice || 'Click "Get AI Coach Task Breakdown" above to generate a personalized focus strategy and session structure.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: FOCUS TIMER (ZEN WORKSPACE) */}
        {/* ================================================================= */}
        {(activeTab === 'timer' || distractionFree) && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-6">
            {/* Mode Switcher Buttons */}
            <div className="flex items-center gap-2 bg-black border border-emerald-950 p-1.5 rounded-full">
              {[
                { id: 'focus', label: 'Focus (25m)' },
                { id: 'short_break', label: 'Short Break (5m)' },
                { id: 'long_break', label: 'Long Break (15m)' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => switchMode(m.id as any)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    mode === m.id
                      ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                      : 'text-zinc-400 hover:text-emerald-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Current Active Task Banner */}
            <div className="text-center space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Current Focus Session</span>
              <div className="font-bold text-sm text-emerald-200">{activeTaskTitle}</div>
            </div>

            {/* Giant Countdown Clock */}
            <div className="relative flex items-center justify-center p-8 bg-[#05080c] border-2 border-emerald-500/80 rounded-full w-64 h-64 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <div className="text-5xl font-extrabold text-emerald-300 tracking-wider font-mono">
                {formatTime(timeLeft)}
              </div>
              <div className="absolute bottom-10 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                {mode === 'focus' ? 'Deep Work' : 'Break Time'}
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center gap-3">
              {isRunning ? (
                <button
                  onClick={pauseTimer}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-6 py-2.5 rounded-lg text-xs flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Pause className="w-4 h-4 fill-black" />
                  <span>PAUSE</span>
                </button>
              ) : (
                <button
                  onClick={startTimer}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-8 py-2.5 rounded-lg text-xs flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>START TIMER</span>
                </button>
              )}

              <button
                onClick={resetTimer}
                className="bg-black hover:bg-emerald-950 border border-emerald-900 text-emerald-300 px-4 py-2.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <button
                onClick={handleSessionComplete}
                className="bg-black hover:bg-cyan-950 border border-cyan-900 text-cyan-300 px-4 py-2.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Complete Session</span>
              </button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: TASK TRACKER */}
        {/* ================================================================= */}
        {activeTab === 'tasks' && !distractionFree && (
          <div className="space-y-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-emerald-950 pb-2">
              <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-emerald-400" />
                TASK MANAGER ({tasks.length})
              </h3>
              <button
                onClick={() => { soundEngine.playClick(); setIsEditingTask(true); }}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-3 py-1.5 rounded text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>

            {/* Task Creation Modal / Form */}
            {isEditingTask && (
              <form onSubmit={handleSaveNewTask} className="bg-[#05080c] border border-emerald-500 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between font-bold text-xs text-emerald-200">
                  <span>CREATE NEW FOCUS TASK</span>
                  <button type="button" onClick={() => setIsEditingTask(false)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Task title (e.g. Complete API authentication module)"
                  required
                  className="w-full bg-black border border-emerald-900 rounded px-3 py-1.5 text-xs text-emerald-200 outline-none"
                />
                <textarea
                  rows={2}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Optional description..."
                  className="w-full bg-black border border-emerald-900 rounded p-2 text-xs text-emerald-200 outline-none"
                />
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-500 block font-bold">PRIORITY:</label>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as any)}
                      className="w-full bg-black border border-emerald-900 rounded px-2 py-1 text-xs text-emerald-300 outline-none"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 block font-bold">EST. MINUTES:</label>
                    <input
                      type="number"
                      value={newTaskEst}
                      onChange={(e) => setNewTaskEst(Number(e.target.value))}
                      className="w-full bg-black border border-emerald-900 rounded px-2 py-1 text-xs text-emerald-300 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 block font-bold">CATEGORY:</label>
                    <input
                      type="text"
                      value={newTaskCat}
                      onChange={(e) => setNewTaskCat(e.target.value)}
                      className="w-full bg-black border border-emerald-900 rounded px-2 py-1 text-xs text-emerald-300 outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingTask(false)}
                    className="px-3 py-1 bg-black text-zinc-400 rounded text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1 bg-emerald-500 text-black font-bold rounded text-xs"
                  >
                    Save Task
                  </button>
                </div>
              </form>
            )}

            {/* Task List */}
            <div className="space-y-2 flex-1 overflow-y-auto max-h-[420px] pr-1">
              {tasks.length === 0 ? (
                <div className="py-16 text-center text-zinc-600">
                  <ListTodo className="w-8 h-8 mx-auto text-zinc-700" />
                  <p className="font-bold text-zinc-400 mt-2">NO TASKS CREATED</p>
                  <p className="text-[11px]">Click &ldquo;Add Task&rdquo; to add items to your focus queue.</p>
                </div>
              ) : (
                tasks.map((t) => (
                  <div
                    key={t.id}
                    className={`bg-[#05080c] border rounded-lg p-3 flex items-center justify-between gap-3 transition-colors ${
                      t.status === 'Completed' ? 'border-emerald-900/50 opacity-60' : 'border-emerald-950 hover:border-emerald-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={t.status === 'Completed'}
                        onChange={() => handleToggleTaskComplete(t.id)}
                        className="accent-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <div className="space-y-0.5 truncate">
                        <div className={`font-bold text-xs truncate ${t.status === 'Completed' ? 'line-through text-zinc-500' : 'text-emerald-200'}`}>
                          {t.title}
                        </div>
                        <div className="text-[10px] text-zinc-500 flex items-center gap-2">
                          <span>{t.category}</span>
                          <span>•</span>
                          <span>{t.estimatedMinutes} mins</span>
                          <span
                            className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                              t.priority === 'High' ? 'text-red-400 bg-red-950/40' : 'text-amber-400 bg-amber-950/40'
                            }`}
                          >
                            {t.priority}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActiveTaskTitle(t.title);
                          setActiveTab('timer');
                          soundEngine.playSuccess();
                        }}
                        className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-emerald-300" /> Focus
                      </button>
                      <button
                        onClick={() => handleFetchAiCoach(t.title)}
                        className="p-1 text-cyan-400 hover:text-cyan-300 rounded"
                        title="AI Coach Breakdown"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(t.id)}
                        className="p-1 text-zinc-500 hover:text-red-400 rounded"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: DAILY GOALS */}
        {/* ================================================================= */}
        {activeTab === 'goals' && !distractionFree && (
          <div className="space-y-4 flex-1">
            <div className="border-b border-emerald-950 pb-2">
              <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                DAILY GOALS &amp; PROGRESS TRACKING
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Goals automatically update as you complete focus sessions and finish tasks.
              </p>
            </div>

            <div className="space-y-3">
              {goals.map((g) => {
                const pct = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
                return (
                  <div key={g.id} className="bg-[#05080c] border border-emerald-950 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-emerald-200">{g.title}</span>
                      <span className={g.isCompleted ? 'text-emerald-400' : 'text-zinc-400'}>
                        {g.currentValue} / {g.targetValue} ({pct}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-black rounded-full overflow-hidden border border-emerald-950">
                      <div
                        className={`h-full transition-all duration-500 ${g.isCompleted ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-emerald-600'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 5: PROGRESS DASHBOARD */}
        {/* ================================================================= */}
        {activeTab === 'progress' && !distractionFree && (
          <div className="space-y-4 flex-1">
            <div className="border-b border-emerald-950 pb-2">
              <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                PRODUCTIVITY PROGRESS &amp; STATS
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#05080c] border border-emerald-950 p-4 rounded-lg space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold">TOTAL FOCUSED MINUTES:</span>
                <div className="text-xl font-extrabold text-emerald-300">{totalFocusedMinutesToday} mins</div>
              </div>
              <div className="bg-[#05080c] border border-emerald-950 p-4 rounded-lg space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold">SESSIONS COMPLETED:</span>
                <div className="text-xl font-extrabold text-cyan-300">{completedSessionsToday}</div>
              </div>
              <div className="bg-[#05080c] border border-emerald-950 p-4 rounded-lg space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold">GOAL COMPLETION:</span>
                <div className="text-xl font-extrabold text-amber-300">{goalCompletionPercentage}%</div>
              </div>
            </div>

            {/* Session History Log */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-emerald-300 block">RECENT COMPLETED SESSIONS</span>
              <div className="bg-[#05080c] border border-emerald-950 rounded-lg p-3 space-y-2 max-h-56 overflow-y-auto">
                {sessionHistory.length === 0 ? (
                  <div className="py-8 text-center text-zinc-600">No focus sessions recorded today yet.</div>
                ) : (
                  sessionHistory.map((s) => (
                    <div key={s.id} className="bg-black border border-emerald-950 p-2.5 rounded flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-emerald-200">{s.taskTitle}</span>
                        <div className="text-[10px] text-zinc-500">{new Date(s.completedAt).toLocaleTimeString()}</div>
                      </div>
                      <span className="text-emerald-400 font-bold">+{s.durationMinutes} mins</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 6: SETTINGS & ROUTINES */}
        {/* ================================================================= */}
        {activeTab === 'settings' && !distractionFree && (
          <div className="space-y-4 flex-1 max-w-xl">
            <div className="border-b border-emerald-950 pb-2">
              <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-400" />
                WORK SESSION ROUTINES &amp; PREFERENCES
              </h3>
            </div>

            <div className="bg-[#05080c] border border-emerald-950 rounded-lg p-4 space-y-3">
              <div>
                <label className="text-[10px] text-zinc-500 block font-bold">FOCUS DURATION (MINUTES):</label>
                <input
                  type="number"
                  value={settings.focusDuration}
                  onChange={(e) => setSettings({ ...settings, focusDuration: Number(e.target.value) || 25 })}
                  className="w-full bg-black border border-emerald-900 rounded px-3 py-1.5 text-xs text-emerald-200 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 block font-bold">SHORT BREAK DURATION (MINUTES):</label>
                <input
                  type="number"
                  value={settings.shortBreakDuration}
                  onChange={(e) => setSettings({ ...settings, shortBreakDuration: Number(e.target.value) || 5 })}
                  className="w-full bg-black border border-emerald-900 rounded px-3 py-1.5 text-xs text-emerald-200 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 block font-bold">LONG BREAK DURATION (MINUTES):</label>
                <input
                  type="number"
                  value={settings.longBreakDuration}
                  onChange={(e) => setSettings({ ...settings, longBreakDuration: Number(e.target.value) || 15 })}
                  className="w-full bg-black border border-emerald-900 rounded px-3 py-1.5 text-xs text-emerald-200 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 block font-bold">DAILY FOCUSED MINUTE TARGET:</label>
                <input
                  type="number"
                  value={settings.dailyMinutesTarget}
                  onChange={(e) => setSettings({ ...settings, dailyMinutesTarget: Number(e.target.value) || 120 })}
                  className="w-full bg-black border border-emerald-900 rounded px-3 py-1.5 text-xs text-emerald-200 outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    soundEngine.playSuccess();
                    alert('Focus session settings saved successfully!');
                  }}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-5 py-2 rounded text-xs"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ModalWrapper>
  );
};
