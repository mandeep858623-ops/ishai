export interface PlanetaryLocation {
  id: string;
  planetId: string; // 'earth' | 'mars' | 'moon' | 'mercury' | 'venus' | 'jupiter' | 'saturn' | 'uranus' | 'neptune'
  name: string;
  category: 'City' | 'Landmark' | 'Volcano' | 'Canyon' | 'Crater' | 'Landing Site' | 'Mountain' | 'Ocean' | 'Feature';
  lat: number; // -90 to 90
  lon: number; // -180 to 180
  altitude: number; // camera distance zoom level (1.5 = close, 3.0 = high, 5.0 = global)
  description: string;
  keyFacts?: string[];
  elevationMeters?: number;
  countryOrRegion?: string;
}

export const PLANETARY_LOCATIONS: PlanetaryLocation[] = [
  // --- EARTH ---
  {
    id: 'earth_paris',
    planetId: 'earth',
    name: 'Paris',
    category: 'City',
    lat: 48.8566,
    lon: 2.3522,
    altitude: 1.8,
    countryOrRegion: 'France, Europe',
    elevationMeters: 35,
    description: 'Capital of France, iconic cultural & historic hub known for the Eiffel Tower, Louvre Museum, and Seine River.',
    keyFacts: [
      'Home to over 2.1 million residents in the city proper.',
      'Eiffel Tower stands 330 meters tall.',
      'The Louvre is the world’s largest art museum.'
    ]
  },
  {
    id: 'earth_nyc',
    planetId: 'earth',
    name: 'New York City',
    category: 'City',
    lat: 40.7128,
    lon: -74.0060,
    altitude: 1.8,
    countryOrRegion: 'USA, North America',
    elevationMeters: 10,
    description: 'Global financial capital and metropolis featuring Manhattan, Central Park, and the Statue of Liberty.',
    keyFacts: [
      'Most populous city in the United States (~8.8 million).',
      'Times Square handles over 330,000 daily pedestrians.',
      'Includes 5 distinct boroughs.'
    ]
  },
  {
    id: 'earth_everest',
    planetId: 'earth',
    name: 'Mount Everest',
    category: 'Mountain',
    lat: 27.9881,
    lon: 86.9250,
    altitude: 1.6,
    countryOrRegion: 'Nepal / China Border, Asia',
    elevationMeters: 8848,
    description: 'The highest mountain peak above sea level on Earth, situated in the Mahalangur Himal sub-range of the Himalayas.',
    keyFacts: [
      'Elevation is officially recognized at 8,848.86 meters (29,031.7 ft).',
      'First summited by Sir Edmund Hillary and Tenzing Norgay on May 29, 1953.',
      'Grows approximately 4 mm higher each year due to tectonic collision.'
    ]
  },
  {
    id: 'earth_giza',
    planetId: 'earth',
    name: 'Pyramids of Giza',
    category: 'Landmark',
    lat: 29.9792,
    lon: 31.1342,
    altitude: 1.7,
    countryOrRegion: 'Giza, Egypt, Africa',
    elevationMeters: 20,
    description: 'Ancient archaeological site containing the Great Pyramid of Giza, Pyramid of Khafre, Pyramid of Menkaure, and the Great Sphinx.',
    keyFacts: [
      'Constructed over 4,500 years ago during Egypt’s Fourth Dynasty.',
      'The Great Pyramid was the tallest man-made structure for over 3,800 years.',
      'Aligned precisely with the cardinal points of the compass.'
    ]
  },
  {
    id: 'earth_grand_canyon',
    planetId: 'earth',
    name: 'Grand Canyon',
    category: 'Canyon',
    lat: 36.1069,
    lon: -112.1129,
    altitude: 1.9,
    countryOrRegion: 'Arizona, USA',
    elevationMeters: 2134,
    description: 'A steep-sided canyon carved by the Colorado River over millions of years, exposing nearly two billion years of Earth’s geological history.',
    keyFacts: [
      'Measures 446 km (277 miles) long and up to 29 km (18 miles) wide.',
      'Reaches depths of over 1,800 meters (6,000 feet).',
      'Contains 6 different life zones.'
    ]
  },
  {
    id: 'earth_tokyo',
    planetId: 'earth',
    name: 'Tokyo',
    category: 'City',
    lat: 35.6762,
    lon: 139.6503,
    altitude: 1.8,
    countryOrRegion: 'Japan, Asia',
    elevationMeters: 40,
    description: 'The bustling capital of Japan, combining ultramodern skyscrapers with historic temples and vibrant urban districts.',
    keyFacts: [
      'World’s most populous metropolitan area (~37.4 million people).',
      'Features Mount Fuji views on clear days.',
      'Shibuya Crossing is the busiest pedestrian intersection in the world.'
    ]
  },
  {
    id: 'earth_sydney',
    planetId: 'earth',
    name: 'Sydney',
    category: 'City',
    lat: -33.8688,
    lon: 151.2093,
    altitude: 1.8,
    countryOrRegion: 'Australia',
    elevationMeters: 19,
    description: 'Coastal metropolis known for the Sydney Opera House, Harbour Bridge, and Bondi Beach.',
    keyFacts: [
      'Largest city in Australia.',
      'The Sydney Opera House was opened in 1973 and is a UNESCO World Heritage site.'
    ]
  },
  {
    id: 'earth_rio',
    planetId: 'earth',
    name: 'Rio de Janeiro',
    category: 'City',
    lat: -22.9068,
    lon: -43.1729,
    altitude: 1.8,
    countryOrRegion: 'Brazil, South America',
    elevationMeters: 2,
    description: 'Famous Brazilian city surrounded by dramatic mountains, Copacabana beach, and the Christ the Redeemer statue on Mount Corcovado.',
    keyFacts: [
      'Christ the Redeemer stands 30 meters tall atop Corcovado mountain.',
      'Hosts the world’s largest Carnival celebration.'
    ]
  },
  {
    id: 'earth_mariana',
    planetId: 'earth',
    name: 'Mariana Trench (Challenger Deep)',
    category: 'Ocean',
    lat: 11.35,
    lon: 142.2,
    altitude: 2.2,
    countryOrRegion: 'Pacific Ocean',
    elevationMeters: -10994,
    description: 'The deepest known point in Earth’s oceans, located in the western Pacific Ocean.',
    keyFacts: [
      'Reaches a depth of nearly 11,000 meters (36,000 feet).',
      'Water pressure at the bottom is over 1,000 times standard atmospheric pressure.',
      'Home to unique extremophile organisms.'
    ]
  },

  // --- MARS ---
  {
    id: 'mars_olympus_mons',
    planetId: 'mars',
    name: 'Olympus Mons',
    category: 'Volcano',
    lat: 18.65,
    lon: -133.8,
    altitude: 1.6,
    elevationMeters: 21900,
    description: 'The largest known volcano in the solar system, a colossal shield volcano roughly 2.5 times the height of Mount Everest above sea level.',
    keyFacts: [
      'Stands approximately 22 km (13.6 miles) high.',
      'Base spans 600 km (370 miles) across—roughly the size of France or Arizona.',
      'Caldera complex at the summit is 80 km wide.'
    ]
  },
  {
    id: 'mars_valles_marineris',
    planetId: 'mars',
    name: 'Valles Marineris',
    category: 'Canyon',
    lat: -13.9,
    lon: -59.2,
    altitude: 2.0,
    elevationMeters: -7000,
    description: 'A vast canyon system along the Martian equator, dwarfing Earth’s Grand Canyon in scale.',
    keyFacts: [
      'Stretches over 4,000 km (2,500 miles) long.',
      'Reaches depths up to 7 km (23,000 feet).',
      'Covers nearly a quarter of Mars’s circumference.'
    ]
  },
  {
    id: 'mars_jezero',
    planetId: 'mars',
    name: 'Jezero Crater (Perseverance Rover)',
    category: 'Landing Site',
    lat: 18.38,
    lon: 77.58,
    altitude: 1.7,
    elevationMeters: -2500,
    description: 'An ancient 45-km-wide crater lake bed where NASA’s Perseverance Rover and Ingenuity Helicopter landed in February 2021.',
    keyFacts: [
      'Preserves an ancient river delta that once flowed with liquid water.',
      'Primary mission target for searching for signs of ancient microbial life.',
      'Contains diverse clays and carbonate minerals.'
    ]
  },
  {
    id: 'mars_gale',
    planetId: 'mars',
    name: 'Gale Crater (Curiosity Rover)',
    category: 'Landing Site',
    lat: -5.4,
    lon: 137.8,
    altitude: 1.7,
    elevationMeters: -4500,
    description: 'Impact crater containing Mount Sharp (Aeolis Mons), landed on by NASA’s Curiosity Rover in August 2012.',
    keyFacts: [
      'Curiosity confirmed that ancient Gale Crater had long-lived liquid water lakes.',
      'Layered sediments in Mount Sharp record millions of years of climate transition.',
      'Spans 154 km (96 miles) in diameter.'
    ]
  },
  {
    id: 'mars_viking1',
    planetId: 'mars',
    name: 'Chryse Planitia (Viking 1 Site)',
    category: 'Landing Site',
    lat: 22.27,
    lon: -47.95,
    altitude: 1.9,
    elevationMeters: -3000,
    description: 'Smooth circular plain where NASA’s Viking 1 lander performed humanity’s first successful Mars surface mission on July 20, 1976.',
    keyFacts: [
      'Viking 1 operated on the surface for over 6 years.',
      'Transmitted the first iconic color photographs of the red Martian surface.'
    ]
  },
  {
    id: 'mars_hellas',
    planetId: 'mars',
    name: 'Hellas Planitia',
    category: 'Crater',
    lat: -42.4,
    lon: 70.5,
    altitude: 2.2,
    elevationMeters: -7152,
    description: 'Enormous impact crater basin in the southern hemisphere, one of the largest impact craters in the solar system.',
    keyFacts: [
      'Measures roughly 2,300 km (1,400 miles) in diameter.',
      'Deepest location on Mars, with atmospheric pressure significantly higher than the average surface.'
    ]
  },

  // --- MOON ---
  {
    id: 'moon_apollo11',
    planetId: 'moon',
    name: 'Tranquility Base (Apollo 11)',
    category: 'Landing Site',
    lat: 0.674,
    lon: 23.473,
    altitude: 1.6,
    countryOrRegion: 'Mare Tranquillitatis',
    description: 'Historic site where Neil Armstrong and Buzz Aldrin landed the Eagle lunar module on July 20, 1969.',
    keyFacts: [
      'First human footprint on an extraterrestrial world.',
      '"The Eagle has landed"—Neil Armstrong’s famous radio transmission.',
      'Left behind the Apollo 11 Lunar Module descent stage, U.S. flag, and scientific experiments.'
    ]
  },
  {
    id: 'moon_apollo17',
    planetId: 'moon',
    name: 'Taurus-Littrow (Apollo 17)',
    category: 'Landing Site',
    lat: 20.19,
    lon: 30.77,
    altitude: 1.7,
    countryOrRegion: 'Valley of Taurus-Littrow',
    description: 'Landing location of the final Apollo crewed lunar mission in December 1972 with Gene Cernan and Harrison Schmitt.',
    keyFacts: [
      'Harrison Schmitt was the first trained scientist (geologist) to walk on the Moon.',
      'Crew collected 110.5 kg of lunar soil and rock samples.',
      'Traversed over 35 km using the Lunar Roving Vehicle.'
    ]
  },
  {
    id: 'moon_tycho',
    planetId: 'moon',
    name: 'Tycho Crater',
    category: 'Crater',
    lat: -43.31,
    lon: -11.36,
    altitude: 1.8,
    description: 'Prominent 85-km-wide rayed impact crater in the southern lunar highlands with bright splash rays stretching over 1,500 km.',
    keyFacts: [
      'Relatively young crater (~108 million years old).',
      'Central peak rises 2 km above the crater floor.',
      'Easily visible from Earth with binoculars during full moon.'
    ]
  },
  {
    id: 'moon_chandrayaan3',
    planetId: 'moon',
    name: 'Shiv Shakti Point (Chandrayaan-3)',
    category: 'Landing Site',
    lat: -69.37,
    lon: 32.35,
    altitude: 1.7,
    countryOrRegion: 'Lunar South Pole Region',
    description: 'Historic landing location where India’s ISRO Chandrayaan-3 Vikram lander made soft touchdown on August 23, 2023.',
    keyFacts: [
      'First spacecraft to land near the Moon’s southern polar region.',
      'Pragyan rover conducted in-situ chemical analysis of sulfur and elemental regolith.',
      'Proved presence of key surface volatile elements.'
    ]
  },
  {
    id: 'moon_copernicus',
    planetId: 'moon',
    name: 'Copernicus Crater',
    category: 'Crater',
    lat: 9.62,
    lon: -20.08,
    altitude: 1.8,
    description: 'A classic terraced lunar impact crater 93 km in diameter, located in eastern Oceanus Procellarum.',
    keyFacts: [
      'Nicknamed "The Monarch of the Moon" by lunar observers.',
      'Depth of crater is 3.8 km with multiple central peaks rising 1.2 km.'
    ]
  },
  {
    id: 'moon_shackleton',
    planetId: 'moon',
    name: 'Shackleton Crater',
    category: 'Crater',
    lat: -89.9,
    lon: 0.0,
    altitude: 1.8,
    description: 'Impact crater situated precisely at the lunar south pole whose interior remains in perpetual darkness, trapping immense water ice reserves.',
    keyFacts: [
      'Crater rim peaks receive nearly continuous sunlight for solar power.',
      'Primary target site for NASA Artemis human landing program.'
    ]
  },

  // --- MERCURY ---
  {
    id: 'mercury_caloris',
    planetId: 'mercury',
    name: 'Caloris Basin',
    category: 'Crater',
    lat: 30.5,
    lon: -189.8,
    altitude: 2.0,
    description: 'Massive impact basin 1,550 km in diameter created by a catastrophic asteroid collision early in solar system history.',
    keyFacts: [
      'One of the largest impact structures in the solar system.',
      'Impact shockwaves traveled around the planet to create jumbled "weird terrain" on the opposite side.'
    ]
  },

  // --- VENUS ---
  {
    id: 'venus_maat_mons',
    planetId: 'venus',
    name: 'Maat Mons',
    category: 'Volcano',
    lat: -0.5,
    lon: 194.6,
    altitude: 1.8,
    description: 'The highest shield volcano on Venus, rising 8 km above the surrounding radar plains.',
    keyFacts: [
      'Recent Magellan and Magellan radar data show signs of active volcanic eruptions.',
      'Summits in a large 28 km x 31 km caldera.'
    ]
  },

  // --- JUPITER ---
  {
    id: 'jupiter_grs',
    planetId: 'jupiter',
    name: 'Great Red Spot',
    category: 'Feature',
    lat: -22.0,
    lon: -10.0,
    altitude: 2.0,
    description: 'A colossal anticyclonic storm larger than Earth, raging in Jupiter’s southern atmosphere for at least 350 years.',
    keyFacts: [
      'Winds blow at speeds up to 680 km/h (425 mph).',
      'Measures roughly 16,350 km wide.',
      'Powered by heat rising from Jupiter’s interior.'
    ]
  },

  // --- SATURN ---
  {
    id: 'saturn_cassini_gap',
    planetId: 'saturn',
    name: 'Cassini Division',
    category: 'Feature',
    lat: 0.0,
    lon: 0.0,
    altitude: 2.5,
    description: 'A 4,800-km-wide gap separating Saturn’s outer A ring and inner B ring, cleared by the gravitational resonance of moon Mimas.',
    keyFacts: [
      'Discovered in 1675 by Giovanni Domenico Cassini.',
      'Contains sparse ring material cleared by orbital interactions.'
    ]
  },

  // --- NEPTUNE ---
  {
    id: 'neptune_dark_spot',
    planetId: 'neptune',
    name: 'Great Dark Spot',
    category: 'Feature',
    lat: -22.0,
    lon: 60.0,
    altitude: 2.0,
    description: 'Earth-sized storm in Neptune’s southern atmosphere recorded by Voyager 2 in 1989.',
    keyFacts: [
      'Supersonic winds reached speeds of 2,100 km/h (1,300 mph).',
      'Driven by internal thermal energy radiation.'
    ]
  }
];
