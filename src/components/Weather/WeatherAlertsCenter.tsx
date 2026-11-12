import React from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  MapPin, 
  ExternalLink, 
  CheckCircle2, 
  Radio, 
  Info,
  Wind,
  CloudLightning,
  Droplets,
  Flame,
  Snowflake
} from 'lucide-react';
import { WeatherAlertItem, WeatherLocation } from './types';

interface WeatherAlertsCenterProps {
  alerts: WeatherAlertItem[];
  location: WeatherLocation;
  isLoading: boolean;
  onRefresh: () => void;
  theme: 'dark' | 'light';
}

export const WeatherAlertsCenter: React.FC<WeatherAlertsCenterProps> = ({
  alerts,
  location,
  isLoading,
  onRefresh,
  theme
}) => {
  const getSeverityBadge = (severity: WeatherAlertItem['severity']) => {
    switch (severity) {
      case 'EXTREME':
        return {
          bg: 'bg-red-500/20 border-red-500/50 text-red-400',
          dot: 'bg-red-500',
          label: 'EXTREME SEVERITY'
        };
      case 'SEVERE':
        return {
          bg: 'bg-orange-500/20 border-orange-500/50 text-orange-400',
          dot: 'bg-orange-500',
          label: 'SEVERE WARNING'
        };
      case 'MODERATE':
        return {
          bg: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
          dot: 'bg-amber-500',
          label: 'MODERATE ADVISORY'
        };
      case 'MINOR':
      default:
        return {
          bg: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
          dot: 'bg-blue-500',
          label: 'METEOROLOGICAL WATCH'
        };
    }
  };

  const getAlertIcon = (event: string) => {
    const e = event.toLowerCase();
    if (e.includes('thunder') || e.includes('lightning')) return <CloudLightning className="w-5 h-5" />;
    if (e.includes('wind') || e.includes('gale') || e.includes('cyclone')) return <Wind className="w-5 h-5" />;
    if (e.includes('flood') || e.includes('rain')) return <Droplets className="w-5 h-5" />;
    if (e.includes('heat') || e.includes('fire')) return <Flame className="w-5 h-5" />;
    if (e.includes('snow') || e.includes('cold') || e.includes('freeze')) return <Snowflake className="w-5 h-5" />;
    return <AlertTriangle className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`p-5 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        theme === 'dark' 
          ? 'bg-gradient-to-r from-red-950/30 via-zinc-900/60 to-zinc-900/40 border-red-900/40' 
          : 'bg-gradient-to-r from-red-50 via-white to-slate-50 border-red-200'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-red-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-white">Weather Alerts & Warnings Center</h2>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                <Radio className="w-2.5 h-2.5" />
                Live Sync
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Verified official meteorological bulletins for <span className="text-cyan-400 font-semibold">{location.name}, {location.country}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>Refresh Alerts</span>
        </button>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <div className={`p-10 rounded-3xl border text-center flex flex-col items-center justify-center space-y-3 ${
          theme === 'dark' ? 'bg-zinc-900/30 border-zinc-800' : 'bg-white border-slate-200'
        }`}>
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">No Active Severe Weather Warnings</h3>
          <p className="text-xs text-zinc-400 max-w-md">
            All meteorological indices for {location.name} are currently within normal baseline parameters. No extreme rain, gale winds, heatwaves, or severe thunderstorms are registered.
          </p>
          <div className="text-[10px] text-zinc-500 font-mono mt-2">
            Verified across NOAA / WMO Synoptic Station Telemetry
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const badge = getSeverityBadge(alert.severity);

            return (
              <div
                key={alert.id}
                className={`p-5 rounded-3xl border transition-all shadow-xl relative overflow-hidden ${
                  theme === 'dark' 
                    ? 'bg-zinc-900/70 border-zinc-700/80 hover:border-red-500/50' 
                    : 'bg-white border-slate-200 hover:border-red-400'
                }`}
              >
                {/* Decorative alert ambient glow */}
                <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-10 ${
                  alert.severity === 'EXTREME' ? 'bg-red-500' : 'bg-amber-500'
                }`} />

                {/* Top Badge & Timing */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black tracking-wider uppercase border flex items-center gap-1.5 ${badge.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full animate-ping ${badge.dot}`} />
                      {badge.label}
                    </span>
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      {getAlertIcon(alert.event)}
                      {alert.event}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      Expires: {new Date(alert.expires).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Main Headline & Description */}
                <div className="mt-3.5 space-y-2">
                  <h4 className="text-base font-extrabold text-white leading-snug">
                    {alert.title}
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                    {alert.description}
                  </p>
                </div>

                {/* Instructions Box if present */}
                {alert.instructions && (
                  <div className="mt-3 p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 text-xs text-amber-300/90 flex items-start gap-2">
                    <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                    <div>
                      <span className="font-bold">Recommended Safety Actions: </span>
                      <span>{alert.instructions}</span>
                    </div>
                  </div>
                )}

                {/* Footer: Issuing Authority & Source Link */}
                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500 font-medium">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">Issuing Authority:</span>
                    <span className="text-zinc-300 font-semibold">{alert.authority}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-zinc-400">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      {alert.region}
                    </span>
                  </div>

                  {alert.sourceUrl && (
                    <a
                      href={alert.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline transition-colors cursor-pointer"
                    >
                      <span>Official Bulletin</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
