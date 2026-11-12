import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Search, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  Star, 
  Compass, 
  Clock, 
  Layers, 
  Scale, 
  Loader2,
  ArrowUpDown,
  X
} from 'lucide-react';
import { WeatherLocation, UnitPreferences } from './types';
import { formatTemperature, formatLocalTime } from './weatherHelpers';

interface LocationManagerProps {
  currentLocation: WeatherLocation;
  savedLocations: WeatherLocation[];
  comparisonList: WeatherLocation[];
  units: UnitPreferences;
  onSelectLocation: (loc: WeatherLocation) => void;
  onAddFavorite: (loc: WeatherLocation) => void;
  onRemoveFavorite: (id: string) => void;
  onRenameLocation: (id: string, newLabel: string) => void;
  onToggleComparison: (loc: WeatherLocation) => void;
  theme: 'dark' | 'light';
}

export const LocationManager: React.FC<LocationManagerProps> = ({
  currentLocation,
  savedLocations,
  comparisonList,
  units,
  onSelectLocation,
  onAddFavorite,
  onRemoveFavorite,
  onRenameLocation,
  onToggleComparison,
  theme
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'manage' | 'compare'>('manage');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabelText, setEditLabelText] = useState('');

  // Comparison weather data state
  const [comparisonData, setComparisonData] = useState<Record<string, any>>({});
  const [loadingComparison, setLoadingComparison] = useState(false);

  // Search cities handler
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/weather/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load weather for comparison locations
  useEffect(() => {
    if (activeSubTab !== 'compare' || comparisonList.length === 0) return;

    let isMounted = true;
    setLoadingComparison(true);

    const promises = comparisonList.map(async (loc) => {
      try {
        const [wRes, aqRes] = await Promise.all([
          fetch(`/api/weather/forecast?lat=${loc.lat}&lon=${loc.lon}&days=1`),
          fetch(`/api/weather/air-quality?lat=${loc.lat}&lon=${loc.lon}`)
        ]);
        const wJson = await wRes.json();
        const aqJson = await aqRes.json();
        return {
          id: loc.id,
          weather: wJson.forecast?.current,
          airQuality: aqJson.airQuality?.current,
          daily: wJson.forecast?.daily
        };
      } catch {
        return { id: loc.id, weather: null, airQuality: null, daily: null };
      }
    });

    Promise.all(promises).then((results) => {
      if (!isMounted) return;
      const map: Record<string, any> = {};
      results.forEach((r) => {
        map[r.id] = r;
      });
      setComparisonData(map);
      setLoadingComparison(false);
    });

    return () => {
      isMounted = false;
    };
  }, [activeSubTab, comparisonList]);

  // Use GPS Location button
  const handleUseGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        onSelectLocation({
          id: `gps_${Date.now()}`,
          name: 'My Current Location',
          country: '',
          lat: latitude,
          lon: longitude,
          customLabel: 'GPS Location'
        });
      },
      (err) => {
        alert(`Location permission denied or unavailable: ${err.message}. Please search manually.`);
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className="space-y-6">
      {/* Tab Header Switcher */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('manage')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'manage'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                : 'text-zinc-400 hover:text-white bg-zinc-900/60'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Saved Locations Explorer</span>
          </button>

          <button
            onClick={() => setActiveSubTab('compare')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'compare'
                ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/20'
                : 'text-zinc-400 hover:text-white bg-zinc-900/60'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Multi-Location Comparison ({comparisonList.length}/5)</span>
          </button>
        </div>

        <button
          onClick={handleUseGps}
          className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-cyan-400 text-xs font-bold border border-zinc-700 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Use My Location</span>
        </button>
      </div>

      {/* MANAGE LOCATIONS SUB-TAB */}
      {activeSubTab === 'manage' && (
        <div className="space-y-6">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search worldwide city, town, province, or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-zinc-950/80 border border-zinc-700 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 shadow-xl"
            />
            {isSearching && (
              <Loader2 className="w-4 h-4 absolute right-4 top-3.5 text-cyan-400 animate-spin" />
            )}

            {/* Live Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-14 left-0 right-0 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 shadow-2xl overflow-hidden z-50 divide-y divide-zinc-800">
                {searchResults.map((r) => {
                  const loc: WeatherLocation = {
                    id: `loc_${r.id || `${r.latitude}_${r.longitude}`}`,
                    name: r.name,
                    country: r.country || '',
                    countryCode: r.country_code,
                    admin1: r.admin1,
                    lat: r.latitude,
                    lon: r.longitude,
                    timezone: r.timezone
                  };

                  return (
                    <div
                      key={`${r.id}-${r.latitude}`}
                      className="p-3.5 flex items-center justify-between hover:bg-zinc-800/80 transition-colors"
                    >
                      <div>
                        <div className="text-xs font-bold text-white">
                          {r.name}, {r.admin1 ? `${r.admin1}, ` : ''}{r.country}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                          {r.latitude.toFixed(2)}°, {r.longitude.toFixed(2)}° • {r.timezone || 'UTC'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            onSelectLocation(loc);
                            setSearchQuery('');
                            setSearchResults([]);
                          }}
                          className="px-3 py-1 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold shadow-md transition-colors cursor-pointer"
                        >
                          View
                        </button>
                        <button
                          onClick={() => {
                            onAddFavorite(loc);
                            setSearchQuery('');
                            setSearchResults([]);
                          }}
                          className="p-1.5 rounded-xl bg-zinc-800 hover:bg-amber-500/20 text-zinc-300 hover:text-amber-400 border border-zinc-700 transition-colors cursor-pointer"
                          title="Save to Favorites"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Saved Favorites Grid */}
          <div>
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
              Your Favorite Saved Locations ({savedLocations.length})
            </h4>

            {savedLocations.length === 0 ? (
              <div className="p-8 rounded-3xl border border-zinc-800 text-center text-xs text-zinc-400">
                No favorite locations saved yet. Search above to add your home city, travel destinations, or campuses.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {savedLocations.map((loc) => {
                  const isCurrent = currentLocation.id === loc.id;
                  const isComparing = comparisonList.some((c) => c.id === loc.id);

                  return (
                    <div
                      key={loc.id}
                      onClick={() => onSelectLocation(loc)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                        isCurrent
                          ? 'bg-gradient-to-br from-cyan-950/50 to-blue-950/50 border-cyan-400/80 shadow-lg shadow-cyan-950/30'
                          : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-2">
                          {editingId === loc.id ? (
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <input
                                autoFocus
                                value={editLabelText}
                                onChange={(e) => setEditLabelText(e.target.value)}
                                className="w-full bg-zinc-950 border border-cyan-500 rounded px-2 py-0.5 text-xs text-white"
                              />
                              <button
                                onClick={() => {
                                  onRenameLocation(loc.id, editLabelText);
                                  setEditingId(null);
                                }}
                                className="p-1 rounded bg-cyan-600 text-white cursor-pointer"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div className="text-sm font-bold text-white truncate">
                                {loc.customLabel || loc.name}
                              </div>
                              <div className="text-[11px] text-zinc-400 truncate">
                                {loc.name}, {loc.country}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onToggleComparison(loc)}
                            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                              isComparing
                                ? 'bg-violet-600/30 border-violet-500 text-violet-300'
                                : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-white'
                            }`}
                            title="Toggle in Weather Comparison Matrix"
                          >
                            <Scale className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => {
                              setEditingId(loc.id);
                              setEditLabelText(loc.customLabel || loc.name);
                            }}
                            className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title="Rename Label"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => onRemoveFavorite(loc.id)}
                            className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="Remove Location"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                        <span>{loc.lat.toFixed(2)}°, {loc.lon.toFixed(2)}°</span>
                        {isCurrent && <span className="text-cyan-400 font-bold">Active View</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPARISON SUB-TAB */}
      {activeSubTab === 'compare' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 flex items-center justify-between">
            <span>Comparing up to 5 chosen cities simultaneously across temperatures, rain, winds, and AQI.</span>
            <span className="text-violet-400 font-bold">{comparisonList.length}/5 Selected</span>
          </div>

          {comparisonList.length === 0 ? (
            <div className="p-10 rounded-3xl border border-zinc-800 text-center text-xs text-zinc-400">
              No cities added to comparison yet. Switch to "Saved Locations Explorer" and tap the scale icon on any location to add it to this matrix!
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-zinc-800 shadow-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-950/80 border-b border-zinc-800">
                    <th className="p-4 font-bold text-zinc-400 uppercase tracking-wider">Metric</th>
                    {comparisonList.map((loc) => (
                      <th key={loc.id} className="p-4 font-bold text-white min-w-[140px]">
                        <div className="flex items-center justify-between">
                          <span className="truncate">{loc.name}</span>
                          <button
                            onClick={() => onToggleComparison(loc)}
                            className="text-zinc-500 hover:text-red-400 p-1"
                            title="Remove from comparison"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 bg-zinc-900/40">
                  <tr>
                    <td className="p-4 font-bold text-zinc-400">Current Temperature</td>
                    {comparisonList.map((loc) => {
                      const data = comparisonData[loc.id]?.weather;
                      return (
                        <td key={loc.id} className="p-4 font-black text-white text-base">
                          {data ? formatTemperature(data.temperature_2m, units.temperature) : '--'}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-zinc-400">Feels Like</td>
                    {comparisonList.map((loc) => {
                      const data = comparisonData[loc.id]?.weather;
                      return (
                        <td key={loc.id} className="p-4 text-zinc-300">
                          {data ? formatTemperature(data.apparent_temperature, units.temperature) : '--'}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-zinc-400">Rain Probability</td>
                    {comparisonList.map((loc) => {
                      const daily = comparisonData[loc.id]?.daily;
                      return (
                        <td key={loc.id} className="p-4 text-blue-400 font-bold">
                          {daily?.precipitation_probability_max?.[0] !== undefined
                            ? `${daily.precipitation_probability_max[0]}%`
                            : '--'}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-zinc-400">Wind Velocity</td>
                    {comparisonList.map((loc) => {
                      const data = comparisonData[loc.id]?.weather;
                      return (
                        <td key={loc.id} className="p-4 text-zinc-300">
                          {data ? `${Math.round(data.wind_speed_10m)} km/h` : '--'}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-zinc-400">Air Quality Index</td>
                    {comparisonList.map((loc) => {
                      const aq = comparisonData[loc.id]?.airQuality;
                      const val = aq?.us_aqi;
                      return (
                        <td key={loc.id} className="p-4 font-bold">
                          {val !== undefined ? (
                            <span className={val <= 50 ? 'text-emerald-400' : val <= 100 ? 'text-amber-400' : 'text-rose-400'}>
                              AQI {Math.round(val)}
                            </span>
                          ) : (
                            '--'
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-zinc-400">Sunrise / Sunset</td>
                    {comparisonList.map((loc) => {
                      const daily = comparisonData[loc.id]?.daily;
                      const rise = daily?.sunrise?.[0]?.slice(11, 16);
                      const set = daily?.sunset?.[0]?.slice(11, 16);
                      return (
                        <td key={loc.id} className="p-4 text-zinc-400 text-[11px]">
                          {rise && set ? `${rise} / ${set}` : '--'}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
