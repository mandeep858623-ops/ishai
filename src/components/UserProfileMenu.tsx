import React, { useState } from 'react';
import { soundEngine } from '../utils/audio';
import { UserProfile } from '../../server/authService';
import { 
  User, 
  Folder, 
  Settings, 
  LogOut, 
  ChevronDown, 
  ShieldCheck, 
  KeyRound, 
  UserCheck
} from 'lucide-react';

interface UserProfileMenuProps {
  currentUser: UserProfile | null;
  onOpenAuthModal: (mode?: 'signin' | 'signup' | 'settings') => void;
  onOpenMyFiles: () => void;
  onOpenSettings?: () => void;
  onReplayIntro?: () => void;
  onSignOut: () => void;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  currentUser,
  onOpenAuthModal,
  onOpenMyFiles,
  onOpenSettings,
  onReplayIntro,
  onSignOut,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const getRoleBadge = (role?: string) => {
    if (role === 'superai') {
      return (
        <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 text-[9px] font-extrabold uppercase flex items-center gap-1">
          <ShieldCheck className="w-2.5 h-2.5 text-cyan-400" />
          SUPERAI MODE
        </span>
      );
    }
    if (role === 'guest') {
      return (
        <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[9px] font-extrabold uppercase">
          GUEST
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 text-[9px] font-extrabold uppercase flex items-center gap-1">
        <UserCheck className="w-2.5 h-2.5 text-emerald-400" />
        AUTHENTICATED
      </span>
    );
  };

  return (
    <div className="relative font-mono flex items-center gap-2">
      {currentUser ? (
        <>
          {/* Authenticated User Menu Button */}
          <button
            onClick={() => {
              soundEngine.playClick();
              setIsOpen(!isOpen);
            }}
            className="bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/80 text-emerald-200 font-bold px-2.5 py-1 rounded text-[11px] transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.3)]"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-500 text-black font-extrabold flex items-center justify-center text-[10px]">
              {currentUser.fullName.charAt(0).toUpperCase()}
            </div>
            <span className="max-w-[110px] truncate font-extrabold">{currentUser.fullName}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Quick Sign Out Button right in the Header */}
          <button
            onClick={() => {
              soundEngine.playClick();
              onSignOut();
            }}
            className="bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-300 font-bold px-2.5 py-1 rounded text-[11px] transition-all flex items-center gap-1 cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.3)]"
            title="Sign Out"
          >
            <LogOut className="w-3 h-3" />
            <span className="hidden sm:inline">SIGN OUT</span>
          </button>
        </>
      ) : (
        /* Signed Out Button */
        <button
          onClick={() => {
            soundEngine.playClick();
            onOpenAuthModal('signin');
          }}
          className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-3 py-1 rounded text-[11px] transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.5)]"
        >
          <User className="w-3.5 h-3.5 fill-black" />
          <span>SIGN IN / REGISTER</span>
        </button>
      )}

      {/* Dropdown Menu for My Files & Settings */}
      {isOpen && currentUser && (
        <div className="absolute right-0 top-10 mt-1 w-52 bg-[#05080c] border border-emerald-500 rounded-lg p-2 space-y-1 shadow-2xl shadow-emerald-950 z-50 text-xs">
          {/* User Details */}
          <div className="px-2 py-1.5 border-b border-emerald-950/80 space-y-1">
            <div className="font-bold text-emerald-200 truncate">{currentUser.fullName}</div>
            <div className="text-[10px] text-zinc-500 truncate">{currentUser.email}</div>
            <div className="pt-0.5">{getRoleBadge(currentUser.role)}</div>
          </div>

          {/* Menu Items */}
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenMyFiles();
            }}
            className="w-full text-left px-2.5 py-1.5 rounded text-emerald-300 hover:bg-emerald-950 hover:text-emerald-200 flex items-center gap-2 cursor-pointer"
          >
            <Folder className="w-3.5 h-3.5 text-emerald-400" />
            <span>📁 My Files Workspace</span>
          </button>

          {onOpenSettings && (
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenSettings();
              }}
              className="w-full text-left px-2.5 py-1.5 rounded text-cyan-300 hover:bg-cyan-950 hover:text-cyan-200 flex items-center gap-2 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-cyan-400" />
              <span>⚙️ System Preferences</span>
            </button>
          )}

          {onReplayIntro && (
            <button
              onClick={() => {
                setIsOpen(false);
                onReplayIntro();
              }}
              className="w-full text-left px-2.5 py-1.5 rounded text-cyan-300 hover:bg-cyan-950 hover:text-cyan-200 flex items-center gap-2 cursor-pointer"
            >
              <span>🎬 Replay Intro Video</span>
            </button>
          )}

          <button
            onClick={() => {
              setIsOpen(false);
              onOpenAuthModal('settings');
            }}
            className="w-full text-left px-2.5 py-1.5 rounded text-emerald-300 hover:bg-emerald-950 hover:text-emerald-200 flex items-center gap-2 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-emerald-400" />
            <span>⚙️ Account Settings</span>
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              onOpenAuthModal('signin');
            }}
            className="w-full text-left px-2.5 py-1.5 rounded text-cyan-300 hover:bg-cyan-950 hover:text-cyan-200 flex items-center gap-2 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
            <span>🔑 Switch Account / Mode</span>
          </button>
        </div>
      )}
    </div>
  );
};
