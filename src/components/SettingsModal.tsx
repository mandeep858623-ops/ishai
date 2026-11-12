import React from 'react';
import { UserSettings } from '../types/superai';
import { Settings, X, Moon, Sun, Trash2, Download, ShieldCheck, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen?: boolean;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onClose: () => void;
  onReplayIntro?: () => void;
  onClearChats?: () => void;
  onClearAllData?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen = true,
  settings,
  onUpdateSettings,
  onClose,
  onReplayIntro,
  onClearChats = () => {},
  onClearAllData = () => {},
}) => {
  if (!isOpen) return null;
  const exportAllData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      settings,
      chats: localStorage.getItem('superai_chats'),
      tasks: localStorage.getItem('superai_tasks'),
      notes: localStorage.getItem('superai_notes'),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SUPERAI_Backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-zinc-200 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300">
              <Settings className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white tracking-tight">SUPERAI Preferences & Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Appearance & Theme */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 block">Appearance Theme</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdateSettings({ theme: 'dark' })}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                  settings.theme === 'dark'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Moon className="w-4 h-4" />
                Dark Theme
              </button>
              <button
                onClick={() => onUpdateSettings({ theme: 'light' })}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                  settings.theme === 'light'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Sun className="w-4 h-4" />
                Light Theme
              </button>
            </div>
          </div>

          {/* AI Response Style */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 block">Assistant Response Tone</label>
            <select
              value={settings.responseTone}
              onChange={(e) => onUpdateSettings({ responseTone: e.target.value as any })}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="balanced">Balanced — Informative, articulate, and well-rounded</option>
              <option value="concise">Concise — Direct, high-density, minimal pleasantries</option>
              <option value="technical">Technical — In-depth systems, proofs, algorithmic depth</option>
              <option value="creative">Creative — Expansive, expressive, storytelling flair</option>
            </select>
          </div>

          {/* Font scale */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 block">Text Font Scale</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'sm', label: 'Compact' },
                { id: 'md', label: 'Default' },
                { id: 'lg', label: 'Large' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => onUpdateSettings({ fontSize: f.id as any })}
                  className={`p-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                    settings.fontSize === f.id
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Audio voice settings */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 block">Speech Synthesis Voice</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdateSettings({ voiceGender: 'female' })}
                className={`p-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                  settings.voiceGender === 'female'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Female Profile
              </button>
              <button
                onClick={() => onUpdateSettings({ voiceGender: 'male' })}
                className={`p-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                  settings.voiceGender === 'male'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Male Profile
              </button>
            </div>
          </div>

          {/* Cinematic Startup Video Intro */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 block flex items-center gap-1.5">
              <span>Cinematic Startup Video Intro</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdateSettings({ startupIntroEnabled: true })}
                className={`p-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  settings.startupIntroEnabled !== false
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300 font-bold'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Enable Startup Intro
              </button>
              <button
                onClick={() => onUpdateSettings({ startupIntroEnabled: false })}
                className={`p-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  settings.startupIntroEnabled === false
                    ? 'border-red-500 bg-red-500/10 text-red-300 font-bold'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Disable Startup Intro
              </button>
            </div>
            {onReplayIntro && (
              <button
                onClick={() => {
                  onClose();
                  onReplayIntro();
                }}
                className="w-full mt-2 p-2.5 rounded-xl border border-cyan-500/80 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 hover:text-cyan-100 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              >
                <span>🎬 REPLAY CINEMATIC INTRO VIDEO</span>
              </button>
            )}
          </div>

          {/* Local Data Privacy & Management */}
          <div className="pt-3 border-t border-zinc-800 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Storage & Privacy Controls</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              SUPERAI stores conversation histories, tasks, and scratchpad notes exclusively within your local browser storage. No third-party data tracking.
            </p>

            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={exportAllData}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-200 font-medium transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export Workspace Data (JSON)
              </button>
              <button
                onClick={onClearChats}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-red-900/40 bg-red-950/20 hover:bg-red-950/40 text-xs text-red-300 font-medium transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Chat History
              </button>
              <button
                onClick={onClearAllData}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-red-900/60 bg-red-950/40 hover:bg-red-900/60 text-xs text-red-200 font-medium transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Purge All Local Workspace Data
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
