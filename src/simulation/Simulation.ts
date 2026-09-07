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

let spawnTimer = 0;

export function tick(dt: number, world: World) {
  advanceConstruction(dt, world);
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
  for (const villager of villagers) {
    if (building.workerIds.length >= def.workerSlots) break;
    if (villager.job !== 'idle') continue;
    villager.job = def.gatherJob;
    villager.state = 'idle';
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

function findDropoffBuilding(buildings: Building[]): Building | null {
  return buildings.find((b) => b.state === 'active' && BUILDING_DEFS[b.type].acceptsDropoff) ?? null;
}

function advancePopulationGrowth(dt: number, world: World) {
  spawnTimer += dt;
  if (spawnTimer < POPULATION_SPAWN_INTERVAL) return;
  spawnTimer = 0;

  const cap = getPopulationCap(world.buildings);
  if (world.villagers.length >= cap) return;

  const keep = world.buildings.find((b) => b.type === 'keep');
  if (!keep) return;
  world.villagers.push(createVillager(keep.position));
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
        villager.state = 'gathering';
        villager.gatherTimer = GATHER_DURATION;
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
  }
}
