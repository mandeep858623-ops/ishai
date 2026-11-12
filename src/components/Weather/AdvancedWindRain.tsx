import React, { useState } from 'react';
import { 
  Wind, 
  Droplets, 
  Compass, 
  ArrowUp, 
  TrendingUp, 
  Gauge, 
  Clock, 
  CloudRain,
  ShieldAlert
} from 'lucide-react';
import { RawWeatherData, UnitPreferences } from './types';
import { 
  formatWindSpeed, 
  formatPrecipitation, 
  getWindDirectionLabel 
} from './weatherHelpers';

interface AdvancedWindRainProps {
  weather: RawWeatherData;
  units: UnitPreferences;
  theme: 'dark' | 'light';
}

export const AdvancedWindRain: React.FC<AdvancedWindRainProps> = ({
  weather,
  units,
  theme
}) => {
  const [activeTab, setActiveTab] = useState<'wind' | 'rain'>('wind');

  const curr = weather.current;
  const hourly = weather.hourly;
  const hours = hourly?.time?.slice(0, 24) || [];

  return (
    <div className="space-y-6">
      {/* Switcher Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('wind')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'wind'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-white bg-zinc-900/60'
            }`}
          >
            <Wind className="w-4 h-4" />
            <span>Wind Telemetry & Compass</span>
          </button>

          <button
            onClick={() => setActiveTab('rain')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'rain'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-zinc-400 hover:text-white bg-zinc-900/60'
            }`}
          >
            <Droplets className="w-4 h-4" />
            <span>Precipitation & Rain Timeline</span>
          </button>
        </div>

        <span className="text-[10px] text-zinc-500 font-mono">10m AGL Anemometer & Radar</span>
      </div>

      {/* WIND ANALYSIS PANEL */}
      {activeTab === 'wind' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Wind Compass Visualizer */}
            <div className={`p-6 rounded-3xl border flex flex-col items-center justify-center text-center shadow-xl ${
              theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200'
            }`}>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">
                Wind Compass & Direction
              </span>

              {/* Circular Compass Dial */}
              <div className="relative w-44 h-44 rounded-full border-2 border-zinc-700/80 bg-zinc-950/70 flex items-center justify-center shadow-inner">
                {/* Cardinal Points */}
                <span className="absolute top-1.5 text-[11px] font-black text-cyan-400">N</span>
                <span className="absolute right-2 text-[11px] font-black text-zinc-500">E</span>
                <span className="absolute bottom-1.5 text-[11px] font-black text-zinc-500">S</span>
                <span className="absolute left-2 text-[11px] font-black text-zinc-500">W</span>

                {/* Rotating Needle */}
                <div
                  className="absolute w-full h-full flex items-center justify-center transition-transform duration-700"
                  style={{ transform: `rotate(${curr.wind_direction_10m}deg)` }}
                >
                  <div className="flex flex-col items-center h-full py-6">
                    <ArrowUp className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                    <div className="w-0.5 flex-1 bg-gradient-to-b from-cyan-400 to-transparent" />
                  </div>
                </div>

                {/* Center Hub */}
                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700 flex flex-col items-center justify-center shadow-md relative z-10">
                  <span className="text-xs font-black text-white">{curr.wind_direction_10m}°</span>
                </div>
              </div>

              <div className="mt-4 text-xs font-bold text-cyan-400 flex items-center gap-1">
                <span>Originating: </span>
                <span className="text-white font-extrabold">{getWindDirectionLabel(curr.wind_direction_10m)} ({curr.wind_direction_10m}°)</span>
              </div>
            </div>

            {/* Sustained Speed Card */}
            <div className={`p-6 rounded-3xl border flex flex-col justify-between shadow-xl ${
              theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200'
            }`}>
              <div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Sustained 10m Wind Speed
                </span>
                <div className="text-4xl font-black text-white mt-3">
                  {formatWindSpeed(curr.wind_speed_10m, units.windSpeed)}
                </div>
                <p className="text-xs text-zinc-400 mt-2">
                  Average velocity measured at 10 meters above ground level per WMO standards.
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-800/80 mt-4 text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Beaufort Scale:</span>
                <span className="text-cyan-400 font-bold">
                  {curr.wind_speed_10m < 1 ? 'Calm (0)' : curr.wind_speed_10m < 12 ? 'Light Breeze (2)' : curr.wind_speed_10m < 29 ? 'Moderate Breeze (4)' : 'Strong Breeze (6)'}
                </span>
              </div>
            </div>

            {/* Peak Gusts Card */}
            <div className={`p-6 rounded-3xl border flex flex-col justify-between shadow-xl ${
              theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200'
            }`}>
              <div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Peak Wind Gusts
                </span>
                <div className="text-4xl font-black text-amber-400 mt-3">
                  {formatWindSpeed(curr.wind_gusts_10m, units.windSpeed)}
                </div>
                <p className="text-xs text-zinc-400 mt-2">
                  Maximum localized 3-second turbulent spike expected during this observation window.
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-800/80 mt-4 text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Gust Margin:</span>
                <span className="text-amber-400 font-bold">
                  +{(curr.wind_gusts_10m - curr.wind_speed_10m).toFixed(1)} km/h
                </span>
              </div>
            </div>
          </div>

          {/* 24-Hour Wind Velocity Curve */}
          {hours.length > 0 && (
            <div className={`p-6 rounded-3xl border shadow-xl ${
              theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-slate-200'
            }`}>
              <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>24-Hour Wind Speed & Gusts Trajectory</span>
              </h4>

              <div className="flex items-end gap-2 overflow-x-auto pb-2 scrollbar-none">
                {hours.map((time, idx) => {
                  const spd = hourly.wind_speed_10m[idx] || 0;
                  const gst = hourly.wind_gusts_10m[idx] || 0;
                  const hourStr = new Date(time).toLocaleTimeString([], { hour: 'numeric' });
                  const barH = Math.max(12, (spd / 60) * 80);

                  return (
                    <div key={time} className="flex flex-col items-center gap-1.5 shrink-0 min-w-[38px]">
                      <span className="text-[10px] font-bold text-white">{Math.round(spd)}</span>
                      <div
                        className="w-3.5 rounded-t bg-cyan-400/80 hover:bg-cyan-300 transition-colors"
                        style={{ height: `${barH}px` }}
                        title={`Sustained: ${spd} km/h, Gusts: ${gst} km/h`}
                      />
                      <span className="text-[9px] text-zinc-500 font-medium">{hourStr}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* RAIN ANALYSIS PANEL */}
      {activeTab === 'rain' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-6 rounded-3xl border shadow-xl ${
              theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200'
            }`}>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Current Precipitation Rate
              </span>
              <div className="text-4xl font-black text-cyan-400 mt-3">
                {formatPrecipitation(curr.precipitation, units.precipitation)}/h
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                Liquid water equivalent accumulating per hour at surface level.
              </p>
            </div>

            <div className={`p-6 rounded-3xl border shadow-xl ${
              theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200'
            }`}>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Today's Cumulative Rainfall
              </span>
              <div className="text-4xl font-black text-blue-400 mt-3">
                {formatPrecipitation(weather.daily?.rain_sum?.[0] || 0, units.precipitation)}
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                Total aggregate volume forecast across the current 24-hour cycle.
              </p>
            </div>

            <div className={`p-6 rounded-3xl border shadow-xl ${
              theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200'
            }`}>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Peak Rain Probability
              </span>
              <div className="text-4xl font-black text-indigo-400 mt-3">
                {weather.daily?.precipitation_probability_max?.[0] || 0}%
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                Maximum likelihood of measurable precipitation occurring today.
              </p>
            </div>
          </div>

          {/* Hourly Rain Probability Timeline */}
          {hours.length > 0 && (
            <div className={`p-6 rounded-3xl border shadow-xl ${
              theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-slate-200'
            }`}>
              <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-blue-400" />
                <span>Next 24 Hours Precipitation Probability & Volume Timeline</span>
              </h4>

              <div className="flex items-end gap-2 overflow-x-auto pb-2 scrollbar-none">
                {hours.map((time, idx) => {
                  const prob = hourly.precipitation_probability[idx] || 0;
                  const amt = hourly.precipitation[idx] || 0;
                  const hourStr = new Date(time).toLocaleTimeString([], { hour: 'numeric' });
                  const barH = Math.max(8, (prob / 100) * 80);

                  return (
                    <div key={time} className="flex flex-col items-center gap-1.5 shrink-0 min-w-[38px]">
                      <span className="text-[10px] font-bold text-blue-300">{prob}%</span>
                      <div
                        className="w-4 rounded-t transition-all"
                        style={{
                          height: `${barH}px`,
                          backgroundColor: prob > 60 ? '#3b82f6' : prob > 25 ? '#60a5fa' : '#38bdf8'
                        }}
                        title={`Probability: ${prob}%, Volume: ${amt} mm`}
                      />
                      <span className="text-[9px] text-zinc-500 font-medium">{hourStr}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
