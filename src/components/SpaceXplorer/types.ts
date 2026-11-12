export type SpaceXTab = 
  | 'home'
  | 'globe3d'
  | 'skymap'
  | 'solarsystem'
  | 'planets'
  | 'constellations'
  | 'satellites'
  | 'iss'
  | 'moon'
  | 'deepspace'
  | 'missions'
  | 'nasa'
  | 'collection';

export interface PlanetData {
  id: string;
  name: string;
  type: 'Terrestrial' | 'Gas Giant' | 'Ice Giant' | 'Dwarf Planet' | 'Star';
  tagline: string;
  description: string;
  color: string;
  texturePattern: string; // CSS radial gradient or canvas pattern descriptor
  radiusKm: number;
  radiusEarths: number;
  massEarths: number;
  distanceFromSunAU: number;
  distanceFromSunMillionKm: number;
  orbitalPeriodDays: number;
  rotationPeriodHours: number;
  meanTempC: number;
  atmosphereComposition: string[];
  moonsCount: number;
  majorMoons: string[];
  notableMissions: string[];
  keyFacts: string[];
  scale3D: number;
  orbitSpeedRatio: number;
}

export interface ConstellationData {
  id: string;
  name: string;
  latinName: string;
  englishName: string;
  pronunciation: string;
  symbolism: string;
  brightestStar: string;
  brightestStarMag: number;
  bestViewingSeason: 'Spring' | 'Summer' | 'Autumn' | 'Winter' | 'Year-round';
  hemisphere: 'Northern' | 'Southern' | 'Both';
  mythology: string;
  stars: Array<{ name: string; raHours: number; decDeg: number; mag: number; spectType: string }>;
  lineConnections: Array<[number, number]>; // Indices into stars array
  nearbyDeepSpaceObjects: string[];
}

export interface SatelliteData {
  id: string;
  noradId: number;
  name: string;
  type: 'Space Station' | 'Telescope' | 'Weather' | 'Navigation' | 'Communication' | 'Earth Science';
  operator: string;
  launchYear: number;
  orbitType: 'LEO' | 'GEO' | 'MEO' | 'SSO';
  altitudeKm: number;
  velocityKmSec: number;
  periodMinutes: number;
  inclinationDeg: number;
  lat: number;
  lon: number;
  description: string;
}

export interface DeepSpaceObject {
  id: string;
  name: string;
  catalogId: string; // e.g. M31, NGC 224
  type: 'Spiral Galaxy' | 'Elliptical Galaxy' | 'Emission Nebula' | 'Planetary Nebula' | 'Open Cluster' | 'Globular Cluster' | 'Supernova Remnant' | 'Supermassive Black Hole' | 'Exoplanet';
  constellation: string;
  distanceLightYears: number;
  magnitude: number;
  description: string;
  imageUrl: string;
  imageCredit: string;
  ra: string;
  dec: string;
}

export interface SpaceMission {
  id: string;
  name: string;
  agency: string;
  type: 'Lunar' | 'Mars' | 'Outer Solar System' | 'Space Telescope' | 'Solar' | 'Interstellar';
  launchDate: string;
  status: 'Active' | 'Completed' | 'En Route' | 'Planned';
  objectives: string;
  keyAchievements: string[];
  imageUrl: string;
}

export interface AstronomicalEvent {
  id: string;
  title: string;
  type: 'Meteor Shower' | 'Eclipse' | 'Planetary Conjunction' | 'Supermoon' | 'Opposition' | 'Solstice/Equinox';
  date: string;
  peakTimeUTC?: string;
  visibilityRegion: string;
  description: string;
  viewingTips: string;
}

export interface NasaApod {
  title: string;
  date: string;
  explanation: string;
  url: string;
  media_type: string;
  copyright?: string;
}

export interface UserLocation {
  lat: number;
  lon: number;
  city: string;
  isCustom: boolean;
}

export interface SavedCollectionItem {
  id: string;
  type: 'planet' | 'constellation' | 'satellite' | 'deepspace' | 'mission';
  title: string;
  subtitle: string;
  savedAt: string;
  data: any;
}
