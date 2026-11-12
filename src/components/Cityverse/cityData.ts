/**
 * CITYVERSE — Building Catalogue Catalogue & City Templates
 */

import { BuildingDefinition, CityProject, TileData, BuildingInstance } from './types';

export const BUILDING_CATALOG: BuildingDefinition[] = [
  // =========================================================================
  // RESIDENTIAL
  // =========================================================================
  {
    id: 'res_small_house',
    name: 'Small House',
    category: 'residential',
    description: 'Cozy suburban family home with private yard.',
    cost: 1500,
    width: 1,
    height: 1,
    maxCapacity: 6,
    powerDemand: 1,
    waterDemand: 1,
    color: '#38bdf8',
    accentColor: '#e0f2fe',
    icon: 'Home',
    modelStyle: 'house',
  },
  {
    id: 'res_apartment_block',
    name: 'Apartment Block',
    category: 'residential',
    description: 'Medium-density residential apartments.',
    cost: 8000,
    width: 2,
    height: 1,
    maxCapacity: 45,
    powerDemand: 4,
    waterDemand: 5,
    color: '#0284c7',
    accentColor: '#bae6fd',
    icon: 'Building',
    modelStyle: 'apartment',
  },
  {
    id: 'res_residential_tower',
    name: 'High-Rise Tower',
    category: 'residential',
    description: 'High-density luxury residential skyscraper.',
    cost: 25000,
    width: 2,
    height: 2,
    maxCapacity: 180,
    powerDemand: 12,
    waterDemand: 15,
    color: '#0369a1',
    accentColor: '#38bdf8',
    icon: 'Building2',
    modelStyle: 'skyscraper',
  },
  {
    id: 'res_luxury_villa',
    name: 'Luxury Villa',
    category: 'residential',
    description: 'Exclusive estate with swimming pool and landscaped gardens.',
    cost: 12000,
    width: 2,
    height: 2,
    maxCapacity: 10,
    powerDemand: 3,
    waterDemand: 4,
    color: '#7dd3fc',
    accentColor: '#f0f9ff',
    icon: 'Castle',
    modelStyle: 'house',
  },

  // =========================================================================
  // COMMERCIAL
  // =========================================================================
  {
    id: 'com_corner_shop',
    name: 'Corner Shop',
    category: 'commercial',
    description: 'Neighborhood retail store and cafe.',
    cost: 3000,
    width: 1,
    height: 1,
    maxCapacity: 8,
    powerDemand: 2,
    waterDemand: 2,
    color: '#f59e0b',
    accentColor: '#fef3c7',
    icon: 'ShoppingBag',
    modelStyle: 'shop',
  },
  {
    id: 'com_shopping_mall',
    name: 'Shopping Mall',
    category: 'commercial',
    description: 'Large multi-story retail, dining, and cinema hub.',
    cost: 35000,
    width: 3,
    height: 2,
    maxCapacity: 120,
    powerDemand: 15,
    waterDemand: 18,
    color: '#d97706',
    accentColor: '#fde68a',
    icon: 'Store',
    modelStyle: 'mall',
  },
  {
    id: 'com_office_tower',
    name: 'Office Tower',
    category: 'commercial',
    description: 'Modern corporate glass tower for tech and financial firms.',
    cost: 45000,
    width: 2,
    height: 2,
    maxCapacity: 250,
    powerDemand: 22,
    waterDemand: 20,
    color: '#b45309',
    accentColor: '#fbbf24',
    icon: 'Briefcase',
    modelStyle: 'office',
  },
  {
    id: 'com_grand_hotel',
    name: 'Grand Hotel',
    category: 'commercial',
    description: '5-star hospitality hotel attracting city tourists.',
    cost: 40000,
    width: 2,
    height: 2,
    maxCapacity: 160,
    powerDemand: 18,
    waterDemand: 22,
    color: '#f59e0b',
    accentColor: '#fef08a',
    icon: 'Hotel',
    modelStyle: 'office',
  },

  // =========================================================================
  // INDUSTRIAL
  // =========================================================================
  {
    id: 'ind_factory',
    name: 'Manufacturing Factory',
    category: 'industrial',
    description: 'Goods manufacturing plant providing industrial employment.',
    cost: 12000,
    width: 2,
    height: 2,
    maxCapacity: 90,
    powerDemand: 10,
    waterDemand: 12,
    color: '#84cc16',
    accentColor: '#ecfccb',
    icon: 'Factory',
    modelStyle: 'factory',
  },
  {
    id: 'ind_warehouse',
    name: 'Logistics Warehouse',
    category: 'industrial',
    description: 'Freight storage and distribution hub.',
    cost: 15000,
    width: 3,
    height: 2,
    maxCapacity: 75,
    powerDemand: 8,
    waterDemand: 6,
    color: '#65a30d',
    accentColor: '#d9f99d',
    icon: 'Box',
    modelStyle: 'factory',
  },
  {
    id: 'ind_solar_plant',
    name: 'Solar Power Station',
    category: 'industrial',
    description: 'Clean photovoltaic solar energy farm.',
    cost: 30000,
    width: 2,
    height: 2,
    maxCapacity: 15,
    powerDemand: 0,
    waterDemand: 1,
    powerProduction: 120, // 120 MW
    color: '#eab308',
    accentColor: '#fef08a',
    icon: 'Zap',
    modelStyle: 'power_plant',
  },
  {
    id: 'ind_wind_farm',
    name: 'Wind Turbine Farm',
    category: 'industrial',
    description: 'Eco-friendly renewable wind turbines.',
    cost: 22000,
    width: 2,
    height: 1,
    maxCapacity: 8,
    powerDemand: 0,
    waterDemand: 0,
    powerProduction: 85,
    color: '#10b981',
    accentColor: '#a7f3d0',
    icon: 'Wind',
    modelStyle: 'power_plant',
  },

  // =========================================================================
  // PUBLIC INFRASTRUCTURE
  // =========================================================================
  {
    id: 'pub_school',
    name: 'Primary School',
    category: 'public_infrastructure',
    description: 'Educates neighborhood children and boosts city score.',
    cost: 10000,
    width: 2,
    height: 1,
    maxCapacity: 40,
    powerDemand: 5,
    waterDemand: 5,
    serviceRadius: 10,
    color: '#a855f7',
    accentColor: '#f3e8ff',
    icon: 'GraduationCap',
    modelStyle: 'school',
  },
  {
    id: 'pub_hospital',
    name: 'General Hospital',
    category: 'public_infrastructure',
    description: 'Full-service healthcare center serving emergency medical needs.',
    cost: 45000,
    width: 3,
    height: 2,
    maxCapacity: 120,
    powerDemand: 20,
    waterDemand: 25,
    serviceRadius: 16,
    color: '#ec4899',
    accentColor: '#fce7f3',
    icon: 'Activity',
    modelStyle: 'hospital',
  },
  {
    id: 'pub_fire_station',
    name: 'Fire Department',
    category: 'public_infrastructure',
    description: 'Provides fire protection and disaster response.',
    cost: 15000,
    width: 2,
    height: 1,
    maxCapacity: 25,
    powerDemand: 4,
    waterDemand: 6,
    serviceRadius: 12,
    color: '#ef4444',
    accentColor: '#fee2e2',
    icon: 'Flame',
    modelStyle: 'school',
  },
  {
    id: 'pub_police_station',
    name: 'Police Headquarters',
    category: 'public_infrastructure',
    description: 'Ensures public safety and keeps crime rates low.',
    cost: 18000,
    width: 2,
    height: 1,
    maxCapacity: 30,
    powerDemand: 6,
    waterDemand: 5,
    serviceRadius: 14,
    color: '#3b82f6',
    accentColor: '#dbeafe',
    icon: 'Shield',
    modelStyle: 'school',
  },
  {
    id: 'pub_city_hall',
    name: 'City Hall',
    category: 'public_infrastructure',
    description: 'Municipal government administrative headquarters.',
    cost: 60000,
    width: 3,
    height: 3,
    maxCapacity: 80,
    powerDemand: 15,
    waterDemand: 15,
    serviceRadius: 24,
    color: '#6366f1',
    accentColor: '#e0e7ff',
    icon: 'Landmark',
    modelStyle: 'hospital',
  },

  // =========================================================================
  // ENTERTAINMENT & AMENITIES
  // =========================================================================
  {
    id: 'ent_stadium',
    name: 'Sports Stadium',
    category: 'entertainment',
    description: 'Major sports venue hosting football, athletics, and concerts.',
    cost: 85000,
    width: 4,
    height: 3,
    maxCapacity: 350,
    powerDemand: 30,
    waterDemand: 35,
    serviceRadius: 20,
    color: '#10b981',
    accentColor: '#d1fae5',
    icon: 'Trophy',
    modelStyle: 'stadium',
  },
  {
    id: 'ent_cinema',
    name: 'Cinema Complex',
    category: 'entertainment',
    description: 'Multi-screen theater complex for moviegoers.',
    cost: 20000,
    width: 2,
    height: 2,
    maxCapacity: 60,
    powerDemand: 10,
    waterDemand: 8,
    serviceRadius: 12,
    color: '#f43f5e',
    accentColor: '#ffe4e6',
    icon: 'Film',
    modelStyle: 'mall',
  },

  // =========================================================================
  // NATURE & PARKS
  // =========================================================================
  {
    id: 'nat_city_park',
    name: 'City Park',
    category: 'nature',
    description: 'Lush green park with walking paths and trees.',
    cost: 2000,
    width: 1,
    height: 1,
    maxCapacity: 0,
    powerDemand: 0,
    waterDemand: 1,
    serviceRadius: 8,
    color: '#22c55e',
    accentColor: '#dcfce7',
    icon: 'Trees',
    modelStyle: 'park',
  },
  {
    id: 'nat_botanical_garden',
    name: 'Botanical Garden',
    category: 'nature',
    description: 'Expansive flora research and leisure park.',
    cost: 12000,
    width: 2,
    height: 2,
    maxCapacity: 20,
    powerDemand: 2,
    waterDemand: 10,
    serviceRadius: 14,
    color: '#16a34a',
    accentColor: '#bbf7d0',
    icon: 'Flower2',
    modelStyle: 'park',
  },

  // =========================================================================
  // TRANSPORT & UTILITY
  // =========================================================================
  {
    id: 'tra_bus_terminal',
    name: 'Bus Central Station',
    category: 'transport',
    description: 'Central transit terminal for passenger buses.',
    cost: 15000,
    width: 2,
    height: 2,
    maxCapacity: 40,
    powerDemand: 5,
    waterDemand: 5,
    serviceRadius: 12,
    color: '#0ea5e9',
    accentColor: '#e0f2fe',
    icon: 'Bus',
    modelStyle: 'station',
  },
  {
    id: 'tra_metro_station',
    name: 'Subway / Metro Station',
    category: 'transport',
    description: 'Underground high-speed rail network station.',
    cost: 28000,
    width: 2,
    height: 1,
    maxCapacity: 60,
    powerDemand: 12,
    waterDemand: 4,
    serviceRadius: 18,
    color: '#0284c7',
    accentColor: '#e0f2fe',
    icon: 'Train',
    modelStyle: 'station',
  },
  {
    id: 'util_water_facility',
    name: 'Water Treatment Facility',
    category: 'utility',
    description: 'Pumps and purifies fresh municipal water.',
    cost: 25000,
    width: 2,
    height: 2,
    maxCapacity: 15,
    powerDemand: 10,
    waterDemand: 0,
    waterProduction: 500, // 500 KL/day
    color: '#06b6d4',
    accentColor: '#cffaff',
    icon: 'Droplets',
    modelStyle: 'water_tower',
  },
];

export interface CityTemplateDefinition {
  id: string;
  name: string;
  description: string;
  treasury: number;
  gridSize: number;
  previewColor: string;
}

export const CITY_TEMPLATES: CityTemplateDefinition[] = [
  {
    id: 'modern_metropolis',
    name: 'Modern Metropolis',
    description: 'Dense commercial skyscraper core with connected residential rings.',
    treasury: 250000,
    gridSize: 64,
    previewColor: '#0284c7',
  },
  {
    id: 'smart_green_city',
    name: 'Smart Green City',
    description: 'Solar energy grid, expansive botanical parks, and zero-emission transit.',
    treasury: 200000,
    gridSize: 64,
    previewColor: '#16a34a',
  },
  {
    id: 'coastal_city',
    name: 'Coastal Beach Resort',
    description: 'Scenic ocean coastline, beachfront hotels, and marina district.',
    treasury: 220000,
    gridSize: 64,
    previewColor: '#06b6d4',
  },
  {
    id: 'mountain_valley',
    name: 'Mountain Valley Town',
    description: 'Elevated topography with winding mountain roads and valley lake.',
    treasury: 180000,
    gridSize: 64,
    previewColor: '#84cc16',
  },
  {
    id: 'industrial_hub',
    name: 'Industrial Power Hub',
    description: 'Heavy manufacturing complexes, freight warehouses, and highway corridors.',
    treasury: 210000,
    gridSize: 64,
    previewColor: '#d97706',
  },
  {
    id: 'futuristic_cyber',
    name: 'Futuristic Cyber City',
    description: 'Neon-lit towers, high-speed metro lines, and advanced tech hubs.',
    treasury: 300000,
    gridSize: 64,
    previewColor: '#a855f7',
  },
  {
    id: 'small_town',
    name: 'Peaceful Small Town',
    description: 'Charming main street, cozy single-family homes, and local school.',
    treasury: 150000,
    gridSize: 64,
    previewColor: '#38bdf8',
  },
  {
    id: 'empty_canvas',
    name: 'Empty Pristine Land',
    description: 'Blank 64x64 grid canvas ready for your custom city design.',
    treasury: 300000,
    gridSize: 64,
    previewColor: '#22c55e',
  },
];

/**
 * Procedurally generates initial city layout based on selected template
 */
export function generateTemplateCity(
  templateId: string,
  userId: string,
  projectName: string
): CityProject {
  const gridSize = 64;
  const tiles: TileData[] = [];
  const buildings: BuildingInstance[] = [];

  // Initialize empty grid
  for (let z = 0; z < gridSize; z++) {
    for (let x = 0; x < gridSize; x++) {
      tiles.push({
        x,
        z,
        elevation: 0,
        terrain: 'grass',
      });
    }
  }

  const getTile = (x: number, z: number) => tiles[z * gridSize + x];

  // Apply template specifics
  if (templateId === 'coastal_city') {
    // Add coastal water on right edge
    for (let z = 0; z < gridSize; z++) {
      for (let x = 46; x < gridSize; x++) {
        const t = getTile(x, z);
        if (t) {
          t.terrain = x >= 50 ? 'water' : 'sand';
        }
      }
    }
  } else if (templateId === 'mountain_valley') {
    // Elevate left/top mountain ridge & central lake
    for (let z = 0; z < gridSize; z++) {
      for (let x = 0; x < gridSize; x++) {
        const t = getTile(x, z);
        if (t) {
          if (x < 12 || z < 10) {
            t.elevation = Math.min(4, Math.floor((12 - x + (10 - z)) / 3) + 1);
            if (t.elevation > 0) t.terrain = 'soil';
          } else if (x > 26 && x < 38 && z > 26 && z < 38) {
            t.terrain = 'water';
          }
        }
      }
    }
  }

  // Helper to place road on tile
  const placeRoad = (x: number, z: number) => {
    const t = getTile(x, z);
    if (t && t.terrain !== 'water') {
      t.isRoad = true;
      t.roadType = 'straight';
    }
  };

  // Helper to place building instance
  const placeBuilding = (defId: string, x: number, z: number) => {
    const def = BUILDING_CATALOG.find((b) => b.id === defId);
    if (!def) return;
    const instId = `inst-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    for (let dz = 0; dz < def.height; dz++) {
      for (let dx = 0; dx < def.width; dx++) {
        const t = getTile(x + dx, z + dz);
        if (t) {
          t.buildingId = defId;
          t.buildingInstanceId = instId;
        }
      }
    }

    buildings.push({
      instanceId: instId,
      defId,
      x,
      z,
      rotation: 0,
      occupancy: Math.floor(def.maxCapacity * 0.75),
      powered: true,
      watered: true,
      constructedAt: Date.now(),
    });
  };

  // Build template features if not empty canvas
  if (templateId !== 'empty_canvas') {
    const centerX = 32;
    const centerZ = 32;

    // Create central Avenue roads
    for (let i = 12; i < 52; i++) {
      placeRoad(i, centerZ);
      placeRoad(centerX, i);
      placeRoad(i, centerZ - 12);
      placeRoad(i, centerZ + 12);
      placeRoad(centerX - 12, i);
      placeRoad(centerX + 12, i);
    }

    // Always place core power & water utilities
    placeBuilding('ind_solar_plant', centerX - 18, centerZ - 18);
    placeBuilding('util_water_facility', centerX + 15, centerZ - 18);
    placeBuilding('pub_fire_station', centerX - 15, centerZ + 15);
    placeBuilding('pub_police_station', centerX + 15, centerZ + 15);
    placeBuilding('pub_school', centerX - 8, centerZ - 8);

    if (templateId === 'modern_metropolis' || templateId === 'futuristic_cyber') {
      placeBuilding('com_office_tower', centerX + 2, centerZ + 2);
      placeBuilding('com_shopping_mall', centerX - 6, centerZ + 2);
      placeBuilding('res_residential_tower', centerX + 2, centerZ - 6);
      placeBuilding('res_apartment_block', centerX - 5, centerZ - 5);
      placeBuilding('ent_stadium', centerX + 14, centerZ + 2);
      placeBuilding('tra_metro_station', centerX, centerZ + 1);
    } else if (templateId === 'smart_green_city') {
      placeBuilding('nat_botanical_garden', centerX + 2, centerZ + 2);
      placeBuilding('nat_city_park', centerX - 4, centerZ + 2);
      placeBuilding('ind_wind_farm', centerX - 16, centerZ - 16);
      placeBuilding('res_apartment_block', centerX + 2, centerZ - 5);
      placeBuilding('com_corner_shop', centerX - 3, centerZ - 3);
    } else if (templateId === 'small_town') {
      placeBuilding('res_small_house', centerX - 4, centerZ - 4);
      placeBuilding('res_small_house', centerX + 2, centerZ - 4);
      placeBuilding('res_small_house', centerX - 4, centerZ + 2);
      placeBuilding('com_corner_shop', centerX + 2, centerZ + 2);
    } else {
      placeBuilding('res_apartment_block', centerX - 5, centerZ - 5);
      placeBuilding('com_corner_shop', centerX + 2, centerZ + 2);
      placeBuilding('ind_factory', centerX - 16, centerZ + 2);
    }
  }

  const templateDef = CITY_TEMPLATES.find((t) => t.id === templateId) || CITY_TEMPLATES[0];

  return {
    id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    userId,
    name: projectName || templateDef.name,
    templateId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    gridSize,
    tiles,
    buildings,
    treasury: templateDef.treasury,
  };
}
