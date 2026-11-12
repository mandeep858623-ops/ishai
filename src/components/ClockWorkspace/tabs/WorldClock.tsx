import React, { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, Search, MapPin, Clock as ClockIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClockService, ClockSettings } from '../../../services/ClockService';
import { format } from 'date-fns';

interface WorldClockTabProps {
  currentUser: any;
  settings: ClockSettings;
  onUpdateSettings: (settings: ClockSettings) => void;
}

const COMMON_CITIES = [
  { name: 'New Delhi', timezone: 'Asia/Kolkata' },
  { name: 'London', timezone: 'Europe/London' },
  { name: 'New York', timezone: 'America/New_York' },
  { name: 'Tokyo', timezone: 'Asia/Tokyo' },
  { name: 'Singapore', timezone: 'Asia/Singapore' },
  { name: 'Dubai', timezone: 'Asia/Dubai' },
  { name: 'Sydney', timezone: 'Australia/Sydney' },
  { name: 'Los Angeles', timezone: 'America/Los_Angeles' },
  { name: 'Paris', timezone: 'Europe/Paris' },
];

export const WorldClockTab: React.FC<WorldClockTabProps> = ({ currentUser, settings, onUpdateSettings }) => {
  const [search, setSearch] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const worldClocks = settings.world_clocks || [];

  const addCity = async (city: { name: string, timezone: string }) => {
    if (worldClocks.find(c => c.timezone === city.timezone)) return;
    
    const updatedClocks = [...worldClocks, city];
    const updatedSettings = { ...settings, world_clocks: updatedClocks };
    onUpdateSettings(updatedSettings);
    await ClockService.updateSettings(currentUser.uid, { world_clocks: updatedClocks });
    setSearch('');
  };

  const removeCity = async (timezone: string) => {
    const updatedClocks = worldClocks.filter(c => c.timezone !== timezone);
    const updatedSettings = { ...settings, world_clocks: updatedClocks };
    onUpdateSettings(updatedSettings);
    await ClockService.updateSettings(currentUser.uid, { world_clocks: updatedClocks });
  };

  const getTimeInZone = (timezone: string) => {
    return new Date(currentTime.toLocaleString('en-US', { timeZone: timezone }));
  };

  const getTimeDiff = (timezone: string) => {
    const localTime = new Date();
    const targetTime = getTimeInZone(timezone);
    const diffHours = Math.round((targetTime.getTime() - localTime.getTime()) / (1000 * 60 * 60));
    const prefix = diffHours >= 0 ? '+' : '';
    return `${prefix}${diffHours}h`;
  };

  const filteredCities = COMMON_CITIES.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) && 
    !worldClocks.find(wc => wc.timezone === c.timezone)
  );

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Search Section */}
      <section className="relative">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-900 group-focus-within:text-emerald-500 transition-colors" />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SEARCH CITIES TO ADD..."
            className="w-full bg-black/40 border border-emerald-500/20 rounded-xl pl-12 pr-4 py-4 text-sm text-emerald-300 placeholder:text-emerald-900 focus:outline-none focus:border-emerald-500/50 transition-all font-bold uppercase tracking-widest"
          />
        </div>

        <AnimatePresence>
          {search && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-10 left-0 right-0 mt-2 bg-[#0d0d0e] border border-emerald-500/30 rounded-xl shadow-2xl overflow-hidden"
            >
              {filteredCities.length > 0 ? filteredCities.map(city => (
                <button 
                  key={city.timezone}
                  onClick={() => addCity(city)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-emerald-500/10 transition-colors border-b border-emerald-500/10 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-emerald-700" />
                    <span className="text-sm font-black text-emerald-200 uppercase tracking-wider">{city.name}</span>
                  </div>
                  <Plus className="w-4 h-4 text-emerald-700" />
                </button>
              )) : (
                <div className="px-6 py-4 text-center text-[10px] text-emerald-900 font-black uppercase tracking-widest">No matching cities found</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Selected Clocks */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
        <AnimatePresence>
          {worldClocks.map((city) => {
            const time = getTimeInZone(city.timezone);
            const isNight = time.getHours() < 6 || time.getHours() >= 18;
            
            return (
              <motion.div 
                key={city.timezone}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`p-6 rounded-2xl border border-emerald-500/20 bg-emerald-950/5 relative overflow-hidden group`}
              >
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-2">
                    <Globe className={`w-4 h-4 ${isNight ? 'text-indigo-500' : 'text-amber-500'}`} />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">{city.name}</span>
                  </div>
                  <button 
                    onClick={() => removeCity(city.timezone)}
                    className="p-1 text-emerald-900 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-4xl font-mono font-black text-emerald-100 tracking-tighter mb-1 relative z-10">
                  {format(time, settings.format_24h ? 'HH:mm' : 'hh:mm a')}
                </div>

                <div className="flex items-center justify-between relative z-10">
                  <span className="text-[10px] text-emerald-700 font-bold uppercase">{format(time, 'EEE, MMM do')}</span>
                  <span className="text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded text-emerald-500 font-black">{getTimeDiff(city.timezone)}</span>
                </div>

                {/* Decorative Background Icon */}
                <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                  <Globe className="w-24 h-24 text-emerald-500" />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {worldClocks.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-center space-y-4 opacity-30">
            <Globe className="w-12 h-12 text-emerald-500" />
            <div className="text-xs font-black uppercase tracking-[0.3em] text-emerald-500">Monitor Global Timezones</div>
          </div>
        )}
      </div>
    </div>
  );
};
