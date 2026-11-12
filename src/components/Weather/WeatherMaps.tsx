import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  MapPin, 
  Search, 
  Compass, 
  Clock, 
  Info, 
  Eye, 
  Loader2,
  Thermometer,
  CloudRain,
  Wind
} from 'lucide-react';
import { RadarManifest, WeatherLocation } from './types';
import { getWeatherCodeInfo, formatTemperature } from './weatherHelpers';

interface WeatherMapsProps {
  currentLocation: WeatherLocation;
  theme: 'dark' | 'light';
  onSelectCoordinate?: (lat: number, lon: number, name: string) => void;
}

type MapLayerType = 'radar' | 'satellite' | 'clouds';

export const WeatherMaps: React.FC<WeatherMapsProps> = ({
  currentLocation,
  theme,
  onSelectCoordinate
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const baseTileRef = useRef<L.TileLayer | null>(null);
  const weatherTileRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [radarManifest, setRadarManifest] = useState<RadarManifest | null>(null);
  const [activeLayer, setActiveLayer] = useState<MapLayerType>('radar');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [frames, setFrames] = useState<Array<{ time: number; path: string }>>([]);
  const [isLoadingRadar, setIsLoadingRadar] = useState(true);
  const [inspectData, setInspectData] = useState<{
    lat: number;
    lon: number;
    temp?: number;
    condition?: string;
    wind?: number;
    humidity?: number;
    loading: boolean;
  } | null>(null);

  const [mapSearch, setMapSearch] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // 1. Fetch RainViewer manifest
  useEffect(() => {
    let isMounted = true;
    setIsLoadingRadar(true);

    fetch('/api/weather/radar')
      .then((r) => r.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && data.radar) {
          setRadarManifest(data.radar);
          const past = data.radar.radar?.past || [];
          const nowcast = data.radar.radar?.nowcast || [];
          const allFrames = [...past, ...nowcast];
          setFrames(allFrames);
          // Set to the latest live past frame
          if (past.length > 0) {
            setCurrentFrameIndex(past.length - 1);
          }
        }
      })
      .catch((err) => console.error('Radar manifest fetch error:', err))
      .finally(() => {
        if (isMounted) setIsLoadingRadar(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentLocation.lat, currentLocation.lon],
        zoom: 7,
        zoomControl: false,
        attributionControl: false
      });

      // Add zoom control in top right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Default Base Tile: CartoDB Dark Matter / Positron
      const tileUrl =
        theme === 'dark'
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      const baseTile = L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      baseTileRef.current = baseTile;
      mapRef.current = map;

      // Click on map to inspect weather
      map.on('click', async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        setInspectData({ lat, lon: lng, loading: true });

        try {
          const res = await fetch(`/api/weather/forecast?lat=${lat.toFixed(4)}&lon=${lng.toFixed(4)}&days=1`);
          const json = await res.json();
          if (json.success && json.forecast?.current) {
            const c = json.forecast.current;
            const wInfo = getWeatherCodeInfo(c.weather_code);
            setInspectData({
              lat,
              lon: lng,
              temp: c.temperature_2m,
              condition: wInfo.description,
              wind: c.wind_speed_10m,
              humidity: c.relative_humidity_2m,
              loading: false
            });
          } else {
            setInspectData({ lat, lon: lng, loading: false });
          }
        } catch {
          setInspectData({ lat, lon: lng, loading: false });
        }
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [theme]);

  // 3. Update base tile when theme changes
  useEffect(() => {
    if (!baseTileRef.current || !mapRef.current) return;
    const tileUrl =
      theme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    baseTileRef.current.setUrl(tileUrl);
  }, [theme]);

  // 4. Update Current Location Marker and Pan
  useEffect(() => {
    if (!mapRef.current) return;

    mapRef.current.setView([currentLocation.lat, currentLocation.lon], mapRef.current.getZoom());

    if (markerRef.current) {
      markerRef.current.setLatLng([currentLocation.lat, currentLocation.lon]);
    } else {
      const customIcon = L.divIcon({
        className: 'custom-weather-pin',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-4 h-4 rounded-full bg-cyan-400 border-2 border-white shadow-lg animate-ping absolute"></div>
            <div class="w-4 h-4 rounded-full bg-cyan-500 border-2 border-white shadow-md relative z-10"></div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      markerRef.current = L.marker([currentLocation.lat, currentLocation.lon], { icon: customIcon }).addTo(
        mapRef.current
      );
    }
  }, [currentLocation]);

  // 5. Update Weather Overlay Layer (Radar / Satellite / Clouds)
  useEffect(() => {
    if (!mapRef.current || !radarManifest) return;

    if (weatherTileRef.current) {
      mapRef.current.removeLayer(weatherTileRef.current);
      weatherTileRef.current = null;
    }

    const host = radarManifest.host || 'https://tilecache.rainviewer.com';

    if (activeLayer === 'radar' && frames.length > 0) {
      const frame = frames[currentFrameIndex];
      if (frame) {
        // RainViewer radar tile
        const radarUrl = `${host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
        weatherTileRef.current = L.tileLayer(radarUrl, {
          opacity: 0.75,
          zIndex: 10
        }).addTo(mapRef.current);
      }
    } else if (activeLayer === 'satellite') {
      const satFrames = radarManifest.satellite?.infrared || [];
      const satFrame = satFrames[satFrames.length - 1];
      if (satFrame) {
        const satUrl = `${host}${satFrame.path}/256/{z}/{x}/{y}/0/0_0.png`;
        weatherTileRef.current = L.tileLayer(satUrl, {
          opacity: 0.7,
          zIndex: 10
        }).addTo(mapRef.current);
      }
    }
  }, [activeLayer, currentFrameIndex, frames, radarManifest]);

  // 6. Animation Player Timeline
  useEffect(() => {
    if (!isPlaying || frames.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentFrameIndex((prev) => (prev + 1) % frames.length);
    }, 700);

    return () => clearInterval(interval);
  }, [isPlaying, frames]);

  // 7. Search Locations on Map
  const handleMapSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSearch.trim()) return;

    setSearchLoading(true);
    try {
      const res = await fetch(`/api/weather/search?q=${encodeURIComponent(mapSearch.trim())}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectSearchResult = (res: any) => {
    setSearchResults([]);
    setMapSearch('');
    if (mapRef.current) {
      mapRef.current.flyTo([res.latitude, res.longitude], 9, { duration: 1.5 });
      if (onSelectCoordinate) {
        onSelectCoordinate(res.latitude, res.longitude, res.name);
      }
    }
  };

  // 8. GPS Browser Location
  const handleUseGpsLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapRef.current) {
          mapRef.current.flyTo([latitude, longitude], 10, { duration: 1.5 });
          if (onSelectCoordinate) {
            onSelectCoordinate(latitude, longitude, 'My Location');
          }
        }
      },
      (err) => {
        console.warn('Geolocation denied or unavailable:', err.message);
        alert('Could not retrieve current location. Please use the search bar above.');
      },
      { timeout: 10000 }
    );
  };

  // Format frame timestamp
  const getFrameTimeLabel = (index: number) => {
    const frame = frames[index];
    if (!frame) return '--:--';
    const d = new Date(frame.time * 1000);
    const isNowcast = index >= (radarManifest?.radar?.past?.length || 0);
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${timeStr} ${isNowcast ? '(Forecast)' : '(Observation)'}`;
  };

  return (
    <div className="relative w-full h-[620px] rounded-3xl overflow-hidden border border-zinc-800/80 shadow-2xl flex flex-col select-none">
      {/* Top Map Bar: Search & Layer Selector */}
      <div className={`absolute top-4 left-4 right-4 z-[400] flex flex-wrap items-center justify-between gap-3 pointer-events-none`}>
        {/* Search bar */}
        <div className="relative pointer-events-auto min-w-[240px] max-w-sm">
          <form onSubmit={handleMapSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
            <input
              type="text"
              placeholder="Search city on map..."
              value={mapSearch}
              onChange={(e) => setMapSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2 rounded-2xl bg-zinc-950/80 backdrop-blur-md border border-zinc-700/80 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 shadow-xl"
            />
            {searchLoading && (
              <Loader2 className="w-4 h-4 absolute right-3 top-3 text-cyan-400 animate-spin" />
            )}
          </form>

          {/* Search Dropdown Results */}
          {searchResults.length > 0 && (
            <div className="absolute top-12 left-0 right-0 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 shadow-2xl overflow-hidden z-50">
              {searchResults.slice(0, 5).map((r) => (
                <button
                  key={`${r.id}-${r.latitude}`}
                  onClick={() => handleSelectSearchResult(r)}
                  className="w-full px-3.5 py-2.5 text-left text-xs hover:bg-zinc-800/70 flex items-center justify-between transition-colors border-b border-zinc-800/50 last:border-b-0 cursor-pointer"
                >
                  <span className="font-semibold text-white truncate">
                    {r.name}, {r.admin1 || ''} {r.country || ''}
                  </span>
                  <span className="text-[10px] text-cyan-400 shrink-0 ml-2">Pan</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Layer Switches & GPS Button */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Layer switcher */}
          <div className="flex items-center rounded-2xl bg-zinc-950/85 backdrop-blur-md p-1 border border-zinc-700/80 shadow-xl">
            <button
              onClick={() => setActiveLayer('radar')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeLayer === 'radar'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" />
              <span>Precipitation Radar</span>
            </button>
            <button
              onClick={() => setActiveLayer('satellite')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeLayer === 'satellite'
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Satellite Infrared</span>
            </button>
          </div>

          {/* Current Location Button */}
          <button
            onClick={handleUseGpsLocation}
            className="p-2.5 rounded-2xl bg-zinc-950/85 backdrop-blur-md border border-zinc-700/80 hover:border-cyan-400 text-zinc-300 hover:text-cyan-400 shadow-xl transition-all cursor-pointer"
            title="Pan to My Current GPS Location"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Leaflet Map Target */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Point Inspector Card (When user clicks on map) */}
      {inspectData && (
        <div className="absolute top-18 left-4 z-[400] p-3.5 rounded-2xl bg-zinc-950/90 backdrop-blur-xl border border-cyan-500/40 shadow-2xl text-xs max-w-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <MapPin className="w-3.5 h-3.5" />
              <span>Clicked Coordinate Weather</span>
            </div>
            <button
              onClick={() => setInspectData(null)}
              className="text-zinc-500 hover:text-white p-0.5"
            >
              ✕
            </button>
          </div>

          {inspectData.loading ? (
            <div className="flex items-center gap-2 py-3 text-zinc-400">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Fetching meteorological telemetry...</span>
            </div>
          ) : (
            <div className="mt-2.5 space-y-2 text-zinc-200">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-white">
                  {inspectData.temp !== undefined ? `${Math.round(inspectData.temp)}°C` : '--'}
                </span>
                <span className="text-xs text-cyan-300 font-semibold">{inspectData.condition}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
                <div>Wind: <span className="text-white font-medium">{inspectData.wind} km/h</span></div>
                <div>Humidity: <span className="text-white font-medium">{inspectData.humidity}%</span></div>
              </div>
              <div className="text-[10px] text-zinc-500 font-mono">
                {inspectData.lat.toFixed(3)}°, {inspectData.lon.toFixed(3)}°
              </div>
            </div>
          )}
        </div>
      )}

      {/* Radar Timeline Player (When activeLayer is radar) */}
      {activeLayer === 'radar' && frames.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 z-[400] flex flex-col md:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-950/90 backdrop-blur-xl border border-zinc-700/80 shadow-2xl">
          {/* Controls: Play/Pause, Step */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title={isPlaying ? 'Pause Radar Loop' : 'Play Animated Radar'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setCurrentFrameIndex((prev) => (prev > 0 ? prev - 1 : frames.length - 1))}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors"
              title="Step Backward"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentFrameIndex((prev) => (prev + 1) % frames.length)}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors"
              title="Step Forward"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-white px-2">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{getFrameTimeLabel(currentFrameIndex)}</span>
            </div>
          </div>

          {/* Timeline slider */}
          <div className="flex-1 max-w-md w-full flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-mono">-2h</span>
            <input
              type="range"
              min={0}
              max={frames.length - 1}
              value={currentFrameIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentFrameIndex(parseInt(e.target.value, 10));
              }}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-[10px] text-cyan-400 font-mono">+30m</span>
          </div>

          {/* Radar Intensity Legend */}
          <div className="hidden lg:flex items-center gap-2 text-[10px] text-zinc-400 shrink-0">
            <span>Light</span>
            <div className="w-24 h-2 rounded-full bg-gradient-to-r from-cyan-400 via-green-400 via-yellow-400 via-red-500 to-purple-600" />
            <span>Severe</span>
          </div>
        </div>
      )}
    </div>
  );
};
