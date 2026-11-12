export type WeatherConditionCategory =
  | 'sunny'
  | 'partly-cloudy'
  | 'cloudy'
  | 'rain'
  | 'thunderstorm'
  | 'snow'
  | 'fog'
  | 'haze'
  | 'windy';

export interface WeatherLocation {
  id: string;
  name: string;
  country: string;
  countryCode?: string;
  admin1?: string;
  lat: number;
  lon: number;
  timezone?: string;
  customLabel?: string;
  isFavorite?: boolean;
}

export interface UnitPreferences {
  temperature: 'c' | 'f';
  windSpeed: 'kmh' | 'mph' | 'ms' | 'kn';
  precipitation: 'mm' | 'inch';
  pressure: 'hPa' | 'inHg' | 'mmHg';
}

export interface WidgetConfig {
  showCurrentWeather: boolean;
  showHourlyForecast: boolean;
  showSevenDayForecast: boolean;
  showAirQuality: boolean;
  showSunAndMoon: boolean;
  showWindCompass: boolean;
  showRainTimeline: boolean;
  showWeatherAlerts: boolean;
  showUvIndex: boolean;
  showHealthComfort: boolean;
}

export interface NotificationSettings {
  rainAlert: boolean;
  severeAlert: boolean;
  highTempAlert: boolean;
  highTempThreshold: number; // in Celsius
  lowTempAlert: boolean;
  lowTempThreshold: number; // in Celsius
  windAlert: boolean;
  windThreshold: number; // km/h
  poorAqiAlert: boolean;
  morningBriefing: boolean;
  eveningSummary: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "07:00"
}

export interface WeatherAlertItem {
  id: string;
  title: string;
  event: string;
  region: string;
  severity: 'EXTREME' | 'SEVERE' | 'MODERATE' | 'MINOR';
  authority: string;
  issued: string;
  expires: string;
  description: string;
  instructions?: string;
  sourceUrl?: string;
}

export interface RawWeatherData {
  latitude: number;
  longitude: number;
  timezone: string;
  timezone_abbreviation?: string;
  current: {
    time: string;
    interval?: number;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: number;
    precipitation: number;
    rain: number;
    showers: number;
    snowfall: number;
    weather_code: number;
    cloud_cover: number;
    pressure_msl: number;
    surface_pressure?: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    dew_point_2m: number[];
    apparent_temperature: number[];
    precipitation_probability: number[];
    precipitation: number[];
    rain: number[];
    showers: number[];
    snowfall: number[];
    weather_code: number[];
    pressure_msl: number[];
    cloud_cover: number[];
    visibility: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    wind_gusts_10m: number[];
    uv_index: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    apparent_temperature_max: number[];
    apparent_temperature_min: number[];
    sunrise: string[];
    sunset: string[];
    daylight_duration?: number[];
    sunshine_duration?: number[];
    uv_index_max: number[];
    precipitation_sum: number[];
    rain_sum: number[];
    showers_sum?: number[];
    snowfall_sum?: number[];
    precipitation_hours?: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
    wind_gusts_10m_max: number[];
    wind_direction_10m_dominant: number[];
  };
  fetchedAt: string;
  isCached?: boolean;
  provider?: string;
}

export interface RawAirQualityData {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    time: string;
    european_aqi: number;
    us_aqi: number;
    pm10: number;
    pm2_5: number;
    carbon_monoxide: number;
    nitrogen_dioxide: number;
    sulphur_dioxide: number;
    ozone: number;
    dust?: number;
  };
  hourly: {
    time: string[];
    pm10: number[];
    pm2_5: number[];
    carbon_monoxide: number[];
    nitrogen_dioxide: number[];
    sulphur_dioxide: number[];
    ozone: number[];
    european_aqi: number[];
    us_aqi: number[];
  };
  fetchedAt: string;
  isCached?: boolean;
  provider?: string;
}

export interface RadarManifest {
  version: string;
  generated: number;
  host: string;
  radar: {
    past: Array<{ time: number; path: string }>;
    nowcast: Array<{ time: number; path: string }>;
  };
  satellite: {
    infrared: Array<{ time: number; path: string }>;
  };
}

export type WeatherTab =
  | 'overview'
  | 'hourly'
  | 'forecast'
  | 'maps'
  | 'alerts'
  | 'air_quality'
  | 'locations'
  | 'compare'
  | 'calendar'
  | 'intelligence'
  | 'settings';
