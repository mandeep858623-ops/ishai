/**
 * CITYVERSE — Live City Simulation & Traffic Graph Engine
 */

import {
  TileData,
  BuildingInstance,
  CitySimulationState,
  VehicleAgent,
  RoadType,
} from './types';
import { BUILDING_CATALOG } from './cityData';

/**
 * Recalculates city simulation metrics based on actual 3D city tiles & buildings
 */
export function recalculateSimulationState(
  gridSize: number,
  tiles: TileData[],
  buildings: BuildingInstance[],
  currentState: CitySimulationState
): { nextState: CitySimulationState; updatedTiles: TileData[] } {
  let resCapacity = 0;
  let comCapacity = 0;
  let totalJobs = 0;
  let powerDemand = 0;
  let powerSupply = 0;
  let waterDemand = 0;
  let waterSupply = 0;

  const powerSources: Array<{ x: number; z: number; radius: number }> = [];
  const waterSources: Array<{ x: number; z: number; radius: number }> = [];
  const serviceCenters: Array<{ x: number; z: number; radius: number }> = [];

  // 1. Scan Buildings & Aggregate Capacities / Demand
  buildings.forEach((b) => {
    const def = BUILDING_CATALOG.find((catalogItem) => catalogItem.id === b.defId);
    if (!def) return;

    if (def.category === 'residential') {
      resCapacity += def.maxCapacity;
    } else if (def.category === 'commercial') {
      comCapacity += def.maxCapacity;
      totalJobs += def.maxCapacity;
    } else if (def.category === 'industrial') {
      totalJobs += def.maxCapacity;
    } else if (def.category === 'public_infrastructure') {
      totalJobs += Math.floor(def.maxCapacity * 0.5);
    }

    powerDemand += def.powerDemand;
    waterDemand += def.waterDemand;

    if (def.powerProduction && def.powerProduction > 0) {
      powerSupply += def.powerProduction;
      powerSources.push({ x: b.x, z: b.z, radius: 25 });
    }

    if (def.waterProduction && def.waterProduction > 0) {
      waterSupply += def.waterProduction;
      waterSources.push({ x: b.x, z: b.z, radius: 25 });
    }

    if (def.serviceRadius && def.serviceRadius > 0) {
      serviceCenters.push({ x: b.x, z: b.z, radius: def.serviceRadius });
    }
  });

  // 2. Scan Tiles for Infrastructure Coverage
  let roadTileCount = 0;
  const updatedTiles = tiles.map((tile) => {
    if (tile.isRoad) roadTileCount++;

    const distToPower = powerSources.some(
      (p) => Math.hypot(tile.x - p.x, tile.z - p.z) <= p.radius
    );
    const distToWater = waterSources.some(
      (w) => Math.hypot(tile.x - w.x, tile.z - w.z) <= w.radius
    );
    const distToService = serviceCenters.some(
      (s) => Math.hypot(tile.x - s.x, tile.z - s.z) <= s.radius
    );

    return {
      ...tile,
      hasPower: distToPower || powerSupply >= powerDemand,
      hasWater: distToWater || waterSupply >= waterDemand,
      hasServiceCoverage: distToService,
    };
  });

  // 3. Population & Employment Calculations
  const livabilityRatio =
    (powerSupply >= powerDemand ? 0.3 : 0.1) +
    (waterSupply >= waterDemand ? 0.3 : 0.1) +
    (roadTileCount > 10 ? 0.2 : 0.05) +
    (serviceCenters.length > 0 ? 0.2 : 0.05);

  const estimatedPop = Math.min(resCapacity, Math.floor(resCapacity * livabilityRatio * 0.85));
  const employedCount = Math.min(estimatedPop, totalJobs);

  // Financial Revenue vs Expenses
  const monthlyRevenue = Math.floor(estimatedPop * 12 + totalJobs * 8);
  const monthlyExpenses = Math.floor(powerSupply * 5 + waterSupply * 4 + serviceCenters.length * 150);

  // Warnings
  const warnings: string[] = [];
  if (powerSupply < powerDemand) {
    warnings.push(`Electricity Deficit: Need ${powerDemand - powerSupply} MW additional power generation.`);
  }
  if (waterSupply < waterDemand) {
    warnings.push(`Water Supply Deficit: Need ${waterDemand - waterSupply} KL/day additional water capacity.`);
  }
  if (resCapacity > 0 && totalJobs < resCapacity * 0.3) {
    warnings.push('Job Shortage: Build commercial or industrial zones to employ residents.');
  }
  if (roadTileCount < 12) {
    warnings.push('Road Network Incomplete: Connect buildings to roads for optimal transit.');
  }

  // Calculate City Score (0 - 100)
  const powerScore = Math.min(100, Math.round((powerSupply / (powerDemand || 1)) * 100));
  const waterScore = Math.min(100, Math.round((waterSupply / (waterDemand || 1)) * 100));
  const employmentScore = totalJobs > 0 ? Math.min(100, Math.round((employedCount / (estimatedPop || 1)) * 100)) : 50;

  const cityScore = Math.min(
    100,
    Math.max(10, Math.round((powerScore * 0.3 + waterScore * 0.3 + employmentScore * 0.25 + livabilityRatio * 100 * 0.15)))
  );

  const nextState: CitySimulationState = {
    ...currentState,
    population: estimatedPop,
    employedCount,
    totalJobs,
    residentialCapacity: resCapacity,
    commercialCapacity: comCapacity,
    powerDemandTotal: powerDemand,
    powerCapacityTotal: powerSupply,
    waterDemandTotal: waterDemand,
    waterCapacityTotal: waterSupply,
    monthlyRevenue,
    monthlyExpenses,
    trafficIndex: Math.min(95, Math.max(5, Math.floor((estimatedPop / (roadTileCount || 1)) * 4))),
    cityScore,
    warnings,
  };

  return { nextState, updatedTiles };
}

/**
 * Finds road network path using BFS graph search
 */
export function findRoadPath(
  gridSize: number,
  tiles: TileData[],
  startX: number,
  startZ: number,
  targetX: number,
  targetZ: number
): Array<{ x: number; z: number }> {
  const getRoadTile = (x: number, z: number) => {
    if (x < 0 || x >= gridSize || z < 0 || z >= gridSize) return null;
    const t = tiles[z * gridSize + x];
    return t && t.isRoad ? t : null;
  };

  if (!getRoadTile(startX, startZ) || !getRoadTile(targetX, targetZ)) return [];

  const queue: Array<{ x: number; z: number; path: Array<{ x: number; z: number }> }> = [
    { x: startX, z: startZ, path: [{ x: startX, z: startZ }] },
  ];
  const visited = new Set<string>();
  visited.add(`${startX},${startZ}`);

  const neighbors = [
    { dx: 1, dz: 0 },
    { dx: -1, dz: 0 },
    { dx: 0, dz: 1 },
    { dx: 0, dz: -1 },
  ];

  while (queue.length > 0 && queue.length < 500) {
    const current = queue.shift()!;
    if (current.x === targetX && current.z === targetZ) {
      return current.path;
    }

    for (const n of neighbors) {
      const nx = current.x + n.dx;
      const nz = current.z + n.dz;
      const key = `${nx},${nz}`;

      if (!visited.has(key) && getRoadTile(nx, nz)) {
        visited.add(key);
        queue.push({
          x: nx,
          z: nz,
          path: [...current.path, { x: nx, z: nz }],
        });
      }
    }
  }

  return [];
}

/**
 * Spawns and updates moving vehicle agents along connected road network
 */
export function updateVehicles(
  gridSize: number,
  tiles: TileData[],
  existingVehicles: VehicleAgent[],
  deltaSeconds: number,
  simSpeed: number
): VehicleAgent[] {
  if (simSpeed === 0) return existingVehicles;

  const roadTiles = tiles.filter((t) => t.isRoad);
  if (roadTiles.length < 2) return [];

  const vehicleColors = ['#f59e0b', '#3b82f6', '#ef4444', '#10b981', '#a855f7', '#06b6d4'];
  const updated = existingVehicles.map((v) => {
    if (v.path.length < 2) return null;

    const currentEdge = v.path[v.currentPathIdx];
    const nextEdge = v.path[v.currentPathIdx + 1] || currentEdge;

    let newProgress = v.progress + v.speed * deltaSeconds * simSpeed;
    let newIdx = v.currentPathIdx;

    if (newProgress >= 1.0) {
      newProgress = 0;
      newIdx++;
    }

    if (newIdx >= v.path.length - 1) {
      // Reached destination - loop back
      newIdx = 0;
      newProgress = 0;
    }

    const p1 = v.path[newIdx];
    const p2 = v.path[newIdx + 1] || p1;

    const posX = p1.x + (p2.x - p1.x) * newProgress;
    const posZ = p1.z + (p2.z - p1.z) * newProgress;
    const rotY = Math.atan2(p2.x - p1.x, p2.z - p1.z);

    return {
      ...v,
      currentPathIdx: newIdx,
      progress: newProgress,
      posX,
      posZ,
      rotY,
    };
  }).filter(Boolean) as VehicleAgent[];

  // Spawn new vehicles if count is below threshold
  const targetVehicleCount = Math.min(24, Math.floor(roadTiles.length / 3));
  if (updated.length < targetVehicleCount) {
    const startTile = roadTiles[Math.floor(Math.random() * roadTiles.length)];
    const endTile = roadTiles[Math.floor(Math.random() * roadTiles.length)];

    if (startTile && endTile && (startTile.x !== endTile.x || startTile.z !== endTile.z)) {
      const path = findRoadPath(gridSize, tiles, startTile.x, startTile.z, endTile.x, endTile.z);
      if (path.length >= 2) {
        updated.push({
          id: `veh-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: Math.random() > 0.3 ? 'car' : Math.random() > 0.5 ? 'bus' : 'taxi',
          color: vehicleColors[Math.floor(Math.random() * vehicleColors.length)],
          path,
          currentPathIdx: 0,
          progress: 0,
          speed: 1.2 + Math.random() * 0.8,
          posX: path[0].x,
          posZ: path[0].z,
          rotY: 0,
        });
      }
    }
  }

  return updated;
}
