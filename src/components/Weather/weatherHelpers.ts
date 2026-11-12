import * as SunCalcModule from 'suncalc';
const SunCalc = ((SunCalcModule as any).default || SunCalcModule) as typeof SunCalcModule;
import { WeatherConditionCategory, UnitPreferences } from './types';

export interface WeatherCodeInfo {
  code: number;
  description: string;
  category: WeatherConditionCategory;
  iconName: string;
  isPrecipitation: boolean;
}

export const WMO_WEATHER_CODES: Record<number, WeatherCodeInfo> = {
  0: { code: 0, description: 'Clear Sky', category: 'sunny', iconName: 'Sun', isPrecipitation: false },
  1: { code: 1, description: 'Mainly Clear', category: 'sunny', iconName: 'SunMedium', isPrecipitation: false },
  2: { code: 2, description: 'Partly Cloudy', category: 'partly-cloudy', iconName: 'CloudSun', isPrecipitation: false },
  3: { code: 3, description: 'Overcast Skies', category: 'cloudy', iconName: 'Cloud', isPrecipitation: false },
  45: { code: 45, description: 'Dense Fog', category: 'fog', iconName: 'CloudFog', isPrecipitation: false },
  48: { code: 48, description: 'Depositing Rime Fog', category: 'fog', iconName: 'CloudFog', isPrecipitation: false },
  51: { code: 51, description: 'Light Drizzle', category: 'rain', iconName: 'CloudDrizzle', isPrecipitation: true },
  53: { code: 53, description: 'Moderate Drizzle', category: 'rain', iconName: 'CloudDrizzle', isPrecipitation: true },
  55: { code: 55, description: 'Dense Drizzle', category: 'rain', iconName: 'CloudRain', isPrecipitation: true },
  56: { code: 56, description: 'Light Freezing Drizzle', category: 'snow', iconName: 'CloudSnow', isPrecipitation: true },
  57: { code: 57, description: 'Dense Freezing Drizzle', category: 'snow', iconName: 'CloudSnow', isPrecipitation: true },
  61: { code: 61, description: 'Slight Rain', category: 'rain', iconName: 'CloudRain', isPrecipitation: true },
  63: { code: 63, description: 'Moderate Rain', category: 'rain', iconName: 'CloudRain', isPrecipitation: true },
  65: { code: 65, description: 'Heavy Rain', category: 'rain', iconName: 'CloudRain', isPrecipitation: true },
  66: { code: 66, description: 'Light Freezing Rain', category: 'snow', iconName: 'CloudSnow', isPrecipitation: true },
  67: { code: 67, description: 'Heavy Freezing Rain', category: 'snow', iconName: 'CloudSnow', isPrecipitation: true },
  71: { code: 71, description: 'Slight Snow Fall', category: 'snow', iconName: 'CloudSnow', isPrecipitation: true },
  73: { code: 73, description: 'Moderate Snow Fall', category: 'snow', iconName: 'CloudSnow', isPrecipitation: true },
  75: { code: 75, description: 'Heavy Snow Fall', category: 'snow', iconName: 'CloudSnow', isPrecipitation: true },
  77: { code: 77, description: 'Snow Grains', category: 'snow', iconName: 'Snowflake', isPrecipitation: true },
  80: { code: 80, description: 'Slight Rain Showers', category: 'rain', iconName: 'CloudDrizzle', isPrecipitation: true },
  81: { code: 81, description: 'Moderate Rain Showers', category: 'rain', iconName: 'CloudRain', isPrecipitation: true },
  82: { code: 82, description: 'Violent Rain Showers', category: 'rain', iconName: 'CloudRain', isPrecipitation: true },
  85: { code: 85, description: 'Slight Snow Showers', category: 'snow', iconName: 'CloudSnow', isPrecipitation: true },
  86: { code: 86, description: 'Heavy Snow Showers', category: 'snow', iconName: 'CloudSnow', isPrecipitation: true },
  95: { code: 95, description: 'Thunderstorm', category: 'thunderstorm', iconName: 'CloudLightning', isPrecipitation: true },
  96: { code: 96, description: 'Thunderstorm with Slight Hail', category: 'thunderstorm', iconName: 'CloudLightning', isPrecipitation: true },
  99: { code: 99, description: 'Thunderstorm with Heavy Hail', category: 'thunderstorm', iconName: 'CloudLightning', isPrecipitation: true }
};

export function getWeatherCodeInfo(code: number): WeatherCodeInfo {
  return WMO_WEATHER_CODES[code] || {
    code,
    description: 'Variable Weather',
    category: 'partly-cloudy',
    iconName: 'CloudSun',
    isPrecipitation: false
  };
}

// ============================================================================
// UNIT CONVERSION HELPERS
// ============================================================================
export function formatTemperature(celsius: number, unit: 'c' | 'f'): string {
  if (celsius === undefined || celsius === null || isNaN(celsius)) return '--';
  const val = unit === 'f' ? (celsius * 9) / 5 + 32 : celsius;
  return `${Math.round(val)}°${unit.toUpperCase()}`;
}

export function formatWindSpeed(kmh: number, unit: UnitPreferences['windSpeed']): string {
  if (kmh === undefined || kmh === null || isNaN(kmh)) return '--';
  switch (unit) {
    case 'mph':
      return `${Math.round(kmh * 0.621371)} mph`;
    case 'ms':
      return `${(kmh / 3.6).toFixed(1)} m/s`;
    case 'kn':
      return `${Math.round(kmh * 0.539957)} kn`;
    case 'kmh':
    default:
      return `${Math.round(kmh)} km/h`;
  }
}

export function formatPrecipitation(mm: number, unit: UnitPreferences['precipitation']): string {
  if (mm === undefined || mm === null || isNaN(mm)) return '--';
  if (unit === 'inch') {
    return `${(mm * 0.0393701).toFixed(2)} in`;
  }
  return `${mm.toFixed(1)} mm`;
}

export function formatPressure(hPa: number, unit: UnitPreferences['pressure']): string {
  if (hPa === undefined || hPa === null || isNaN(hPa)) return '--';
  switch (unit) {
    case 'inHg':
      return `${(hPa * 0.02953).toFixed(2)} inHg`;
    case 'mmHg':
      return `${Math.round(hPa * 0.750062)} mmHg`;
    case 'hPa':
    default:
      return `${Math.round(hPa)} hPa`;
  }
}

export function getWindDirectionLabel(deg: number): string {
  const directions = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
  ];
  const idx = Math.round(deg / 22.5) % 16;
  return directions[idx] || 'N';
}

// ============================================================================
// HEALTH & COMFORT CALCULATIONS
// ============================================================================

/**
 * Calculate Heat Index (Rothfusz equation in °C)
 */
export function calculateHeatIndex(tempC: number, humidity: number): number {
  if (tempC < 27 || humidity < 40) return tempC;
  const T = (tempC * 9) / 5 + 32; // to Fahrenheit
  const R = humidity;
  const c1 = -42.379;
  const c2 = 2.04901523;
  const c3 = 10.14333127;
  const c4 = -0.22475541;
  const c5 = -0.00683783;
  const c6 = -0.05481717;
  const c7 = 0.00122874;
  const c8 = 0.00085282;
  const c9 = -0.00000199;

  let HI =
    c1 +
    c2 * T +
    c3 * R +
    c4 * T * R +
    c5 * T * T +
    c6 * R * R +
    c7 * T * T * R +
    c8 * T * R * R +
    c9 * T * T * R * R;

  return ((HI - 32) * 5) / 9;
}

/**
 * Calculate Wind Chill in °C
 */
export function calculateWindChill(tempC: number, windSpeedKmh: number): number {
  if (tempC > 10 || windSpeedKmh < 4.8) return tempC;
  const V = Math.pow(windSpeedKmh, 0.16);
  return 13.12 + 0.6215 * tempC - 11.37 * V + 0.3965 * tempC * V;
}

/**
 * Approximate Dew Point in °C using Magnus formula
 */
export function calculateDewPoint(tempC: number, humidity: number): number {
  const a = 17.27;
  const b = 237.7;
  const alpha = (a * tempC) / (b + tempC) + Math.log(humidity / 100);
  return (b * alpha) / (a - alpha);
}

/**
 * Human Comfort evaluation based on Dew Point
 */
export function getComfortEvaluation(dewPointC: number): { label: string; color: string; advice: string } {
  if (dewPointC < 10) {
    return { label: 'Dry / Crisp', color: 'text-cyan-400', advice: 'Very comfortable; skin may feel dry.' };
  } else if (dewPointC <= 15) {
    return { label: 'Comfortable', color: 'text-emerald-400', advice: 'Ideal outdoor conditions and pleasant air.' };
  } else if (dewPointC <= 18) {
    return { label: 'Mild Humidity', color: 'text-blue-400', advice: 'Noticeable moisture; agreeable for most activities.' };
  } else if (dewPointC <= 21) {
    return { label: 'Humid', color: 'text-amber-400', advice: 'Muggy; sweat evaporates slowly during exertion.' };
  } else if (dewPointC <= 24) {
    return { label: 'Very Muggy', color: 'text-orange-400', advice: 'Oppressive moisture; stay well hydrated.' };
  }
  return { label: 'Severely Oppressive', color: 'text-rose-400', advice: 'Dangerous heat/moisture stress. Seek cool refuge.' };
}

// ============================================================================
// AIR QUALITY INTELLIGENCE HELPERS
// ============================================================================
export interface AqiCategoryInfo {
  category: string;
  color: string;
  bgColor: string;
  badgeBg: string;
  badgeText: string;
  description: string;
  healthAdvice: string;
  sensitiveAdvice: string;
}

export function getUsAqiCategory(aqi: number): AqiCategoryInfo {
  if (aqi <= 50) {
    return {
      category: 'Good',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/30',
      badgeBg: 'bg-emerald-500/20',
      badgeText: 'text-emerald-300',
      description: 'Air quality is satisfactory and poses little or no risk.',
      healthAdvice: 'Air quality is ideal for all outdoor activities.',
      sensitiveAdvice: 'No special health precautions needed.'
    };
  } else if (aqi <= 100) {
    return {
      category: 'Moderate',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/30',
      badgeBg: 'bg-amber-500/20',
      badgeText: 'text-amber-300',
      description: 'Air quality is acceptable; some pollutants may affect a few sensitive individuals.',
      healthAdvice: 'Most people can continue normal outdoor activities.',
      sensitiveAdvice: 'Extremely sensitive individuals should consider limiting prolonged outdoor exertion.'
    };
  } else if (aqi <= 150) {
    return {
      category: 'Unhealthy for Sensitive Groups',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10 border-orange-500/30',
      badgeBg: 'bg-orange-500/20',
      badgeText: 'text-orange-300',
      description: 'Members of sensitive groups may experience adverse health effects.',
      healthAdvice: 'General public is not likely to be affected.',
      sensitiveAdvice: 'People with asthma, respiratory, or heart conditions should reduce prolonged outdoor effort.'
    };
  } else if (aqi <= 200) {
    return {
      category: 'Unhealthy',
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/30',
      badgeBg: 'bg-rose-500/20',
      badgeText: 'text-rose-300',
      description: 'Everyone may begin to experience health effects.',
      healthAdvice: 'Avoid prolonged outdoor physical exertion.',
      sensitiveAdvice: 'Children, the elderly, and sensitive groups should stay indoors and use air purification.'
    };
  } else if (aqi <= 300) {
    return {
      category: 'Very Unhealthy',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/30',
      badgeBg: 'bg-purple-500/20',
      badgeText: 'text-purple-300',
      description: 'Health alert: increased likelihood of serious effects for everyone.',
      healthAdvice: 'Keep all windows closed; wear an N95/FFP2 mask if outdoors is necessary.',
      sensitiveAdvice: 'Strictly avoid outdoor exposure. Keep medical inhalers/prescriptions nearby.'
    };
  }
  return {
    category: 'Hazardous',
    color: 'text-red-500',
    bgColor: 'bg-red-500/20 border-red-500/50',
    badgeBg: 'bg-red-500/30',
    badgeText: 'text-red-200',
    description: 'Emergency health conditions: the entire population is likely to be affected.',
    healthAdvice: 'Remain indoors with closed windows and HEPA filtration running.',
    sensitiveAdvice: 'Emergency conditions. Strictly avoid any outdoor activity.'
  };
}

// ============================================================================
// UV INDEX GUIDELINES
// ============================================================================
export interface UvGuidance {
  category: string;
  color: string;
  protection: string;
  burnTime: string;
}

export function getUvGuidance(uv: number): UvGuidance {
  if (uv <= 2) {
    return {
      category: 'Low',
      color: 'text-emerald-400',
      protection: 'No protection required. You can safely stay outside.',
      burnTime: '> 60 mins'
    };
  } else if (uv <= 5) {
    return {
      category: 'Moderate',
      color: 'text-amber-400',
      protection: 'Wear sunglasses, apply SPF 30+ sunscreen, and seek shade during midday.',
      burnTime: '30–45 mins'
    };
  } else if (uv <= 7) {
    return {
      category: 'High',
      color: 'text-orange-400',
      protection: 'Slip on a shirt, apply SPF 50+, wear a wide-brim hat, and reduce midday sun exposure.',
      burnTime: '15–25 mins'
    };
  } else if (uv <= 10) {
    return {
      category: 'Very High',
      color: 'text-rose-400',
      protection: 'Extra precautions essential: avoid direct midday sun, seek dense shade, reapply sunscreen.',
      burnTime: '10–15 mins'
    };
  }
  return {
    category: 'Extreme',
    color: 'text-purple-400',
    protection: 'Dangerous exposure. Avoid outdoor sun between 10 AM and 4 PM. Unprotected skin burns rapidly.',
    burnTime: '< 10 mins'
  };
}

// ============================================================================
// SUN & MOON ASTRONOMY HELPERS (SunCalc)
// ============================================================================
export interface SunMoonTelemetry {
  sunrise: Date;
  sunset: Date;
  solarNoon: Date;
  nadir: Date;
  goldenHour: Date;
  dawn: Date;
  dusk: Date;
  dayLengthMinutes: number;
  dayLengthFormatted: string;
  moonFraction: number; // 0 to 1
  moonPhase: number; // 0 to 1
  moonPhaseName: string;
  moonIcon: string;
  moonrise?: Date;
  moonset?: Date;
}

export function getSunMoonTelemetry(date: Date, lat: number, lon: number): SunMoonTelemetry {
  const times = SunCalc.getTimes(date, lat, lon);
  const moonIllum = SunCalc.getMoonIllumination(date);
  let moonTimes: any = {};
  try {
    moonTimes = SunCalc.getMoonTimes(date, lat, lon);
  } catch {}

  const fallbackNow = new Date();
  const sunrise = times.sunrise || fallbackNow;
  const sunset = times.sunset || fallbackNow;
  const dayLengthMs = Math.max(0, sunset.getTime() - sunrise.getTime());
  const totalMinutes = Math.floor(dayLengthMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  // Determine moon phase name
  const p = moonIllum.phase;
  let phaseName = 'New Moon';
  let icon = '🌑';

  if (p < 0.03 || p > 0.97) {
    phaseName = 'New Moon';
    icon = '🌑';
  } else if (p < 0.22) {
    phaseName = 'Waxing Crescent';
    icon = '🌒';
  } else if (p < 0.28) {
    phaseName = 'First Quarter';
    icon = '🌓';
  } else if (p < 0.47) {
    phaseName = 'Waxing Gibbous';
    icon = '🌔';
  } else if (p < 0.53) {
    phaseName = 'Full Moon';
    icon = '🌕';
  } else if (p < 0.72) {
    phaseName = 'Waning Gibbous';
    icon = '🌖';
  } else if (p < 0.78) {
    phaseName = 'Last Quarter';
    icon = '🌗';
  } else {
    phaseName = 'Waning Crescent';
    icon = '🌘';
  }

  return {
    sunrise,
    sunset,
    solarNoon: times.solarNoon || fallbackNow,
    nadir: times.nadir || fallbackNow,
    goldenHour: times.goldenHour || fallbackNow,
    dawn: times.dawn || fallbackNow,
    dusk: times.dusk || fallbackNow,
    dayLengthMinutes: totalMinutes,
    dayLengthFormatted: `${hours}h ${mins}m`,
    moonFraction: moonIllum.fraction,
    moonPhase: moonIllum.phase,
    moonPhaseName: phaseName,
    moonIcon: icon,
    moonrise: moonTimes.rise,
    moonset: moonTimes.set
  };
}

/**
 * Format local time for any time string with timezone
 */
export function formatLocalTime(isoString: string, timezone?: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone || undefined
    });
  } catch {
    return isoString.slice(11, 16);
  }
}

/**
 * Format date for daily cards
 */
export function formatDayCard(isoString: string, timezone?: string): { day: string; date: string } {
  try {
    const d = new Date(isoString);
    const day = d.toLocaleDateString([], { weekday: 'short', timeZone: timezone || undefined });
    const date = d.toLocaleDateString([], { month: 'short', day: 'numeric', timeZone: timezone || undefined });
    return { day, date };
  } catch {
    return { day: 'Day', date: isoString };
  }
}
