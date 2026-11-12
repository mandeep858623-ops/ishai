import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  X, 
  RefreshCw, 
  Search, 
  MapPin, 
  Calendar, 
  Layers, 
  ShieldAlert, 
  Wind, 
  Droplets, 
  Eye, 
  Gauge, 
  Compass, 
  Sun, 
  Moon, 
  Sparkles, 
  Settings, 
  Scale, 
  Bell, 
  Activity, 
  ChevronRight, 
  ChevronDown, 
  Clock, 
  ExternalLink, 
  Check, 
  AlertTriangle,
  Loader2,
  TrendingUp,
  CloudSun,
  Layout,
  Radio,
  Sliders,
  Maximize2
} from 'lucide-react';
import { 
  WeatherLocation, 
  RawWeatherData, 
  RawAirQualityData, 
  WeatherAlertItem, 
  UnitPreferences, 
  WidgetConfig, 
  NotificationSettings, 
  WeatherTab 
} from './Weather/types';
import { 
  getWeatherCodeInfo, 
  formatTemperature, 
  formatWindSpeed, 
  formatPrecipitation, 
  formatPressure, 
  getWindDirectionLabel, 
  formatLocalTime,
  getUsAqiCategory
} from './Weather/weatherHelpers';
import { DynamicWeatherBackground } from './Weather/DynamicWeatherBackground';
import { WeatherIllustration } from './Weather/WeatherIllustration';
import { WeatherMaps } from './Weather/WeatherMaps';
import { WeatherAlertsCenter } from './Weather/WeatherAlertsCenter';
import { AirQualitySection } from './Weather/AirQualitySection';
import { AdvancedWindRain } from './Weather/AdvancedWindRain';
import { WeatherCalendarView } from './Weather/WeatherCalendarView';
import { WeatherIntelligence } from './Weather/WeatherIntelligence';
import { LocationManager } from './Weather/LocationManager';
import { SpecialWeatherTools } from './Weather/SpecialWeatherTools';
import { soundEngine } from '../utils/audio';
import { db, auth, handleFirestoreError, OperationType } from '../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  writeLog: (text: string, tag?: string) => void;
  userId: string;
  theme: 'dark' | 'light';
}

const DEFAULT_LOCATION: WeatherLocation = {
  id: 'loc_default_nyc',
  name: 'New York',
  country: 'United States',
  countryCode: 'US',
  admin1: 'New York',
  lat: 40.7128,
  lon: -74.0060,
  timezone: 'America/New_York',
  customLabel: 'Headquarters'
};

const DEFAULT_UNITS: UnitPreferences = {
  temperature: 'c',
  windSpeed: 'kmh',
  precipitation: 'mm',
  pressure: 'hPa'
};

const DEFAULT_WIDGETS: WidgetConfig = {
  showCurrentWeather: true,
  showHourlyForecast: true,
  showSevenDayForecast: true,
  showAirQuality: true,
  showSunAndMoon: true,
  showWindCompass: true,
  showRainTimeline: true,
  showWeatherAlerts: true,
  showUvIndex: true,
  showHealthComfort: true
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  rainAlert: true,
  severeAlert: true,
  highTempAlert: false,
  highTempThreshold: 35,
  lowTempAlert: false,
  lowTempThreshold: 0,
  windAlert: true,
  windThreshold: 55,
  poorAqiAlert: true,
  morningBriefing: true,
  eveningSummary: false,
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00'
};

export const WeatherModal: React.FC<WeatherModalProps> = ({
  isOpen,
  onClose,
  writeLog,
  userId,
  theme: appTheme
}) => {
  const [activeTab, setActiveTab] = useState<WeatherTab>('overview');
  const [currentLocation, setCurrentLocation] = useState<WeatherLocation>(DEFAULT_LOCATION);
  const [savedLocations, setSavedLocations] = useState<WeatherLocation[]>([
    DEFAULT_LOCATION,
    {
      id: 'loc_tokyo',
      name: 'Tokyo',
      country: 'Japan',
      admin1: 'Tokyo',
      lat: 35.6895,
      lon: 139.6917,
      timezone: 'Asia/Tokyo',
      customLabel: 'Tokyo Hub'
    },
    {
      id: 'loc_london',
      name: 'London',
      country: 'United Kingdom',
      admin1: 'England',
      lat: 51.5074,
      lon: -0.1278,
      timezone: 'Europe/London',
      customLabel: 'London Office'
    }
  ]);
  const [comparisonList, setComparisonList] = useState<WeatherLocation[]>([
    DEFAULT_LOCATION,
    {
      id: 'loc_tokyo',
      name: 'Tokyo',
      country: 'Japan',
      admin1: 'Tokyo',
      lat: 35.6895,
      lon: 139.6917,
      timezone: 'Asia/Tokyo'
    }
  ]);

  const [units, setUnits] = useState<UnitPreferences>(DEFAULT_UNITS);
  const [widgets, setWidgets] = useState<WidgetConfig>(DEFAULT_WIDGETS);
  const [notifications, setNotifications] = useState<NotificationSettings>(DEFAULT_NOTIFICATIONS);
  const [autoRefreshMinutes, setAutoRefreshMinutes] = useState<number>(10);

  // Weather Data States
  const [weatherData, setWeatherData] = useState<RawWeatherData | null>(null);
  const [airQualityData, setAirQualityData] = useState<RawAirQualityData | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('Just now');
  const [isCachedData, setIsCachedData] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Detailed selected hour inspector in Hourly tab
  const [selectedHourIndex, setSelectedHourIndex] = useState<number>(0);
  const [expandedDayIndex, setExpandedDayIndex] = useState<number | null>(null);

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const storageCacheKey = `ISHAI_Weather_User_${userId || 'guest'}`;

  // 1. Load User Weather Records from Firestore / LocalStorage
  useEffect(() => {
    if (!isOpen) return;

    try {
      const cached = localStorage.getItem(storageCacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.currentLocation) setCurrentLocation(parsed.currentLocation);
        if (Array.isArray(parsed.savedLocations)) setSavedLocations(parsed.savedLocations);
        if (Array.isArray(parsed.comparisonList)) setComparisonList(parsed.comparisonList);
        if (parsed.units) setUnits(parsed.units);
        if (parsed.widgets) setWidgets(parsed.widgets);
        if (parsed.notifications) setNotifications(parsed.notifications);
      }
    } catch {}

    // Only attempt Firestore cloud sync when user is genuinely authenticated with Firebase Auth
    // and the requested document matches their UID, satisfying isOwner(userId) in firestore.rules
    const isAuthedWithFirestore = Boolean(auth.currentUser && auth.currentUser.uid === userId && userId !== 'guest' && userId !== 'guest_default');

    if (isAuthedWithFirestore && auth.currentUser) {
      const authUid = auth.currentUser.uid;
      getDoc(doc(db, 'user_weather_records', authUid))
        .then((docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.favorite_locations) setSavedLocations(data.favorite_locations);
            if (data.units) setUnits(data.units);
            if (data.widget_config) setWidgets(data.widget_config);
            if (data.notification_settings) setNotifications(data.notification_settings);
            if (data.comparison_locations) setComparisonList(data.comparison_locations);
          }
        })
        .catch((err) => {
          console.warn('Firestore weather record sync notice:', err);
          handleFirestoreError(err, OperationType.GET, `user_weather_records/${authUid}`);
        });
    }
  }, [isOpen, userId, storageCacheKey]);

  // 2. Persist Settings & Locations
  const saveWeatherSettings = useCallback(
    (
      newLocs: WeatherLocation[],
      newComp: WeatherLocation[],
      newUnits: UnitPreferences,
      newWidgets: WidgetConfig,
      newNotifs: NotificationSettings
    ) => {
      const payload = {
        savedLocations: newLocs,
        comparisonList: newComp,
        units: newUnits,
        widgets: newWidgets,
        notifications: newNotifs,
        currentLocation
      };

      try {
        localStorage.setItem(storageCacheKey, JSON.stringify(payload));
      } catch {}

      const isAuthedWithFirestore = Boolean(auth.currentUser && auth.currentUser.uid === userId && userId !== 'guest' && userId !== 'guest_default');

      if (isAuthedWithFirestore && auth.currentUser) {
        const authUid = auth.currentUser.uid;
        setDoc(
          doc(db, 'user_weather_records', authUid),
          {
            user_id: authUid,
            favorite_locations: newLocs,
            comparison_locations: newComp,
            units: newUnits,
            widget_config: newWidgets,
            notification_settings: newNotifs,
            updated_at: new Date().toISOString()
          },
          { merge: true }
        ).catch((e) => {
          console.warn('Failed to sync weather settings to Firestore:', e);
          handleFirestoreError(e, OperationType.WRITE, `user_weather_records/${authUid}`);
        });
      }
    },
    [userId, storageCacheKey, currentLocation]
  );

  // 3. Fetch Comprehensive Weather Telemetry
  const loadWeatherData = useCallback(
    async (loc: WeatherLocation, showLoading: boolean = true) => {
      if (showLoading) setIsLoading(true);
      setErrorMessage(null);

      try {
        writeLog(`Querying live meteorological telemetry for ${loc.name}...`, 'WEATHER');

        const [forecastRes, airRes, alertRes] = await Promise.all([
          fetch(`/api/weather/forecast?lat=${loc.lat}&lon=${loc.lon}&days=14`),
          fetch(`/api/weather/air-quality?lat=${loc.lat}&lon=${loc.lon}`),
          fetch(`/api/weather/alerts?lat=${loc.lat}&lon=${loc.lon}&city=${encodeURIComponent(loc.name)}`)
        ]);

        if (!forecastRes.ok) {
          throw new Error(`Weather Provider returned HTTP ${forecastRes.status}`);
        }

        const [fJson, aJson, alJson] = await Promise.all([
          forecastRes.json(),
          airRes.ok ? airRes.json() : { success: false },
          alertRes.ok ? alertRes.json() : { success: false }
        ]);

        if (fJson.success && fJson.forecast) {
          setWeatherData(fJson.forecast);
          setIsCachedData(!!fJson.forecast.isCached);
          setLastRefreshedAt(
            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          );
        } else {
          throw new Error(fJson.error || 'Failed to parse forecast data.');
        }

        if (aJson.success && aJson.airQuality) {
          setAirQualityData(aJson.airQuality);
        }

        if (alJson.success && Array.isArray(alJson.alerts)) {
          setAlerts(alJson.alerts);
        } else {
          setAlerts([]);
        }

        writeLog(
          `Telemetry verified for ${loc.name}: ${fJson.forecast?.current?.temperature_2m}°C, Humidity ${fJson.forecast?.current?.relative_humidity_2m}%`,
          'METEOROLOGY'
        );
      } catch (err: any) {
        console.error('Weather load error:', err);
        setErrorMessage(err.message || 'Unable to connect to meteorological provider.');
        writeLog(`Weather telemetry error for ${loc.name}: ${err.message}`, 'ERROR');
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [writeLog]
  );

  // Trigger load when modal opens or location changes
  useEffect(() => {
    if (isOpen) {
      loadWeatherData(currentLocation);
    }
  }, [isOpen, currentLocation, loadWeatherData]);

  // Periodic Auto-Refresh
  useEffect(() => {
    if (!isOpen || autoRefreshMinutes <= 0) return;

    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);

    refreshIntervalRef.current = setInterval(() => {
      loadWeatherData(currentLocation, false);
    }, autoRefreshMinutes * 60 * 1000);

    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    };
  }, [isOpen, autoRefreshMinutes, currentLocation, loadWeatherData]);

  // Current weather breakdown
  const curr = weatherData?.current;
  const wCodeInfo = curr ? getWeatherCodeInfo(curr.weather_code) : getWeatherCodeInfo(0);
  const isDay = curr ? Boolean(curr.is_day) : true;
  const conditionCategory = wCodeInfo.category;

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 font-sans select-none overflow-hidden ${
      appTheme === 'dark' ? 'bg-black/85 backdrop-blur-xl text-zinc-100' : 'bg-slate-900/60 backdrop-blur-xl text-slate-800'
    }`}>
      {/* Outer Modal Container */}
      <div className={`relative w-full max-w-7xl h-[95vh] rounded-[32px] border shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
        appTheme === 'dark' ? 'bg-[#090b10] border-zinc-800/80 shadow-cyan-950/20' : 'bg-slate-50 border-slate-200 shadow-slate-900/30'
      }`}>
        {/* Dynamic Animated Weather Atmosphere Background */}
        <DynamicWeatherBackground
          condition={conditionCategory}
          isDay={isDay}
          theme={appTheme}
        />

        {/* ========================================================================= */}
        {/* 1. TOP HEADER & HUD STATUS */}
        {/* ========================================================================= */}
        <header className={`relative z-20 px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 ${
          appTheme === 'dark' ? 'border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md' : 'border-slate-200 bg-white/70 backdrop-blur-md'
        }`}>
          {/* Brand & Active Location */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
              <CloudSun className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-wider uppercase text-white">WEATHER</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-extrabold border border-cyan-500/30">
                  PLATFORM
                </span>
                {isCachedData ? (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-mono border border-amber-500/30">
                    CACHED
                  </span>
                ) : (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                )}
              </div>

              <div className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>{currentLocation.customLabel || currentLocation.name}, {currentLocation.country}</span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-400 font-mono text-[11px]">
                  {weatherData ? formatLocalTime(weatherData.current.time, weatherData.timezone) : '--:--'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Last Updated Timestamp */}
            <div className="hidden md:flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium px-3 py-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span>Updated: {lastRefreshedAt}</span>
            </div>

            {/* Refresh button */}
            <button
              onClick={() => {
                soundEngine.playClick();
                loadWeatherData(currentLocation);
              }}
              disabled={isLoading}
              className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-cyan-400 border border-zinc-700/80 shadow-md transition-all cursor-pointer"
              title="Refresh Live Weather Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            {/* Close button */}
            <button
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-zinc-900/80 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700/80 shadow-md transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* 2. NAVIGATION BAR (11 SECTIONS) */}
        {/* ========================================================================= */}
        <nav className={`relative z-20 px-4 py-2 border-b flex items-center gap-1.5 overflow-x-auto scrollbar-none ${
          appTheme === 'dark' ? 'border-zinc-800/80 bg-zinc-950/40' : 'border-slate-200 bg-slate-100/60'
        }`}>
          {[
            { id: 'overview', label: 'Overview', icon: Layout },
            { id: 'hourly', label: 'Hourly', icon: Clock },
            { id: 'forecast', label: 'Forecast', icon: Calendar },
            { id: 'maps', label: 'Weather Maps', icon: Layers },
            { id: 'alerts', label: `Alerts (${alerts.length})`, icon: ShieldAlert, badge: alerts.length > 0 },
            { id: 'air_quality', label: 'Air Quality', icon: Activity },
            { id: 'locations', label: 'Locations', icon: MapPin },
            { id: 'compare', label: 'Compare', icon: Scale },
            { id: 'calendar', label: 'Weather Calendar', icon: Calendar },
            { id: 'intelligence', label: 'Weather Intelligence', icon: Sparkles },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundEngine.playClick();
                  setActiveTab(tab.id as WeatherTab);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25 ring-1 ring-cyan-400/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : tab.badge ? 'text-amber-400' : 'text-zinc-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Error Notice if any */}
        {errorMessage && (
          <div className="relative z-20 m-4 p-3.5 rounded-2xl bg-red-950/60 border border-red-800 text-xs text-red-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => loadWeatherData(currentLocation)}
              className="text-xs font-bold text-cyan-400 underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. MAIN TAB CONTENT AREA */}
        {/* ========================================================================= */}
        <main className="relative z-10 flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'overview' && weatherData && curr && (
            <div className="space-y-6">
              {/* Hero Banner with Animated Illustration & Dynamic Temp */}
              <div className={`p-6 md:p-8 rounded-3xl border shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 ${
                appTheme === 'dark' 
                  ? 'bg-zinc-950/60 border-zinc-800/80 backdrop-blur-xl' 
                  : 'bg-white/80 border-slate-200/90 backdrop-blur-xl'
              }`}>
                {/* Left: Temperature & Conditions */}
                <div className="space-y-3 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      {wCodeInfo.description}
                    </span>
                    <span className="text-xs text-zinc-400 font-medium">
                      Feels like {formatTemperature(curr.apparent_temperature, units.temperature)}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-center md:justify-start gap-3">
                    <h1 className="text-6xl md:text-7xl font-black tracking-tight text-white">
                      {formatTemperature(curr.temperature_2m, units.temperature)}
                    </h1>
                  </div>

                  <div className="flex items-center justify-center md:justify-start gap-4 text-xs font-semibold text-zinc-300">
                    <div>
                      High: <span className="text-white font-bold">{formatTemperature(weatherData.daily.temperature_2m_max[0], units.temperature)}</span>
                    </div>
                    <div>
                      Low: <span className="text-zinc-400 font-bold">{formatTemperature(weatherData.daily.temperature_2m_min[0], units.temperature)}</span>
                    </div>
                    <div>
                      Precip: <span className="text-blue-400 font-bold">{weatherData.daily.precipitation_probability_max[0] || 0}%</span>
                    </div>
                  </div>
                </div>

                {/* Right: Large Animated Weather Illustration */}
                <div className="shrink-0 flex items-center justify-center">
                  <WeatherIllustration condition={conditionCategory} isDay={isDay} />
                </div>
              </div>

              {/* Quick Hourly Forecast Strip */}
              {widgets.showHourlyForecast && (
                <div className={`p-5 rounded-3xl border shadow-xl ${
                  appTheme === 'dark' ? 'bg-zinc-950/50 border-zinc-800/80' : 'bg-white/80 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Next 24 Hours Timeline</span>
                    </div>
                    <button
                      onClick={() => setActiveTab('hourly')}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Interactive Curves</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                    {weatherData.hourly.time.slice(0, 24).map((timeStr, idx) => {
                      const temp = weatherData.hourly.temperature_2m[idx];
                      const code = weatherData.hourly.weather_code[idx];
                      const rainProb = weatherData.hourly.precipitation_probability[idx] || 0;
                      const info = getWeatherCodeInfo(code);
                      const hourLabel = idx === 0 ? 'Now' : new Date(timeStr).toLocaleTimeString([], { hour: 'numeric' });

                      return (
                        <div
                          key={timeStr}
                          className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-800/60 shrink-0 min-w-[70px] transition-all cursor-default"
                        >
                          <span className="text-[11px] font-semibold text-zinc-400">{hourLabel}</span>
                          <span className="text-xl font-black text-white">{Math.round(temp)}°</span>
                          <span className="text-[10px] text-zinc-400 truncate max-w-[60px] text-center">{info.description}</span>
                          {rainProb > 0 && (
                            <span className="text-[10px] text-blue-400 font-bold flex items-center gap-0.5">
                              <Droplets className="w-2.5 h-2.5" />
                              {rainProb}%
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 8-Tile Atmospheric Telemetry Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {/* Wind */}
                <div className={`p-4 rounded-2xl border ${
                  appTheme === 'dark' ? 'bg-zinc-950/50 border-zinc-800/80' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold">
                    <Wind className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Wind & Gusts</span>
                  </div>
                  <div className="text-xl font-black text-white mt-2">
                    {formatWindSpeed(curr.wind_speed_10m, units.windSpeed)}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-medium mt-0.5">
                    Gusts to {formatWindSpeed(curr.wind_gusts_10m, units.windSpeed)} • {getWindDirectionLabel(curr.wind_direction_10m)}
                  </div>
                </div>

                {/* Humidity */}
                <div className={`p-4 rounded-2xl border ${
                  appTheme === 'dark' ? 'bg-zinc-950/50 border-zinc-800/80' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold">
                    <Droplets className="w-3.5 h-3.5 text-blue-400" />
                    <span>Humidity</span>
                  </div>
                  <div className="text-xl font-black text-white mt-2">
                    {curr.relative_humidity_2m}%
                  </div>
                  <div className="text-[10px] text-zinc-500 font-medium mt-0.5">
                    Dew point {formatTemperature(weatherData.hourly?.dew_point_2m?.[0] || 12, units.temperature)}
                  </div>
                </div>

                {/* UV Index */}
                <div className={`p-4 rounded-2xl border ${
                  appTheme === 'dark' ? 'bg-zinc-950/50 border-zinc-800/80' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>UV Index</span>
                  </div>
                  <div className="text-xl font-black text-white mt-2">
                    {weatherData.daily.uv_index_max[0]} Max
                  </div>
                  <div className="text-[10px] text-zinc-500 font-medium mt-0.5">
                    {weatherData.daily.uv_index_max[0] >= 6 ? 'Sun protection required' : 'Moderate exposure'}
                  </div>
                </div>

                {/* Atmospheric Pressure */}
                <div className={`p-4 rounded-2xl border ${
                  appTheme === 'dark' ? 'bg-zinc-950/50 border-zinc-800/80' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold">
                    <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Barometric Pressure</span>
                  </div>
                  <div className="text-xl font-black text-white mt-2">
                    {formatPressure(curr.pressure_msl, units.pressure)}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-medium mt-0.5">
                    Sea-level normalized
                  </div>
                </div>

                {/* Visibility */}
                <div className={`p-4 rounded-2xl border ${
                  appTheme === 'dark' ? 'bg-zinc-950/50 border-zinc-800/80' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold">
                    <Eye className="w-3.5 h-3.5 text-teal-400" />
                    <span>Visibility</span>
                  </div>
                  <div className="text-xl font-black text-white mt-2">
                    {weatherData.hourly.visibility?.[0] !== undefined 
                      ? `${(weatherData.hourly.visibility[0] / 1000).toFixed(1)} km` 
                      : '10+ km'}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-medium mt-0.5">
                    Clear optical horizon
                  </div>
                </div>

                {/* Cloud Cover */}
                <div className={`p-4 rounded-2xl border ${
                  appTheme === 'dark' ? 'bg-zinc-950/50 border-zinc-800/80' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold">
                    <CloudSun className="w-3.5 h-3.5 text-sky-400" />
                    <span>Cloud Coverage</span>
                  </div>
                  <div className="text-xl font-black text-white mt-2">
                    {curr.cloud_cover}%
                  </div>
                  <div className="text-[10px] text-zinc-500 font-medium mt-0.5">
                    {curr.cloud_cover > 75 ? 'Heavy overcast' : curr.cloud_cover > 25 ? 'Scattered clouds' : 'Clear skies'}
                  </div>
                </div>

                {/* Sunrise / Sunset */}
                <div className={`p-4 rounded-2xl border ${
                  appTheme === 'dark' ? 'bg-zinc-950/50 border-zinc-800/80' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Sun Cycle</span>
                  </div>
                  <div className="text-base font-black text-white mt-2 truncate">
                    {weatherData.daily.sunrise[0]?.slice(11, 16)} ↑
                  </div>
                  <div className="text-[10px] text-zinc-500 font-medium mt-0.5">
                    Sunset: {weatherData.daily.sunset[0]?.slice(11, 16)} ↓
                  </div>
                </div>

                {/* Air Quality Index */}
                <div className={`p-4 rounded-2xl border ${
                  appTheme === 'dark' ? 'bg-zinc-950/50 border-zinc-800/80' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Air Quality</span>
                  </div>
                  <div className="text-xl font-black text-emerald-400 mt-2">
                    {airQualityData?.current?.us_aqi ? `AQI ${Math.round(airQualityData.current.us_aqi)}` : 'Good'}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-medium mt-0.5">
                    PM2.5: {airQualityData?.current?.pm2_5 ? `${airQualityData.current.pm2_5.toFixed(1)} µg/m³` : 'Normal'}
                  </div>
                </div>
              </div>

              {/* 7-Day Extended Forecast Preview */}
              {widgets.showSevenDayForecast && (
                <div className={`p-5 rounded-3xl border shadow-xl ${
                  appTheme === 'dark' ? 'bg-zinc-950/50 border-zinc-800/80' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      <span>7-Day Meteorological Outlook</span>
                    </div>
                    <button
                      onClick={() => setActiveTab('forecast')}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>14-Day View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="divide-y divide-zinc-800/60">
                    {weatherData.daily.time.slice(0, 7).map((dStr, idx) => {
                      const maxT = weatherData.daily.temperature_2m_max[idx];
                      const minT = weatherData.daily.temperature_2m_min[idx];
                      const code = weatherData.daily.weather_code[idx];
                      const info = getWeatherCodeInfo(code);
                      const rainProb = weatherData.daily.precipitation_probability_max[idx] || 0;
                      const dayName = idx === 0 ? 'Today' : new Date(dStr).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

                      return (
                        <div
                          key={dStr}
                          className="py-3 flex items-center justify-between text-xs hover:bg-zinc-900/30 px-2 rounded-xl transition-colors"
                        >
                          <span className="font-bold text-white w-28 truncate">{dayName}</span>
                          <span className="text-zinc-300 flex-1 truncate px-2">{info.description}</span>
                          {rainProb > 0 && (
                            <span className="text-blue-400 font-bold text-[11px] w-16 text-right">
                              {rainProb}% rain
                            </span>
                          )}
                          <div className="flex items-center gap-2 w-24 justify-end text-right">
                            <span className="font-extrabold text-white">{Math.round(maxT)}°</span>
                            <span className="text-zinc-500">{Math.round(minT)}°</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HOURLY FORECAST WITH INTERACTIVE TREND CURVES */}
          {activeTab === 'hourly' && weatherData && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>Next 48 Hours Meteorological Trajectory</span>
                </h3>
                <span className="text-xs text-zinc-400">Tap any hour to inspect exact physics parameters</span>
              </div>

              {/* Horizontal Scrollable Timeline */}
              <div className="flex items-center gap-2.5 overflow-x-auto pb-3 scrollbar-none">
                {weatherData.hourly.time.slice(0, 48).map((timeStr, idx) => {
                  const isSelected = selectedHourIndex === idx;
                  const temp = weatherData.hourly.temperature_2m[idx];
                  const code = weatherData.hourly.weather_code[idx];
                  const rainProb = weatherData.hourly.precipitation_probability[idx] || 0;
                  const info = getWeatherCodeInfo(code);
                  const hourLabel = idx === 0 ? 'Now' : new Date(timeStr).toLocaleTimeString([], { hour: 'numeric' });

                  return (
                    <button
                      key={timeStr}
                      onClick={() => setSelectedHourIndex(idx)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer shrink-0 min-w-[76px] flex flex-col items-center gap-1.5 ${
                        isSelected
                          ? 'bg-gradient-to-b from-cyan-600 to-blue-700 text-white border-cyan-400 shadow-lg shadow-cyan-600/30'
                          : 'bg-zinc-900/50 hover:bg-zinc-800/80 border-zinc-800 text-zinc-300'
                      }`}
                    >
                      <span className="text-[11px] font-semibold">{hourLabel}</span>
                      <span className="text-lg font-black">{Math.round(temp)}°</span>
                      <span className="text-[10px] text-zinc-400 truncate max-w-[65px]">{info.description}</span>
                      {rainProb > 0 && (
                        <span className="text-[10px] text-cyan-300 font-bold flex items-center gap-0.5">
                          <Droplets className="w-2.5 h-2.5" />
                          {rainProb}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Detailed Inspector for Selected Hour */}
              {weatherData.hourly.time[selectedHourIndex] && (
                <div className={`p-6 rounded-3xl border shadow-xl ${
                  appTheme === 'dark' ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      Hour Inspection: {new Date(weatherData.hourly.time[selectedHourIndex]).toLocaleDateString([], { weekday: 'long', hour: 'numeric', minute: '2-digit' })}
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {getWeatherCodeInfo(weatherData.hourly.weather_code[selectedHourIndex]).description}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-zinc-500 block">Temperature / Apparent</span>
                      <span className="text-xl font-bold text-white mt-1 block">
                        {Math.round(weatherData.hourly.temperature_2m[selectedHourIndex])}°C
                        <span className="text-zinc-400 text-sm font-normal ml-1.5">
                          (feels {Math.round(weatherData.hourly.apparent_temperature[selectedHourIndex])}°C)
                        </span>
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-500 block">Rain Probability & Volume</span>
                      <span className="text-xl font-bold text-blue-400 mt-1 block">
                        {weatherData.hourly.precipitation_probability[selectedHourIndex]}%
                        <span className="text-zinc-400 text-sm font-normal ml-1.5">
                          ({weatherData.hourly.precipitation[selectedHourIndex]} mm)
                        </span>
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-500 block">Wind Velocity</span>
                      <span className="text-xl font-bold text-white mt-1 block">
                        {weatherData.hourly.wind_speed_10m[selectedHourIndex]} km/h
                        <span className="text-zinc-400 text-sm font-normal ml-1.5">
                          ({getWindDirectionLabel(weatherData.hourly.wind_direction_10m[selectedHourIndex])})
                        </span>
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-500 block">Atmospheric Humidity</span>
                      <span className="text-xl font-bold text-white mt-1 block">
                        {weatherData.hourly.relative_humidity_2m[selectedHourIndex]}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EXTENDED FORECAST (7 TO 14 DAYS) */}
          {activeTab === 'forecast' && weatherData && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span>14-Day Extended Synoptic Outlook</span>
                </h3>
                <span className="text-xs text-zinc-400">Click any day to expand detailed breakdown</span>
              </div>

              <div className="space-y-2.5">
                {weatherData.daily.time.slice(0, 14).map((dStr, idx) => {
                  const maxT = weatherData.daily.temperature_2m_max[idx];
                  const minT = weatherData.daily.temperature_2m_min[idx];
                  const code = weatherData.daily.weather_code[idx];
                  const info = getWeatherCodeInfo(code);
                  const rainProb = weatherData.daily.precipitation_probability_max[idx] || 0;
                  const rainSum = weatherData.daily.rain_sum?.[idx] || 0;
                  const windMax = weatherData.daily.wind_speed_10m_max[idx];
                  const isExpanded = expandedDayIndex === idx;

                  return (
                    <div
                      key={dStr}
                      className={`rounded-2xl border transition-all overflow-hidden ${
                        isExpanded
                          ? 'bg-zinc-900/80 border-cyan-500/60 shadow-lg'
                          : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <button
                        onClick={() => setExpandedDayIndex(isExpanded ? null : idx)}
                        className="w-full p-4 flex items-center justify-between text-left text-xs cursor-pointer"
                      >
                        <div className="w-36 font-bold text-white">
                          {idx === 0 ? 'Today' : new Date(dStr).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>

                        <div className="flex-1 px-4 text-zinc-300 font-medium truncate">
                          {info.description}
                        </div>

                        {rainProb > 0 && (
                          <div className="w-24 text-blue-400 font-bold flex items-center gap-1 justify-end">
                            <Droplets className="w-3 h-3" />
                            <span>{rainProb}%</span>
                          </div>
                        )}

                        <div className="w-28 text-right font-black flex items-center gap-2 justify-end">
                          <span className="text-white">{Math.round(maxT)}°</span>
                          <span className="text-zinc-500">{Math.round(minT)}°</span>
                          <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </button>

                      {/* Expandable Day Details */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-2 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-zinc-950/40">
                          <div>
                            <span className="text-zinc-500 block">Rainfall Expected</span>
                            <span className="font-bold text-white mt-1 block">{rainSum} mm</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block">Peak Wind</span>
                            <span className="font-bold text-white mt-1 block">{windMax} km/h</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block">Max UV</span>
                            <span className="font-bold text-amber-400 mt-1 block">UV {weatherData.daily.uv_index_max[idx]}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block">Sunrise / Sunset</span>
                            <span className="font-bold text-cyan-400 mt-1 block">
                              {weatherData.daily.sunrise[idx]?.slice(11, 16)} • {weatherData.daily.sunset[idx]?.slice(11, 16)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: WEATHER MAPS (RADAR & SATELLITE) */}
          {activeTab === 'maps' && (
            <WeatherMaps
              currentLocation={currentLocation}
              theme={appTheme}
              onSelectCoordinate={(lat, lon, name) => {
                const loc: WeatherLocation = {
                  id: `loc_${Date.now()}`,
                  name,
                  country: '',
                  lat,
                  lon
                };
                setCurrentLocation(loc);
                loadWeatherData(loc);
              }}
            />
          )}

          {/* TAB 5: WEATHER ALERTS CENTER */}
          {activeTab === 'alerts' && (
            <WeatherAlertsCenter
              alerts={alerts}
              location={currentLocation}
              isLoading={isLoading}
              onRefresh={() => loadWeatherData(currentLocation)}
              theme={appTheme}
            />
          )}

          {/* TAB 6: AIR QUALITY INTELLIGENCE */}
          {activeTab === 'air_quality' && (
            <AirQualitySection
              airQuality={airQualityData}
              location={currentLocation}
              savedLocations={savedLocations}
              theme={appTheme}
            />
          )}

          {/* TAB 7: LOCATIONS EXPLORER */}
          {activeTab === 'locations' && (
            <LocationManager
              currentLocation={currentLocation}
              savedLocations={savedLocations}
              comparisonList={comparisonList}
              units={units}
              onSelectLocation={(loc) => {
                soundEngine.playClick();
                setCurrentLocation(loc);
                loadWeatherData(loc);
                setActiveTab('overview');
              }}
              onAddFavorite={(loc) => {
                soundEngine.playSuccess();
                const next = [loc, ...savedLocations.filter((l) => l.id !== loc.id)];
                setSavedLocations(next);
                saveWeatherSettings(next, comparisonList, units, widgets, notifications);
              }}
              onRemoveFavorite={(id) => {
                soundEngine.playClick();
                const next = savedLocations.filter((l) => l.id !== id);
                setSavedLocations(next);
                saveWeatherSettings(next, comparisonList, units, widgets, notifications);
              }}
              onRenameLocation={(id, newLabel) => {
                soundEngine.playSuccess();
                const next = savedLocations.map((l) => (l.id === id ? { ...l, customLabel: newLabel } : l));
                setSavedLocations(next);
                saveWeatherSettings(next, comparisonList, units, widgets, notifications);
              }}
              onToggleComparison={(loc) => {
                soundEngine.playClick();
                const exists = comparisonList.some((c) => c.id === loc.id);
                let next = [];
                if (exists) {
                  next = comparisonList.filter((c) => c.id !== loc.id);
                } else {
                  if (comparisonList.length >= 5) {
                    alert('Maximum of 5 cities allowed in comparison matrix.');
                    return;
                  }
                  next = [...comparisonList, loc];
                }
                setComparisonList(next);
                saveWeatherSettings(savedLocations, next, units, widgets, notifications);
              }}
              theme={appTheme}
            />
          )}

          {/* TAB 8: WEATHER COMPARISON MATRIX */}
          {activeTab === 'compare' && (
            <LocationManager
              currentLocation={currentLocation}
              savedLocations={savedLocations}
              comparisonList={comparisonList}
              units={units}
              onSelectLocation={(loc) => {
                setCurrentLocation(loc);
                loadWeatherData(loc);
                setActiveTab('overview');
              }}
              onAddFavorite={(loc) => {
                const next = [loc, ...savedLocations.filter((l) => l.id !== loc.id)];
                setSavedLocations(next);
                saveWeatherSettings(next, comparisonList, units, widgets, notifications);
              }}
              onRemoveFavorite={(id) => {
                const next = savedLocations.filter((l) => l.id !== id);
                setSavedLocations(next);
                saveWeatherSettings(next, comparisonList, units, widgets, notifications);
              }}
              onRenameLocation={(id, newLabel) => {
                const next = savedLocations.map((l) => (l.id === id ? { ...l, customLabel: newLabel } : l));
                setSavedLocations(next);
                saveWeatherSettings(next, comparisonList, units, widgets, notifications);
              }}
              onToggleComparison={(loc) => {
                const exists = comparisonList.some((c) => c.id === loc.id);
                let next = [];
                if (exists) {
                  next = comparisonList.filter((c) => c.id !== loc.id);
                } else {
                  if (comparisonList.length >= 5) {
                    alert('Maximum 5 cities allowed.');
                    return;
                  }
                  next = [...comparisonList, loc];
                }
                setComparisonList(next);
                saveWeatherSettings(savedLocations, next, units, widgets, notifications);
              }}
              theme={appTheme}
            />
          )}

          {/* TAB 9: WEATHER CALENDAR */}
          {activeTab === 'calendar' && weatherData && (
            <WeatherCalendarView
              weather={weatherData}
              units={units}
              theme={appTheme}
            />
          )}

          {/* TAB 10: WEATHER INTELLIGENCE (GEMINI AI) */}
          {activeTab === 'intelligence' && weatherData && (
            <WeatherIntelligence
              weather={weatherData}
              airQuality={airQualityData}
              location={currentLocation}
              theme={appTheme}
            />
          )}

          {/* TAB 11: SETTINGS & TOOLS */}
          {activeTab === 'settings' && weatherData && (
            <div className="space-y-6">
              {/* Special Weather Tools */}
              <SpecialWeatherTools
                weather={weatherData}
                location={currentLocation}
                units={units}
                theme={appTheme}
              />

              {/* Units & Preferences */}
              <div className={`p-6 rounded-3xl border shadow-xl ${
                appTheme === 'dark' ? 'bg-zinc-950/60 border-zinc-800' : 'bg-white border-slate-200'
              }`}>
                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Measurement Units & System Preferences</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  {/* Temperature */}
                  <div>
                    <label className="text-zinc-400 block mb-1.5 font-medium">Temperature</label>
                    <div className="flex rounded-xl bg-zinc-900 p-1 border border-zinc-800">
                      <button
                        onClick={() => {
                          const next = { ...units, temperature: 'c' as const };
                          setUnits(next);
                          saveWeatherSettings(savedLocations, comparisonList, next, widgets, notifications);
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-center font-bold cursor-pointer transition-all ${
                          units.temperature === 'c' ? 'bg-cyan-600 text-white shadow' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Celsius (°C)
                      </button>
                      <button
                        onClick={() => {
                          const next = { ...units, temperature: 'f' as const };
                          setUnits(next);
                          saveWeatherSettings(savedLocations, comparisonList, next, widgets, notifications);
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-center font-bold cursor-pointer transition-all ${
                          units.temperature === 'f' ? 'bg-cyan-600 text-white shadow' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Fahrenheit (°F)
                      </button>
                    </div>
                  </div>

                  {/* Wind Speed */}
                  <div>
                    <label className="text-zinc-400 block mb-1.5 font-medium">Wind Speed</label>
                    <div className="flex rounded-xl bg-zinc-900 p-1 border border-zinc-800">
                      {(['kmh', 'mph', 'ms', 'kn'] as const).map((ws) => (
                        <button
                          key={ws}
                          onClick={() => {
                            const next = { ...units, windSpeed: ws };
                            setUnits(next);
                            saveWeatherSettings(savedLocations, comparisonList, next, widgets, notifications);
                          }}
                          className={`flex-1 py-1.5 rounded-lg text-center font-bold cursor-pointer uppercase transition-all ${
                            units.windSpeed === ws ? 'bg-cyan-600 text-white shadow' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {ws}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Precipitation */}
                  <div>
                    <label className="text-zinc-400 block mb-1.5 font-medium">Precipitation</label>
                    <div className="flex rounded-xl bg-zinc-900 p-1 border border-zinc-800">
                      <button
                        onClick={() => {
                          const next = { ...units, precipitation: 'mm' as const };
                          setUnits(next);
                          saveWeatherSettings(savedLocations, comparisonList, next, widgets, notifications);
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-center font-bold cursor-pointer transition-all ${
                          units.precipitation === 'mm' ? 'bg-cyan-600 text-white shadow' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Millimeters (mm)
                      </button>
                      <button
                        onClick={() => {
                          const next = { ...units, precipitation: 'inch' as const };
                          setUnits(next);
                          saveWeatherSettings(savedLocations, comparisonList, next, widgets, notifications);
                        }}
                        className={`flex-1 py-1.5 rounded-lg text-center font-bold cursor-pointer transition-all ${
                          units.precipitation === 'inch' ? 'bg-cyan-600 text-white shadow' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Inches (in)
                      </button>
                    </div>
                  </div>

                  {/* Auto-Refresh Timer */}
                  <div>
                    <label className="text-zinc-400 block mb-1.5 font-medium">Auto-Refresh Interval</label>
                    <select
                      value={autoRefreshMinutes}
                      onChange={(e) => setAutoRefreshMinutes(parseInt(e.target.value, 10))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value={5}>Every 5 Minutes</option>
                      <option value={10}>Every 10 Minutes</option>
                      <option value={15}>Every 15 Minutes</option>
                      <option value={30}>Every 30 Minutes</option>
                      <option value={0}>Manual Only</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
