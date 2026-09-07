import type { Entity } from './Entity';
import { generateId } from './Entity';
import type { Point } from '../world/Map';

export type VillagerJob = 'idle' | 'woodcutter' | 'quarrier';
export type VillagerState =
  | 'idle'
  | 'walkingToResource'
  | 'gathering'
  | 'walkingToDropoff'
  | 'depositing';

export type ResourceType = 'wood' | 'stone';

export interface Villager extends Entity {
  job: VillagerJob;
  state: VillagerState;
  target: Point | null;
  targetTile: Point | null;
  carrying: { type: ResourceType; amount: number } | null;
  gatherTimer: number;
  speed: number;
}

export const VILLAGER_SPEED = 60; // px/sec
export const GATHER_DURATION = 3; // seconds
export const GATHER_YIELD = 10;

export function createVillager(position: Point): Villager {
  return {
    id: generateId('villager'),
    position: { ...position },
    job: 'idle',
    state: 'idle',
    target: null,
    targetTile: null,
    carrying: null,
    gatherTimer: 0,
    speed: VILLAGER_SPEED,
  };
}
