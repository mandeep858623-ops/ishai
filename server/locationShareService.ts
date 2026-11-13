import { Router, Request, Response } from 'express';
import crypto from 'crypto';

// In-memory active sharing sessions with TTL cleanup
export interface LocationShareSession {
  token: string;
  requesterId: string;
  requesterName: string;
  recipientPhone: string;
  purpose: string;
  durationMinutes: number;
  status: 
    | 'INVITED'
    | 'SENDING'
    | 'SENT'
    | 'AWAITING_APPROVAL'
    | 'DECLINED'
    | 'PERMISSION_DENIED'
    | 'SHARING_ACTIVE'
    | 'SHARING_STOPPED'
    | 'EXPIRED';
  createdAt: number;
  expiresAt: number;
  lastCoordinates?: {
    lat: number;
    lng: number;
    accuracy?: number;
    heading?: number | null;
    speed?: number | null;
    timestamp: number;
  };
  smsSent: boolean;
  smsError?: string;
  shareUrl: string;
}

const activeSessions: Map<string, LocationShareSession> = new Map();

// Periodic cleanup of expired sessions
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of activeSessions.entries()) {
    if (now > session.expiresAt && session.status !== 'SHARING_STOPPED') {
      session.status = 'EXPIRED';
    }
    // Delete sessions expired for more than 24 hours
    if (now > session.expiresAt + 24 * 60 * 60 * 1000) {
      activeSessions.delete(token);
    }
  }
}, 60000).unref();

// Comprehensive International Country Calling Codes & Geographic Numbering Plan Registry
export interface AreaCodeGeo {
  name: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  confidence?: 'HIGH' | 'MEDIUM';
  source?: string;
}

export interface CallingCodeData {
  name: string;
  iso: string;
  code: string;
  sampleLength: number[];
  countryCenter: { lat: number; lng: number };
  countryRadiusMeters: number;
  areaCodes?: Record<string, string>;
  areaCodeGeo?: Record<string, AreaCodeGeo>;
  carrierPrefixes?: Record<string, string>;
  defaultType?: 'Mobile' | 'Fixed Line' | 'Geographic';
}

export interface GeographicRegionEstimate {
  hasGeographicRegion: boolean;
  precision: 'METRO_AREA' | 'STATE_PROVINCE' | 'COUNTRY_LEVEL' | 'NONE';
  regionName: string;
  country: string;
  center: { lat: number; lng: number };
  estimatedRadiusMeters: number;
  minRadiusMeters: number;
  maxRadiusMeters: number;
  dataSource: string;
  confidence: 'HIGH' | 'MEDIUM' | 'COUNTRY_LEVEL' | 'NONE';
  limitations: string;
  isPhysicalLocation: false;
}

const CALLING_CODES: Record<string, CallingCodeData> = {
  '+1': {
    name: 'United States & Canada',
    iso: 'US/CA',
    code: '+1',
    sampleLength: [10],
    defaultType: 'Geographic',
    countryCenter: { lat: 39.8283, lng: -98.5795 },
    countryRadiusMeters: 2000000,
    areaCodes: {
      '212': 'New York City (Manhattan), NY',
      '718': 'New York City (Brooklyn/Queens/Bronx), NY',
      '917': 'New York City Mobile/Regional, NY',
      '646': 'New York City (Manhattan Overlay), NY',
      '347': 'New York City (Outer Boroughs), NY',
      '415': 'San Francisco / Bay Area, CA',
      '310': 'Los Angeles / Beverly Hills, CA',
      '213': 'Los Angeles Downtown, CA',
      '650': 'San Mateo / Silicon Valley, CA',
      '408': 'San Jose / Silicon Valley, CA',
      '312': 'Chicago Downtown, IL',
      '773': 'Chicago Metro, IL',
      '206': 'Seattle Metro, WA',
      '512': 'Austin Metro, TX',
      '214': 'Dallas Metro, TX',
      '713': 'Houston Metro, TX',
      '305': 'Miami / South Florida, FL',
      '404': 'Atlanta Metro, GA',
      '617': 'Boston Metro, MA',
      '202': 'Washington, D.C.',
      '416': 'Toronto, Ontario, Canada',
      '604': 'Vancouver, British Columbia, Canada',
      '514': 'Montreal, Quebec, Canada',
    },
    areaCodeGeo: {
      '212': { name: 'New York City (Manhattan), NY', lat: 40.7831, lng: -73.9712, radiusMeters: 14000, confidence: 'HIGH', source: 'North American Numbering Plan (NANP) - Manhattan Central Wire Center' },
      '718': { name: 'New York City (Brooklyn/Queens/Bronx), NY', lat: 40.6782, lng: -73.9442, radiusMeters: 18000, confidence: 'HIGH', source: 'NANP - NY Outer Boroughs Exchange' },
      '917': { name: 'New York City Mobile/Regional, NY', lat: 40.7128, lng: -74.0060, radiusMeters: 25000, confidence: 'MEDIUM', source: 'NANP - NYC All-Borough Overlay' },
      '646': { name: 'New York City (Manhattan Overlay), NY', lat: 40.7589, lng: -73.9851, radiusMeters: 16000, confidence: 'HIGH', source: 'NANP - NY Manhattan Exchange' },
      '347': { name: 'New York City (Outer Boroughs), NY', lat: 40.7282, lng: -73.7949, radiusMeters: 20000, confidence: 'HIGH', source: 'NANP - NY Exchange' },
      '415': { name: 'San Francisco / Bay Area, CA', lat: 37.7749, lng: -122.4194, radiusMeters: 22000, confidence: 'HIGH', source: 'NANP - California Zone 1 (San Francisco)' },
      '310': { name: 'Los Angeles / Beverly Hills, CA', lat: 34.0522, lng: -118.2437, radiusMeters: 35000, confidence: 'HIGH', source: 'NANP - California Zone 2 (LA West)' },
      '213': { name: 'Los Angeles Downtown, CA', lat: 34.0407, lng: -118.2468, radiusMeters: 18000, confidence: 'HIGH', source: 'NANP - Downtown LA Wire Center' },
      '650': { name: 'San Mateo / Silicon Valley, CA', lat: 37.5630, lng: -122.3255, radiusMeters: 28000, confidence: 'HIGH', source: 'NANP - San Mateo Peninsula' },
      '408': { name: 'San Jose / Silicon Valley, CA', lat: 37.3382, lng: -121.8863, radiusMeters: 30000, confidence: 'HIGH', source: 'NANP - Santa Clara County' },
      '312': { name: 'Chicago Downtown / Loop, IL', lat: 41.8781, lng: -87.6298, radiusMeters: 18000, confidence: 'HIGH', source: 'NANP - Chicago Central' },
      '773': { name: 'Chicago Metro, IL', lat: 41.8375, lng: -87.6866, radiusMeters: 26000, confidence: 'HIGH', source: 'NANP - Chicago Outer' },
      '206': { name: 'Seattle Metro, WA', lat: 47.6062, lng: -122.3321, radiusMeters: 25000, confidence: 'HIGH', source: 'NANP - Puget Sound / Seattle' },
      '512': { name: 'Austin Metro, TX', lat: 30.2672, lng: -97.7431, radiusMeters: 32000, confidence: 'HIGH', source: 'NANP - Central Texas / Austin' },
      '214': { name: 'Dallas Metro, TX', lat: 32.7767, lng: -96.7970, radiusMeters: 35000, confidence: 'HIGH', source: 'NANP - North Texas / Dallas' },
      '713': { name: 'Houston Metro, TX', lat: 29.7604, lng: -95.3698, radiusMeters: 38000, confidence: 'HIGH', source: 'NANP - Houston Central' },
      '305': { name: 'Miami / South Florida, FL', lat: 25.7617, lng: -80.1918, radiusMeters: 30000, confidence: 'HIGH', source: 'NANP - Miami-Dade & Florida Keys' },
      '404': { name: 'Atlanta Metro, GA', lat: 33.7490, lng: -84.3880, radiusMeters: 32000, confidence: 'HIGH', source: 'NANP - Fulton / Atlanta' },
      '617': { name: 'Boston Metro, MA', lat: 42.3601, lng: -71.0589, radiusMeters: 22000, confidence: 'HIGH', source: 'NANP - Greater Boston' },
      '202': { name: 'Washington, D.C.', lat: 38.9072, lng: -77.0369, radiusMeters: 16000, confidence: 'HIGH', source: 'NANP - District of Columbia' },
      '416': { name: 'Toronto, Ontario, Canada', lat: 43.6532, lng: -79.3832, radiusMeters: 28000, confidence: 'HIGH', source: 'NANP / CRTC - Greater Toronto Area' },
      '604': { name: 'Vancouver, British Columbia, Canada', lat: 49.2827, lng: -123.1207, radiusMeters: 30000, confidence: 'HIGH', source: 'NANP / CRTC - Lower Mainland BC' },
      '514': { name: 'Montreal, Quebec, Canada', lat: 45.5017, lng: -73.5673, radiusMeters: 26000, confidence: 'HIGH', source: 'NANP / CRTC - Island of Montreal' },
    },
    carrierPrefixes: {
      '800': 'Toll-Free Nationwide',
      '888': 'Toll-Free Nationwide',
      '877': 'Toll-Free Nationwide',
    }
  },
  '+44': {
    name: 'United Kingdom',
    iso: 'GB',
    code: '+44',
    sampleLength: [10, 11],
    defaultType: 'Geographic',
    countryCenter: { lat: 55.3781, lng: -3.4360 },
    countryRadiusMeters: 450000,
    areaCodes: {
      '20': 'London Metro Area',
      '161': 'Manchester Metro',
      '121': 'Birmingham Metro',
      '113': 'Leeds Metro',
      '141': 'Glasgow Metro, Scotland',
      '131': 'Edinburgh Metro, Scotland',
      '151': 'Liverpool Metro',
      '117': 'Bristol Metro',
      '29': 'Cardiff Metro, Wales',
      '28': 'Belfast Metro, Northern Ireland',
    },
    areaCodeGeo: {
      '20': { name: 'London Metro Area', lat: 51.5074, lng: -0.1278, radiusMeters: 28000, confidence: 'HIGH', source: 'Ofcom UK National Numbering Scheme' },
      '161': { name: 'Manchester Metro', lat: 53.4808, lng: -2.2426, radiusMeters: 18000, confidence: 'HIGH', source: 'Ofcom UK National Numbering Scheme' },
      '121': { name: 'Birmingham Metro', lat: 52.4862, lng: -1.8904, radiusMeters: 20000, confidence: 'HIGH', source: 'Ofcom UK National Numbering Scheme' },
      '113': { name: 'Leeds Metro', lat: 53.8008, lng: -1.5491, radiusMeters: 16000, confidence: 'HIGH', source: 'Ofcom UK National Numbering Scheme' },
      '141': { name: 'Glasgow Metro, Scotland', lat: 55.8642, lng: -4.2518, radiusMeters: 20000, confidence: 'HIGH', source: 'Ofcom UK National Numbering Scheme' },
      '131': { name: 'Edinburgh Metro, Scotland', lat: 55.9533, lng: -3.1883, radiusMeters: 18000, confidence: 'HIGH', source: 'Ofcom UK National Numbering Scheme' },
      '151': { name: 'Liverpool Metro', lat: 53.4084, lng: -2.9916, radiusMeters: 16000, confidence: 'HIGH', source: 'Ofcom UK National Numbering Scheme' },
      '117': { name: 'Bristol Metro', lat: 51.4545, lng: -2.5879, radiusMeters: 16000, confidence: 'HIGH', source: 'Ofcom UK National Numbering Scheme' },
      '29': { name: 'Cardiff Metro, Wales', lat: 51.4816, lng: -3.1791, radiusMeters: 18000, confidence: 'HIGH', source: 'Ofcom UK National Numbering Scheme' },
      '28': { name: 'Belfast Metro, Northern Ireland', lat: 54.5973, lng: -5.9301, radiusMeters: 22000, confidence: 'HIGH', source: 'Ofcom UK National Numbering Scheme' },
    },
    carrierPrefixes: {
      '7': 'UK Mobile Network (EE / Vodafone / O2 / Three)',
      '800': 'UK Freephone',
    }
  },
  '+91': {
    name: 'India',
    iso: 'IN',
    code: '+91',
    sampleLength: [10],
    defaultType: 'Mobile',
    countryCenter: { lat: 20.5937, lng: 78.9629 },
    countryRadiusMeters: 950000,
    areaCodes: {
      '11': 'Delhi NCR Telecom Circle',
      '22': 'Mumbai Metro Circle',
      '80': 'Bengaluru Metro Circle, Karnataka',
      '44': 'Chennai Metro Circle, Tamil Nadu',
      '33': 'Kolkata Metro Circle, West Bengal',
      '40': 'Hyderabad Metro Circle, Telangana',
      '20': 'Pune Metro Circle, Maharashtra',
      '79': 'Ahmedabad Metro Circle, Gujarat',
    },
    areaCodeGeo: {
      '11': { name: 'Delhi NCR Telecom Circle', lat: 28.6139, lng: 77.2090, radiusMeters: 35000, confidence: 'HIGH', source: 'TRAI / DoT National Numbering Plan' },
      '22': { name: 'Mumbai Metro Circle', lat: 19.0760, lng: 72.8777, radiusMeters: 28000, confidence: 'HIGH', source: 'TRAI / DoT National Numbering Plan' },
      '80': { name: 'Bengaluru Metro Circle, Karnataka', lat: 12.9716, lng: 77.5946, radiusMeters: 25000, confidence: 'HIGH', source: 'TRAI / DoT National Numbering Plan' },
      '44': { name: 'Chennai Metro Circle, Tamil Nadu', lat: 13.0827, lng: 80.2707, radiusMeters: 24000, confidence: 'HIGH', source: 'TRAI / DoT National Numbering Plan' },
      '33': { name: 'Kolkata Metro Circle, West Bengal', lat: 22.5726, lng: 88.3639, radiusMeters: 26000, confidence: 'HIGH', source: 'TRAI / DoT National Numbering Plan' },
      '40': { name: 'Hyderabad Metro Circle, Telangana', lat: 17.3850, lng: 78.4867, radiusMeters: 28000, confidence: 'HIGH', source: 'TRAI / DoT National Numbering Plan' },
      '20': { name: 'Pune Metro Circle, Maharashtra', lat: 18.5204, lng: 73.8567, radiusMeters: 22000, confidence: 'HIGH', source: 'TRAI / DoT National Numbering Plan' },
      '79': { name: 'Ahmedabad Metro Circle, Gujarat', lat: 23.0225, lng: 72.5714, radiusMeters: 25000, confidence: 'HIGH', source: 'TRAI / DoT National Numbering Plan' },
    },
    carrierPrefixes: {
      '98': 'Major Indian Wireless (Airtel / Jio / Vi)',
      '99': 'Major Indian Wireless (Airtel / Jio / Vi)',
      '97': 'Major Indian Wireless (Jio / Airtel / Vi)',
      '96': 'Major Indian Wireless (Vi / Jio / Airtel)',
      '94': 'BSNL Mobile / National Public Network',
      '70': 'Jio / Digital 4G/5G Network',
      '62': 'Jio / Digital Telecom Series',
      '63': 'Airtel / High-Speed Cellular Series',
    }
  },
  '+61': {
    name: 'Australia',
    iso: 'AU',
    code: '+61',
    sampleLength: [9, 10],
    defaultType: 'Geographic',
    countryCenter: { lat: -25.2744, lng: 133.7751 },
    countryRadiusMeters: 1600000,
    areaCodes: {
      '2': 'Sydney / New South Wales & ACT',
      '3': 'Melbourne / Victoria & Tasmania',
      '7': 'Brisbane / Queensland',
      '8': 'Perth / Western & South Australia',
    },
    areaCodeGeo: {
      '2': { name: 'Sydney / New South Wales & ACT', lat: -33.8688, lng: 151.2093, radiusMeters: 45000, confidence: 'HIGH', source: 'ACMA Australian Numbering Plan' },
      '3': { name: 'Melbourne / Victoria & Tasmania', lat: -37.8136, lng: 144.9631, radiusMeters: 40000, confidence: 'HIGH', source: 'ACMA Australian Numbering Plan' },
      '7': { name: 'Brisbane / Queensland', lat: -27.4698, lng: 153.0251, radiusMeters: 38000, confidence: 'HIGH', source: 'ACMA Australian Numbering Plan' },
      '8': { name: 'Perth / Western & South Australia', lat: -31.9505, lng: 115.8605, radiusMeters: 42000, confidence: 'HIGH', source: 'ACMA Australian Numbering Plan' },
    },
    carrierPrefixes: {
      '4': 'Australian Cellular Mobile (Telstra / Optus / Vodafone)',
    }
  },
  '+49': {
    name: 'Germany',
    iso: 'DE',
    code: '+49',
    sampleLength: [10, 11],
    defaultType: 'Geographic',
    countryCenter: { lat: 51.1657, lng: 10.4515 },
    countryRadiusMeters: 380000,
    areaCodes: {
      '30': 'Berlin Capital Region',
      '89': 'Munich / Bavaria',
      '69': 'Frankfurt am Main / Hesse',
      '40': 'Hamburg Hanseatic City',
      '221': 'Cologne / North Rhine-Westphalia',
      '711': 'Stuttgart / Baden-Württemberg',
    },
    areaCodeGeo: {
      '30': { name: 'Berlin Capital Region', lat: 52.5200, lng: 13.4050, radiusMeters: 25000, confidence: 'HIGH', source: 'Bundesnetzagentur (BNetzA) Numbering Plan' },
      '89': { name: 'Munich / Bavaria', lat: 48.1351, lng: 11.5820, radiusMeters: 26000, confidence: 'HIGH', source: 'BNetzA Numbering Plan' },
      '69': { name: 'Frankfurt am Main / Hesse', lat: 50.1109, lng: 8.6821, radiusMeters: 22000, confidence: 'HIGH', source: 'BNetzA Numbering Plan' },
      '40': { name: 'Hamburg Hanseatic City', lat: 53.5511, lng: 9.9937, radiusMeters: 24000, confidence: 'HIGH', source: 'BNetzA Numbering Plan' },
      '221': { name: 'Cologne / North Rhine-Westphalia', lat: 50.9375, lng: 6.9603, radiusMeters: 20000, confidence: 'HIGH', source: 'BNetzA Numbering Plan' },
      '711': { name: 'Stuttgart / Baden-Württemberg', lat: 48.7758, lng: 9.1829, radiusMeters: 20000, confidence: 'HIGH', source: 'BNetzA Numbering Plan' },
    },
    carrierPrefixes: {
      '15': 'German Mobile Network (Telekom / Vodafone / O2)',
      '16': 'German Mobile Network (Telekom / Vodafone / O2)',
      '17': 'German Mobile Network (Telekom / Vodafone / O2)',
    }
  },
  '+33': {
    name: 'France',
    iso: 'FR',
    code: '+33',
    sampleLength: [9, 10],
    defaultType: 'Geographic',
    countryCenter: { lat: 46.2276, lng: 2.2137 },
    countryRadiusMeters: 450000,
    areaCodes: {
      '1': 'Île-de-France & Paris Metro',
      '2': 'North-West France',
      '3': 'North-East France',
      '4': 'South-East France & Corsica',
      '5': 'South-West France',
    },
    areaCodeGeo: {
      '1': { name: 'Île-de-France & Paris Metro', lat: 48.8566, lng: 2.3522, radiusMeters: 30000, confidence: 'HIGH', source: 'ARCEP French National Numbering Plan' },
      '2': { name: 'North-West France (Nantes / Rennes)', lat: 47.2184, lng: -1.5536, radiusMeters: 120000, confidence: 'MEDIUM', source: 'ARCEP ZPA (Zone de Numérotation)' },
      '3': { name: 'North-East France (Strasbourg / Lille)', lat: 48.5734, lng: 7.7521, radiusMeters: 120000, confidence: 'MEDIUM', source: 'ARCEP ZPA' },
      '4': { name: 'South-East France (Marseille / Lyon / Nice)', lat: 43.2965, lng: 5.3698, radiusMeters: 130000, confidence: 'MEDIUM', source: 'ARCEP ZPA' },
      '5': { name: 'South-West France (Bordeaux / Toulouse)', lat: 44.8378, lng: -0.5792, radiusMeters: 120000, confidence: 'MEDIUM', source: 'ARCEP ZPA' },
    },
    carrierPrefixes: {
      '6': 'French Mobile Network (Orange / SFR / Bouygues / Free)',
      '7': 'French Mobile Network (Orange / SFR / Bouygues / Free)',
    }
  },
  '+81': {
    name: 'Japan',
    iso: 'JP',
    code: '+81',
    sampleLength: [10],
    defaultType: 'Geographic',
    countryCenter: { lat: 36.2048, lng: 138.2529 },
    countryRadiusMeters: 550000,
    areaCodes: {
      '3': 'Tokyo Metropolitan Area',
      '6': 'Osaka / Kansai Region',
      '52': 'Nagoya / Aichi',
      '11': 'Sapporo / Hokkaido',
      '92': 'Fukuoka / Kyushu',
    },
    areaCodeGeo: {
      '3': { name: 'Tokyo Metropolitan Area', lat: 35.6762, lng: 139.6503, radiusMeters: 30000, confidence: 'HIGH', source: 'MIC Japan Telecommunications Numbering Plan' },
      '6': { name: 'Osaka / Kansai Region', lat: 34.6937, lng: 135.5023, radiusMeters: 26000, confidence: 'HIGH', source: 'MIC Japan Telecommunications Numbering Plan' },
      '52': { name: 'Nagoya / Aichi', lat: 35.1815, lng: 136.9066, radiusMeters: 24000, confidence: 'HIGH', source: 'MIC Japan Telecommunications Numbering Plan' },
      '11': { name: 'Sapporo / Hokkaido', lat: 43.0618, lng: 141.3545, radiusMeters: 28000, confidence: 'HIGH', source: 'MIC Japan Telecommunications Numbering Plan' },
      '92': { name: 'Fukuoka / Kyushu', lat: 33.5904, lng: 130.4017, radiusMeters: 24000, confidence: 'HIGH', source: 'MIC Japan Telecommunications Numbering Plan' },
    },
    carrierPrefixes: {
      '90': 'Japanese Mobile Network (NTT Docomo / au / SoftBank / Rakuten)',
      '80': 'Japanese Mobile Network (NTT Docomo / au / SoftBank / Rakuten)',
      '70': 'Japanese Mobile Network (NTT Docomo / au / SoftBank / Rakuten)',
    }
  },
  '+971': {
    name: 'United Arab Emirates',
    iso: 'AE',
    code: '+971',
    sampleLength: [9],
    defaultType: 'Geographic',
    countryCenter: { lat: 23.4241, lng: 53.8478 },
    countryRadiusMeters: 180000,
    areaCodes: {
      '4': 'Dubai Emirate',
      '2': 'Abu Dhabi Capital Emirate',
      '6': 'Sharjah, Ajman, Umm Al Quwain',
      '7': 'Ras Al Khaimah',
      '9': 'Fujairah',
    },
    areaCodeGeo: {
      '4': { name: 'Dubai Emirate', lat: 25.2048, lng: 55.2708, radiusMeters: 30000, confidence: 'HIGH', source: 'TDRA UAE National Numbering Plan' },
      '2': { name: 'Abu Dhabi Capital Emirate', lat: 24.4539, lng: 54.3773, radiusMeters: 35000, confidence: 'HIGH', source: 'TDRA UAE National Numbering Plan' },
      '6': { name: 'Sharjah, Ajman, Umm Al Quwain', lat: 25.3463, lng: 55.4209, radiusMeters: 25000, confidence: 'HIGH', source: 'TDRA UAE National Numbering Plan' },
      '7': { name: 'Ras Al Khaimah', lat: 25.7895, lng: 55.9432, radiusMeters: 25000, confidence: 'HIGH', source: 'TDRA UAE National Numbering Plan' },
      '9': { name: 'Fujairah', lat: 25.1288, lng: 56.3265, radiusMeters: 22000, confidence: 'HIGH', source: 'TDRA UAE National Numbering Plan' },
    },
    carrierPrefixes: {
      '50': 'e& (Etisalat) Mobile Network',
      '54': 'e& (Etisalat) Mobile Network',
      '55': 'du Telecom Mobile Network',
      '56': 'e& (Etisalat) Mobile Network',
    }
  },
  '+55': {
    name: 'Brazil',
    iso: 'BR',
    code: '+55',
    sampleLength: [10, 11],
    defaultType: 'Geographic',
    countryCenter: { lat: -14.2350, lng: -51.9253 },
    countryRadiusMeters: 1800000,
    areaCodes: {
      '11': 'São Paulo Capital & Metro',
      '21': 'Rio de Janeiro Capital & Metro',
      '31': 'Belo Horizonte / Minas Gerais',
      '61': 'Brasília Federal District',
      '71': 'Salvador / Bahia',
    },
    areaCodeGeo: {
      '11': { name: 'São Paulo Capital & Metro', lat: -23.5505, lng: -46.6333, radiusMeters: 35000, confidence: 'HIGH', source: 'Anatel Brazilian Telecom Plan' },
      '21': { name: 'Rio de Janeiro Capital & Metro', lat: -22.9068, lng: -43.1729, radiusMeters: 30000, confidence: 'HIGH', source: 'Anatel Brazilian Telecom Plan' },
      '31': { name: 'Belo Horizonte / Minas Gerais', lat: -19.9167, lng: -43.9345, radiusMeters: 28000, confidence: 'HIGH', source: 'Anatel Brazilian Telecom Plan' },
      '61': { name: 'Brasília Federal District', lat: -15.7975, lng: -47.8919, radiusMeters: 30000, confidence: 'HIGH', source: 'Anatel Brazilian Telecom Plan' },
      '71': { name: 'Salvador / Bahia', lat: -12.9777, lng: -38.5016, radiusMeters: 25000, confidence: 'HIGH', source: 'Anatel Brazilian Telecom Plan' },
    },
    carrierPrefixes: {
      '9': 'Brazilian Mobile Carrier (Vivo / Claro / TIM)',
    }
  },
  '+34': {
    name: 'Spain',
    iso: 'ES',
    code: '+34',
    sampleLength: [9],
    defaultType: 'Geographic',
    countryCenter: { lat: 40.4637, lng: -3.7492 },
    countryRadiusMeters: 380000,
    areaCodes: {
      '91': 'Madrid Community Area',
      '93': 'Barcelona / Catalonia',
      '96': 'Valencia Community',
      '95': 'Seville / Andalusia',
    },
    areaCodeGeo: {
      '91': { name: 'Madrid Community Area', lat: 40.4168, lng: -3.7038, radiusMeters: 30000, confidence: 'HIGH', source: 'CNMC Spanish National Numbering Plan' },
      '93': { name: 'Barcelona / Catalonia', lat: 41.3851, lng: 2.1734, radiusMeters: 26000, confidence: 'HIGH', source: 'CNMC Spanish National Numbering Plan' },
      '96': { name: 'Valencia Community', lat: 39.4699, lng: -0.3763, radiusMeters: 25000, confidence: 'HIGH', source: 'CNMC Spanish National Numbering Plan' },
      '95': { name: 'Seville / Andalusia', lat: 37.3891, lng: -5.9845, radiusMeters: 32000, confidence: 'HIGH', source: 'CNMC Spanish National Numbering Plan' },
    },
    carrierPrefixes: {
      '6': 'Spanish Mobile Network (Movistar / Vodafone / Orange)',
      '7': 'Spanish Mobile Network (Movistar / Vodafone / Orange)',
    }
  },
  '+39': {
    name: 'Italy',
    iso: 'IT',
    code: '+39',
    sampleLength: [10],
    defaultType: 'Geographic',
    countryCenter: { lat: 41.8719, lng: 12.5674 },
    countryRadiusMeters: 420000,
    areaCodes: {
      '06': 'Rome Capital Metropolitan Area',
      '02': 'Milan / Lombardy',
      '081': 'Naples / Campania',
      '011': 'Turin / Piedmont',
      '055': 'Florence / Tuscany',
    },
    areaCodeGeo: {
      '06': { name: 'Rome Capital Metropolitan Area', lat: 41.9028, lng: 12.4964, radiusMeters: 28000, confidence: 'HIGH', source: 'AGCOM Italian Numbering Plan' },
      '02': { name: 'Milan / Lombardy', lat: 45.4642, lng: 9.1900, radiusMeters: 25000, confidence: 'HIGH', source: 'AGCOM Italian Numbering Plan' },
      '081': { name: 'Naples / Campania', lat: 40.8518, lng: 14.2681, radiusMeters: 22000, confidence: 'HIGH', source: 'AGCOM Italian Numbering Plan' },
      '011': { name: 'Turin / Piedmont', lat: 45.0703, lng: 7.6869, radiusMeters: 22000, confidence: 'HIGH', source: 'AGCOM Italian Numbering Plan' },
      '055': { name: 'Florence / Tuscany', lat: 43.7696, lng: 11.2558, radiusMeters: 20000, confidence: 'HIGH', source: 'AGCOM Italian Numbering Plan' },
    },
    carrierPrefixes: {
      '3': 'Italian Mobile Network (TIM / Vodafone / WindTre / Iliad)',
    }
  },
  '+86': {
    name: 'China',
    iso: 'CN',
    code: '+86',
    sampleLength: [11],
    defaultType: 'Geographic',
    countryCenter: { lat: 35.8617, lng: 104.1954 },
    countryRadiusMeters: 2200000,
    areaCodes: {
      '10': 'Beijing Capital',
      '21': 'Shanghai Municipality',
      '20': 'Guangzhou, Guangdong',
      '755': 'Shenzhen, Guangdong',
    },
    areaCodeGeo: {
      '10': { name: 'Beijing Capital', lat: 39.9042, lng: 116.4074, radiusMeters: 40000, confidence: 'HIGH', source: 'MIIT China National Numbering Plan' },
      '21': { name: 'Shanghai Municipality', lat: 31.2304, lng: 121.4737, radiusMeters: 35000, confidence: 'HIGH', source: 'MIIT China National Numbering Plan' },
      '20': { name: 'Guangzhou, Guangdong', lat: 23.1291, lng: 113.2644, radiusMeters: 32000, confidence: 'HIGH', source: 'MIIT China National Numbering Plan' },
      '755': { name: 'Shenzhen, Guangdong', lat: 22.5431, lng: 114.0579, radiusMeters: 30000, confidence: 'HIGH', source: 'MIIT China National Numbering Plan' },
    },
    carrierPrefixes: {
      '13': 'China Mobile / China Unicom',
      '15': 'China Mobile / China Telecom',
      '18': 'China Mobile / China Telecom',
    }
  }
};

/**
 * Validates and looks up phone numbering metadata with AI Geographic Region Circle estimation
 */
export function lookupPhoneNumberMetadata(countryCode: string, nationalNumber: string) {
  const cleanCode = countryCode.trim().startsWith('+') ? countryCode.trim() : `+${countryCode.trim()}`;
  const cleanNumber = nationalNumber.replace(/\D/g, '');

  if (!cleanNumber) {
    return {
      valid: false,
      error: 'Please enter a valid phone number containing digits.',
      geographicEstimate: null,
    };
  }

  const countryInfo = CALLING_CODES[cleanCode];
  const e164 = `${cleanCode}${cleanNumber}`;

  if (!countryInfo) {
    const isReasonableLength = cleanNumber.length >= 6 && cleanNumber.length <= 15;
    return {
      valid: isReasonableLength,
      callingCode: cleanCode,
      country: 'International Territory',
      iso: 'INTL',
      e164Format: e164,
      nationalFormat: cleanNumber,
      regionOrCity: 'Designated International Numbering Zone',
      numberType: 'Standard Telecom Number',
      carrierOrNetwork: 'International Telecom Routing',
      isPhysicalLocation: false,
      disclaimer: 'This is telecom numbering plan information, NOT real-time physical GPS location. Live location requires recipient consent.',
      geographicEstimate: {
        hasGeographicRegion: false,
        precision: 'NONE',
        regionName: 'Unverified International Territory',
        country: 'International',
        center: { lat: 0, lng: 0 },
        estimatedRadiusMeters: 0,
        minRadiusMeters: 0,
        maxRadiusMeters: 0,
        dataSource: 'ITU-T Unallocated Dialing Prefix',
        confidence: 'NONE',
        limitations: 'Dialing prefix is not mapped to a specific geographic territory in the standard numbering registry.',
        isPhysicalLocation: false,
      } as GeographicRegionEstimate,
    };
  }

  // Check expected length
  const validLength = countryInfo.sampleLength.some(len => cleanNumber.length === len || cleanNumber.length === len + 1 || cleanNumber.length === len - 1);

  if (!validLength) {
    return {
      valid: false,
      callingCode: cleanCode,
      country: countryInfo.name,
      iso: countryInfo.iso,
      e164Format: e164,
      nationalFormat: cleanNumber,
      regionOrCity: `${countryInfo.name} National Numbering Plan`,
      numberType: 'Invalid Number Length',
      carrierOrNetwork: 'Unknown',
      isPhysicalLocation: false,
      error: `Invalid number length for ${countryInfo.name}. Expected ${countryInfo.sampleLength.join(' or ')} digits, but received ${cleanNumber.length}.`,
      geographicEstimate: null,
    };
  }

  // Region / Area Code match
  let detectedRegion = `${countryInfo.name} National Dialing Plan`;
  let detectedType = countryInfo.defaultType || 'Standard Telecom Number';
  let detectedCarrier: string | null = null;
  let matchedGeo: AreaCodeGeo | null = null;

  // Check area codes (matching prefixes from longest to shortest)
  if (countryInfo.areaCodes) {
    const prefixes = Object.keys(countryInfo.areaCodes).sort((a, b) => b.length - a.length);
    for (const prefix of prefixes) {
      if (cleanNumber.startsWith(prefix)) {
        detectedRegion = countryInfo.areaCodes[prefix];
        detectedType = 'Fixed Line / Regional Geographic';
        if (countryInfo.areaCodeGeo && countryInfo.areaCodeGeo[prefix]) {
          matchedGeo = countryInfo.areaCodeGeo[prefix];
        }
        break;
      }
    }
  }

  // Check carrier prefixes
  if (countryInfo.carrierPrefixes) {
    const prefixes = Object.keys(countryInfo.carrierPrefixes).sort((a, b) => b.length - a.length);
    for (const prefix of prefixes) {
      if (cleanNumber.startsWith(prefix)) {
        detectedCarrier = countryInfo.carrierPrefixes[prefix];
        if (detectedCarrier.toLowerCase().includes('mobile') || detectedCarrier.toLowerCase().includes('cellular')) {
          detectedType = 'Mobile Cellular Number';
        }
        break;
      }
    }
  }

  // Determine Geographic Region Estimate Circle
  let geographicEstimate: GeographicRegionEstimate;

  if (matchedGeo) {
    geographicEstimate = {
      hasGeographicRegion: true,
      precision: 'METRO_AREA',
      regionName: matchedGeo.name,
      country: countryInfo.name,
      center: { lat: matchedGeo.lat, lng: matchedGeo.lng },
      estimatedRadiusMeters: matchedGeo.radiusMeters,
      minRadiusMeters: 5000,
      maxRadiusMeters: 150000,
      dataSource: matchedGeo.source || 'ITU-T E.164 National Numbering Exchange Registry',
      confidence: matchedGeo.confidence || 'HIGH',
      limitations: 'Estimated from telecommunication wire center / exchange allocation. Does not identify a person\'s live physical location, GPS coordinates, or residential address.',
      isPhysicalLocation: false,
    };
  } else {
    // Country-level fallback (for mobile numbers or nationwide non-geographic allocations)
    geographicEstimate = {
      hasGeographicRegion: true,
      precision: 'COUNTRY_LEVEL',
      regionName: `${countryInfo.name} National Territory`,
      country: countryInfo.name,
      center: countryInfo.countryCenter,
      estimatedRadiusMeters: countryInfo.countryRadiusMeters,
      minRadiusMeters: 50000,
      maxRadiusMeters: countryInfo.countryRadiusMeters * 1.5,
      dataSource: 'ITU-T E.164 International Country Code Allocation',
      confidence: 'COUNTRY_LEVEL',
      limitations: 'Mobile cellular or nationwide non-geographic allocation. In accordance with telecommunications standards, mobile numbers are nationwide and not geographically anchored to an individual city exchange.',
      isPhysicalLocation: false,
    };
  }

  // Format nicely
  let formattedNational = cleanNumber;
  if (cleanCode === '+1' && cleanNumber.length === 10) {
    formattedNational = `(${cleanNumber.slice(0, 3)}) ${cleanNumber.slice(3, 6)}-${cleanNumber.slice(6)}`;
  } else if (cleanCode === '+91' && cleanNumber.length === 10) {
    formattedNational = `${cleanNumber.slice(0, 5)} ${cleanNumber.slice(5)}`;
  } else if (cleanCode === '+44' && cleanNumber.length >= 10) {
    formattedNational = `${cleanNumber.slice(0, 4)} ${cleanNumber.slice(4)}`;
  }

  return {
    valid: validLength,
    callingCode: cleanCode,
    country: countryInfo.name,
    iso: countryInfo.iso,
    e164Format: e164,
    nationalFormat: formattedNational,
    regionOrCity: detectedRegion,
    numberType: detectedType,
    carrierOrNetwork: detectedCarrier || 'Standard Certified Telecom Allocation',
    isPhysicalLocation: false,
    disclaimer: 'This metadata is derived strictly from telecommunication numbering plans and area code allocations. It represents telecom routing, NOT the person or device\'s current live GPS coordinates.',
    geographicEstimate,
  };
}

/**
 * Dispatch an SMS using Twilio if configured
 */
async function sendSmsNotification(toPhone: string, messageBody: string): Promise<{ success: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

  if (!accountSid || !authToken || (!fromPhone && !messagingServiceSid)) {
    return {
      success: false,
      error: 'Twilio SMS service is not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER missing in environment). Invitation URL generated for direct sharing.',
    };
  }

  // Do not attempt if credentials look like dummy placeholders
  if (accountSid.startsWith('ACxxx') || authToken.includes('your_twilio')) {
    return {
      success: false,
      error: 'Twilio credentials contain default placeholders. Please configure active Twilio API keys for automatic SMS delivery.',
    };
  }

  try {
    const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const params = new URLSearchParams();
    params.append('To', toPhone);
    params.append('Body', messageBody);

    if (messagingServiceSid) {
      params.append('MessagingServiceSid', messagingServiceSid);
    } else if (fromPhone) {
      params.append('From', fromPhone);
    }

    const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data: any = await res.json();
    if (!res.ok) {
      return { success: false, error: data.message || `Twilio error: ${res.statusText}` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network failure dispatching SMS' };
  }
}

export const locationShareRouter = Router();

/**
 * 1. Phone number numbering lookup endpoint
 */
locationShareRouter.post('/lookup-number', (req: Request, res: Response) => {
  const { countryCode, nationalNumber } = req.body;
  if (!countryCode || !nationalNumber) {
    return res.status(400).json({ error: 'countryCode and nationalNumber are required.' });
  }

  const result = lookupPhoneNumberMetadata(countryCode, nationalNumber);
  return res.json(result);
});

/**
 * 2. Create secure location-sharing invitation
 */
locationShareRouter.post('/create-invite', async (req: Request, res: Response) => {
  try {
    const { 
      countryCode, 
      nationalNumber, 
      requesterName = 'SUPERAI Maps Explorer', 
      requesterId = 'guest_user',
      purpose = 'Personal Coordination', 
      durationMinutes = 60 
    } = req.body;

    const lookup = lookupPhoneNumberMetadata(countryCode, nationalNumber);
    if (!lookup.valid || !lookup.e164Format) {
      return res.status(400).json({ error: (lookup as any).error || 'Invalid phone number structure. Please verify the digits.' });
    }

    const token = crypto.randomBytes(16).toString('hex');
    const now = Date.now();
    const duration = Math.min(Math.max(Number(durationMinutes) || 60, 5), 1440); // 5 min to 24 hrs
    const expiresAt = now + duration * 60 * 1000;

    // Build the secure invitation link
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const shareUrl = `${baseUrl}/?loc_invite=${token}`;

    // Prepare SMS text
    const smsText = `SUPERAI Maps: ${requesterName} has requested your real-time GPS location for "${purpose}" (valid for ${duration}m). Review & consent securely: ${shareUrl}`;

    // Attempt SMS
    const smsResult = await sendSmsNotification(lookup.e164Format, smsText);

    const session: LocationShareSession = {
      token,
      requesterId,
      requesterName,
      recipientPhone: lookup.e164Format,
      purpose,
      durationMinutes: duration,
      status: smsResult.success ? 'SENT' : 'AWAITING_APPROVAL',
      createdAt: now,
      expiresAt,
      smsSent: smsResult.success,
      smsError: smsResult.error,
      shareUrl,
    };

    activeSessions.set(token, session);

    return res.json({
      success: true,
      token,
      shareUrl,
      recipientPhone: lookup.e164Format,
      smsSent: smsResult.success,
      smsMessage: smsResult.success 
        ? 'SMS invitation dispatched successfully through carrier network.' 
        : (smsResult.error || 'SMS not automatically sent. Share the secure invitation link manually.'),
      session,
    });
  } catch (err: any) {
    console.error('Error creating location share invite:', err);
    return res.status(500).json({ error: err.message || 'Failed to create location invitation.' });
  }
});

/**
 * 3. Get session details for recipient consent page
 */
locationShareRouter.get('/session/:token', (req: Request, res: Response) => {
  const { token } = req.params;
  const session = activeSessions.get(token);

  if (!session) {
    return res.status(404).json({ error: 'Location sharing invitation not found or has expired.' });
  }

  if (Date.now() > session.expiresAt) {
    session.status = 'EXPIRED';
  }

  // Never return coordinates to unapproved users
  const isApproved = session.status === 'SHARING_ACTIVE';

  return res.json({
    token: session.token,
    requesterName: session.requesterName,
    recipientPhone: session.recipientPhone,
    purpose: session.purpose,
    durationMinutes: session.durationMinutes,
    status: session.status,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    remainingSeconds: Math.max(0, Math.round((session.expiresAt - Date.now()) / 1000)),
    lastCoordinates: isApproved ? session.lastCoordinates : undefined,
  });
});

/**
 * 4. Recipient responds: APPROVE or DECLINE
 */
locationShareRouter.post('/respond', (req: Request, res: Response) => {
  const { token, decision } = req.body;
  const session = activeSessions.get(token);

  if (!session) {
    return res.status(404).json({ error: 'Session not found or expired.' });
  }

  if (Date.now() > session.expiresAt) {
    session.status = 'EXPIRED';
    return res.status(400).json({ error: 'Invitation has expired.' });
  }

  if (decision === 'APPROVE') {
    session.status = 'SHARING_ACTIVE';
    return res.json({ success: true, status: 'SHARING_ACTIVE' });
  } else if (decision === 'DECLINE') {
    session.status = 'DECLINED';
    return res.json({ success: true, status: 'DECLINED' });
  } else if (decision === 'PERMISSION_DENIED') {
    session.status = 'PERMISSION_DENIED';
    return res.json({ success: true, status: 'PERMISSION_DENIED' });
  }

  return res.status(400).json({ error: 'Invalid decision payload.' });
});

/**
 * 5. Recipient pushes live GPS coordinates
 */
locationShareRouter.post('/update-location', (req: Request, res: Response) => {
  const { token, lat, lng, accuracy, heading, speed } = req.body;
  const session = activeSessions.get(token);

  if (!session) {
    return res.status(404).json({ error: 'Session not found.' });
  }

  if (session.status !== 'SHARING_ACTIVE') {
    return res.status(403).json({ error: 'Sharing session is not active or has been revoked.' });
  }

  if (Date.now() > session.expiresAt) {
    session.status = 'EXPIRED';
    return res.status(403).json({ error: 'Sharing session has expired.' });
  }

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'Valid numerical latitude and longitude required.' });
  }

  session.lastCoordinates = {
    lat,
    lng,
    accuracy: typeof accuracy === 'number' ? accuracy : undefined,
    heading: typeof heading === 'number' ? heading : null,
    speed: typeof speed === 'number' ? speed : null,
    timestamp: Date.now(),
  };

  return res.json({ success: true, updated: true, timestamp: session.lastCoordinates.timestamp });
});

/**
 * 6. Stop/Revoke sharing (Requester or Recipient)
 */
locationShareRouter.post('/stop', (req: Request, res: Response) => {
  const { token } = req.body;
  const session = activeSessions.get(token);

  if (!session) {
    return res.status(404).json({ error: 'Session not found.' });
  }

  session.status = 'SHARING_STOPPED';
  return res.json({ success: true, status: 'SHARING_STOPPED' });
});

/**
 * 7. List active sessions for requester
 */
locationShareRouter.get('/my-sessions', (req: Request, res: Response) => {
  const requesterId = (req.query.requesterId as string) || 'guest_user';
  const now = Date.now();

  const userSessions = Array.from(activeSessions.values())
    .filter(s => s.requesterId === requesterId)
    .map(s => {
      if (now > s.expiresAt && s.status !== 'SHARING_STOPPED') {
        s.status = 'EXPIRED';
      }
      return s;
    });

  return res.json({ sessions: userSessions });
});
