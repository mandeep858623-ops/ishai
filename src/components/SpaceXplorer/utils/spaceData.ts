import { PlanetData, ConstellationData, SatelliteData, DeepSpaceObject, SpaceMission, AstronomicalEvent } from '../types';

export const PLANETS_DATA: PlanetData[] = [
  {
    id: 'sun',
    name: 'The Sun',
    type: 'Star',
    tagline: 'The G-type main-sequence power of our solar system',
    description: 'The Sun is a yellow dwarf star at the center of our Solar System. Its gravity holds the solar system together, keeping everything from the biggest planets to the smallest debris in orbit.',
    color: '#ffaa00',
    texturePattern: 'radial-gradient(circle, #fff176 0%, #ffb300 40%, #ff6f00 80%, #d84315 100%)',
    radiusKm: 696340,
    radiusEarths: 109,
    massEarths: 333000,
    distanceFromSunAU: 0,
    distanceFromSunMillionKm: 0,
    orbitalPeriodDays: 0,
    rotationPeriodHours: 600, // ~25-35 Earth days
    meanTempC: 5500, // surface
    atmosphereComposition: ['73% Hydrogen', '25% Helium', '1% Oxygen', '0.3% Carbon'],
    moonsCount: 0,
    majorMoons: [],
    notableMissions: ['SOHO', 'Parker Solar Probe', 'Solar Orbiter', 'Aditya-L1'],
    keyFacts: [
      'Contains 99.86% of the mass in the entire solar system.',
      'Core temperature reaches approximately 15 million °C.',
      'Light takes about 8 minutes and 20 seconds to reach Earth.'
    ],
    scale3D: 3.5,
    orbitSpeedRatio: 0
  },
  {
    id: 'mercury',
    name: 'Mercury',
    type: 'Terrestrial',
    tagline: 'The smallest and fastest planet in the solar system',
    description: 'Mercury is the closest planet to the Sun and the smallest planet in the solar system. It is only slightly larger than Earth’s Moon and has a heavily cratered, metallic surface.',
    color: '#b0bec5',
    texturePattern: 'radial-gradient(circle, #cfd8dc 0%, #90a4ae 50%, #546e7a 100%)',
    radiusKm: 2439.7,
    radiusEarths: 0.383,
    massEarths: 0.055,
    distanceFromSunAU: 0.387,
    distanceFromSunMillionKm: 57.9,
    orbitalPeriodDays: 88,
    rotationPeriodHours: 1407.6, // 58.6 Earth days
    meanTempC: 167, // -180 to 430
    atmosphereComposition: ['42% Molecular Oxygen', '29% Sodium', '22% Hydrogen', '6% Helium'],
    moonsCount: 0,
    majorMoons: [],
    notableMissions: ['Mariner 10', 'MESSENGER', 'BepiColombo'],
    keyFacts: [
      'Extreme temperature swings from -180°C at night to 430°C in daylight.',
      'A year on Mercury is just 88 Earth days, but one solar day lasts 176 Earth days.',
      'Has the most eccentric orbit of all eight planets.'
    ],
    scale3D: 0.6,
    orbitSpeedRatio: 4.15
  },
  {
    id: 'venus',
    name: 'Venus',
    type: 'Terrestrial',
    tagline: 'Earth’s toxic twin with runaway greenhouse effect',
    description: 'Venus is the second planet from the Sun and Earth’s closest planetary neighbor. Its thick, toxic atmosphere traps heat in a runaway greenhouse effect, making it the hottest planet in the solar system.',
    color: '#ffcc80',
    texturePattern: 'radial-gradient(circle, #ffe0b2 0%, #ffb74d 50%, #e65100 100%)',
    radiusKm: 6051.8,
    radiusEarths: 0.949,
    massEarths: 0.815,
    distanceFromSunAU: 0.723,
    distanceFromSunMillionKm: 108.2,
    orbitalPeriodDays: 224.7,
    rotationPeriodHours: 5832.5, // Retrograde
    meanTempC: 464,
    atmosphereComposition: ['96.5% Carbon Dioxide', '3.5% Nitrogen', 'Traces of Sulfuric Acid'],
    moonsCount: 0,
    majorMoons: [],
    notableMissions: ['Venera 7', 'Magellan', 'Venus Express', 'Akatsuki'],
    keyFacts: [
      'Rotates backwards (retrograde rotation) compared to most planets.',
      'Surface pressure is 92 times greater than Earth’s—equivalent to 900m under water.',
      'Brightest natural object in the night sky after the Moon.'
    ],
    scale3D: 0.9,
    orbitSpeedRatio: 1.62
  },
  {
    id: 'earth',
    name: 'Earth',
    type: 'Terrestrial',
    tagline: 'Our vibrant home oasis, rich with liquid water and life',
    description: 'Earth is the third planet from the Sun and the only astronomical object known to harbor life. About 71% of Earth’s surface is covered by liquid ocean water.',
    color: '#42a5f5',
    texturePattern: 'radial-gradient(circle, #64b5f6 0%, #1e88e5 40%, #1565c0 70%, #0d47a1 100%)',
    radiusKm: 6371,
    radiusEarths: 1.0,
    massEarths: 1.0,
    distanceFromSunAU: 1.0,
    distanceFromSunMillionKm: 149.6,
    orbitalPeriodDays: 365.25,
    rotationPeriodHours: 23.93,
    meanTempC: 15,
    atmosphereComposition: ['78.1% Nitrogen', '20.9% Oxygen', '0.9% Argon', '0.04% Carbon Dioxide'],
    moonsCount: 1,
    majorMoons: ['The Moon (Luna)'],
    notableMissions: ['International Space Station', 'Hubble Space Telescope', 'Landsat', 'Sentinel'],
    keyFacts: [
      'Only planet with stable liquid water on its surface.',
      'Protected by a strong magnetosphere that deflects solar wind.',
      'Has one natural satellite, the Moon, which stabilizes Earth’s axial tilt.'
    ],
    scale3D: 1.0,
    orbitSpeedRatio: 1.0
  },
  {
    id: 'mars',
    name: 'Mars',
    type: 'Terrestrial',
    tagline: 'The Red Planet, ancient dry riverbeds, and future frontier',
    description: 'Mars is a dusty, cold, desert world with a very thin atmosphere. There is strong evidence that billions of years ago Mars was wetter and warmer with a thicker atmosphere.',
    color: '#ff7043',
    texturePattern: 'radial-gradient(circle, #ff8a65 0%, #f4511e 50%, #bf360c 100%)',
    radiusKm: 3389.5,
    radiusEarths: 0.532,
    massEarths: 0.107,
    distanceFromSunAU: 1.524,
    distanceFromSunMillionKm: 227.9,
    orbitalPeriodDays: 687,
    rotationPeriodHours: 24.62,
    meanTempC: -63,
    atmosphereComposition: ['95.3% Carbon Dioxide', '2.6% Nitrogen', '1.9% Argon', '0.16% Oxygen'],
    moonsCount: 2,
    majorMoons: ['Phobos', 'Deimos'],
    notableMissions: ['Viking 1 & 2', 'Curiosity', 'Perseverance', 'Ingenuity', 'Tianwen-1'],
    keyFacts: [
      'Home to Olympus Mons, the largest volcano in the solar system (21.9 km high).',
      'Valles Marineris canyon system stretches over 4,000 km along the Martian equator.',
      'Has polar ice caps composed of water ice and dry ice (frozen carbon dioxide).'
    ],
    scale3D: 0.7,
    orbitSpeedRatio: 0.53
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    type: 'Gas Giant',
    tagline: 'King of planets, swirling storms, and vast magnetic reach',
    description: 'Jupiter is more than twice as massive as all the other planets combined. Its iconic Great Red Spot is a giant storm larger than Earth that has raged for centuries.',
    color: '#d7ccc8',
    texturePattern: 'radial-gradient(circle, #efebe9 0%, #bcaaa4 40%, #8d6e63 80%, #4e342e 100%)',
    radiusKm: 69911,
    radiusEarths: 10.97,
    massEarths: 317.8,
    distanceFromSunAU: 5.204,
    distanceFromSunMillionKm: 778.5,
    orbitalPeriodDays: 4333, // 11.86 years
    rotationPeriodHours: 9.93,
    meanTempC: -110,
    atmosphereComposition: ['89.8% Hydrogen', '10.2% Helium', 'Traces of Methane & Ammonia'],
    moonsCount: 95,
    majorMoons: ['Io', 'Europa', 'Ganymede', 'Callisto'],
    notableMissions: ['Pioneer 10 & 11', 'Voyager 1 & 2', 'Galileo', 'Juno', 'JUICE'],
    keyFacts: [
      'Fastest rotation of any planet in the solar system (under 10 hours for one day).',
      'Ganymede, its moon, is the largest moon in the solar system and larger than Mercury.',
      'Acts as a cosmic vacuum cleaner, deflecting many comets away from inner planets.'
    ],
    scale3D: 2.2,
    orbitSpeedRatio: 0.084
  },
  {
    id: 'saturn',
    name: 'Saturn',
    type: 'Gas Giant',
    tagline: 'The jewel of the solar system adorned with spectacular rings',
    description: 'Saturn is famous for its complex system of ringlets made of trillions of pieces of ice, rock, and dust. It is the least dense planet in the solar system—it would float in water if there were a bathtub big enough.',
    color: '#ffe082',
    texturePattern: 'radial-gradient(circle, #fff59d 0%, #ffe082 40%, #ffb300 80%, #ff6f00 100%)',
    radiusKm: 58232,
    radiusEarths: 9.14,
    massEarths: 95.2,
    distanceFromSunAU: 9.582,
    distanceFromSunMillionKm: 1433.5,
    orbitalPeriodDays: 10759, // 29.45 years
    rotationPeriodHours: 10.7,
    meanTempC: -140,
    atmosphereComposition: ['96.3% Hydrogen', '3.25% Helium', '0.45% Methane'],
    moonsCount: 146,
    majorMoons: ['Titan', 'Enceladus', 'Mimas', 'Rhea', 'Iapetus'],
    notableMissions: ['Pioneer 11', 'Voyager 1 & 2', 'Cassini-Huygens'],
    keyFacts: [
      'Rings span up to 282,000 km across, yet are typically only about 10 meters thick.',
      'Titan, its largest moon, has a dense nitrogen atmosphere and liquid methane lakes.',
      'Features a unique hexagonal storm pattern around its north pole.'
    ],
    scale3D: 1.8,
    orbitSpeedRatio: 0.034
  },
  {
    id: 'uranus',
    name: 'Uranus',
    type: 'Ice Giant',
    tagline: 'The sideways ice giant with faint rings and dynamic atmosphere',
    description: 'Uranus is an ice giant with a blue-green color due to methane in its upper atmosphere. It rotates nearly completely on its side, with an axial tilt of 97.8 degrees.',
    color: '#80deea',
    texturePattern: 'radial-gradient(circle, #e0f7fa 0%, #80deea 50%, #00acc1 100%)',
    radiusKm: 25362,
    radiusEarths: 3.98,
    massEarths: 14.5,
    distanceFromSunAU: 19.2,
    distanceFromSunMillionKm: 2872.5,
    orbitalPeriodDays: 30687, // 84 years
    rotationPeriodHours: 17.2, // Retrograde
    meanTempC: -195,
    atmosphereComposition: ['82.5% Hydrogen', '15.2% Helium', '2.3% Methane'],
    moonsCount: 28,
    majorMoons: ['Miranda', 'Ariel', 'Umbriel', 'Titania', 'Oberon'],
    notableMissions: ['Voyager 2'],
    keyFacts: [
      'Axial tilt of 98° causes extreme 42-year seasons of darkness and sunlight at poles.',
      'Holds the record for the coldest planetary atmosphere temperature recorded (-224°C).',
      'First planet discovered using a telescope (by William Herschel in 1781).'
    ],
    scale3D: 1.3,
    orbitSpeedRatio: 0.012
  },
  {
    id: 'neptune',
    name: 'Neptune',
    type: 'Ice Giant',
    tagline: 'The windiest planet at the dark outer edge of our planetary neighborhood',
    description: 'Neptune is dark, cold, and whipped by supersonic winds. It is the first planet located through mathematical calculations before being observed via telescope.',
    color: '#5c6bc0',
    texturePattern: 'radial-gradient(circle, #7986cb 0%, #3f51b5 50%, #1a237e 100%)',
    radiusKm: 24622,
    radiusEarths: 3.86,
    massEarths: 17.1,
    distanceFromSunAU: 30.05,
    distanceFromSunMillionKm: 4495.1,
    orbitalPeriodDays: 60190, // 164.8 years
    rotationPeriodHours: 16.1,
    meanTempC: -200,
    atmosphereComposition: ['80% Hydrogen', '19% Helium', '1.5% Methane'],
    moonsCount: 16,
    majorMoons: ['Triton', 'Proteus', 'Nereid'],
    notableMissions: ['Voyager 2'],
    keyFacts: [
      'Fastest planetary winds recorded in the solar system, exceeding 2,100 km/h.',
      'Triton orbits Neptune in a retrograde direction and has active nitrogen ice geysers.',
      'Completed its first full orbit around the Sun since its 1846 discovery in 2011.'
    ],
    scale3D: 1.25,
    orbitSpeedRatio: 0.006
  },
  {
    id: 'pluto',
    name: 'Pluto',
    type: 'Dwarf Planet',
    tagline: 'The icy heart of the Kuiper Belt with nitrogen glaciers',
    description: 'Pluto is a dwarf planet in the Kuiper Belt, a ring of icy bodies beyond Neptune. It features nitrogen ice mountains, glaciers shaped like hearts, and a thin seasonal atmosphere.',
    color: '#d7ccc8',
    texturePattern: 'radial-gradient(circle, #f5f5f5 0%, #d7ccc8 50%, #8d6e63 100%)',
    radiusKm: 1188.3,
    radiusEarths: 0.186,
    massEarths: 0.0022,
    distanceFromSunAU: 39.48,
    distanceFromSunMillionKm: 5906.4,
    orbitalPeriodDays: 90560, // 248 years
    rotationPeriodHours: 153.3,
    meanTempC: -229,
    atmosphereComposition: ['Nitrogen', 'Methane', 'Carbon Monoxide'],
    moonsCount: 5,
    majorMoons: ['Charon', 'Styx', 'Nix', 'Kerberos', 'Hydra'],
    notableMissions: ['New Horizons'],
    keyFacts: [
      'Pluto and its moon Charon form a binary system locked in mutual tidal synchronization.',
      'Sputnik Planitia is a massive heart-shaped nitrogen ice sheet 1,000 km wide.',
      'Reclassified as a dwarf planet by the IAU in 2006.'
    ],
    scale3D: 0.45,
    orbitSpeedRatio: 0.004
  }
];

export const CONSTELLATIONS_DATA: ConstellationData[] = [
  {
    id: 'orion',
    name: 'Orion',
    latinName: 'Orion',
    englishName: 'The Hunter',
    pronunciation: 'oh-RYE-un',
    symbolism: 'Mythological hunter with sword and shield',
    brightestStar: 'Rigel (Beta Orionis)',
    brightestStarMag: 0.13,
    bestViewingSeason: 'Winter',
    hemisphere: 'Both',
    mythology: 'In Greek mythology, Orion was a gigantic hunter whom Zeus placed among the stars. He stands near Taurus the Bull and is pursued by Scorpius.',
    stars: [
      { name: 'Betelgeuse', raHours: 5.92, decDeg: 7.41, mag: 0.50, spectType: 'M1-M2Ia-ab (Red Supergiant)' },
      { name: 'Rigel', raHours: 5.24, decDeg: -8.20, mag: 0.13, spectType: 'B8Ia (Blue Supergiant)' },
      { name: 'Bellatrix', raHours: 5.42, decDeg: 6.35, mag: 1.64, spectType: 'B2III' },
      { name: 'Saiph', raHours: 5.79, decDeg: -9.67, mag: 2.07, spectType: 'B0.5Ia' },
      { name: 'Alnitak', raHours: 5.68, decDeg: -1.94, mag: 1.77, spectType: 'O9.5Iab (Orion Belt)' },
      { name: 'Alnilam', raHours: 5.60, decDeg: -1.20, mag: 1.69, spectType: 'B0Ia (Orion Belt)' },
      { name: 'Mintaka', raHours: 5.53, decDeg: -0.30, mag: 2.23, spectType: 'O9.5II (Orion Belt)' }
    ],
    lineConnections: [
      [0, 4], [4, 5], [5, 6], [6, 2], [0, 2], [1, 3], [3, 4], [1, 6]
    ],
    nearbyDeepSpaceObjects: ['Orion Nebula (M42)', 'Horsehead Nebula (B33)', 'Flame Nebula (NGC 2024)']
  },
  {
    id: 'ursa_major',
    name: 'Ursa Major',
    latinName: 'Ursa Major',
    englishName: 'The Great Bear (Big Dipper)',
    pronunciation: 'ER-suh MAY-jer',
    symbolism: 'Great Bear containing the Big Dipper asterism',
    brightestStar: 'Alioth (Epsilon Ursae Majoris)',
    brightestStarMag: 1.77,
    bestViewingSeason: 'Spring',
    hemisphere: 'Northern',
    mythology: 'Associated with Callisto, a nymph transformed into a bear by Hera due to Zeus’s affection. Placed into the northern sky to revolve eternally around the celestial pole.',
    stars: [
      { name: 'Dubhe', raHours: 11.06, decDeg: 61.75, mag: 1.79, spectType: 'K0III' },
      { name: 'Merak', raHours: 11.03, decDeg: 56.38, mag: 2.37, spectType: 'A1V' },
      { name: 'Phecda', raHours: 11.90, decDeg: 53.69, mag: 2.44, spectType: 'A0Ve' },
      { name: 'Megrez', raHours: 12.26, decDeg: 57.03, mag: 3.31, spectType: 'A3V' },
      { name: 'Alioth', raHours: 12.90, decDeg: 55.96, mag: 1.77, spectType: 'A1p' },
      { name: 'Mizar', raHours: 13.40, decDeg: 54.92, mag: 2.23, spectType: 'A2V' },
      { name: 'Alkaid', raHours: 13.79, decDeg: 49.31, mag: 1.86, spectType: 'B3V' }
    ],
    lineConnections: [
      [0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]
    ],
    nearbyDeepSpaceObjects: ['Pinwheel Galaxy (M101)', 'Bode’s Galaxy (M81)', 'Cigar Galaxy (M82)', 'Owl Nebula (M97)']
  },
  {
    id: 'cassiopeia',
    name: 'Cassiopeia',
    latinName: 'Cassiopeia',
    englishName: 'The Vain Queen',
    pronunciation: 'kass-ee-oh-PEE-uh',
    symbolism: 'Queen sitting on her celestial throne (distinct W shape)',
    brightestStar: 'Shedar (Alpha Cassiopeiae)',
    brightestStarMag: 2.24,
    bestViewingSeason: 'Autumn',
    hemisphere: 'Northern',
    mythology: 'Boasted that her beauty surpassed that of the Nereids, angering Poseidon. As punishment, she was bound to her throne in the heavens, tumbling upside down half the time.',
    stars: [
      { name: 'Segin', raHours: 1.90, decDeg: 63.67, mag: 3.37, spectType: 'B3III' },
      { name: 'Ruchbah', raHours: 1.43, decDeg: 60.23, mag: 2.68, spectType: 'A5V' },
      { name: 'Gamma Cas', raHours: 0.94, decDeg: 60.72, mag: 2.15, spectType: 'B0.5IVe' },
      { name: 'Shedar', raHours: 0.68, decDeg: 56.54, mag: 2.24, spectType: 'K0III' },
      { name: 'Caph', raHours: 0.15, decDeg: 59.15, mag: 2.28, spectType: 'F2III' }
    ],
    lineConnections: [
      [0, 1], [1, 2], [2, 3], [3, 4]
    ],
    nearbyDeepSpaceObjects: ['Pacman Nebula (NGC 281)', 'Heart Nebula (IC 1805)', 'Soul Nebula (IC 1848)']
  },
  {
    id: 'leo',
    name: 'Leo',
    latinName: 'Leo',
    englishName: 'The Lion',
    pronunciation: 'LEE-oh',
    symbolism: 'Nemean Lion defeated by Hercules',
    brightestStar: 'Regulus (Alpha Leonis)',
    brightestStarMag: 1.36,
    bestViewingSeason: 'Spring',
    hemisphere: 'Both',
    mythology: 'Represented the invincible Nemean Lion killed by Hercules as the first of his twelve labors.',
    stars: [
      { name: 'Regulus', raHours: 10.14, decDeg: 11.97, mag: 1.36, spectType: 'B8IV' },
      { name: 'Denebola', raHours: 11.82, decDeg: 14.57, mag: 2.14, spectType: 'A3V' },
      { name: 'Algieba', raHours: 10.33, decDeg: 19.84, mag: 2.01, spectType: 'K1III' },
      { name: 'Zosma', raHours: 11.24, decDeg: 20.52, mag: 2.56, spectType: 'A4V' }
    ],
    lineConnections: [
      [0, 2], [2, 3], [3, 1], [0, 1]
    ],
    nearbyDeepSpaceObjects: ['Leo Triplet Galaxies (M65, M66, NGC 3628)']
  },
  {
    id: 'scorpius',
    name: 'Scorpius',
    latinName: 'Scorpius',
    englishName: 'The Scorpion',
    pronunciation: 'SKOR-pee-us',
    symbolism: 'Giant scorpion sent to sting Orion',
    brightestStar: 'Antares (Alpha Scorpii)',
    brightestStarMag: 0.96,
    bestViewingSeason: 'Summer',
    hemisphere: 'Southern',
    mythology: 'Sent by Gaia or Artemis to defeat Orion after he boasted he could slay any creature on Earth.',
    stars: [
      { name: 'Antares', raHours: 16.49, decDeg: -26.43, mag: 0.96, spectType: 'M1.5Iab (Red Supergiant)' },
      { name: 'Shaula', raHours: 17.56, decDeg: -37.01, mag: 1.62, spectType: 'B2IV' },
      { name: 'Sargas', raHours: 17.62, decDeg: -42.99, mag: 1.86, spectType: 'F0II' }
    ],
    lineConnections: [
      [0, 1], [1, 2]
    ],
    nearbyDeepSpaceObjects: ['Ptolemy Cluster (M7)', 'Butterfly Cluster (M6)']
  }
];

export const SATELLITES_DATA: SatelliteData[] = [
  {
    id: 'iss',
    noradId: 25544,
    name: 'International Space Station (ISS)',
    type: 'Space Station',
    operator: 'NASA / Roscosmos / ESA / JAXA / CSA',
    launchYear: 1998,
    orbitType: 'LEO',
    altitudeKm: 420,
    velocityKmSec: 7.66,
    periodMinutes: 92.68,
    inclinationDeg: 51.64,
    lat: 28.5,
    lon: -80.5,
    description: 'A habitable artificial satellite and microgravity research lab orbiting Earth every 92 minutes at ~27,600 km/h.'
  },
  {
    id: 'hubble',
    noradId: 20580,
    name: 'Hubble Space Telescope',
    type: 'Telescope',
    operator: 'NASA / ESA',
    launchYear: 1990,
    orbitType: 'LEO',
    altitudeKm: 535,
    velocityKmSec: 7.59,
    periodMinutes: 95.4,
    inclinationDeg: 28.47,
    lat: 15.2,
    lon: -45.1,
    description: 'One of the largest and most versatile space telescopes, providing iconic ultra-deep view images of cosmos.'
  },
  {
    id: 'tiangong',
    noradId: 48274,
    name: 'Tiangong Space Station',
    type: 'Space Station',
    operator: 'CMSA (China)',
    launchYear: 2021,
    orbitType: 'LEO',
    altitudeKm: 388,
    velocityKmSec: 7.68,
    periodMinutes: 92.2,
    inclinationDeg: 41.5,
    lat: 32.1,
    lon: 118.2,
    description: 'China’s modular permanent space station operating in low Earth orbit with Shenzhou astronaut crews.'
  },
  {
    id: 'starlink-1007',
    noradId: 44713,
    name: 'Starlink-1007',
    type: 'Communication',
    operator: 'SpaceX',
    launchYear: 2019,
    orbitType: 'LEO',
    altitudeKm: 550,
    velocityKmSec: 7.58,
    periodMinutes: 95.6,
    inclinationDeg: 53.0,
    lat: -12.4,
    lon: 68.3,
    description: 'Part of SpaceX’s global broadband satellite constellation delivering high-speed satellite internet worldwide.'
  },
  {
    id: 'noaa-19',
    noradId: 33591,
    name: 'NOAA-19 Weather Satellite',
    type: 'Weather',
    operator: 'NOAA / NASA',
    launchYear: 2009,
    orbitType: 'SSO',
    altitudeKm: 850,
    velocityKmSec: 7.42,
    periodMinutes: 102.1,
    inclinationDeg: 98.7,
    lat: 72.0,
    lon: -110.0,
    description: 'Polar-orbiting environmental satellite providing continuous weather monitoring, atmospheric soundings, and search & rescue tracking.'
  }
];

export const DEEP_SPACE_DATA: DeepSpaceObject[] = [
  {
    id: 'andromeda',
    name: 'Andromeda Galaxy',
    catalogId: 'M31 / NGC 224',
    type: 'Spiral Galaxy',
    constellation: 'Andromeda',
    distanceLightYears: 2537000,
    magnitude: 3.44,
    description: 'The nearest major galaxy to our Milky Way, containing over 1 trillion stars. On a collision course with the Milky Way in ~4.5 billion years.',
    imageUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&auto=format&fit=crop',
    imageCredit: 'NASA / ESA / STScI',
    ra: '00h 42m 44s',
    dec: '+41° 16′ 09″'
  },
  {
    id: 'orion_nebula',
    name: 'Orion Nebula',
    catalogId: 'M42 / NGC 1976',
    type: 'Emission Nebula',
    constellation: 'Orion',
    distanceLightYears: 1344,
    magnitude: 4.0,
    description: 'A massive star-forming nursery located in the sword of Orion. Visible to the naked eye as a fuzzy star.',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
    imageCredit: 'NASA / ESA / Hubble Heritage Team',
    ra: '05h 35m 17s',
    dec: '-05° 23′ 28″'
  },
  {
    id: 'crab_nebula',
    name: 'Crab Nebula',
    catalogId: 'M1 / NGC 1952',
    type: 'Supernova Remnant',
    constellation: 'Taurus',
    distanceLightYears: 6500,
    magnitude: 8.4,
    description: 'Expanding remnant of a supernova witnessed by Chinese and Arab astronomers in the year 1054 AD. Houses the Crab Pulsar at its center.',
    imageUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1200&auto=format&fit=crop',
    imageCredit: 'NASA / ESA / J. Hester',
    ra: '05h 34m 31s',
    dec: '+22° 00′ 52″'
  },
  {
    id: 'pleiades',
    name: 'Pleiades (Seven Sisters)',
    catalogId: 'M45',
    type: 'Open Cluster',
    constellation: 'Taurus',
    distanceLightYears: 444,
    magnitude: 1.6,
    description: 'An open star cluster dominated by hot blue luminous stars that have formed within the last 100 million years.',
    imageUrl: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=80&w=1200&auto=format&fit=crop',
    imageCredit: 'NASA / ESA / STScI',
    ra: '03h 47m 24s',
    dec: '+24° 07′ 00″'
  },
  {
    id: 'whirlpool',
    name: 'Whirlpool Galaxy',
    catalogId: 'M51 / NGC 5194',
    type: 'Spiral Galaxy',
    constellation: 'Canes Venatici',
    distanceLightYears: 23000000,
    magnitude: 8.4,
    description: 'A classic grand design spiral galaxy interacting with its smaller companion galaxy NGC 5195.',
    imageUrl: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?q=80&w=1200&auto=format&fit=crop',
    imageCredit: 'NASA / ESA / Hubble Heritage',
    ra: '13h 29m 52s',
    dec: '+47° 11′ 43″'
  }
];

export const SPACE_MISSIONS_DATA: SpaceMission[] = [
  {
    id: 'apollo11',
    name: 'Apollo 11',
    agency: 'NASA',
    type: 'Lunar',
    launchDate: 'July 16, 1969',
    status: 'Completed',
    objectives: 'Perform the first crewed lunar landing and safely return the astronauts to Earth.',
    keyAchievements: [
      'Neil Armstrong & Buzz Aldrin became the first humans to walk on the Moon on July 20, 1969.',
      'Returned 21.5 kg of lunar surface materials.',
      'Deployed EASEP scientific experiments on the lunar surface.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?q=80&w=1000&auto=format&fit=crop'
  },
  {
    id: 'jwst',
    name: 'James Webb Space Telescope (JWST)',
    agency: 'NASA / ESA / CSA',
    type: 'Space Telescope',
    launchDate: 'December 25, 2021',
    status: 'Active',
    objectives: 'Observe the earliest stars and galaxies formed after the Big Bang, analyze exoplanet atmospheres, and study star formation.',
    keyAchievements: [
      'Captured the deepest, sharpest infrared image of the distant universe (JWST Deep Field).',
      'Detected water vapor, carbon dioxide, and sulfur dioxide in exoplanet atmospheres.',
      'Revealed intricate structures in Carina Nebula and Pillars of Creation.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=1000&auto=format&fit=crop'
  },
  {
    id: 'perseverance',
    name: 'Mars Perseverance Rover & Ingenuity',
    agency: 'NASA / JPL',
    type: 'Mars',
    launchDate: 'July 30, 2020',
    status: 'Active',
    objectives: 'Seek signs of ancient microbial life in Jezero Crater, collect rock core samples, and test oxygen production (MOXIE).',
    keyAchievements: [
      'Successfully landed in Jezero Crater on February 18, 2021.',
      'Ingenuity helicopter achieved 72 powered controlled flights on another planet.',
      'Extracted over 20 sealed rock and soil core samples for future Mars Sample Return.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=1000&auto=format&fit=crop'
  },
  {
    id: 'chandrayaan3',
    name: 'Chandrayaan-3',
    agency: 'ISRO (India)',
    type: 'Lunar',
    launchDate: 'July 14, 2023',
    status: 'Completed',
    objectives: 'Demonstrate safe soft landing on the lunar south pole and conduct in-situ mineralogical experiments with Pragyan rover.',
    keyAchievements: [
      'First nation to land near the lunar south pole on August 23, 2023.',
      'Pragyan rover confirmed the presence of Sulfur (S), Aluminum, Calcium, Iron, and Titanium.',
      'Successfully performed a hop experiment demonstrating future sample return capability.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?q=80&w=1000&auto=format&fit=crop'
  }
];

export const ASTRONOMICAL_EVENTS_DATA: AstronomicalEvent[] = [
  {
    id: 'perseids-2026',
    title: 'Perseid Meteor Shower Peak',
    type: 'Meteor Shower',
    date: 'August 12-13, 2026',
    peakTimeUTC: '02:00 UTC',
    visibilityRegion: 'Northern Hemisphere & Tropics',
    description: 'One of the brightest meteor showers of the year, producing up to 100 fast and bright meteors per hour originating from Comet Swift-Tuttle.',
    viewingTips: 'Find a dark sky location away from city lights after midnight. Look toward the constellation Perseus.'
  },
  {
    id: 'saturn-opposition-2026',
    title: 'Saturn at Opposition',
    type: 'Opposition',
    date: 'September 21, 2026',
    peakTimeUTC: '22:00 UTC',
    visibilityRegion: 'Worldwide',
    description: 'Saturn makes its closest approach to Earth and its face is fully illuminated by the Sun, appearing brighter than at any other time of the year.',
    viewingTips: 'A small telescope will reveal Saturn’s rings and its largest moon Titan in high contrast.'
  },
  {
    id: 'total-lunar-eclipse-2026',
    title: 'Total Lunar Eclipse (Blood Moon)',
    type: 'Eclipse',
    date: 'March 3, 2026',
    peakTimeUTC: '11:34 UTC',
    visibilityRegion: 'Americas, Pacific, East Asia, Australia',
    description: 'The Moon passes entirely through Earth’s dark umbral shadow, turning a deep copper-red due to sunlight scattered by Earth’s atmosphere.',
    viewingTips: 'Safe to observe with naked eye, binoculars, or telescopes without filter protection.'
  }
];
