import type { Entity } from './Entity';
import { generateId } from './Entity';
import type { Point } from '../world/Map';

export type VillagerJob = 'idle' | 'woodcutter' | 'quarrier' | 'farmer';
export type VillagerState =
  | 'idle'
  | 'walkingToResource'
  | 'gathering'
  | 'walkingToDropoff'
  | 'depositing'
  | 'working';

export type ResourceType = 'wood' | 'stone';
export type AgeGroup = 'kid' | 'adult';

export interface Villager extends Entity {
  job: VillagerJob;
  state: VillagerState;
  target: Point | null;
  targetTile: Point | null;
  carrying: { type: ResourceType; amount: number } | null;
  gatherTimer: number;
  speed: number;
  ageGroup: AgeGroup;
  ageTimer: number;
  workplaceBuildingId: string | null;
}

export const VILLAGER_SPEED = 60; // px/sec
export const GATHER_DURATION = 3; // seconds
export const GATHER_YIELD = 10;
export const KID_GROW_UP_SECONDS = 60;

export function createVillager(position: Point, ageGroup: AgeGroup = 'adult'): Villager {
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
    ageGroup,
    ageTimer: ageGroup === 'kid' ? KID_GROW_UP_SECONDS : 0,
    workplaceBuildingId: null,
  };
}
