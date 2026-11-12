import React, { useState, useEffect } from 'react';
import { 
  Milestone, Plus, Calendar, Clock, Trash2, 
  ChevronRight, Camera, MapPin, Tag, Heart,
  Star, Trophy, Book, Briefcase, GraduationCap, PartyPopper
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClockService, LifeMilestone } from '../../../services/ClockService';
import { format, parseISO, compareDesc } from 'date-fns';

interface LifeTimelineTabProps {
  currentUser: any;
}

export const LifeTimelineTab: React.FC<LifeTimelineTabProps> = ({ currentUser }) => {
  const [milestones, setMilestones] = useState<LifeMilestone[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    date: '',
    description: '',
    category: 'Celebration'
  });

  useEffect(() => {
    if (currentUser?.uid) {
      const unsubscribe = ClockService.subscribeMilestones(currentUser.uid, setMilestones);
      return () => unsubscribe();
    }
  }, [currentUser]);

  const sortedMilestones = [...milestones].sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestone.title || !newMilestone.date) return;

    try {
      await ClockService.addMilestone(currentUser.uid, newMilestone);
      setIsAdding(false);
      setNewMilestone({
        title: '',
        date: '',
        description: '',
        category: 'Celebration'
      });
    } catch (err) {
      console.error(err);
    }
  };

  const categories = [
    { id: 'Celebration', icon: PartyPopper },
    { id: 'Education', icon: GraduationCap },
    { id: 'Career', icon: Briefcase },
    { id: 'Personal', icon: Heart },
    { id: 'Travel', icon: MapPin },
    { id: 'Achievement', icon: Trophy }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-emerald-100 flex items-center gap-2">
            <Milestone className="w-5 h-5 text-emerald-500" />
            LIFE TIMELINE
          </h3>
          <p className="text-xs text-emerald-700 font-medium">A visual map of your journey and significant achievements.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg border border-emerald-500/30 transition-all font-bold text-sm"
        >
          <Plus className="w-4 h-4" />
          ADD MILESTONE
        </button>
      </div>

      <div className="relative pl-8 sm:pl-32 space-y-12 before:absolute before:inset-y-0 before:left-8 sm:before:left-32 before:w-0.5 before:bg-emerald-500/10 before:-translate-x-1/2">
        <AnimatePresence mode="popLayout">
          {sortedMilestones.map((ms, i) => {
            const CategoryIcon = categories.find(c => c.id === ms.category)?.icon || Star;
            
            return (
              <motion.div
                key={ms.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative"
              >
                {/* Year Label (Only for first item of each year) */}
                {(i === 0 || format(parseISO(ms.date), 'yyyy') !== format(parseISO(sortedMilestones[i-1].date), 'yyyy')) && (
                   <div className="absolute -left-8 sm:-left-32 top-0 -translate-y-full mb-4">
                      <span className="text-4xl font-black text-emerald-950/40 select-none">{format(parseISO(ms.date), 'yyyy')}</span>
                   </div>
                )}

                {/* Timeline Dot */}
                <div className="absolute left-0 top-6 -translate-x-1/2 w-4 h-4 bg-[#0a0a0b] border-2 border-emerald-500 rounded-full z-10 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                
                {/* Date Label (Desktop) */}
                <div className="hidden sm:block absolute -left-32 top-5 -translate-x-full text-right w-24">
                  <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">{format(parseISO(ms.date), 'MMM d')}</p>
                </div>

                <div className="bg-emerald-950/10 border border-emerald-500/20 rounded-2xl p-6 group hover:border-emerald-500/40 transition-all relative overflow-hidden">
                   {/* Background Icon */}
                   <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <CategoryIcon className="w-32 h-32 text-emerald-500" />
                   </div>

                   <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                             <CategoryIcon className="w-4 h-4 text-emerald-500" />
                             <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">
                                {ms.category}
                             </span>
                          </div>
                          <h4 className="text-xl font-black text-emerald-100 tracking-tight">{ms.title}</h4>
                          <p className="sm:hidden text-[10px] font-black text-emerald-800 uppercase tracking-widest mt-1">
                             {format(parseISO(ms.date), 'MMMM d, yyyy')}
                          </p>
                        </div>
                        <button 
                          onClick={() => ClockService.deleteMilestone(currentUser.uid, ms.id!)}
                          className="p-2 text-emerald-900 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <p className="text-sm text-emerald-700 font-medium leading-relaxed max-w-2xl">
                         {ms.description}
                      </p>

                      {ms.image_url && (
                        <div className="mt-6 aspect-video w-full sm:w-80 rounded-xl overflow-hidden border border-emerald-500/20 bg-emerald-950/20">
                           <img src={ms.image_url} alt={ms.title} className="w-full h-full object-cover grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500" />
                        </div>
                      )}
                   </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {milestones.length === 0 && !isAdding && (
        <div className="flex flex-col items-center justify-center py-20 text-emerald-900 border-2 border-dashed border-emerald-500/10 rounded-2xl ml-8 sm:ml-32">
          <Milestone className="w-12 h-12 mb-4 opacity-20" />
          <p className="font-bold uppercase tracking-widest text-sm">Your journey starts here</p>
          <p className="text-xs opacity-50">Record your first major life milestone</p>
        </div>
      )}

      {/* Add Milestone Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-[#0d0d0e] border border-emerald-500/30 rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-xl font-black text-emerald-100 mb-6 flex items-center gap-3">
                <Plus className="w-6 h-6 text-emerald-500" />
                RECORD MILESTONE
              </h3>
              
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={newMilestone.title}
                    onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                    className="w-full bg-emerald-950/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-100 focus:outline-none focus:border-emerald-500/50 transition-all font-bold"
                    placeholder="e.g., Graduated University, Started First Job"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={newMilestone.date}
                      onChange={(e) => setNewMilestone({ ...newMilestone, date: e.target.value })}
                      className="w-full bg-emerald-950/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-100 focus:outline-none focus:border-emerald-500/50 transition-all font-bold cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Category</label>
                    <select
                      value={newMilestone.category}
                      onChange={(e) => setNewMilestone({ ...newMilestone, category: e.target.value })}
                      className="w-full bg-emerald-950/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-100 focus:outline-none focus:border-emerald-500/50 transition-all font-bold appearance-none cursor-pointer"
                    >
                      {categories.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={newMilestone.description}
                    onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                    className="w-full bg-emerald-950/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-100 focus:outline-none focus:border-emerald-500/50 transition-all font-bold resize-none"
                    placeholder="Tell the story of this moment..."
                  />
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-emerald-500/20 text-emerald-700 font-bold hover:bg-emerald-500/5 transition-all"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="flex-2 px-8 py-3 bg-emerald-500 text-black font-black rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  >
                    SAVE MILESTONE
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
