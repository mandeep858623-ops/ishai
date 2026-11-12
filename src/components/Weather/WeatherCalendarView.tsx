import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Sun, 
  CloudRain, 
  Droplets, 
  Wind, 
  Clock, 
  Info,
  CalendarCheck2
} from 'lucide-react';
import { RawWeatherData, UnitPreferences } from './types';
import { 
  getWeatherCodeInfo, 
  formatTemperature, 
  formatPrecipitation, 
  formatDayCard 
} from './weatherHelpers';

interface WeatherCalendarViewProps {
  weather: RawWeatherData;
  units: UnitPreferences;
  theme: 'dark' | 'light';
}

export const WeatherCalendarView: React.FC<WeatherCalendarViewProps> = ({
  weather,
  units,
  theme
}) => {
  const daily = weather.daily;
  const days = daily?.time || [];
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  if (days.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-400">
        No calendar schedule available.
      </div>
    );
  }

  const selectedDateStr = days[selectedDayIndex];
  const selectedCode = daily.weather_code[selectedDayIndex] || 0;
  const selectedInfo = getWeatherCodeInfo(selectedCode);

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white">14-Day Meteorological Planner & Calendar</h3>
        </div>
        <span className="text-[10px] text-zinc-500 font-mono">Synced to ECMWF Multi-Day Horizon</span>
      </div>

      {/* Days Grid Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
        {days.slice(0, 14).map((dStr, idx) => {
          const isSelected = selectedDayIndex === idx;
          const code = daily.weather_code[idx] || 0;
          const wInfo = getWeatherCodeInfo(code);
          const maxT = daily.temperature_2m_max[idx];
          const minT = daily.temperature_2m_min[idx];
          const rainProb = daily.precipitation_probability_max[idx] || 0;
          const cardInfo = formatDayCard(dStr);

          return (
            <button
              key={dStr}
              onClick={() => setSelectedDayIndex(idx)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-b from-cyan-950/60 to-blue-950/60 border-cyan-400 text-white shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400/50'
                  : theme === 'dark'
                  ? 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-800/50 text-zinc-300'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{idx === 0 ? 'Today' : cardInfo.day}</span>
                  <span className="text-[10px] text-zinc-500">{cardInfo.date}</span>
                </div>
                <div className="text-[11px] font-medium text-cyan-400 mt-1 truncate">
                  {wInfo.description}
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-zinc-800/60 flex items-baseline justify-between text-xs">
                <span className="font-extrabold text-white">{formatTemperature(maxT, units.temperature)}</span>
                <span className="text-zinc-500 font-medium">{formatTemperature(minT, units.temperature)}</span>
              </div>

              {rainProb > 0 && (
                <div className="text-[9px] text-blue-400 font-bold mt-1 flex items-center gap-1">
                  <Droplets className="w-2.5 h-2.5" />
                  <span>{rainProb}% rain</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Day Expanded Detail Card */}
      <div className={`p-6 rounded-3xl border shadow-xl ${
        theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-xl text-xs font-black uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Detailed Observation
              </span>
              <span className="text-sm font-bold text-white">
                {new Date(selectedDateStr).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h4 className="text-2xl font-black text-white mt-2">
              {selectedInfo.description}
            </h4>
          </div>

          <div className="flex items-baseline gap-4">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">High</span>
              <span className="text-2xl font-black text-white">
                {formatTemperature(daily.temperature_2m_max[selectedDayIndex], units.temperature)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Low</span>
              <span className="text-2xl font-black text-zinc-400">
                {formatTemperature(daily.temperature_2m_min[selectedDayIndex], units.temperature)}
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 text-xs">
          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
            <span className="text-zinc-500 block">Rainfall Volume</span>
            <span className="text-base font-bold text-white mt-1 block">
              {formatPrecipitation(daily.rain_sum?.[selectedDayIndex] || 0, units.precipitation)}
            </span>
            <span className="text-[10px] text-zinc-500">
              {daily.precipitation_hours?.[selectedDayIndex] || 0} hrs expected duration
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
            <span className="text-zinc-500 block">Peak Wind Gusts</span>
            <span className="text-base font-bold text-white mt-1 block">
              {daily.wind_gusts_10m_max[selectedDayIndex]} km/h
            </span>
            <span className="text-[10px] text-zinc-500">
              Sustained {daily.wind_speed_10m_max[selectedDayIndex]} km/h
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
            <span className="text-zinc-500 block">Max UV Index</span>
            <span className="text-base font-bold text-amber-400 mt-1 block">
              UV {daily.uv_index_max?.[selectedDayIndex] || 0}
            </span>
            <span className="text-[10px] text-zinc-500">Sun protection advised</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
            <span className="text-zinc-500 block">Daylight Duration</span>
            <span className="text-base font-bold text-cyan-400 mt-1 block">
              {Math.round((daily.daylight_duration?.[selectedDayIndex] || 43200) / 3600)} hrs
            </span>
            <span className="text-[10px] text-zinc-500">
              Sunrise {daily.sunrise?.[selectedDayIndex]?.slice(11, 16)} • Sunset {daily.sunset?.[selectedDayIndex]?.slice(11, 16)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
