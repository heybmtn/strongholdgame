import type { World } from '../game/World';
import type { Villager } from '../entities/Villager';
import { GATHER_DURATION, GATHER_YIELD, createVillager } from '../entities/Villager';
import type { Building } from '../entities/Building';
import { BUILDING_DEFS } from '../buildings/BuildingDefs';
import { tileToWorldCenter, worldToTile } from '../world/Map';
import type { Point } from '../world/Map';
import { findPath } from '../world/Pathfinding';

const ARRIVAL_EPSILON = 2;
const POPULATION_SPAWN_INTERVAL = 15; // seconds
export const MAX_POPULATION = 50;
const MIN_FOOD_SURPLUS_TO_GROW = 10;
const FARM_PRODUCTION_INTERVAL = 10; // seconds
const FOOD_CONSUMPTION_INTERVAL = 20; // seconds, one "day"
const FOOD_PER_VILLAGER = 1;
const TREE_YIELD_CAPACITY = 100;
export const SAPLING_GROW_SECONDS = 45;

let spawnTimer = 0;
let farmProductionTimer = 0;
let foodConsumptionTimer = 0;

export function tick(dt: number, world: World) {
  advanceConstruction(dt, world);
  advanceAging(dt, world);
  advanceSaplings(dt, world);
  advanceFarmProduction(dt, world);
  advanceFoodConsumption(dt, world);
  advancePopulationGrowth(dt, world);
  for (const villager of world.villagers) {
    updateVillager(villager, dt, world);
  }
}

function advanceConstruction(dt: number, world: World) {
  for (const building of world.buildings) {
    if (building.state !== 'underConstruction') continue;
    building.constructionProgress += dt;
    const def = BUILDING_DEFS[building.type];
    if (building.constructionProgress >= def.buildTimeSeconds) {
      building.state = 'active';
      claimWorkers(building, world.villagers);
    }
  }
}

function claimWorkers(building: Building, villagers: Villager[]) {
  const def = BUILDING_DEFS[building.type];
  if (!def.workerSlots || !def.gatherJob) return;
  const isFarm = def.gatherJob === 'farmer';
  for (const villager of villagers) {
    if (building.workerIds.length >= def.workerSlots) break;
    if (villager.job !== 'idle') continue;
    if (!isFarm && villager.ageGroup === 'kid') continue;
    villager.job = def.gatherJob;
    villager.state = 'idle';
    villager.workplaceBuildingId = isFarm ? building.id : null;
    building.workerIds.push(villager.id);
  }
}

function getPopulationCap(buildings: Building[]): number {
  let cap = 0;
  for (const building of buildings) {
    if (building.state !== 'active') continue;
    const def = BUILDING_DEFS[building.type];
    cap += def.populationCap ?? 0;
  }
  return cap;
}

function getFoodCapacity(buildings: Building[]): number {
  let cap = 0;
  for (const building of buildings) {
    if (building.state !== 'active') continue;
    const def = BUILDING_DEFS[building.type];
    cap += def.foodCapacity ?? 0;
  }
  return cap;
}

function findDropoffBuilding(buildings: Building[]): Building | null {
  return buildings.find((b) => b.state === 'active' && BUILDING_DEFS[b.type].acceptsDropoff) ?? null;
}

function advancePopulationGrowth(dt: number, world: World) {
  spawnTimer += dt;
  if (spawnTimer < POPULATION_SPAWN_INTERVAL) return;
  spawnTimer = 0;

  const cap = Math.min(getPopulationCap(world.buildings), MAX_POPULATION);
  if (world.villagers.length >= cap) return;
  if (world.resources.get('food') < MIN_FOOD_SURPLUS_TO_GROW) return;

  const keep = world.buildings.find((b) => b.type === 'keep');
  if (!keep) return;
  world.villagers.push(createVillager(keep.position, 'kid'));
}

function advanceAging(dt: number, world: World) {
  for (const villager of world.villagers) {
    if (villager.ageGroup !== 'kid') continue;
    villager.ageTimer -= dt;
    if (villager.ageTimer <= 0) {
      villager.ageGroup = 'adult';
      villager.ageTimer = 0;
    }
  }
}

function advanceSaplings(dt: number, world: World) {
  world.map.forEachTile((tile) => {
    if (tile.saplingTimer <= 0) return;
    tile.saplingTimer -= dt;
    if (tile.saplingTimer <= 0) {
      tile.saplingTimer = 0;
      tile.type = 'forest';
      tile.resourceAmount = TREE_YIELD_CAPACITY;
    }
  });
}

function advanceFarmProduction(dt: number, world: World) {
  farmProductionTimer += dt;
  if (farmProductionTimer < FARM_PRODUCTION_INTERVAL) return;
  farmProductionTimer = 0;

  const def = BUILDING_DEFS.farm;
  let totalYield = 0;
  for (const building of world.buildings) {
    if (building.type !== 'farm' || building.state !== 'active') continue;
    totalYield += building.workerIds.length * (def.foodYieldPerWorker ?? 0);
  }
  if (totalYield <= 0) return;
  world.resources.addFoodCapped(totalYield, getFoodCapacity(world.buildings));
}

function advanceFoodConsumption(dt: number, world: World) {
  foodConsumptionTimer += dt;
  if (foodConsumptionTimer < FOOD_CONSUMPTION_INTERVAL) return;
  foodConsumptionTimer = 0;

  const needed = world.villagers.length * FOOD_PER_VILLAGER;
  if (needed <= 0) return;

  if (world.resources.canAfford({ food: needed })) {
    world.resources.spend({ food: needed });
    return;
  }

  const available = world.resources.get('food');
  const shortfall = needed - available;
  removeStarvingVillagers(world.villagers, Math.ceil(shortfall / FOOD_PER_VILLAGER));
  world.resources.spend({ food: available });
}

function removeStarvingVillagers(villagers: Villager[], count: number) {
  let remaining = count;
  const removeWhere = (predicate: (v: Villager) => boolean) => {
    for (let i = villagers.length - 1; i >= 0 && remaining > 0; i--) {
      if (predicate(villagers[i])) {
        villagers.splice(i, 1);
        remaining--;
      }
    }
  };
  removeWhere((v) => v.ageGroup === 'kid');
  removeWhere((v) => v.job === 'idle');
  removeWhere(() => true);
}

function moveToward(villager: Villager, target: Point, dt: number): boolean {
  const dx = target.x - villager.position.x;
  const dy = target.y - villager.position.y;
  const dist = Math.hypot(dx, dy);
  if (dist <= ARRIVAL_EPSILON) {
    villager.position.x = target.x;
    villager.position.y = target.y;
    return true;
  }
  const step = villager.speed * dt;
  if (step >= dist) {
    villager.position.x = target.x;
    villager.position.y = target.y;
    return true;
  }
  villager.position.x += (dx / dist) * step;
  villager.position.y += (dy / dist) * step;
  return false;
}

function resourceTileTypeForJob(job: Villager['job']): 'forest' | 'stone' | null {
  if (job === 'woodcutter') return 'forest';
  if (job === 'quarrier') return 'stone';
  return null;
}

function updateVillager(villager: Villager, dt: number, world: World) {
  switch (villager.state) {
    case 'idle': {
      if (villager.job === 'farmer') {
        const workplace = villager.workplaceBuildingId
          ? world.buildings.find((b) => b.id === villager.workplaceBuildingId)
          : null;
        if (!workplace) return;
        villager.target = workplace.position;
        villager.state = 'walkingToResource';
        return;
      }
      const tileType = resourceTileTypeForJob(villager.job);
      if (!tileType) return;
      const currentTile = worldToTile(villager.position.x, villager.position.y);
      const nearest = world.map.findNearestResourceTile(currentTile, tileType);
      if (!nearest) return;
      villager.targetTile = nearest;
      villager.target = tileToWorldCenter(nearest.x, nearest.y);
      villager.state = 'walkingToResource';
      break;
    }
    case 'walkingToResource': {
      if (!villager.target) {
        villager.state = 'idle';
        return;
      }
      const [waypoint] = findPath(villager.position, villager.target);
      const arrived = moveToward(villager, waypoint, dt);
      if (arrived) {
        if (villager.job === 'farmer') {
          villager.state = 'working';
        } else {
          villager.state = 'gathering';
          villager.gatherTimer = GATHER_DURATION;
        }
      }
      break;
    }
    case 'gathering': {
      villager.gatherTimer -= dt;
      if (villager.gatherTimer > 0) return;

      const tileType = resourceTileTypeForJob(villager.job);
      const tile = villager.targetTile ? world.map.getTile(villager.targetTile.x, villager.targetTile.y) : null;
      if (!tileType || !tile || tile.type !== tileType || tile.resourceAmount <= 0) {
        villager.state = 'idle';
        villager.target = null;
        villager.targetTile = null;
        return;
      }

      tile.resourceAmount = Math.max(0, tile.resourceAmount - GATHER_YIELD);
      villager.carrying = { type: tileType === 'forest' ? 'wood' : 'stone', amount: GATHER_YIELD };

      const dropoff = findDropoffBuilding(world.buildings);
      if (!dropoff) {
        villager.state = 'idle';
        return;
      }
      villager.target = dropoff.position;
      villager.state = 'walkingToDropoff';
      break;
    }
    case 'walkingToDropoff': {
      if (!villager.target) {
        villager.state = 'idle';
        return;
      }
      const arrived = moveToward(villager, villager.target, dt);
      if (arrived) {
        villager.state = 'depositing';
      }
      break;
    }
    case 'depositing': {
      if (villager.carrying) {
        world.resources.add(villager.carrying.type, villager.carrying.amount);
        villager.carrying = null;
      }
      if (villager.targetTile) {
        villager.target = tileToWorldCenter(villager.targetTile.x, villager.targetTile.y);
        villager.state = 'walkingToResource';
      } else {
        villager.state = 'idle';
        villager.target = null;
      }
      break;
    }
    case 'working': {
      // Stationary production job (e.g. farmer). Production itself is
      // accrued at the building level in advanceFarmProduction.
      return;
    }
  }
}
