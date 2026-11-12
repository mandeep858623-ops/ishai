import React, { useState } from 'react';
import { ToolType, ChatSession } from '../types/ishaan';
import {
  MessageSquare,
  Sparkles,
  Code,
  Calculator,
  GraduationCap,
  FileText,
  Languages,
  CheckSquare,
  Mic,
  Palette,
  Settings,
  Plus,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Camera as CameraIcon,
  Newspaper,
  Rocket,
  Mail,
  Box,
  Building2,
} from 'lucide-react';

interface SidebarProps {
  currentTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onDeleteSession: (id: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenSettings: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTool,
  onSelectTool,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onRenameSession,
  onDeleteSession,
  isCollapsed,
  onToggleCollapse,
  onOpenSettings,
  theme,
  onToggleTheme,
}) => {
  console.log('Sidebar rendered');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const navItems = [
    { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
    { id: 'writer', label: 'AI Writer', icon: Sparkles },
    { id: 'coding', label: 'Coding Studio', icon: Code },
    { id: 'math', label: 'Math Lab', icon: Calculator },
    { id: 'study', label: 'Study Assistant', icon: GraduationCap },
    { id: 'documents', label: 'Document Assistant', icon: FileText },
    { id: 'translator', label: 'AI Translator', icon: Languages },
    { id: 'productivity', label: 'Productivity Hub', icon: CheckSquare },
    { id: 'gmail', label: 'Gmail Connect', icon: Mail },
    { id: 'voice_recorder', label: 'Voice Recorder', icon: Mic },
    { id: 'cityverse', label: 'CITYVERSE 3D City', icon: Building2 },
    { id: '3d_lab', label: '3D Mechanical Lab', icon: Box },
    { id: 'whiteboard', label: 'Whiteboard', icon: Edit2 },
    { id: 'space_xplorer', label: 'Space Xplorer 3D', icon: Rocket },
    { id: 'ai_coder', label: 'AI Coder', icon: Code },
    { id: 'language_studio', label: 'Language Studio', icon: Languages },
    { id: 'lens_x', label: 'Lens X Intelligence', icon: CameraIcon },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { id: 'news', label: 'News 2.0 Command Center', icon: Newspaper },
    { id: 'creative', label: 'Creative Studio', icon: Palette },
  ];

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startRename = (s: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(s.id);
    setEditTitle(s.title);
  };

  const saveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <aside
      className={`h-screen flex flex-col border-r transition-all duration-300 select-none z-20 ${
        theme === 'dark'
          ? 'bg-[#090b0e] border-zinc-800/80 text-zinc-300'
          : 'bg-zinc-50 border-zinc-200 text-zinc-700'
      } ${isCollapsed ? 'w-16' : 'w-64 sm:w-72'}`}
    >
      {/* Brand & Collapse */}
      <div className="p-3.5 flex items-center justify-between border-b border-inherit">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 flex items-center justify-center text-white font-black text-sm shadow-md">
              I
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
                ISHAI
                <span className="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  OS
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 tracking-wide font-medium">Ishai OS Intelligence Terminal</p>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="w-8 h-8 mx-auto rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 flex items-center justify-center text-white font-black text-sm shadow-md">
            I
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-xl font-semibold text-xs transition-all shadow-sm cursor-pointer ${
            theme === 'dark'
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
          }`}
          title="Start new conversation"
        >
          <Plus className="w-4 h-4" />
          {!isCollapsed && <span>New Conversation</span>}
        </button>
      </div>

      {/* Primary Navigation */}
      <div className="px-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTool === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTool(item.id as ToolType)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? theme === 'dark'
                    ? 'bg-zinc-800/90 text-white font-semibold'
                    : 'bg-zinc-200 text-zinc-900 font-semibold'
                  : 'hover:bg-zinc-800/40 text-zinc-400 hover:text-zinc-200'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title={item.label}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-zinc-400'}`} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Chat History Section */}
      {!isCollapsed && (
        <div className="flex-1 flex flex-col mt-4 min-h-0 border-t border-inherit pt-3 px-3">
          <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 px-1 mb-2">
            <span>CONVERSATIONS</span>
            <span>{sessions.length}</span>
          </div>

          {/* Search chat titles */}
          {sessions.length > 3 && (
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-lg pl-8 pr-2 py-1.5 text-[11px] text-zinc-300 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {filteredSessions.length === 0 ? (
              <div className="text-[11px] text-zinc-500 text-center py-4">No conversations found</div>
            ) : (
              filteredSessions.map((s) => {
                const isActive = activeSessionId === s.id && currentTool === 'chat';
                const isEditing = editingId === s.id;

                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      onSelectTool('chat');
                      onSelectSession(s.id);
                    }}
                    className={`group flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-zinc-800 text-white font-medium'
                        : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                    }`}
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveRename(s.id, e as any)}
                          autoFocus
                          className="flex-1 bg-zinc-900 border border-indigo-500 text-xs text-white px-1.5 py-0.5 rounded focus:outline-none"
                        />
                        <button
                          onClick={(e) => saveRename(s.id, e)}
                          className="text-emerald-400 hover:text-emerald-300 p-0.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(null);
                          }}
                          className="text-zinc-400 hover:text-white p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 truncate mr-1">
                          <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
                          <span className="truncate">{s.title}</span>
                        </div>

                        <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => startRename(s, e)}
                            className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-700/60"
                            title="Rename"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSession(s.id);
                            }}
                            className="p-1 text-zinc-400 hover:text-red-400 rounded hover:bg-zinc-700/60"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Footer controls */}
      <div className="p-3 border-t border-inherit space-y-1">
        <button
          onClick={onToggleTheme}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
          title="Toggle light / dark theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {!isCollapsed && <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>}
        </button>

        <button
          onClick={onOpenSettings}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
          title="Settings & storage"
        >
          <Settings className="w-4 h-4" />
          {!isCollapsed && <span>Settings & Storage</span>}
        </button>
      </div>
    </aside>
  );
};
