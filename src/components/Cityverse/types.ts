/**
 * CITYVERSE — Interactive 3D City Simulator Types & Schemas
 */

export type TerrainType = 'grass' | 'water' | 'sand' | 'soil' | 'paved' | 'concrete';

export type BuildingCategory =
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'public_infrastructure'
  | 'entertainment'
  | 'nature'
  | 'transport'
  | 'utility';

export interface BuildingDefinition {
  id: string;
  name: string;
  category: BuildingCategory;
  description: string;
  cost: number;
  width: number;  // Grid tile width
  height: number; // Grid tile height (depth)
  maxCapacity: number; // Housing capacity or Job capacity
  powerDemand: number; // MW
  waterDemand: number; // KL/day
  powerProduction?: number; // Power generated if utility
  waterProduction?: number; // Water generated if utility
  serviceRadius?: number; // Service coverage tiles
  color: string;
  accentColor: string;
  icon: string;
  modelStyle: 'house' | 'apartment' | 'skyscraper' | 'shop' | 'mall' | 'office' | 'factory' | 'power_plant' | 'school' | 'hospital' | 'stadium' | 'park' | 'station' | 'water_tower';
}

export type RoadType = 'straight' | 'corner' | 't_junction' | 'cross' | 'bridge' | 'highway' | 'pathway';

export interface TileData {
  x: number;
  z: number;
  elevation: number; // 0 = sea level, 1-5 = hills
  terrain: TerrainType;
  buildingId?: string; // ID from catalog
  buildingInstanceId?: string;
  buildingRotation?: number; // 0, 90, 180, 270
  isRoad?: boolean;
  roadType?: RoadType;
  roadRotation?: number;
  hasPower?: boolean;
  hasWater?: boolean;
  hasServiceCoverage?: boolean;
  trafficLevel?: number; // 0 to 1
}

export interface BuildingInstance {
  instanceId: string;
  defId: string;
  x: number;
  z: number;
  rotation: number;
  occupancy: number;
  powered: boolean;
  watered: boolean;
  constructedAt: number;
}

export interface VehicleAgent {
  id: string;
  type: 'car' | 'bus' | 'taxi' | 'truck';
  color: string;
  path: Array<{ x: number; z: number }>;
  currentPathIdx: number;
  progress: number; // 0 to 1 along current edge
  speed: number;
  posX: number;
  posZ: number;
  rotY: number;
}

export interface CitySimulationState {
  timeOfDay: 'day' | 'sunset' | 'night' | 'sunrise';
  timeHour: number; // 0 to 24
  speed: 0 | 1 | 2 | 4; // 0 = pause
  population: number;
  employedCount: number;
  totalJobs: number;
  residentialCapacity: number;
  commercialCapacity: number;
  treasury: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  powerDemandTotal: number;
  powerCapacityTotal: number;
  waterDemandTotal: number;
  waterCapacityTotal: number;
  trafficIndex: number; // 0% to 100%
  cityScore: number; // 0 to 100
  warnings: string[];
}

export interface CityProject {
  id: string;
  userId: string;
  name: string;
  templateId: string;
  createdAt: string;
  updatedAt: string;
  gridSize: number; // 64 or 80
  tiles: TileData[];
  buildings: BuildingInstance[];
  treasury: number;
  thumbnailUrl?: string;
}

export type OverlayMode = 'normal' | 'power' | 'water' | 'traffic' | 'services' | 'elevation';

export type ActiveTool =
  | 'select'
  | 'demolish'
  | 'road'
  | 'building'
  | 'terrain_raise'
  | 'terrain_lower'
  | 'terrain_flatten'
  | 'terrain_water'
  | 'terrain_paint'
  | 'plant_tree';

export interface ProposedCityAction {
  type: 'PLACE_BUILDING' | 'ADD_ROAD' | 'DEMOLISH' | 'EDIT_TERRAIN' | 'PLANT_TREES';
  description: string;
  targetX: number;
  targetZ: number;
  buildingDefId?: string;
  terrainType?: TerrainType;
  width?: number;
  height?: number;
}

export interface AiProposalBatch {
  title: string;
  explanation: string;
  actions: ProposedCityAction[];
}
