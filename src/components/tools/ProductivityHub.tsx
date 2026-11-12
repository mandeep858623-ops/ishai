import React, { useState, useEffect } from 'react';
import { TaskItem, NoteItem } from '../../types/superai';
import { generateAiCompletion } from '../../utils/aiClient';
import { CheckSquare, Plus, Trash2, Sparkles, Check, FileText, Calendar, AlertCircle } from 'lucide-react';

const TASKS_STORAGE_KEY = 'superai_tasks';
const NOTES_STORAGE_KEY = 'superai_notes';

export const ProductivityHub: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const saved = localStorage.getItem(TASKS_STORAGE_KEY);
      return saved
        ? JSON.parse(saved)
        : [
            { id: '1', text: 'Draft product roadmap for Q3', completed: false, priority: 'high', createdAt: 'Today' },
            { id: '2', text: 'Review architecture documentation', completed: true, priority: 'medium', createdAt: 'Yesterday' },
          ];
    } catch {
      return [];
    }
  });

  const [notes, setNotes] = useState<NoteItem[]>(() => {
    try {
      const saved = localStorage.getItem(NOTES_STORAGE_KEY);
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: '1',
              title: 'Brainstorm Notes',
              content: 'Key priorities:\n1. Zero latency conversational experience\n2. True multimodal capabilities\n3. High-yield educational tools',
              updatedAt: new Date().toLocaleDateString(),
            },
          ];
    } catch {
      return [];
    }
  });

  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [activeNoteId, setActiveNoteId] = useState<string>(notes[0]?.id || '');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiTaskPrompt, setAiTaskPrompt] = useState('');

  useEffect(() => {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const addTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask: TaskItem = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
      priority: newTaskPriority,
      createdAt: 'Today',
    };
    setTasks((prev) => [newTask, ...prev]);
    setNewTaskText('');
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // AI Task Plan Generator
  const handleGenerateAiTasks = async () => {
    if (!aiTaskPrompt.trim()) return;
    setAiGenerating(true);
    try {
      const prompt = `Break down this project goal into 4 actionable, clear todo tasks with priority (high, medium, or low):\nGoal: "${aiTaskPrompt}"\nReturn strictly JSON in format: [{"text": "...", "priority": "high"|"medium"|"low"}] without markdown code fencing.`;
      const res = await generateAiCompletion({
        prompt,
        systemInstruction: 'You are an elite productivity executive coach. Return ONLY valid JSON array.',
      });
      const cleaned = res.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        const newItems: TaskItem[] = parsed.map((item, idx) => ({
          id: (Date.now() + idx).toString(),
          text: item.text,
          completed: false,
          priority: item.priority || 'medium',
          createdAt: 'Just now',
        }));
        setTasks((prev) => [...newItems, ...prev]);
        setAiTaskPrompt('');
      }
    } catch {
      // ignore JSON parse error
    } finally {
      setAiGenerating(false);
    }
  };

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0];

  const updateActiveNoteContent = (content: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === activeNote?.id ? { ...n, content, updatedAt: 'Just now' } : n))
    );
  };

  const updateActiveNoteTitle = (title: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === activeNote?.id ? { ...n, title, updatedAt: 'Just now' } : n))
    );
  };

  const addNewNote = () => {
    const newNote: NoteItem = {
      id: Date.now().toString(),
      title: 'Untitled Note',
      content: '',
      updatedAt: 'Just now',
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
  };

  const deleteCurrentNote = () => {
    if (notes.length <= 1) return;
    const remaining = notes.filter((n) => n.id !== activeNote?.id);
    setNotes(remaining);
    setActiveNoteId(remaining[0].id);
  };

  // AI Polish Note
  const handlePolishNote = async () => {
    if (!activeNote?.content.trim()) return;
    setAiGenerating(true);
    try {
      const res = await generateAiCompletion({
        prompt: `Please organize, format, and polish these notes cleanly with clear headings and bullet points:\n${activeNote.content}`,
        systemInstruction: 'You are an executive editor. Polish the text cleanly and return only the polished notes.',
      });
      updateActiveNoteContent(res);
    } catch {
      // ignore
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <CheckSquare className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">Productivity & Organization Hub</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Local browser-backed task management, scratchpad notes, and AI-assisted workflow breakdowns.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tasks Section */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-200">Tasks & Action Items</h2>
              <span className="text-[11px] text-zinc-500">
                {tasks.filter((t) => t.completed).length} / {tasks.length} Completed
              </span>
            </div>

            {/* Add Task Input */}
            <form onSubmit={addTask} className="flex gap-2">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Add a new action item..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-violet-500"
              />
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as any)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 text-xs text-zinc-300"
              >
                <option value="low">Low</option>
                <option value="medium">Med</option>
                <option value="high">High</option>
              </select>
              <button
                type="submit"
                className="bg-violet-600 hover:bg-violet-500 text-white p-2 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            {/* AI Task generator */}
            <div className="flex gap-2 pt-2 border-t border-zinc-800/80">
              <input
                type="text"
                value={aiTaskPrompt}
                onChange={(e) => setAiTaskPrompt(e.target.value)}
                placeholder="AI: Break project into subtasks..."
                className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-violet-500 placeholder:text-zinc-600"
              />
              <button
                onClick={handleGenerateAiTasks}
                disabled={aiGenerating || !aiTaskPrompt.trim()}
                className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-violet-300 border border-violet-500/30 text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                {aiGenerating ? 'Planning...' : 'AI Plan'}
              </button>
            </div>

            {/* Task list */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {tasks.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-500">No tasks currently recorded.</div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                      task.completed
                        ? 'bg-zinc-950/40 border-zinc-800/40 text-zinc-500'
                        : 'bg-zinc-950 border-zinc-800/90 text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-2">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                          task.completed
                            ? 'bg-violet-600 border-violet-600 text-white'
                            : 'border-zinc-700 hover:border-violet-500'
                        }`}
                      >
                        {task.completed && <Check className="w-3 h-3" />}
                      </button>
                      <span className={`text-xs truncate ${task.completed ? 'line-through text-zinc-500' : ''}`}>
                        {task.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          task.priority === 'high'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : task.priority === 'medium'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {task.priority}
                      </span>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-zinc-600 hover:text-red-400 p-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Notes & Scratchpad Section */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-400" />
                <h2 className="text-sm font-bold text-zinc-200">Scratchpad Notes</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePolishNote}
                  disabled={aiGenerating || !activeNote?.content.trim()}
                  className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="Format and polish notes with AI"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {aiGenerating ? 'Polishing...' : 'AI Polish'}
                </button>
                <button
                  onClick={addNewNote}
                  className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2 py-1 rounded transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  New Note
                </button>
              </div>
            </div>

            {/* Note selector tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {notes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setActiveNoteId(n.id)}
                  className={`text-xs px-2.5 py-1 rounded-md whitespace-nowrap transition-colors border cursor-pointer ${
                    n.id === activeNote?.id
                      ? 'bg-violet-600/20 border-violet-500/40 text-violet-300 font-medium'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {n.title || 'Untitled'}
                </button>
              ))}
            </div>

            {activeNote && (
              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <div className="flex justify-between items-center gap-2">
                  <input
                    type="text"
                    value={activeNote.title}
                    onChange={(e) => updateActiveNoteTitle(e.target.value)}
                    className="flex-1 bg-transparent text-sm font-semibold text-zinc-100 focus:outline-none border-b border-transparent focus:border-violet-500 pb-0.5"
                    placeholder="Note title..."
                  />
                  {notes.length > 1 && (
                    <button
                      onClick={deleteCurrentNote}
                      className="text-zinc-600 hover:text-red-400 text-xs p-1"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <textarea
                  value={activeNote.content}
                  onChange={(e) => updateActiveNoteContent(e.target.value)}
                  placeholder="Capture ideas, research excerpts, thoughts, or minutes..."
                  rows={9}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-violet-500 resize-none font-mono leading-relaxed"
                />

                <div className="text-[11px] text-zinc-500 flex justify-between">
                  <span>Saved locally in browser</span>
                  <span>Updated {activeNote.updatedAt}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
