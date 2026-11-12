import React, { useState, useEffect } from 'react';
import {
  CloudSun,
  Layout,
  Cpu,
  Compass,
  FileText,
  Search,
  Clock,
  Activity,
  ChevronRight,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
} from 'lucide-react';

interface FloatingHoloWidgetsProps {
  isVisible: boolean;
  onToggleVisibility: () => void;
  isSpeaking: boolean;
  audioVolume: number;
  avatarState: string;
  theme: 'dark' | 'light';
  onLaunchApp: (appName: string) => void;
  weatherSummary?: {
    city?: string;
    tempC?: number;
    condition?: string;
  };
  isMobile?: boolean;
  isLargeDisplay?: boolean;
}

export const FloatingHoloWidgets: React.FC<FloatingHoloWidgetsProps> = ({
  isVisible,
  onToggleVisibility,
  isSpeaking,
  audioVolume,
  avatarState,
  theme,
  onLaunchApp,
  weatherSummary,
  isMobile = false,
  isLargeDisplay = false,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isDark = theme === 'dark';

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-4 sm:p-6 overflow-hidden">
      {/* Top Floating Row: Telemetry Clock & Weather Glance */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Clock & OS Telemetry Card */}
        {isVisible && (
          <div
            className={`pointer-events-auto backdrop-blur-md rounded-2xl border p-3 sm:p-4 shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
              isDark
                ? 'bg-black/40 border-cyan-500/30 text-white shadow-cyan-500/10'
                : 'bg-white/80 border-cyan-400/40 text-zinc-900 shadow-cyan-400/20'
            } ${isLargeDisplay ? 'scale-125 origin-top-left' : ''} ${isMobile ? 'max-w-[160px]' : 'max-w-xs'}`}
          >
            <div className="flex items-center gap-2 mb-1.5 text-cyan-400 font-mono text-[10px] tracking-wider uppercase">
              <Clock className="w-3.5 h-3.5" />
              <span>{isMobile ? 'Chrono' : 'ISHAI Chrono Telemetry'}</span>
            </div>
            <div className={`font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 ${
              isMobile ? 'text-lg' : 'text-xl sm:text-2xl'
            }`}>
              {timeStr || '12:00:00'}
            </div>
            <div className="text-[10px] sm:text-xs text-zinc-400 flex items-center justify-between mt-1">
              <span>{dateStr}</span>
              {!isMobile && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  QUANTUM SYNC
                </span>
              )}
            </div>
          </div>
        )}

        {/* Visibility Toggle Button (Top-Right) */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={onToggleVisibility}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer shadow-lg ${
              isDark
                ? 'bg-black/60 border-white/10 hover:border-cyan-500/50 text-cyan-300'
                : 'bg-white/80 border-zinc-200 hover:border-cyan-600 text-zinc-800'
            }`}
            title={isVisible ? 'Hide Floating Hologram HUD' : 'Show Floating Hologram HUD'}
          >
            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isVisible ? 'Hide HUD' : 'Show HUD'}</span>
          </button>
        </div>
      </div>

      {/* Middle Flanks: Weather Card (Left) & Quick App Launchers (Right) */}
      {isVisible && (
        <div className="flex items-center justify-between w-full my-auto">
          {/* Left Flank: Live Weather Glance */}
          <div
            className={`pointer-events-auto hidden md:flex flex-col gap-2 backdrop-blur-md rounded-2xl border p-3.5 shadow-xl transition-all duration-300 max-w-[210px] ${
              isDark
                ? 'bg-black/40 border-blue-500/30 text-white shadow-blue-500/10'
                : 'bg-white/80 border-blue-400/40 text-zinc-900 shadow-blue-400/20'
            }`}
          >
            <div className="flex items-center justify-between text-blue-400 text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <CloudSun className="w-4 h-4 text-cyan-400" />
                <span>Weather</span>
              </span>
              <button
                onClick={() => onLaunchApp('WEATHER')}
                className="hover:text-cyan-300 text-[10px] flex items-center cursor-pointer"
              >
                Open <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">
                {weatherSummary?.tempC !== undefined ? `${weatherSummary.tempC}°C` : '24°C'}
              </span>
              <span className="text-xs text-zinc-400 truncate max-w-[110px]">
                {weatherSummary?.city || 'Local Location'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-300 capitalize truncate">
              {weatherSummary?.condition || 'Clear & Optimal conditions'}
            </p>
          </div>

          {/* Right Flank: Quick App Launcher Dock */}
          <div
            className={`pointer-events-auto hidden md:flex flex-col gap-1.5 backdrop-blur-md rounded-2xl border p-2.5 shadow-xl transition-all duration-300 ${
              isDark
                ? 'bg-black/40 border-violet-500/30 text-white shadow-violet-500/10'
                : 'bg-white/80 border-violet-400/40 text-zinc-900 shadow-violet-400/20'
            }`}
          >
            <div className="px-2 py-1 text-[10px] font-mono tracking-wider text-violet-400 uppercase flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>Holo Commands</span>
            </div>

            <button
              onClick={() => onLaunchApp('WEATHER')}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-cyan-500/20 text-xs text-left transition-all group cursor-pointer text-cyan-300"
            >
              <CloudSun className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>Weather</span>
            </button>

            <button
              onClick={() => onLaunchApp('WHITEBOARD')}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-violet-500/20 text-xs text-left transition-all group cursor-pointer text-violet-300"
            >
              <Layout className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>Whiteboard</span>
            </button>

            <button
              onClick={() => onLaunchApp('3D_LAB')}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-blue-500/20 text-xs text-left transition-all group cursor-pointer text-blue-300"
            >
              <Cpu className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>3D Mechanical</span>
            </button>

            <button
              onClick={() => onLaunchApp('SPACE_XPLORER')}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-indigo-500/20 text-xs text-left transition-all group cursor-pointer text-indigo-300"
            >
              <Compass className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>Space Xplorer</span>
            </button>

            <button
              onClick={() => onLaunchApp('RESEARCH')}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-emerald-500/20 text-xs text-left transition-all group cursor-pointer text-emerald-300"
            >
              <Search className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>Deep Research</span>
            </button>

            <button
              onClick={() => onLaunchApp('NOTES')}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-amber-500/20 text-xs text-left transition-all group cursor-pointer text-amber-300"
            >
              <FileText className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>Notes Memory</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Floating Visualizer / Audio Waveform Status */}
      {isVisible && (
        <div className={`flex items-center justify-center w-full ${isMobile ? 'pb-1' : 'pb-2'}`}>
          <div
            className={`pointer-events-auto backdrop-blur-md rounded-full border flex items-center shadow-lg transition-all ${
              isDark
                ? 'bg-black/50 border-cyan-500/30 text-cyan-300'
                : 'bg-white/80 border-cyan-400 text-cyan-800'
            } ${isMobile ? 'px-3 py-1 gap-2 scale-90' : 'px-4 py-1.5 gap-3'}`}
          >
            <Activity className={`${isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'} animate-pulse text-cyan-400`} />
            <span className={`${isMobile ? 'text-[9px]' : 'text-[11px]'} font-mono tracking-wide uppercase truncate max-w-[120px] sm:max-w-none`}>
              {isSpeaking
                ? 'SPEAKING'
                : avatarState === 'listening'
                ? 'LISTENING'
                : avatarState === 'thinking'
                ? 'REASONING'
                : 'QUANTUM IDLE'}
            </span>

            {/* Audio Spectrum Bars */}
            <div className={`flex items-center gap-0.5 ${isMobile ? 'h-2.5' : 'h-3.5'}`}>
              {[0.4, 0.8, 1.2, 0.6, 0.9, 0.3, 0.7].map((factor, idx) => {
                const height = isSpeaking
                  ? Math.max(3, Math.min(isMobile ? 10 : 14, audioVolume * 22 * factor + Math.random() * 4))
                  : avatarState === 'listening'
                  ? 4 + Math.sin(Date.now() * 0.005 + idx) * 3
                  : 3;
                return (
                  <span
                    key={idx}
                    className="w-1 rounded-full bg-gradient-to-t from-cyan-400 to-violet-400 transition-all duration-75"
                    style={{ height: `${height}px` }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
