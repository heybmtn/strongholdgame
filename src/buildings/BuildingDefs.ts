import type { VillagerJob } from '../entities/Villager';

export type BuildingType = 'keep' | 'house' | 'woodcutterHut' | 'quarry';

export interface BuildingDef {
  type: BuildingType;
  name: string;
  footprint: { w: number; h: number };
  cost: { wood?: number; stone?: number };
  buildTimeSeconds: number;
  populationCap?: number;
  acceptsDropoff?: boolean;
  workerSlots?: number;
  gatherJob?: VillagerJob;
}

export const BUILDING_DEFS: Record<BuildingType, BuildingDef> = {
  keep: {
    type: 'keep',
    name: 'Keep',
    footprint: { w: 3, h: 3 },
    cost: {},
    buildTimeSeconds: 0,
    acceptsDropoff: true,
    populationCap: 3,
  },
  house: {
    type: 'house',
    name: 'House',
    footprint: { w: 2, h: 2 },
    cost: { wood: 20 },
    buildTimeSeconds: 10,
    populationCap: 4,
  },
  woodcutterHut: {
    type: 'woodcutterHut',
    name: "Woodcutter's Hut",
    footprint: { w: 2, h: 2 },
    cost: { wood: 15 },
    buildTimeSeconds: 8,
    workerSlots: 2,
    gatherJob: 'woodcutter',
  },
  quarry: {
    type: 'quarry',
    name: 'Quarry',
    footprint: { w: 2, h: 2 },
    cost: { wood: 15 },
    buildTimeSeconds: 8,
    workerSlots: 2,
    gatherJob: 'quarrier',
  },
};

/** Building types the player can place from the HUD build panel. */
export const PLACEABLE_BUILDING_TYPES: BuildingType[] = ['house', 'woodcutterHut', 'quarry'];
