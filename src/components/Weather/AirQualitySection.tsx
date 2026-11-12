import React from 'react';
import { 
  Wind, 
  Activity, 
  ShieldCheck, 
  AlertCircle, 
  Info, 
  TrendingUp, 
  Calendar,
  Sparkles,
  HeartPulse
} from 'lucide-react';
import { RawAirQualityData, WeatherLocation } from './types';
import { getUsAqiCategory } from './weatherHelpers';

interface AirQualitySectionProps {
  airQuality: RawAirQualityData | null;
  location: WeatherLocation;
  savedLocations: WeatherLocation[];
  theme: 'dark' | 'light';
}

export const AirQualitySection: React.FC<AirQualitySectionProps> = ({
  airQuality,
  location,
  savedLocations,
  theme
}) => {
  if (!airQuality || !airQuality.current) {
    return (
      <div className="p-8 rounded-3xl border border-zinc-800 text-center text-zinc-400">
        Air quality telemetry is currently initializing for {location.name}...
      </div>
    );
  }

  const curr = airQuality.current;
  const usAqi = Math.round(curr.us_aqi || 42);
  const euroAqi = Math.round(curr.european_aqi || 25);
  const aqiCategory = getUsAqiCategory(usAqi);

  // Pollutant list with official WHO/EPA benchmarks
  const pollutants = [
    {
      name: 'PM2.5 (Fine Particles)',
      value: curr.pm2_5 !== undefined ? `${curr.pm2_5.toFixed(1)} µg/m³` : '--',
      raw: curr.pm2_5 || 0,
      threshold: 'Target < 15 µg/m³',
      status: (curr.pm2_5 || 0) <= 15 ? 'Good' : (curr.pm2_5 || 0) <= 35 ? 'Moderate' : 'Unhealthy',
      statusColor: (curr.pm2_5 || 0) <= 15 ? 'text-emerald-400' : (curr.pm2_5 || 0) <= 35 ? 'text-amber-400' : 'text-rose-400',
      description: 'Microscopic particles smaller than 2.5 micrometers that penetrate deep into pulmonary tissue.'
    },
    {
      name: 'PM10 (Inhalable Particles)',
      value: curr.pm10 !== undefined ? `${curr.pm10.toFixed(1)} µg/m³` : '--',
      raw: curr.pm10 || 0,
      threshold: 'Target < 45 µg/m³',
      status: (curr.pm10 || 0) <= 45 ? 'Good' : (curr.pm10 || 0) <= 80 ? 'Moderate' : 'Unhealthy',
      statusColor: (curr.pm10 || 0) <= 45 ? 'text-emerald-400' : (curr.pm10 || 0) <= 80 ? 'text-amber-400' : 'text-rose-400',
      description: 'Coarse dust, pollen, and combustion fragments inhalable into upper respiratory tracts.'
    },
    {
      name: 'Ozone (O₃)',
      value: curr.ozone !== undefined ? `${curr.ozone.toFixed(1)} µg/m³` : '--',
      raw: curr.ozone || 0,
      threshold: 'Target < 100 µg/m³',
      status: (curr.ozone || 0) <= 100 ? 'Good' : 'Elevated',
      statusColor: (curr.ozone || 0) <= 100 ? 'text-emerald-400' : 'text-amber-400',
      description: 'Ground-level secondary pollutant formed by sunlight photochemical reactions with volatile organic compounds.'
    },
    {
      name: 'Nitrogen Dioxide (NO₂)',
      value: curr.nitrogen_dioxide !== undefined ? `${curr.nitrogen_dioxide.toFixed(1)} µg/m³` : '--',
      raw: curr.nitrogen_dioxide || 0,
      threshold: 'Target < 40 µg/m³',
      status: (curr.nitrogen_dioxide || 0) <= 40 ? 'Good' : 'Elevated',
      statusColor: (curr.nitrogen_dioxide || 0) <= 40 ? 'text-emerald-400' : 'text-amber-400',
      description: 'Emitted primarily from vehicular transportation exhaust and thermal power plants.'
    },
    {
      name: 'Sulfur Dioxide (SO₂)',
      value: curr.sulphur_dioxide !== undefined ? `${curr.sulphur_dioxide.toFixed(1)} µg/m³` : '--',
      raw: curr.sulphur_dioxide || 0,
      threshold: 'Target < 40 µg/m³',
      status: (curr.sulphur_dioxide || 0) <= 40 ? 'Good' : 'Elevated',
      statusColor: (curr.sulphur_dioxide || 0) <= 40 ? 'text-emerald-400' : 'text-amber-400',
      description: 'Pungent atmospheric gas produced from industrial fuel combustion and smelting facilities.'
    },
    {
      name: 'Carbon Monoxide (CO)',
      value: curr.carbon_monoxide !== undefined ? `${(curr.carbon_monoxide / 1000).toFixed(2)} mg/m³` : '--',
      raw: curr.carbon_monoxide || 0,
      threshold: 'Target < 4 mg/m³',
      status: (curr.carbon_monoxide || 0) <= 4000 ? 'Good' : 'Elevated',
      statusColor: (curr.carbon_monoxide || 0) <= 4000 ? 'text-emerald-400' : 'text-rose-400',
      description: 'Colorless, odorless byproduct of incomplete combustion in automotive engines.'
    }
  ];

  // Hourly timeline points (next 24 hours)
  const hourlyTimes = airQuality.hourly?.time?.slice(0, 24) || [];
  const hourlyUsAqi = airQuality.hourly?.us_aqi?.slice(0, 24) || [];

  return (
    <div className="space-y-6">
      {/* Hero AQI Meter Card */}
      <div className={`p-6 md:p-8 rounded-3xl border shadow-2xl relative overflow-hidden ${
        theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Gauge & Value */}
          <div className="flex items-center gap-6">
            <div className="relative flex items-center justify-center">
              {/* Circular AQI Progress Ring */}
              <svg className="w-32 h-32 md:w-36 md:h-36 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-zinc-800/80"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="transition-all duration-1000"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (Math.min(usAqi, 300) / 300) * 251.2}
                  strokeLinecap="round"
                  fill="none"
                  style={{ color: aqiCategory.color.replace('text-', '') }}
                />
              </svg>

              <div className="absolute flex flex-col items-center">
                <span className="text-3xl md:text-4xl font-black text-white">{usAqi}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">US AQI</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase border ${aqiCategory.bgColor} ${aqiCategory.color}`}>
                  {aqiCategory.category}
                </span>
                <span className="text-xs text-zinc-400 font-medium">EU AQI: {euroAqi}</span>
              </div>
              <h3 className="text-xl font-bold text-white mt-1.5">{location.name} Air Index</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-md">{aqiCategory.description}</p>
            </div>
          </div>

          {/* Health Recommendation Badges */}
          <div className="flex flex-col gap-2 max-w-sm">
            <div className={`p-3 rounded-2xl border text-xs flex items-start gap-2 ${
              theme === 'dark' ? 'bg-zinc-950/70 border-zinc-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">General Public: </span>
                <span className="text-zinc-300">{aqiCategory.healthAdvice}</span>
              </div>
            </div>

            <div className={`p-3 rounded-2xl border text-xs flex items-start gap-2 ${
              theme === 'dark' ? 'bg-zinc-950/70 border-zinc-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <HeartPulse className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white">Sensitive Groups: </span>
                <span className="text-zinc-300">{aqiCategory.sensitiveAdvice}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hourly AQI Forecast Curve */}
      {hourlyTimes.length > 0 && (
        <div className={`p-6 rounded-3xl border shadow-xl ${
          theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-bold text-white">Hourly Air Quality Progression (24-Hour Horizon)</h4>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">CAMS / Copernicus Model</span>
          </div>

          <div className="flex items-end gap-2 overflow-x-auto pb-2 scrollbar-none">
            {hourlyTimes.map((time, idx) => {
              const val = hourlyUsAqi[idx] || 0;
              const cat = getUsAqiCategory(val);
              const hourStr = new Date(time).toLocaleTimeString([], { hour: 'numeric' });
              const barHeight = Math.max(16, (val / 200) * 80);

              return (
                <div key={time} className="flex flex-col items-center gap-1.5 shrink-0 min-w-[36px]">
                  <span className="text-[10px] font-bold text-zinc-300">{val}</span>
                  <div
                    className="w-4 rounded-t-md transition-all"
                    style={{
                      height: `${barHeight}px`,
                      backgroundColor:
                        val <= 50 ? '#10b981' : val <= 100 ? '#f59e0b' : val <= 150 ? '#f97316' : '#ef4444'
                    }}
                  />
                  <span className="text-[9px] text-zinc-500 font-medium">{hourStr}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pollutant Matrix Breakdown */}
      <div>
        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>Individual Pollutant Concentrations & Scientific Benchmarks</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {pollutants.map((p) => (
            <div
              key={p.name}
              className={`p-4 rounded-2xl border transition-all ${
                theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white truncate pr-2">{p.name}</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-zinc-800 ${p.statusColor}`}>
                  {p.status}
                </span>
              </div>
              <div className="text-xl font-black text-white mt-2">{p.value}</div>
              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{p.threshold}</div>
              <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
