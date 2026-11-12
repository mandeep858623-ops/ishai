import React from 'react';
import { NewsCommandCenter } from './News/NewsCommandCenter';
import { X } from 'lucide-react';

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'home' | 'india' | 'tech' | 'verifier' | 'comparer' | 'briefing' | 'library';
  initialSearch?: string;
}

export const NewsModal: React.FC<NewsModalProps> = ({ isOpen, onClose, initialTab, initialSearch }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* Top Banner / Exit Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-extrabold text-xs text-slate-200 uppercase tracking-widest">
            SUPERAI NEWS 2.0 — ULTIMATE AI NEWS COMMAND CENTER
          </span>
        </div>

        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
        >
          <X className="w-4 h-4" /> Exit News
        </button>
      </div>

      {/* Main View Area */}
      <div className="flex-1 overflow-y-auto">
        <NewsCommandCenter initialTab={initialTab} initialSearch={initialSearch} />
      </div>
    </div>
  );
};
