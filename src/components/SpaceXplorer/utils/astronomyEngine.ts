import { SatelliteData } from '../types';

export interface MoonPhaseInfo {
  phaseName: string;
  illuminationFraction: number; // 0 to 1
  illuminationPercentage: number; // 0 to 100
  ageDays: number; // 0 to 29.53
  nextFullMoonDate: string;
  nextNewMoonDate: string;
}

export function getMoonPhaseInfo(date: Date = new Date()): MoonPhaseInfo {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  
  // Approximate Julian Date calculation
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
  
  // Days since known new moon on Jan 6, 2000 (JD 2451549.5)
  const synodicMonth = 29.53058867;
  const daysSinceNew = (jd - 2451549.5) % synodicMonth;
  const ageDays = (daysSinceNew < 0 ? daysSinceNew + synodicMonth : daysSinceNew);
  
  // Phase angle (0 to 2*PI)
  const phaseAngle = (ageDays / synodicMonth) * 2 * Math.PI;
  const illuminationFraction = (1 - Math.cos(phaseAngle)) / 2;
  const illuminationPercentage = Math.round(illuminationFraction * 100);
  
  let phaseName = 'New Moon';
  if (ageDays >= 1 && ageDays < 6.5) phaseName = 'Waxing Crescent';
  else if (ageDays >= 6.5 && ageDays < 8.5) phaseName = 'First Quarter';
  else if (ageDays >= 8.5 && ageDays < 13.8) phaseName = 'Waxing Gibbous';
  else if (ageDays >= 13.8 && ageDays < 15.8) phaseName = 'Full Moon';
  else if (ageDays >= 15.8 && ageDays < 22) phaseName = 'Waning Gibbous';
  else if (ageDays >= 22 && ageDays < 24) phaseName = 'Last Quarter';
  else if (ageDays >= 24) phaseName = 'Waning Crescent';

  const daysToNextFull = (14.765 - ageDays + synodicMonth) % synodicMonth;
  const daysToNextNew = (synodicMonth - ageDays) % synodicMonth;

  const fullMoonDate = new Date(date.getTime() + daysToNextFull * 86400000);
  const newMoonDate = new Date(date.getTime() + daysToNextNew * 86400000);

  return {
    phaseName,
    illuminationFraction,
    illuminationPercentage,
    ageDays: Math.round(ageDays * 10) / 10,
    nextFullMoonDate: fullMoonDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    nextNewMoonDate: newMoonDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  };
}

export function calculateSatellitePosition(satellite: SatelliteData, date: Date = new Date()): {
  lat: number;
  lon: number;
  altKm: number;
  velocityKmSec: number;
} {
  const millis = date.getTime();
  const periodMillis = satellite.periodMinutes * 60 * 1000;
  const progress = (millis % periodMillis) / periodMillis;
  const angleRad = progress * 2 * Math.PI;

  const latAmp = satellite.inclinationDeg > 90 ? 180 - satellite.inclinationDeg : satellite.inclinationDeg;
  const currentLat = Math.sin(angleRad) * Math.min(latAmp, 85);
  
  // Earth rotation drift (~15 degrees per hour)
  const earthRotDegrees = ((millis / (1000 * 3600)) * 15) % 360;
  let currentLon = ((satellite.lon + (progress * 360) - earthRotDegrees) % 360);
  if (currentLon > 180) currentLon -= 360;
  if (currentLon < -180) currentLon += 360;

  return {
    lat: Math.round(currentLat * 100) / 100,
    lon: Math.round(currentLon * 100) / 100,
    altKm: satellite.altitudeKm,
    velocityKmSec: satellite.velocityKmSec
  };
}

export function convertRaDecToAltAz(
  raHours: number,
  decDeg: number,
  latDeg: number,
  lonDeg: number,
  date: Date = new Date()
): { altDeg: number; azDeg: number; isVisible: boolean } {
  const raRad = (raHours * 15) * (Math.PI / 180);
  const decRad = decDeg * (Math.PI / 180);
  const latRad = latDeg * (Math.PI / 180);

  // Greenwich Sidereal Time approximation
  const d = (date.getTime() - new Date('2000-01-01T12:00:00Z').getTime()) / 86400000;
  const gstHours = (18.697374558 + 24.06570982441908 * d) % 24;
  const lstHours = (gstHours + lonDeg / 15) % 24;
  const lstRad = (lstHours * 15) * (Math.PI / 180);

  // Hour Angle
  const haRad = lstRad - raRad;

  // Altitude
  const sinAlt = Math.sin(decRad) * Math.sin(latRad) + Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad);
  const altRad = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const altDeg = altRad * (180 / Math.PI);

  // Azimuth
  const cosAz = (Math.sin(decRad) - Math.sin(latRad) * Math.sin(altRad)) / (Math.cos(latRad) * Math.cos(altRad));
  let azRad = Math.acos(Math.max(-1, Math.min(1, cosAz)));
  if (Math.sin(haRad) > 0) {
    azRad = 2 * Math.PI - azRad;
  }
  const azDeg = azRad * (180 / Math.PI);

  return {
    altDeg: Math.round(altDeg * 10) / 10,
    azDeg: Math.round(azDeg * 10) / 10,
    isVisible: altDeg > 0
  };
}
