import React, { useState, useEffect } from 'react';
import { BookText, Plus, Trash2, Calendar, Search, Save, History, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClockService, JournalNote } from '../../../services/ClockService';
import { format } from 'date-fns';

interface NotesTabProps {
  currentUser: any;
  onLog: (text: string, tag?: string) => void;
}

export const NotesTab: React.FC<NotesTabProps> = ({ currentUser, onLog }) => {
  const [notes, setNotes] = useState<JournalNote[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [content, setContent] = useState('');
  const [reflection, setReflection] = useState('');
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser?.uid) {
      const unsub = ClockService.subscribeNotes(currentUser.uid, (data) => {
        setNotes(data);
        const currentNote = data.find(n => n.date === selectedDate);
        if (currentNote) {
          setContent(currentNote.content);
          setReflection(currentNote.reflection || '');
        } else {
          setContent('');
          setReflection('');
        }
      });
      return () => unsub();
    }
  }, [currentUser, selectedDate]);

  const handleSave = async () => {
    if (!currentUser?.uid || !content.trim()) return;
    setIsSaving(true);
    try {
      await ClockService.saveNote(currentUser.uid, {
        date: selectedDate,
        content,
        reflection
      });
      onLog('Journal updated', 'SUCCESS');
    } catch (err: any) {
      onLog(`Save Error: ${err.message}`, 'ERROR');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteNote = async (id: string) => {
    if (!currentUser?.uid) return;
    try {
      await ClockService.deleteNote(currentUser.uid, id);
      onLog('Note deleted', 'INFO');
    } catch (err: any) {
      onLog(`Delete Error: ${err.message}`, 'ERROR');
    }
  };

  const filteredNotes = notes.filter(n => 
    n.content.toLowerCase().includes(search.toLowerCase()) || 
    n.date.includes(search)
  );

  return (
    <div className="h-full flex flex-col sm:flex-row gap-6">
      {/* Sidebar: History & Search */}
      <aside className="w-full sm:w-72 flex flex-col space-y-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-900 group-focus-within:text-emerald-500 transition-colors" />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SEARCH ENTRIES..."
            className="w-full bg-black/40 border border-emerald-500/10 rounded-xl pl-10 pr-4 py-3 text-[10px] font-black text-emerald-300 placeholder:text-emerald-900 focus:outline-none focus:border-emerald-500/30 transition-all uppercase tracking-widest"
          />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
          <h3 className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.3em] px-2 mb-4 flex items-center gap-2">
            <History className="w-3 h-3" /> Entry History
          </h3>
          <AnimatePresence initial={false}>
            {filteredNotes.map((note) => (
              <motion.button 
                key={note.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setSelectedDate(note.date)}
                className={`w-full p-4 rounded-xl border text-left transition-all group relative overflow-hidden ${
                  selectedDate === note.date 
                    ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                    : 'bg-black/20 border-emerald-500/5 hover:border-emerald-500/20'
                }`}
              >
                <div className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter mb-1">{format(new Date(note.date), 'EEEE, MMM do')}</div>
                <div className="text-[10px] text-emerald-800 line-clamp-2 leading-relaxed uppercase font-bold">{note.content}</div>
                
                {selectedDate === note.date && (
                  <div className="absolute right-2 top-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                )}
              </motion.button>
            ))}
          </AnimatePresence>
          {filteredNotes.length === 0 && (
            <div className="py-12 text-center text-[10px] text-emerald-950 font-black uppercase tracking-widest">No entries found</div>
          )}
        </div>
      </aside>

      {/* Main Editor */}
      <main className="flex-1 flex flex-col space-y-6">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-500">
              <Calendar className="w-4 h-4" />
              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-none text-sm font-black uppercase tracking-widest focus:outline-none cursor-pointer"
              />
            </div>
            <h2 className="text-xl font-black text-emerald-100 uppercase tracking-tight">
              {format(new Date(selectedDate), 'MMMM do, yyyy')}
            </h2>
          </div>
          
          <button 
            onClick={handleSave}
            disabled={isSaving || !content.trim()}
            className="px-6 py-3 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 rounded-xl transition-all border border-emerald-500/30 flex items-center gap-2 font-black uppercase text-xs disabled:opacity-50"
          >
            {isSaving ? <Sparkles className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Entry
          </button>
        </header>

        <div className="flex-1 flex flex-col space-y-6">
          <div className="flex-1 flex flex-col space-y-2">
            <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest px-1 flex items-center gap-2">
              <BookText className="w-3 h-3" /> Daily Notes & Logs
            </label>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="START TYPING YOUR DAILY LOG..."
              className="flex-1 bg-black/40 border border-emerald-500/10 rounded-2xl p-6 text-sm text-emerald-300 placeholder:text-emerald-900 focus:outline-none focus:border-emerald-500/30 transition-all font-mono resize-none leading-relaxed custom-scrollbar"
            />
          </div>

          <div className="h-40 flex flex-col space-y-2">
            <label className="text-[10px] font-black text-emerald-800 uppercase tracking-widest px-1 flex items-center gap-2">
              <Sparkles className="w-3 h-3" /> Evening Reflection
            </label>
            <textarea 
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="HOW WAS YOUR DAY? ANY BREAKTHROUGHS?..."
              className="h-full bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 text-[10px] text-emerald-400 placeholder:text-emerald-900 focus:outline-none focus:border-emerald-500/30 transition-all font-bold uppercase resize-none leading-relaxed custom-scrollbar"
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-emerald-950/20 rounded-2xl border border-emerald-500/10">
          <div className="flex items-center gap-4 text-[10px] font-bold text-emerald-800 uppercase tracking-widest">
            <span>Words: {content.split(/\s+/).filter(Boolean).length}</span>
            <span>Chars: {content.length}</span>
          </div>
          {notes.find(n => n.date === selectedDate) && (
            <button 
              onClick={() => deleteNote(notes.find(n => n.date === selectedDate)!.id!)}
              className="text-[10px] font-black text-red-900 hover:text-red-500 uppercase tracking-widest flex items-center gap-2"
            >
              <Trash2 className="w-3 h-3" /> Purge Entry
            </button>
          )}
        </div>
      </main>
    </div>
  );
};
