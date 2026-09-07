import type { Entity } from './Entity';
import { generateId } from './Entity';
import type { Point } from '../world/Map';
import type { BuildingType } from '../buildings/BuildingDefs';

export type BuildingState = 'underConstruction' | 'active';

export interface Building extends Entity {
  type: BuildingType;
  tileX: number;
  tileY: number;
  state: BuildingState;
  constructionProgress: number;
  workerIds: string[];
}

export function createBuilding(
  type: BuildingType,
  tileX: number,
  tileY: number,
  worldPosition: Point,
  state: BuildingState = 'underConstruction',
): Building {
  return {
    id: generateId('building'),
    position: { ...worldPosition },
    type,
    tileX,
    tileY,
    state,
    constructionProgress: 0,
    workerIds: [],
  };
}
