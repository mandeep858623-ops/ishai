import React from 'react';
import { 
  Sun, Moon, Monitor, LayoutGrid, Type, Globe, 
  ToggleLeft as ToggleOff, ToggleRight as ToggleOn, 
  CheckCircle2, Circle
} from 'lucide-react';
import { ClockSettings, ClockService } from '../../../services/ClockService';
import { soundEngine } from '../../../utils/audio';

interface ClockSettingsTabProps {
  currentUser: any;
  settings: ClockSettings;
  onUpdateSettings: (s: ClockSettings) => void;
}

export const ClockSettingsTab: React.FC<ClockSettingsTabProps> = ({ 
  currentUser, 
  settings, 
  onUpdateSettings 
}) => {
  const updateSetting = async (key: keyof ClockSettings, value: any) => {
    soundEngine.playClick();
    const newSettings = { ...settings, [key]: value };
    onUpdateSettings(newSettings);
    if (currentUser?.uid) {
      await ClockService.updateSettings(currentUser.uid, { [key]: value });
    }
  };

  const themes = [
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  const styles = [
    { id: 'minimal', label: 'Minimalist' },
    { id: 'digital', label: 'Tech Digital' },
    { id: 'analog', label: 'Classic Analog' },
    { id: 'neon', label: 'Cyber Neon' },
    { id: 'elegant', label: 'Modern Elegant' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Visual System */}
      <section className="space-y-6">
        <h3 className="text-xs font-black text-emerald-800 uppercase tracking-[0.3em] flex items-center gap-2">
          <LayoutGrid className="w-3 h-3" />
          Appearance & Style
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Theme Selection */}
          <div className="space-y-4">
            <label className="text-sm font-bold text-emerald-300">System Theme</label>
            <div className="flex gap-2">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => updateSetting('theme', t.id)}
                  className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    settings.theme === t.id 
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                      : 'bg-black/40 border-emerald-500/10 text-emerald-900 hover:border-emerald-500/30'
                  }`}
                >
                  <t.icon className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Clock Style */}
          <div className="space-y-4">
            <label className="text-sm font-bold text-emerald-300">Interface Aesthetic</label>
            <div className="grid grid-cols-2 gap-2">
              {styles.map((s) => (
                <button
                  key={s.id}
                  onClick={() => updateSetting('clock_style', s.id)}
                  className={`px-4 py-2.5 rounded-lg border text-[10px] font-black uppercase transition-all ${
                    settings.clock_style === s.id 
                      ? 'bg-emerald-500 text-black border-emerald-500' 
                      : 'bg-black/40 border-emerald-500/10 text-emerald-800 hover:border-emerald-500/30'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Time Configurations */}
      <section className="space-y-6">
        <h3 className="text-xs font-black text-emerald-800 uppercase tracking-[0.3em] flex items-center gap-2">
          <Type className="w-3 h-3" />
          Temporal Parameters
        </h3>

        <div className="bg-black/40 border border-emerald-500/10 rounded-2xl overflow-hidden divide-y divide-emerald-500/5">
          {/* 24-Hour Format */}
          <div className="flex items-center justify-between p-4">
            <div>
              <div className="text-sm font-bold text-emerald-200">24-Hour Chronometer</div>
              <p className="text-[10px] text-emerald-800 uppercase font-bold tracking-tighter">Toggle between AM/PM and Military time standards.</p>
            </div>
            <button 
              onClick={() => updateSetting('format_24h', !settings.format_24h)}
              className="text-emerald-500"
            >
              {settings.format_24h ? <ToggleOn className="w-10 h-10" /> : <ToggleOff className="w-10 h-10 text-emerald-900" />}
            </button>
          </div>

          {/* Timezone */}
          <div className="flex items-center justify-between p-4">
            <div>
              <div className="text-sm font-bold text-emerald-200">Local Reference Node</div>
              <p className="text-[10px] text-emerald-800 uppercase font-bold tracking-tighter">Current Zone: {settings.timezone || 'Auto-detect active'}</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <Globe className="w-3 h-3" />
              GMT {new Date().getTimezoneOffset() / -60 >= 0 ? '+' : ''}{new Date().getTimezoneOffset() / -60}
            </div>
          </div>
        </div>
      </section>

      {/* Persistence Note */}
      <div className="p-4 bg-emerald-500/5 border border-dashed border-emerald-500/20 rounded-xl text-center">
        <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-widest leading-relaxed">
          Operational configurations are synchronized with your SuperAI Neural Profile. <br />
          Settings persist across all authenticated terminal instances.
        </p>
      </div>
    </div>
  );
};
