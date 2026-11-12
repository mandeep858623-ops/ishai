import React, { useState, useEffect, useMemo, useRef } from 'react';
import { soundEngine, speakText } from '../utils/audio';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Trash2,
  Edit3,
  Search,
  Filter,
  ArrowUpDown,
  Sparkles,
  Layers,
  AlertTriangle,
  FolderPlus,
  Bell,
  BellOff,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  TrendingUp,
  Brain,
  Coffee,
  X,
  Play,
  RotateCcw,
  Check,
  Send,
  Loader2,
  FileCheck,
  CalendarDays,
  Target,
  Maximize2,
  ExternalLink,
} from 'lucide-react';

export interface PlannerTask {
  id: string;
  title: string;
  description?: string;
  category: 'Study' | 'Work' | 'Personal' | 'Projects' | string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  estimatedMinutes?: number;
  isCompleted: boolean;
  completedAt?: string;
  reminderTime?: string; // YYYY-MM-DDTHH:mm
  projectId?: string;
  subtasks?: Array<{ id: string; title: string; isCompleted: boolean }>;
  createdAt: string;
}

export interface TimeBlock {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  title: string;
  category: string;
  isBreak?: boolean;
  taskId?: string;
  notes?: string;
}

export interface PlannerProject {
  id: string;
  name: string;
  description: string;
  category: string;
  targetDate: string;
  milestones: Array<{ id: string; title: string; isCompleted: boolean; targetDate?: string }>;
  createdAt: string;
}

interface SmartPlannerModalProps {
  onClose: () => void;
  onLog: (text: string, tag: string) => void;
  voiceGender?: 'Male' | 'Female';
  audioMuted?: boolean;
  initialTab?: 'dashboard' | 'tasks' | 'ai_planner' | 'calendar' | 'projects' | 'settings';
  initialAction?: string;
}

const STORAGE_KEY = 'superai_smart_planner_v1';

const CATEGORIES = ['All', 'Study', 'Work', 'Personal', 'Projects'];
const PRIORITIES = ['all', 'urgent', 'high', 'medium', 'low'];

const AI_SUGGESTED_PROMPTS = [
  'Plan my day with high focus and realistic breaks',
  'Make a revision timetable for my upcoming exams',
  'Help me finish this work project by Friday',
  'Create a balanced weekly study schedule',
  'Break this big project into manageable daily steps',
];

export const SmartPlannerModal: React.FC<SmartPlannerModalProps> = ({
  onClose,
  onLog,
  voiceGender = 'Male',
  audioMuted = false,
  initialTab,
  initialAction,
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'ai_planner' | 'calendar' | 'projects' | 'settings'>(initialTab || 'dashboard');

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (initialAction === 'show_today_tasks') {
       setFilterStatus('today');
       setActiveTab('tasks');
    }
  }, [initialAction]);

  // Core state
  const [tasks, setTasks] = useState<PlannerTask[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_tasks`);
      if (stored) return JSON.parse(stored);
    } catch {}
    // Initial sample tasks
    const today = new Date().toISOString().split('T')[0];
    return [
      {
        id: 'task_sample_1',
        title: 'Review System Architecture & Module Integrations',
        description: 'Verify end-to-end telemetry and neural pipeline stability.',
        category: 'Work',
        priority: 'high',
        dueDate: today,
        dueTime: '11:00',
        estimatedMinutes: 60,
        isCompleted: false,
        subtasks: [
          { id: 'sub_1', title: 'Inspect terminal log buffers', isCompleted: true },
          { id: 'sub_2', title: 'Test latency benchmarks', isCompleted: false },
        ],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'task_sample_2',
        title: 'Physics & Computational Mathematics Revision',
        description: 'Review quantum state algorithms and differential manifolds.',
        category: 'Study',
        priority: 'urgent',
        dueDate: today,
        dueTime: '15:30',
        estimatedMinutes: 90,
        isCompleted: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'task_sample_3',
        title: 'Hydration and 30-min Physical Conditioning',
        category: 'Personal',
        priority: 'medium',
        dueDate: today,
        dueTime: '17:30',
        estimatedMinutes: 30,
        isCompleted: true,
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    ];
  });

  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_blocks`);
      if (stored) return JSON.parse(stored);
    } catch {}
    const today = new Date().toISOString().split('T')[0];
    return [
      { id: 'b1', date: today, startTime: '09:00', endTime: '10:30', title: 'Deep Work: System Architecture', category: 'Work', isBreak: false },
      { id: 'b2', date: today, startTime: '10:30', endTime: '10:45', title: 'Cognitive Reset & Tea', category: 'Break', isBreak: true },
      { id: 'b3', date: today, startTime: '10:45', endTime: '12:30', title: 'Physics Research Sprint', category: 'Study', isBreak: false },
      { id: 'b4', date: today, startTime: '12:30', endTime: '13:30', title: 'Lunch & Sunlight Walk', category: 'Break', isBreak: true },
      { id: 'b5', date: today, startTime: '14:00', endTime: '16:00', title: 'Project Implementation', category: 'Projects', isBreak: false },
    ];
  });

  const [projects, setProjects] = useState<PlannerProject[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_projects`);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: 'proj_1',
        name: 'SUPERAI Operating System Expansion',
        description: 'Full-stack intelligence enhancement, multi-modal engines, and deep productivity.',
        category: 'Projects',
        targetDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        milestones: [
          { id: 'm1', title: 'Launch Autonomous Deep Research Engine', isCompleted: true },
          { id: 'm2', title: 'Implement Smart Planner with AI scheduling', isCompleted: false },
          { id: 'm3', title: 'Deploy verified real-time conflict detector', isCompleted: false },
        ],
        createdAt: new Date().toISOString(),
      },
    ];
  });

  // Task filter & search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'today' | 'pending' | 'completed' | 'overdue'>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'priority' | 'newest'>('deadline');

  // Task editor modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PlannerTask | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    category: 'Work',
    priority: 'medium' as PlannerTask['priority'],
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '12:00',
    estimatedMinutes: 45,
    reminderTime: '',
    subtaskInput: '',
    subtasks: [] as Array<{ id: string; title: string; isCompleted: boolean }>,
  });

  // Calendar view mode
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('day');
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockForm, setBlockForm] = useState({
    title: '',
    startTime: '09:00',
    endTime: '10:00',
    category: 'Work',
    isBreak: false,
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // AI Planner Assistant state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProposedPlan, setAiProposedPlan] = useState<{
    summary: string;
    clarificationPrompt?: string;
    timeBlocks: TimeBlock[];
    tasks: Array<Partial<PlannerTask>>;
    tips: string[];
  } | null>(null);
  const [aiSuccessToast, setAiSuccessToast] = useState(false);

  // Task breakdown AI state
  const [breakingDownTaskId, setBreakingDownTaskId] = useState<string | null>(null);

  // New Project modal state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    category: 'Projects',
    targetDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  });
  const [projectAiLoading, setProjectAiLoading] = useState(false);

  // Notifications and reminders
  const [notificationsGranted, setNotificationsGranted] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  });
  const [activeAlertReminder, setActiveAlertReminder] = useState<string | null>(null);

  // Save to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_tasks`, JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_blocks`, JSON.stringify(timeBlocks));
    } catch {}
  }, [timeBlocks]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_projects`, JSON.stringify(projects));
    } catch {}
  }, [projects]);

  // In-App Reminder Interval Monitor
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentIsoMinute = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm

      tasks.forEach((t) => {
        if (!t.isCompleted && t.reminderTime && t.reminderTime.slice(0, 16) === currentIsoMinute) {
          setActiveAlertReminder(`⏰ REMINDER: "${t.title}" is due now!`);
          soundEngine.playAlertBeep();
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('Smart Planner Reminder', {
                body: `Task: ${t.title} (${t.priority.toUpperCase()})`,
                icon: '/favicon.ico',
              });
            } catch {}
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [tasks]);

  // Request browser notification permission
  const requestBrowserNotificationPermission = async () => {
    soundEngine.playClick();
    if (!('Notification' in window)) {
      alert('Browser notifications are not supported in this environment.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsGranted(true);
      soundEngine.playSuccess();
      onLog('🔔 Browser notifications enabled for Smart Planner reminders.', 'SYSTEM');
    } else {
      setNotificationsGranted(false);
      onLog('⚠️ Browser notifications were declined. In-app chimes will be used instead.', 'CONFIG');
    }
  };

  // Date calculations
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }
      // Category
      if (filterCategory !== 'All' && task.category !== filterCategory) {
        return false;
      }
      // Priority
      if (filterPriority !== 'all' && task.priority !== filterPriority) {
        return false;
      }
      // Status
      if (filterStatus === 'today') {
        return task.dueDate === todayStr;
      } else if (filterStatus === 'pending') {
        return !task.isCompleted;
      } else if (filterStatus === 'completed') {
        return task.isCompleted;
      } else if (filterStatus === 'overdue') {
        return !task.isCompleted && task.dueDate < todayStr;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'deadline') {
        const dateA = `${a.dueDate} ${a.dueTime || '23:59'}`;
        const dateB = `${b.dueDate} ${b.dueTime || '23:59'}`;
        return dateA.localeCompare(dateB);
      } else if (sortBy === 'priority') {
        const order: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
        return (order[b.priority] || 0) - (order[a.priority] || 0);
      } else {
        return b.createdAt.localeCompare(a.createdAt);
      }
    });
  }, [tasks, searchQuery, filterCategory, filterPriority, filterStatus, sortBy, todayStr]);

  // Metrics
  const metrics = useMemo(() => {
    const dueToday = tasks.filter((t) => t.dueDate === todayStr);
    const upcoming = tasks.filter((t) => t.dueDate > todayStr && !t.isCompleted);
    const completed = tasks.filter((t) => t.isCompleted);
    const overdue = tasks.filter((t) => !t.isCompleted && t.dueDate < todayStr);

    const total = tasks.length;
    const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

    return {
      total,
      dueToday: dueToday.length,
      upcoming: upcoming.length,
      completed: completed.length,
      overdue: overdue.length,
      completionRate,
    };
  }, [tasks, todayStr]);

  // Conflict detection in schedule time blocks
  const detectedConflicts = useMemo(() => {
    const conflicts: Array<{ blockA: TimeBlock; blockB: TimeBlock }> = [];
    const dateMap: Record<string, TimeBlock[]> = {};

    timeBlocks.forEach((b) => {
      if (!dateMap[b.date]) dateMap[b.date] = [];
      dateMap[b.date].push(b);
    });

    Object.values(dateMap).forEach((dayBlocks) => {
      for (let i = 0; i < dayBlocks.length; i++) {
        for (let j = i + 1; j < dayBlocks.length; j++) {
          const a = dayBlocks[i];
          const b = dayBlocks[j];
          // Check overlap: startA < endB and endA > startB
          if (a.startTime < b.endTime && a.endTime > b.startTime) {
            conflicts.push({ blockA: a, blockB: b });
          }
        }
      }
    });

    return conflicts;
  }, [timeBlocks]);

  // Task Actions
  const toggleTaskCompletion = (id: string) => {
    soundEngine.playClick();
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextState = !t.isCompleted;
          if (nextState) {
            soundEngine.playSuccess();
            onLog(`✅ Task marked completed: "${t.title}"`, 'TASK');
          }
          return {
            ...t,
            isCompleted: nextState,
            completedAt: nextState ? new Date().toISOString() : undefined,
          };
        }
        return t;
      })
    );
  };

  const deleteTask = (id: string) => {
    soundEngine.playClick();
    setTasks((prev) => prev.filter((t) => t.id !== id));
    onLog('🗑️ Task removed from planner.', 'TASK');
  };

  const openTaskEditor = (task?: PlannerTask) => {
    soundEngine.playClick();
    if (task) {
      setEditingTask(task);
      setTaskForm({
        title: task.title,
        description: task.description || '',
        category: task.category,
        priority: task.priority,
        dueDate: task.dueDate,
        dueTime: task.dueTime || '12:00',
        estimatedMinutes: task.estimatedMinutes || 45,
        reminderTime: task.reminderTime || '',
        subtaskInput: '',
        subtasks: task.subtasks || [],
      });
    } else {
      setEditingTask(null);
      setTaskForm({
        title: '',
        description: '',
        category: 'Work',
        priority: 'medium',
        dueDate: todayStr,
        dueTime: '12:00',
        estimatedMinutes: 45,
        reminderTime: '',
        subtaskInput: '',
        subtasks: [],
      });
    }
    setIsTaskModalOpen(true);
  };

  const saveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    soundEngine.playSuccess();

    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                title: taskForm.title.trim(),
                description: taskForm.description.trim(),
                category: taskForm.category,
                priority: taskForm.priority,
                dueDate: taskForm.dueDate,
                dueTime: taskForm.dueTime,
                estimatedMinutes: Number(taskForm.estimatedMinutes) || 30,
                reminderTime: taskForm.reminderTime || undefined,
                subtasks: taskForm.subtasks,
              }
            : t
        )
      );
      onLog(`✏️ Task updated: "${taskForm.title.trim()}"`, 'TASK');
    } else {
      const newTask: PlannerTask = {
        id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        category: taskForm.category,
        priority: taskForm.priority,
        dueDate: taskForm.dueDate,
        dueTime: taskForm.dueTime,
        estimatedMinutes: Number(taskForm.estimatedMinutes) || 30,
        reminderTime: taskForm.reminderTime || undefined,
        isCompleted: false,
        subtasks: taskForm.subtasks,
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => [newTask, ...prev]);
      onLog(`➕ New Task added: "${taskForm.title.trim()}"`, 'TASK');
    }

    setIsTaskModalOpen(false);
  };

  // Add subtask inside form
  const addSubtaskToForm = () => {
    if (!taskForm.subtaskInput.trim()) return;
    setTaskForm((prev) => ({
      ...prev,
      subtasks: [
        ...prev.subtasks,
        {
          id: `sub_${Date.now()}`,
          title: prev.subtaskInput.trim(),
          isCompleted: false,
        },
      ],
      subtaskInput: '',
    }));
  };

  const toggleSubtaskInTask = (taskId: string, subtaskId: string) => {
    soundEngine.playClick();
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId && t.subtasks) {
          const updated = t.subtasks.map((st) =>
            st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
          );
          return { ...t, subtasks: updated };
        }
        return t;
      })
    );
  };

  // Break down task with AI
  const handleBreakdownTaskWithAI = async (task: PlannerTask) => {
    soundEngine.playClick();
    setBreakingDownTaskId(task.id);
    onLog(`🤖 AI breaking down task into steps: "${task.title}"`, 'INTELLIGENCE');

    try {
      const res = await fetch('/api/ai/planner/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskTitle: task.title,
          taskDescription: task.description,
          deadline: task.dueDate,
        }),
      });

      const data = await res.json();
      if (Array.isArray(data.steps) && data.steps.length > 0) {
        const newSubtasks = data.steps.map((s: any, idx: number) => ({
          id: `ai_sub_${Date.now()}_${idx}`,
          title: `${s.title} (${s.estimatedMinutes || 25}m)`,
          isCompleted: false,
        }));

        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  subtasks: [...(t.subtasks || []), ...newSubtasks],
                }
              : t
          )
        );
        soundEngine.playSuccess();
        onLog(`✨ AI generated ${newSubtasks.length} sub-steps for "${task.title}"`, 'TASK');
      }
    } catch (err: any) {
      console.warn('Breakdown error:', err);
    } finally {
      setBreakingDownTaskId(null);
    }
  };

  // Time Block Actions
  const openBlockEditor = (block?: TimeBlock, initialDate?: string) => {
    soundEngine.playClick();
    if (block) {
      setBlockForm({
        title: block.title,
        startTime: block.startTime,
        endTime: block.endTime,
        category: block.category,
        isBreak: !!block.isBreak,
        date: block.date,
        notes: block.notes || '',
      });
    } else {
      setBlockForm({
        title: '',
        startTime: '09:00',
        endTime: '10:00',
        category: 'Work',
        isBreak: false,
        date: initialDate || todayStr,
        notes: '',
      });
    }
    setIsBlockModalOpen(true);
  };

  const saveTimeBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockForm.title.trim()) return;
    soundEngine.playSuccess();

    const newBlock: TimeBlock = {
      id: `block_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      title: blockForm.title.trim(),
      startTime: blockForm.startTime,
      endTime: blockForm.endTime,
      category: blockForm.category,
      isBreak: blockForm.isBreak,
      date: blockForm.date,
      notes: blockForm.notes.trim() || undefined,
    };

    setTimeBlocks((prev) => [...prev, newBlock].sort((a, b) => a.startTime.localeCompare(b.startTime)));
    setIsBlockModalOpen(false);
    onLog(`📅 Time block scheduled: [${blockForm.startTime} - ${blockForm.endTime}] ${blockForm.title}`, 'CALENDAR');
  };

  const deleteTimeBlock = (id: string) => {
    soundEngine.playClick();
    setTimeBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  // AI Planner generation
  const handleGenerateAiPlan = async (customPrompt?: string) => {
    const targetPrompt = (customPrompt || aiPrompt).trim();
    if (!targetPrompt || aiLoading) return;

    soundEngine.playClick();
    setAiLoading(true);
    setAiProposedPlan(null);
    onLog(`🤖 AI Planner synthesizing optimal schedule: "${targetPrompt}"`, 'INTELLIGENCE');

    if (!audioMuted) {
      speakText('Generating optimized schedule and task structure.', voiceGender);
    }

    try {
      const res = await fetch('/api/ai/planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: targetPrompt,
          currentTasks: tasks.filter((t) => !t.isCompleted),
          currentDate: todayStr,
        }),
      });

      const data = await res.json();
      setAiProposedPlan(data);
      soundEngine.playSuccess();
      onLog('✨ AI Smart Schedule proposal prepared for review.', 'INTELLIGENCE');
    } catch (err: any) {
      console.error('AI plan error:', err);
      onLog(`⚠️ AI Planning failed: ${err.message}`, 'ALERT');
    } finally {
      setAiLoading(false);
    }
  };

  // Accept proposed AI plan
  const handleAcceptAiPlan = () => {
    if (!aiProposedPlan) return;
    soundEngine.playSuccess();

    // 1. Add proposed time blocks for today
    if (Array.isArray(aiProposedPlan.timeBlocks) && aiProposedPlan.timeBlocks.length > 0) {
      const formattedBlocks: TimeBlock[] = aiProposedPlan.timeBlocks.map((b, i) => ({
        id: `ai_b_${Date.now()}_${i}`,
        date: todayStr,
        startTime: b.startTime,
        endTime: b.endTime,
        title: b.title,
        category: b.category || 'Work',
        isBreak: !!b.isBreak,
        notes: b.notes,
      }));
      setTimeBlocks((prev) => [...prev, ...formattedBlocks].sort((a, b) => a.startTime.localeCompare(b.startTime)));
    }

    // 2. Add proposed tasks
    if (Array.isArray(aiProposedPlan.tasks) && aiProposedPlan.tasks.length > 0) {
      const formattedTasks: PlannerTask[] = aiProposedPlan.tasks.map((t, i) => ({
        id: `ai_t_${Date.now()}_${i}`,
        title: t.title || 'Focus Deliverable',
        description: t.description || 'Generated by Smart AI Planner',
        category: t.category || 'Work',
        priority: (t.priority as any) || 'medium',
        dueDate: t.dueDate || todayStr,
        dueTime: '17:00',
        estimatedMinutes: t.estimatedMinutes || 45,
        isCompleted: false,
        createdAt: new Date().toISOString(),
      }));
      setTasks((prev) => [...formattedTasks, ...prev]);
    }

    setAiSuccessToast(true);
    setTimeout(() => setAiSuccessToast(false), 3000);
    setAiProposedPlan(null);
    onLog('✅ AI Plan accepted and integrated into board & schedule.', 'TASK');

    if (!audioMuted) {
      speakText('Schedule and tasks accepted and integrated.', voiceGender);
    }
  };

  // Projects logic
  const saveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.name.trim()) return;
    soundEngine.playSuccess();

    const newProj: PlannerProject = {
      id: `proj_${Date.now()}`,
      name: projectForm.name.trim(),
      description: projectForm.description.trim(),
      category: projectForm.category,
      targetDate: projectForm.targetDate,
      milestones: [],
      createdAt: new Date().toISOString(),
    };

    setProjects((prev) => [newProj, ...prev]);
    setIsProjectModalOpen(false);
    onLog(`📁 New Project created: "${projectForm.name}"`, 'PROJECT');
  };

  const deleteProject = (id: string) => {
    soundEngine.playClick();
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleMilestone = (projectId: string, milestoneId: string) => {
    soundEngine.playClick();
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const updated = p.milestones.map((m) =>
            m.id === milestoneId ? { ...m, isCompleted: !m.isCompleted } : m
          );
          return { ...p, milestones: updated };
        }
        return p;
      })
    );
  };

  // AI Project Roadmap Generator
  const generateAiProjectRoadmap = async (proj: PlannerProject) => {
    soundEngine.playClick();
    setProjectAiLoading(true);
    onLog(`🤖 AI generating milestone roadmap for project: "${proj.name}"`, 'INTELLIGENCE');

    try {
      const res = await fetch('/api/ai/planner/project-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: proj.name,
          description: proj.description,
          targetDate: proj.targetDate,
        }),
      });

      const data = await res.json();
      if (Array.isArray(data.milestones)) {
        const generatedMilestones = data.milestones.map((m: any, idx: number) => ({
          id: `m_ai_${Date.now()}_${idx}`,
          title: m.title,
          targetDate: m.targetDate || proj.targetDate,
          isCompleted: false,
        }));

        setProjects((prev) =>
          prev.map((p) =>
            p.id === proj.id
              ? { ...p, milestones: [...p.milestones, ...generatedMilestones] }
              : p
          )
        );
        soundEngine.playSuccess();
        onLog(`✨ AI generated ${generatedMilestones.length} milestones for "${proj.name}"`, 'PROJECT');
      }
    } catch (err: any) {
      console.warn('Project AI error:', err);
    } finally {
      setProjectAiLoading(false);
    }
  };

  // Export & Import backup JSON
  const exportPlannerData = () => {
    soundEngine.playClick();
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tasks,
      timeBlocks,
      projects,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SmartPlanner_Backup_${todayStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onLog('💾 Smart Planner data exported to JSON file.', 'CONFIG');
  };

  const importPlannerData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed.tasks)) setTasks(parsed.tasks);
        if (Array.isArray(parsed.timeBlocks)) setTimeBlocks(parsed.timeBlocks);
        if (Array.isArray(parsed.projects)) setProjects(parsed.projects);
        soundEngine.playSuccess();
        onLog('📂 Smart Planner data restored from backup JSON.', 'CONFIG');
      } catch {
        alert('Invalid backup JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#090b0e] border border-emerald-500/80 shadow-[0_0_35px_rgba(16,185,129,0.25)] rounded-xl max-w-6xl w-full h-[92dvh] flex flex-col font-mono text-zinc-100 overflow-hidden my-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-emerald-500/40 px-3.5 py-2.5 sm:px-5 sm:py-3 bg-[#0d1219] shrink-0">
          <div className="flex items-center gap-2.5 truncate pr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <h3 className="font-bold text-xs sm:text-sm tracking-wider uppercase text-emerald-300 truncate font-mono">
              📅 SMART PLANNER
            </h3>
            <span className="text-zinc-600 hidden sm:inline">|</span>
            <span className="text-zinc-400 text-xs hidden sm:inline font-sans">
              Your day, organized.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openTaskEditor()}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs px-2.5 py-1 rounded flex items-center gap-1 transition-colors shadow-[0_0_10px_rgba(16,185,129,0.3)] active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Task</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="text-[11px] sm:text-xs border border-emerald-500/60 px-2.5 py-1 rounded hover:bg-emerald-500 hover:text-black transition-colors shrink-0 active:scale-95 font-mono"
            >
              [ ✕ CLOSE ]
            </button>
          </div>
        </div>

        {/* IN-APP ALERT BANNER IF ACTIVE REMINDER */}
        {activeAlertReminder && (
          <div className="bg-amber-950 border-b border-amber-500 px-4 py-2 flex items-center justify-between text-xs text-amber-200 font-mono animate-pulse">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{activeAlertReminder}</span>
            </div>
            <button
              onClick={() => setActiveAlertReminder(null)}
              className="text-amber-400 hover:text-white text-xs px-2 py-0.5 border border-amber-700 rounded"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* NAVIGATION TABS */}
        <div className="bg-[#0b0f15] border-b border-zinc-800 px-3 sm:px-4 py-1.5 flex items-center justify-between gap-1 overflow-x-auto text-xs shrink-0 scrollbar-none">
          <div className="flex items-center gap-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
              { id: 'tasks', label: `Task Manager (${tasks.filter(t => !t.isCompleted).length})`, icon: ListTodo },
              { id: 'ai_planner', label: 'Smart AI Planner', icon: Brain, badge: 'AI' },
              { id: 'calendar', label: 'Calendar & Timetable', icon: CalendarDays },
              { id: 'projects', label: `Projects (${projects.length})`, icon: Target },
              { id: 'settings', label: 'Reminders & Sync', icon: Bell },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    soundEngine.playClick();
                    setActiveTab(tab.id as any);
                  }}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-mono transition-colors whitespace-nowrap border ${
                    isActive
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500 font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                      : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1 rounded uppercase font-bold">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-[11px] font-mono text-zinc-500 hidden md:block">
            {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>

        {/* WORKSPACE BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#090b0e] scrollbar-thin scrollbar-thumb-zinc-800">
          {/* ========================================================================= */}
          {/* TAB 1: DASHBOARD */}
          {/* ========================================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              {/* WELCOME BANNER */}
              <div className="bg-gradient-to-r from-[#0d141f] via-[#0b1017] to-[#090d13] border border-emerald-900/50 rounded-xl p-5 sm:p-6 relative overflow-hidden shadow-lg">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest block mb-1">
                      DAILY PRODUCTIVITY MATRIX
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold font-sans text-zinc-100 tracking-tight">
                      Your day, organized.
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-sans">
                      {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      {' • '}
                      <span className="text-emerald-400 font-mono">{metrics.dueToday} tasks due today</span>
                    </p>
                  </div>

                  {/* QUICK ACTION BUTTONS */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => openTaskEditor()}
                      className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>New Task</span>
                    </button>
                    <button
                      onClick={() => {
                        soundEngine.playClick();
                        setActiveTab('ai_planner');
                      }}
                      className="bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>AI Smart Plan</span>
                    </button>
                    <button
                      onClick={() => openBlockEditor()}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Clock className="w-4 h-4" />
                      <span>Add Block</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 4 METRIC CARDS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-[#0c1017] border border-zinc-800 p-4 rounded-xl flex flex-col justify-between">
                  <span className="text-xs font-mono text-zinc-400">Due Today</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-bold font-sans text-cyan-300">{metrics.dueToday}</span>
                    <span className="text-[10px] font-mono text-zinc-500">{metrics.dueToday} active</span>
                  </div>
                </div>

                <div className="bg-[#0c1017] border border-zinc-800 p-4 rounded-xl flex flex-col justify-between">
                  <span className="text-xs font-mono text-zinc-400">Upcoming Tasks</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-bold font-sans text-emerald-300">{metrics.upcoming}</span>
                    <span className="text-[10px] font-mono text-zinc-500">Next 7 days</span>
                  </div>
                </div>

                <div className="bg-[#0c1017] border border-zinc-800 p-4 rounded-xl flex flex-col justify-between">
                  <span className="text-xs font-mono text-zinc-400">Completed</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-2xl font-bold font-sans text-emerald-400">{metrics.completed}</span>
                    <span className="text-[10px] font-mono text-emerald-500">{metrics.completionRate}% Done</span>
                  </div>
                </div>

                <div className="bg-[#0c1017] border border-zinc-800 p-4 rounded-xl flex flex-col justify-between">
                  <span className="text-xs font-mono text-zinc-400">Overdue</span>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className={`text-2xl font-bold font-sans ${metrics.overdue > 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                      {metrics.overdue}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">{metrics.overdue > 0 ? 'Needs attention' : 'All clear'}</span>
                  </div>
                </div>
              </div>

              {/* OVERALL COMPLETION PROGRESS BAR */}
              <div className="bg-[#0b0f15] border border-zinc-800 p-4 rounded-xl">
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-zinc-300 font-bold">TOTAL PROGRESS COMPLETION</span>
                  <span className="text-emerald-400 font-bold">{metrics.completionRate}% ({metrics.completed}/{metrics.total} Tasks)</span>
                </div>
                <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-300"
                    style={{ width: `${metrics.completionRate}%` }}
                  />
                </div>
              </div>

              {/* TWO COLUMN: TODAY'S TIMELINE + PRIORITY TASKS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* TODAY'S TIME BLOCKS */}
                <div className="bg-[#0c1017] border border-zinc-800 rounded-xl p-4 flex flex-col">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
                    <h3 className="text-xs font-mono font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      TODAY'S SCHEDULE TIMELINE
                    </h3>
                    <button
                      onClick={() => openBlockEditor(undefined, todayStr)}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Block
                    </button>
                  </div>

                  <div className="space-y-2 flex-1 overflow-y-auto max-h-72 pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                    {timeBlocks.filter(b => b.date === todayStr).length === 0 ? (
                      <div className="text-center py-8 text-zinc-600 text-xs font-mono">
                        No time blocks scheduled for today.
                        <button
                          onClick={() => setActiveTab('ai_planner')}
                          className="block mx-auto mt-2 text-cyan-400 hover:underline"
                        >
                          ⚡ Let AI generate your day's schedule
                        </button>
                      </div>
                    ) : (
                      timeBlocks
                        .filter(b => b.date === todayStr)
                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                        .map((b) => (
                          <div
                            key={b.id}
                            className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                              b.isBreak
                                ? 'bg-[#0f151e]/50 border-zinc-800 text-zinc-400'
                                : 'bg-[#090d13] border-emerald-950 text-zinc-200 hover:border-emerald-700/60 transition-colors'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="font-mono text-[11px] text-cyan-400 bg-zinc-900 px-1.5 py-0.5 rounded shrink-0">
                                {b.startTime} - {b.endTime}
                              </span>
                              <div className="truncate">
                                <span className={`font-semibold ${b.isBreak ? 'text-zinc-400 italic' : 'text-zinc-100'}`}>
                                  {b.title}
                                </span>
                                {b.notes && (
                                  <span className="text-[11px] text-zinc-500 ml-2 hidden sm:inline truncate">
                                    • {b.notes}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 shrink-0">
                              {b.category}
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* PRIORITY TASKS DUE TODAY */}
                <div className="bg-[#0c1017] border border-zinc-800 rounded-xl p-4 flex flex-col">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
                    <h3 className="text-xs font-mono font-bold text-amber-400 uppercase flex items-center gap-1.5">
                      <ListTodo className="w-3.5 h-3.5" />
                      TASKS REQUIRING ATTENTION
                    </h3>
                    <button
                      onClick={() => openTaskEditor()}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Task
                    </button>
                  </div>

                  <div className="space-y-2 flex-1 overflow-y-auto max-h-72 pr-1 scrollbar-thin scrollbar-thumb-zinc-800">
                    {tasks.filter(t => !t.isCompleted).slice(0, 5).length === 0 ? (
                      <div className="text-center py-8 text-zinc-600 text-xs font-mono">
                        🎉 All caught up! Zero pending tasks.
                      </div>
                    ) : (
                      tasks.filter(t => !t.isCompleted).slice(0, 5).map((t) => (
                        <div
                          key={t.id}
                          className="p-2.5 rounded-lg bg-[#090d13] border border-zinc-800/80 hover:border-zinc-700 flex items-center justify-between gap-2 text-xs transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              onClick={() => toggleTaskCompletion(t.id)}
                              className="text-zinc-500 hover:text-emerald-400 shrink-0"
                            >
                              <Circle className="w-4 h-4" />
                            </button>
                            <div className="truncate">
                              <span className="font-semibold text-zinc-100 truncate block">
                                {t.title}
                              </span>
                              <span className="text-[11px] text-zinc-500 font-mono">
                                Due: {t.dueDate} {t.dueTime || ''}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                              t.priority === 'urgent'
                                ? 'bg-red-950 text-red-400 border border-red-800'
                                : t.priority === 'high'
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}>
                              {t.priority}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: TASK MANAGER */}
          {/* ========================================================================= */}
          {activeTab === 'tasks' && (
            <div className="space-y-4 max-w-5xl mx-auto">
              {/* SEARCH & FILTERS BAR */}
              <div className="bg-[#0b0f15] border border-zinc-800 p-3 sm:p-4 rounded-xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                {/* SEARCH */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search tasks by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#07090d] border border-zinc-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* FILTERS */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {/* STATUS */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="bg-[#07090d] border border-zinc-700 rounded px-2 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="all">All Status</option>
                    <option value="today">Due Today</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>

                  {/* CATEGORY */}
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-[#07090d] border border-zinc-700 rounded px-2 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c === 'All' ? 'All Categories' : c}
                      </option>
                    ))}
                  </select>

                  {/* PRIORITY */}
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="bg-[#07090d] border border-zinc-700 rounded px-2 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>

                  {/* SORT BY */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-[#07090d] border border-zinc-700 rounded px-2 py-1.5 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="deadline">Sort: Deadline</option>
                    <option value="priority">Sort: Priority</option>
                    <option value="newest">Sort: Newest</option>
                  </select>
                </div>
              </div>

              {/* TASKS LIST */}
              <div className="space-y-2.5">
                {filteredTasks.length === 0 ? (
                  <div className="bg-[#0b0f15] border border-zinc-800 rounded-xl p-10 text-center text-zinc-500 text-xs font-mono">
                    <ListTodo className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                    <p className="font-semibold text-zinc-400">No tasks match your current criteria</p>
                    <button
                      onClick={() => openTaskEditor()}
                      className="mt-3 px-3 py-1.5 bg-emerald-500 text-black font-bold rounded-lg text-xs hover:bg-emerald-400 transition-colors inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add a New Task
                    </button>
                  </div>
                ) : (
                  filteredTasks.map((t) => (
                    <div
                      key={t.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        t.isCompleted
                          ? 'bg-[#080b0f]/60 border-zinc-800/50 opacity-60'
                          : 'bg-[#0c1017] border-zinc-800 hover:border-zinc-700 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* LEFT: COMPLETION CHECK + TITLE */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <button
                            onClick={() => toggleTaskCompletion(t.id)}
                            className="mt-0.5 text-zinc-500 hover:text-emerald-400 transition-colors shrink-0"
                          >
                            {t.isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <Circle className="w-5 h-5 text-zinc-600 hover:text-emerald-400" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1">
                            <h4
                              className={`text-sm font-semibold font-sans ${
                                t.isCompleted ? 'line-through text-zinc-500' : 'text-zinc-100'
                              }`}
                            >
                              {t.title}
                            </h4>

                            {t.description && (
                              <p className="text-xs text-zinc-400 font-sans mt-0.5 line-clamp-2">
                                {t.description}
                              </p>
                            )}

                            {/* SUBTASKS */}
                            {t.subtasks && t.subtasks.length > 0 && (
                              <div className="mt-2 space-y-1 pl-1">
                                {t.subtasks.map((st) => (
                                  <div
                                    key={st.id}
                                    onClick={() => toggleSubtaskInTask(t.id, st.id)}
                                    className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-zinc-200 cursor-pointer"
                                  >
                                    <span className="w-3.5 h-3.5 rounded border border-zinc-700 flex items-center justify-center text-[10px]">
                                      {st.isCompleted && <Check className="w-3 h-3 text-emerald-400" />}
                                    </span>
                                    <span className={st.isCompleted ? 'line-through text-zinc-600' : ''}>
                                      {st.title}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* METADATA PILLS */}
                            <div className="flex items-center gap-2 flex-wrap mt-2.5 text-[11px] font-mono">
                              <span className="flex items-center gap-1 text-zinc-400">
                                <CalendarIcon className="w-3 h-3 text-zinc-500" />
                                {t.dueDate} {t.dueTime || ''}
                              </span>

                              <span className="text-zinc-700">•</span>
                              <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                                {t.category}
                              </span>

                              {t.estimatedMinutes && (
                                <>
                                  <span className="text-zinc-700">•</span>
                                  <span className="text-zinc-400 flex items-center gap-0.5">
                                    <Clock className="w-3 h-3 text-zinc-500" />
                                    {t.estimatedMinutes}m
                                  </span>
                                </>
                              )}

                              {t.reminderTime && (
                                <>
                                  <span className="text-zinc-700">•</span>
                                  <span className="text-amber-400 flex items-center gap-0.5">
                                    <Bell className="w-3 h-3" />
                                    Reminder Active
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* RIGHT: PRIORITY BADGE & ACTIONS */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span
                            className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                              t.priority === 'urgent'
                                ? 'bg-red-950 text-red-400 border border-red-800'
                                : t.priority === 'high'
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : t.priority === 'medium'
                                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {t.priority}
                          </span>

                          <div className="flex items-center gap-1">
                            {/* AI BREAKDOWN BUTTON */}
                            <button
                              onClick={() => handleBreakdownTaskWithAI(t)}
                              disabled={breakingDownTaskId === t.id}
                              className="p-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-zinc-800 rounded transition-colors text-xs"
                              title="Break this big task into smaller steps with AI"
                            >
                              {breakingDownTaskId === t.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Sparkles className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <button
                              onClick={() => openTaskEditor(t)}
                              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                              title="Edit task"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => deleteTask(t.id)}
                              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                              title="Delete task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: SMART AI PLANNER */}
          {/* ========================================================================= */}
          {activeTab === 'ai_planner' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="bg-[#0c1017] border border-cyan-900/50 rounded-xl p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-base font-bold text-zinc-100 font-mono">
                    SMART AI SCHEDULING & BREAKDOWN ASSISTANT
                  </h2>
                </div>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  Enter your day or week goals, revision targets, or deadlines. The AI generates conflict-free schedules, incorporates realistic breaks, and organizes concrete micro-tasks for your review before saving.
                </p>

                {/* PROMPT INPUT */}
                <div className="mt-4 flex flex-col gap-2.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Plan my day with exams at 2pm, finish coding project, include lunch and exercise..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleGenerateAiPlan();
                      }}
                      disabled={aiLoading}
                      className="flex-1 bg-[#07090d] border border-cyan-900 focus:border-cyan-400 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
                    />
                    <button
                      onClick={() => handleGenerateAiPlan()}
                      disabled={aiLoading || !aiPrompt.trim()}
                      className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-800 text-black font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      {aiLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Planning...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Generate Plan</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* SUGGESTION CHIPS */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {AI_SUGGESTED_PROMPTS.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setAiPrompt(prompt);
                          handleGenerateAiPlan(prompt);
                        }}
                        className="text-[11px] font-sans bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300 border border-zinc-800 px-2.5 py-1 rounded-full transition-colors"
                      >
                        ⚡ {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SUCCESS NOTIFICATION */}
              {aiSuccessToast && (
                <div className="bg-emerald-950 border border-emerald-500 p-3 rounded-lg flex items-center gap-2 text-xs text-emerald-300 font-mono animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>AI Schedule & Tasks accepted! Check Dashboard or Task Manager.</span>
                </div>
              )}

              {/* PROPOSED PLAN REVIEW DRAWER */}
              {aiProposedPlan && (
                <div className="bg-[#0b0f15] border border-emerald-900/70 rounded-xl p-5 space-y-5 shadow-xl animate-in fade-in duration-200">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800">
                    <div>
                      <span className="text-[10px] font-mono uppercase bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800 font-bold">
                        PROPOSED SCHEDULE REVIEW
                      </span>
                      <h3 className="text-base font-bold text-zinc-100 mt-1">
                        Review Plan Before Accepting
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAcceptAiPlan}
                        className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-colors cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept & Apply Plan</span>
                      </button>
                      <button
                        onClick={() => setAiProposedPlan(null)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs px-3 py-2 rounded-lg transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>

                  {/* SUMMARY & STRATEGY */}
                  <div className="bg-[#07090d] border border-zinc-800 p-3.5 rounded-lg text-xs font-sans text-zinc-300 leading-relaxed">
                    <strong className="text-emerald-400 font-mono block mb-1">STRATEGY RATIONALE:</strong>
                    {aiProposedPlan.summary}
                  </div>

                  {/* CLARIFICATION GUIDANCE IF APPLICABLE */}
                  {aiProposedPlan.clarificationPrompt && (
                    <div className="bg-cyan-950/40 border border-cyan-800 p-3 rounded-lg text-xs font-sans text-cyan-300 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-mono block">SUGGESTION FOR REFINEMENT:</strong>
                        {aiProposedPlan.clarificationPrompt}
                      </div>
                    </div>
                  )}

                  {/* PROPOSED TIME BLOCKS */}
                  <div>
                    <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      Generated Conflict-Free Time Blocks ({aiProposedPlan.timeBlocks.length})
                    </h4>
                    <div className="space-y-1.5">
                      {aiProposedPlan.timeBlocks.map((b, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                            b.isBreak
                              ? 'bg-zinc-900/40 border-zinc-800 text-zinc-400'
                              : 'bg-[#090d13] border-zinc-800 text-zinc-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] text-cyan-400 bg-zinc-900 px-1.5 py-0.5 rounded">
                              {b.startTime} - {b.endTime}
                            </span>
                            <span className={b.isBreak ? 'italic text-zinc-400' : 'font-semibold text-zinc-100'}>
                              {b.title}
                            </span>
                          </div>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                            {b.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PROPOSED TASKS */}
                  {aiProposedPlan.tasks && aiProposedPlan.tasks.length > 0 && (
                    <div>
                      <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <ListTodo className="w-3.5 h-3.5 text-emerald-400" />
                        Proposed Action Items ({aiProposedPlan.tasks.length})
                      </h4>
                      <div className="space-y-1.5">
                        {aiProposedPlan.tasks.map((t, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-[#090d13] border border-zinc-800 text-xs flex items-center justify-between gap-2"
                          >
                            <span className="font-semibold text-zinc-200">{t.title}</span>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                              <span>{t.estimatedMinutes}m</span>
                              <span className="uppercase text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-900">
                                {t.priority}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: CALENDAR & TIMETABLE */}
          {/* ========================================================================= */}
          {activeTab === 'calendar' && (
            <div className="space-y-4 max-w-5xl mx-auto">
              {/* CALENDAR CONTROLS & CONFLICT INDICATOR */}
              <div className="bg-[#0b0f15] border border-zinc-800 p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const prev = new Date(calendarDate);
                      prev.setDate(prev.getDate() - 1);
                      setCalendarDate(prev);
                    }}
                    className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-xs font-bold text-zinc-200">
                    {calendarDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <button
                    onClick={() => {
                      const next = new Date(calendarDate);
                      next.setDate(next.getDate() + 1);
                      setCalendarDate(next);
                    }}
                    className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCalendarDate(new Date())}
                    className="text-[11px] font-mono text-emerald-400 hover:underline ml-2"
                  >
                    Today
                  </button>
                </div>

                {/* VIEW MODES */}
                <div className="flex items-center gap-1.5">
                  <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-xs font-mono">
                    {(['day', 'week', 'month'] as const).map((view) => (
                      <button
                        key={view}
                        onClick={() => setCalendarView(view)}
                        className={`px-3 py-1 rounded capitalize ${
                          calendarView === view ? 'bg-emerald-500 text-black font-bold' : 'text-zinc-400'
                        }`}
                      >
                        {view}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => openBlockEditor(undefined, calendarDate.toISOString().split('T')[0])}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Time Block</span>
                  </button>
                </div>
              </div>

              {/* CONFLICT WARNING BANNER */}
              {detectedConflicts.length > 0 && (
                <div className="bg-amber-950/60 border border-amber-600/80 p-3 rounded-xl flex items-center gap-2 text-xs font-mono text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Schedule Overlap Detected: {detectedConflicts.length} conflict(s) between time blocks. Adjust times to prevent overlapping tasks.
                  </span>
                </div>
              )}

              {/* DAY VIEW */}
              {calendarView === 'day' && (
                <div className="bg-[#0b0f15] border border-zinc-800 rounded-xl p-4 space-y-2">
                  <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-3">
                    SCHEDULE FOR {calendarDate.toISOString().split('T')[0]}
                  </h3>

                  {timeBlocks.filter(b => b.date === calendarDate.toISOString().split('T')[0]).length === 0 ? (
                    <div className="text-center py-12 text-zinc-600 text-xs font-mono">
                      No time blocks on this day. Click "+ Time Block" to schedule.
                    </div>
                  ) : (
                    timeBlocks
                      .filter(b => b.date === calendarDate.toISOString().split('T')[0])
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((b) => (
                        <div
                          key={b.id}
                          className={`p-3 rounded-lg border flex items-center justify-between gap-3 text-xs ${
                            b.isBreak
                              ? 'bg-zinc-900/40 border-zinc-800 text-zinc-400'
                              : 'bg-[#0c1017] border-zinc-800 text-zinc-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs text-cyan-400 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                              {b.startTime} - {b.endTime}
                            </span>
                            <div>
                              <span className="font-semibold text-zinc-100">{b.title}</span>
                              <span className="text-[10px] uppercase font-mono text-zinc-500 ml-2">[{b.category}]</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openBlockEditor(b)}
                              className="text-zinc-500 hover:text-zinc-300 p-1"
                              title="Edit block"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteTimeBlock(b.id)}
                              className="text-zinc-600 hover:text-red-400 p-1"
                              title="Delete block"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}

              {/* WEEK VIEW TIMETABLE */}
              {calendarView === 'week' && (
                <div className="bg-[#0b0f15] border border-zinc-800 rounded-xl p-4 overflow-x-auto">
                  <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-3">
                    WEEKLY TIMETABLE OVERVIEW
                  </h3>

                  <div className="grid grid-cols-7 gap-2 min-w-[700px]">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                      const d = new Date(calendarDate);
                      const currentDay = d.getDay();
                      const distance = idx - (currentDay === 0 ? 6 : currentDay - 1);
                      d.setDate(d.getDate() + distance);
                      const dStr = d.toISOString().split('T')[0];
                      const dayBlocks = timeBlocks.filter(b => b.date === dStr);

                      return (
                        <div key={day} className="bg-[#080b0f] border border-zinc-800/80 rounded-lg p-2 flex flex-col h-72">
                          <div className="text-center pb-1.5 border-b border-zinc-800/60 mb-2">
                            <span className="font-mono text-xs font-bold text-emerald-400 block">{day}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">{d.getMonth() + 1}/{d.getDate()}</span>
                          </div>

                          <div className="space-y-1.5 overflow-y-auto flex-1 text-[11px] scrollbar-none">
                            {dayBlocks.map((b) => (
                              <div
                                key={b.id}
                                className={`p-1.5 rounded border text-[10px] ${
                                  b.isBreak
                                    ? 'bg-zinc-900/60 border-zinc-800 text-zinc-500'
                                    : 'bg-[#0d141e] border-emerald-950 text-zinc-200'
                                }`}
                              >
                                <span className="font-mono text-cyan-400 block">{b.startTime}</span>
                                <span className="truncate block font-semibold">{b.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MONTH VIEW CALENDAR */}
              {calendarView === 'month' && (
                <div className="bg-[#0b0f15] border border-zinc-800 rounded-xl p-4">
                  <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-3">
                    MONTHLY DEADLINES & TASK OVERVIEW
                  </h3>
                  <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-mono">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <div key={d} className="p-2 text-zinc-500 font-bold">{d}</div>
                    ))}
                    {Array.from({ length: 31 }, (_, i) => {
                      const dayNum = i + 1;
                      const dayStr = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                      const dayTasks = tasks.filter(t => t.dueDate === dayStr);

                      return (
                        <div
                          key={i}
                          onClick={() => {
                            const newD = new Date(calendarDate);
                            newD.setDate(dayNum);
                            setCalendarDate(newD);
                            setCalendarView('day');
                          }}
                          className={`min-h-[60px] p-1.5 rounded-lg border text-left cursor-pointer transition-colors ${
                            dayStr === todayStr
                              ? 'bg-emerald-950/60 border-emerald-500'
                              : 'bg-[#080b0f] border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <span className={`text-[11px] font-bold ${dayStr === todayStr ? 'text-emerald-400' : 'text-zinc-400'}`}>
                            {dayNum}
                          </span>
                          <div className="space-y-0.5 mt-1">
                            {dayTasks.slice(0, 2).map(t => (
                              <div key={t.id} className="text-[9px] bg-zinc-900 text-zinc-300 px-1 rounded truncate">
                                {t.title}
                              </div>
                            ))}
                            {dayTasks.length > 2 && (
                              <span className="text-[8px] text-zinc-500">+{dayTasks.length - 2} more</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: PROJECTS & GOALS */}
          {/* ========================================================================= */}
          {activeTab === 'projects' && (
            <div className="space-y-4 max-w-5xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-mono font-bold text-emerald-400 uppercase">
                    PROJECT ROADMAPS & MILESTONE TRACKING
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Group tasks into high-level projects, generate AI roadmaps, and track percentage completion.
                  </p>
                </div>
                <button
                  onClick={() => setIsProjectModalOpen(true)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>New Project</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((proj) => {
                  const completedMilestones = proj.milestones.filter(m => m.isCompleted).length;
                  const totalMilestones = proj.milestones.length;
                  const progressPct = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

                  return (
                    <div key={proj.id} className="bg-[#0c1017] border border-zinc-800 rounded-xl p-4 flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex items-center justify-between text-xs font-mono text-zinc-500 mb-1">
                          <span className="text-emerald-400 font-bold uppercase">{proj.category}</span>
                          <span>Target: {proj.targetDate}</span>
                        </div>
                        <h4 className="text-base font-bold text-zinc-100 font-sans">{proj.name}</h4>
                        <p className="text-xs text-zinc-400 font-sans mt-1 leading-relaxed">
                          {proj.description}
                        </p>

                        {/* PROGRESS BAR */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1">
                            <span>Milestones</span>
                            <span className="text-emerald-400 font-bold">{progressPct}% ({completedMilestones}/{totalMilestones})</span>
                          </div>
                          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progressPct}%` }} />
                          </div>
                        </div>

                        {/* MILESTONE CHECKLIST */}
                        <div className="mt-4 space-y-1.5">
                          {proj.milestones.map((m) => (
                            <div
                              key={m.id}
                              onClick={() => toggleMilestone(proj.id, m.id)}
                              className="flex items-center gap-2 text-xs font-mono text-zinc-300 hover:text-zinc-100 cursor-pointer"
                            >
                              <span className="w-4 h-4 rounded border border-zinc-700 flex items-center justify-center text-[10px]">
                                {m.isCompleted && <Check className="w-3 h-3 text-emerald-400" />}
                              </span>
                              <span className={m.isCompleted ? 'line-through text-zinc-600' : ''}>
                                {m.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* BOTTOM CONTROLS */}
                      <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
                        <button
                          onClick={() => generateAiProjectRoadmap(proj)}
                          disabled={projectAiLoading}
                          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>AI Roadmap Plan</span>
                        </button>
                        <button
                          onClick={() => deleteProject(proj.id)}
                          className="text-zinc-600 hover:text-red-400 p-1"
                          title="Delete project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: SETTINGS, REMINDERS & BACKUP SYNC */}
          {/* ========================================================================= */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* NOTIFICATION PREFERENCES */}
              <div className="bg-[#0c1017] border border-zinc-800 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-mono font-bold text-emerald-400 uppercase flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  NOTIFICATION & REMINDER ENGINE
                </h3>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  Smart Planner features an autonomous in-app reminder loop that checks tasks every 30 seconds and sounds an audible alert when a deadline arrives. You can also grant native browser desktop notifications.
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-zinc-800 text-xs font-mono">
                  <span>Browser Desktop Notifications:</span>
                  <button
                    onClick={requestBrowserNotificationPermission}
                    className={`px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1.5 transition-colors ${
                      notificationsGranted
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                    }`}
                  >
                    {notificationsGranted ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Enabled</span>
                      </>
                    ) : (
                      <>
                        <Bell className="w-3.5 h-3.5" />
                        <span>Enable Notifications</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* DATA PERSISTENCE & BACKUP JSON */}
              <div className="bg-[#0c1017] border border-zinc-800 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-mono font-bold text-cyan-400 uppercase flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  DATA PERSISTENCE & PORTABILITY
                </h3>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  All your tasks, schedule time blocks, and project goals are saved securely in your browser's persistent localStorage. Use the backup tools below to export or restore your data across browsers or computers.
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={exportPlannerData}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Backup (JSON)</span>
                  </button>

                  <label className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer">
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span>Restore from JSON</span>
                    <input type="file" accept=".json" onChange={importPlannerData} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TASK CREATE / EDIT MODAL */}
      {/* ========================================================================= */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-3">
          <div className="bg-[#0d121a] border border-emerald-500/80 rounded-xl max-w-lg w-full p-5 text-zinc-100 font-sans shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4 font-mono text-xs">
              <span className="font-bold text-emerald-400">
                {editingTask ? '✏️ EDIT TASK' : '➕ CREATE NEW TASK'}
              </span>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                ✕
              </button>
            </div>

            <form onSubmit={saveTask} className="space-y-3.5 text-xs">
              <div>
                <label className="font-mono text-zinc-400 text-[11px] block mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete quarterly financial audit report"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full bg-[#07090d] border border-zinc-700 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-mono text-zinc-400 text-[11px] block mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Specific requirements, notes, or links..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full bg-[#07090d] border border-zinc-700 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-zinc-400 text-[11px] block mb-1">Category</label>
                  <select
                    value={taskForm.category}
                    onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                    className="w-full bg-[#07090d] border border-zinc-700 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value="Study">Study</option>
                    <option value="Work">Work</option>
                    <option value="Personal">Personal</option>
                    <option value="Projects">Projects</option>
                  </select>
                </div>

                <div>
                  <label className="font-mono text-zinc-400 text-[11px] block mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                    className="w-full bg-[#07090d] border border-zinc-700 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-mono text-zinc-400 text-[11px] block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="w-full bg-[#07090d] border border-zinc-700 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="font-mono text-zinc-400 text-[11px] block mb-1">Due Time</label>
                  <input
                    type="time"
                    value={taskForm.dueTime}
                    onChange={(e) => setTaskForm({ ...taskForm, dueTime: e.target.value })}
                    className="w-full bg-[#07090d] border border-zinc-700 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="font-mono text-zinc-400 text-[11px] block mb-1">Duration (m)</label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={taskForm.estimatedMinutes}
                    onChange={(e) => setTaskForm({ ...taskForm, estimatedMinutes: Number(e.target.value) })}
                    className="w-full bg-[#07090d] border border-zinc-700 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-zinc-400 text-[11px] block mb-1">Optional Reminder (Alert)</label>
                <input
                  type="datetime-local"
                  value={taskForm.reminderTime}
                  onChange={(e) => setTaskForm({ ...taskForm, reminderTime: e.target.value })}
                  className="w-full bg-[#07090d] border border-zinc-700 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {/* SUBTASKS BUILDER */}
              <div className="pt-2 border-t border-zinc-800">
                <label className="font-mono text-zinc-400 text-[11px] block mb-1">Subtasks / Checklist Steps</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add a micro-step..."
                    value={taskForm.subtaskInput}
                    onChange={(e) => setTaskForm({ ...taskForm, subtaskInput: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSubtaskToForm();
                      }
                    }}
                    className="flex-1 bg-[#07090d] border border-zinc-700 rounded-lg p-1.5 text-zinc-100 text-xs"
                  />
                  <button
                    type="button"
                    onClick={addSubtaskToForm}
                    className="px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-mono text-xs"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {taskForm.subtasks.map((st, i) => (
                    <div key={st.id} className="flex items-center justify-between text-xs font-mono text-zinc-300 bg-zinc-900/60 p-1.5 rounded">
                      <span>• {st.title}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setTaskForm({ ...taskForm, subtasks: taskForm.subtasks.filter((_, idx) => idx !== i) })
                        }
                        className="text-zinc-500 hover:text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2 font-mono">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg text-xs"
                >
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TIME BLOCK MODAL */}
      {/* ========================================================================= */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-3">
          <div className="bg-[#0d121a] border border-emerald-500/80 rounded-xl max-w-md w-full p-5 text-zinc-100 font-sans shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4 font-mono text-xs">
              <span className="font-bold text-emerald-400">⏱️ SCHEDULE TIME BLOCK</span>
              <button onClick={() => setIsBlockModalOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                ✕
              </button>
            </div>

            <form onSubmit={saveTimeBlock} className="space-y-3.5 text-xs">
              <div>
                <label className="font-mono text-zinc-400 text-[11px] block mb-1">Block Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deep Focus: Physics problem set"
                  value={blockForm.title}
                  onChange={(e) => setBlockForm({ ...blockForm, title: e.target.value })}
                  className="w-full bg-[#07090d] border border-zinc-700 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="text-zinc-400 text-[11px] block mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={blockForm.startTime}
                    onChange={(e) => setBlockForm({ ...blockForm, startTime: e.target.value })}
                    className="w-full bg-[#07090d] border border-zinc-700 rounded-lg p-2 text-zinc-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 text-[11px] block mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={blockForm.endTime}
                    onChange={(e) => setBlockForm({ ...blockForm, endTime: e.target.value })}
                    className="w-full bg-[#07090d] border border-zinc-700 rounded-lg p-2 text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-zinc-400 text-[11px] block mb-1">Category</label>
                  <select
                    value={blockForm.category}
                    onChange={(e) => setBlockForm({ ...blockForm, category: e.target.value })}
                    className="w-full bg-[#07090d] border border-zinc-700 rounded-lg p-2 text-zinc-100 font-mono text-xs"
                  >
                    <option value="Work">Work</option>
                    <option value="Study">Study</option>
                    <option value="Personal">Personal</option>
                    <option value="Projects">Projects</option>
                    <option value="Break">Break</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-mono text-zinc-300 text-xs">
                    <input
                      type="checkbox"
                      checked={blockForm.isBreak}
                      onChange={(e) => setBlockForm({ ...blockForm, isBreak: e.target.checked })}
                      className="rounded bg-zinc-900 border-zinc-700 text-emerald-500"
                    />
                    <span>Is Rest / Meal Break?</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2 font-mono">
                <button
                  type="button"
                  onClick={() => setIsBlockModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg text-xs"
                >
                  Save Time Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NEW PROJECT MODAL */}
      {/* ========================================================================= */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-3">
          <div className="bg-[#0d121a] border border-emerald-500/80 rounded-xl max-w-md w-full p-5 text-zinc-100 font-sans shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4 font-mono text-xs">
              <span className="font-bold text-emerald-400">📁 CREATE NEW PROJECT</span>
              <button onClick={() => setIsProjectModalOpen(false)} className="text-zinc-500 hover:text-zinc-300">
                ✕
              </button>
            </div>

            <form onSubmit={saveProject} className="space-y-3.5 text-xs">
              <div>
                <label className="font-mono text-zinc-400 text-[11px] block mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master's Thesis Final Defense"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  className="w-full bg-[#07090d] border border-zinc-700 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-mono text-zinc-400 text-[11px] block mb-1">Description / Goal</label>
                <textarea
                  rows={2}
                  placeholder="Objectives, target outcomes, milestones..."
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  className="w-full bg-[#07090d] border border-zinc-700 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="font-mono text-zinc-400 text-[11px] block mb-1">Target Completion Date</label>
                <input
                  type="date"
                  value={projectForm.targetDate}
                  onChange={(e) => setProjectForm({ ...projectForm, targetDate: e.target.value })}
                  className="w-full bg-[#07090d] border border-zinc-700 rounded-lg p-2 text-zinc-100 focus:outline-none font-mono"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2 font-mono">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg text-xs"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
