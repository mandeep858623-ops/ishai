import React, { useState } from 'react';
import { 
  Sun, 
  Moon, 
  ShieldCheck, 
  History, 
  HeartPulse, 
  Sparkles, 
  Clock, 
  ArrowUp, 
  ArrowDown, 
  Calendar,
  Loader2,
  TrendingUp,
  Thermometer
} from 'lucide-react';
import { RawWeatherData, UnitPreferences, WeatherLocation } from './types';
import { 
  getSunMoonTelemetry, 
  getUvGuidance, 
  calculateHeatIndex, 
  calculateWindChill, 
  calculateDewPoint, 
  getComfortEvaluation,
  formatTemperature,
  formatPrecipitation
} from './weatherHelpers';

interface SpecialWeatherToolsProps {
  weather: RawWeatherData;
  location: WeatherLocation;
  units: UnitPreferences;
  theme: 'dark' | 'light';
}

export const SpecialWeatherTools: React.FC<SpecialWeatherToolsProps> = ({
  weather,
  location,
  units,
  theme
}) => {
  const [activeTool, setActiveTool] = useState<'astronomy' | 'uv' | 'comfort' | 'history'>('astronomy');

  // Sun & Moon via SunCalc
  const sunMoon = getSunMoonTelemetry(new Date(), location.lat, location.lon);

  // UV index
  const uvMax = weather.daily?.uv_index_max?.[0] || 4;
  const uvGuidance = getUvGuidance(uvMax);

  // Comfort metrics
  const currTemp = weather.current.temperature_2m;
  const currHumidity = weather.current.relative_humidity_2m;
  const currWind = weather.current.wind_speed_10m;
  const heatIndex = calculateHeatIndex(currTemp, currHumidity);
  const windChill = calculateWindChill(currTemp, currWind);
  const dewPoint = calculateDewPoint(currTemp, currHumidity);
  const comfort = getComfortEvaluation(dewPoint);

  // Historical state
  const [histDaysAgo, setHistDaysAgo] = useState<'7' | '30' | '365'>('7');
  const [histData, setHistData] = useState<any | null>(null);
  const [isLoadingHist, setIsLoadingHist] = useState(false);

  const fetchHistory = async (days: number) => {
    setIsLoadingHist(true);
    const end = new Date(Date.now() - 24 * 3600000); // yesterday
    const start = new Date(end.getTime() - days * 86400000);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);

    try {
      const res = await fetch(`/api/weather/history?lat=${location.lat}&lon=${location.lon}&start_date=${startStr}&end_date=${endStr}`);
      const json = await res.json();
      if (json.success && json.history?.daily) {
        setHistData(json.history.daily);
      } else {
        setHistData(null);
      }
    } catch {
      setHistData(null);
    } finally {
      setIsLoadingHist(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tool Selector Bar */}
      <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-zinc-800">
        <button
          onClick={() => setActiveTool('astronomy')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTool === 'astronomy'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg shadow-amber-500/20'
              : 'text-zinc-400 hover:text-white bg-zinc-900/60'
          }`}
        >
          <Sun className="w-4 h-4" />
          <span>Solar & Lunar Telemetry</span>
        </button>

        <button
          onClick={() => setActiveTool('uv')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTool === 'uv'
              ? 'bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-lg shadow-orange-500/20'
              : 'text-zinc-400 hover:text-white bg-zinc-900/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>UV Index Explorer</span>
        </button>

        <button
          onClick={() => setActiveTool('comfort')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTool === 'comfort'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
              : 'text-zinc-400 hover:text-white bg-zinc-900/60'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          <span>Health, Heat Index & Dew Point</span>
        </button>

        <button
          onClick={() => {
            setActiveTool('history');
            if (!histData && !isLoadingHist) fetchHistory(7);
          }}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTool === 'history'
              ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20'
              : 'text-zinc-400 hover:text-white bg-zinc-900/60'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Historical Archive Comparison</span>
        </button>
      </div>

      {/* 1. SOLAR & LUNAR TELEMETRY */}
      {activeTool === 'astronomy' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sun Cycle Card */}
          <div className={`p-6 rounded-3xl border shadow-xl ${
            theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Sun className="w-4 h-4" />
                <span>Solar Ephemeris</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">Daylight: {sunMoon.dayLengthFormatted}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-400 text-[11px] block">Official Sunrise</span>
                <span className="text-xl font-black text-white mt-1 block">
                  {sunMoon.sunrise.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[10px] text-zinc-500">Dawn: {sunMoon.dawn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-400 text-[11px] block">Official Sunset</span>
                <span className="text-xl font-black text-white mt-1 block">
                  {sunMoon.sunset.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[10px] text-zinc-500">Dusk: {sunMoon.dusk.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-400 text-[11px] block">Solar Noon</span>
                <span className="text-xl font-black text-amber-400 mt-1 block">
                  {sunMoon.solarNoon.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[10px] text-zinc-500">Peak zenith angle</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-400 text-[11px] block">Golden Hour</span>
                <span className="text-xl font-black text-yellow-400 mt-1 block">
                  {sunMoon.goldenHour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[10px] text-zinc-500">Optimal soft lighting</span>
              </div>
            </div>
          </div>

          {/* Lunar Ephemeris Card */}
          <div className={`p-6 rounded-3xl border shadow-xl ${
            theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Moon className="w-4 h-4" />
                <span>Lunar Cycle & Illumination</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">SunCalc Astronomical Engine</span>
            </div>

            <div className="flex items-center gap-6 mt-4 p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
              <div className="text-5xl">{sunMoon.moonIcon}</div>
              <div>
                <span className="text-base font-extrabold text-white block">{sunMoon.moonPhaseName}</span>
                <span className="text-xs text-indigo-300 font-medium block mt-0.5">
                  {(sunMoon.moonFraction * 100).toFixed(1)}% Surface Illumination
                </span>
                <span className="text-[11px] text-zinc-400 block mt-1">
                  Phase Cycle Position: {(sunMoon.moonPhase * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
              <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-400 text-[11px] block">Moonrise</span>
                <span className="text-sm font-bold text-white mt-1 block">
                  {sunMoon.moonrise ? sunMoon.moonrise.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Visible Tomorrow'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="text-zinc-400 text-[11px] block">Moonset</span>
                <span className="text-sm font-bold text-white mt-1 block">
                  {sunMoon.moonset ? sunMoon.moonset.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Visible Tomorrow'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. UV INDEX EXPLORER */}
      {activeTool === 'uv' && (
        <div className={`p-6 md:p-8 rounded-3xl border shadow-xl ${
          theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500 to-rose-600 flex flex-col items-center justify-center text-white shadow-xl shadow-orange-500/30">
                <span className="text-3xl font-black">{uvMax}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">UV INDEX</span>
              </div>
              <div>
                <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase bg-zinc-800 ${uvGuidance.color}`}>
                  {uvGuidance.category} Exposure Risk
                </span>
                <h4 className="text-xl font-bold text-white mt-1.5">Solar Ultraviolet Radiation</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-md">{uvGuidance.protection}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 text-xs text-zinc-300 max-w-sm">
              <span className="font-bold text-amber-400 block mb-1">Unprotected Skin Burn Time:</span>
              <span>Approximately {uvGuidance.burnTime} under direct peak sunlight. Apply broad-spectrum SPF 50+ every two hours when outdoors.</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. HEALTH & COMFORT INDEX */}
      {activeTool === 'comfort' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-6 rounded-3xl border shadow-xl ${
            theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200'
          }`}>
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Apparent Heat Index</span>
            <div className="text-3xl font-black text-white mt-2">
              {formatTemperature(heatIndex, units.temperature)}
            </div>
            <p className="text-xs text-zinc-400 mt-2">
              Calculates how hot conditions genuinely feel when relative humidity ({currHumidity}%) is factored with air temperature.
            </p>
          </div>

          <div className={`p-6 rounded-3xl border shadow-xl ${
            theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200'
          }`}>
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Atmospheric Dew Point</span>
            <div className="text-3xl font-black text-cyan-400 mt-2">
              {formatTemperature(dewPoint, units.temperature)}
            </div>
            <div className="mt-2 text-xs">
              <span className={`font-bold ${comfort.color}`}>{comfort.label}: </span>
              <span className="text-zinc-400">{comfort.advice}</span>
            </div>
          </div>

          <div className={`p-6 rounded-3xl border shadow-xl ${
            theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200'
          }`}>
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Wind Chill Factor</span>
            <div className="text-3xl font-black text-blue-400 mt-2">
              {formatTemperature(windChill, units.temperature)}
            </div>
            <p className="text-xs text-zinc-400 mt-2">
              Rate of cooling heat loss on human skin caused by convection from current wind speeds ({currWind} km/h).
            </p>
          </div>
        </div>
      )}

      {/* 4. HISTORICAL ARCHIVE COMPARISON */}
      {activeTool === 'history' && (
        <div className={`p-6 rounded-3xl border shadow-xl ${
          theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800 mb-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                <span>Historical ECMWF Archive Comparison for {location.name}</span>
              </h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Compare past climate reanalysis against current conditions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setHistDaysAgo('7');
                  fetchHistory(7);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  histDaysAgo === '7' ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Past 7 Days
              </button>
              <button
                onClick={() => {
                  setHistDaysAgo('30');
                  fetchHistory(30);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  histDaysAgo === '30' ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Past 30 Days
              </button>
            </div>
          </div>

          {isLoadingHist ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
              <span className="text-xs text-zinc-400">Querying ERA5 Historical Climate Archive...</span>
            </div>
          ) : histData?.time ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                  <span className="text-zinc-500 block">Avg Past Max Temp</span>
                  <span className="text-lg font-bold text-white mt-1 block">
                    {formatTemperature(
                      histData.temperature_2m_max.reduce((a: number, b: number) => a + b, 0) / histData.temperature_2m_max.length,
                      units.temperature
                    )}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                  <span className="text-zinc-500 block">Today's Forecast Max</span>
                  <span className="text-lg font-bold text-cyan-400 mt-1 block">
                    {formatTemperature(weather.daily?.temperature_2m_max?.[0] || 0, units.temperature)}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                  <span className="text-zinc-500 block">Total Past Rain</span>
                  <span className="text-lg font-bold text-white mt-1 block">
                    {formatPrecipitation(
                      histData.precipitation_sum.reduce((a: number, b: number) => a + b, 0),
                      units.precipitation
                    )}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                  <span className="text-zinc-500 block">Today's Forecast Rain</span>
                  <span className="text-lg font-bold text-blue-400 mt-1 block">
                    {formatPrecipitation(weather.daily?.rain_sum?.[0] || 0, units.precipitation)}
                  </span>
                </div>
              </div>

              {/* Historical Trend Bar */}
              <div className="flex items-end gap-1.5 overflow-x-auto pb-2 scrollbar-none pt-2">
                {histData.time.map((t: string, i: number) => {
                  const max = histData.temperature_2m_max[i];
                  return (
                    <div key={t} className="flex flex-col items-center gap-1 shrink-0 min-w-[28px]">
                      <span className="text-[9px] text-zinc-400">{Math.round(max)}°</span>
                      <div
                        className="w-3 rounded-t bg-indigo-500/70"
                        style={{ height: `${Math.max(10, Math.min(60, max * 2))}px` }}
                      />
                      <span className="text-[8px] text-zinc-500">{t.slice(8, 10)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-zinc-400">
              Select a historical window above to retrieve archive data.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
