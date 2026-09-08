export type TileType = 'grass' | 'forest' | 'stone' | 'water';

export interface Tile {
  type: TileType;
  resourceAmount: number;
  buildingId: string | null;
  /** Seconds remaining until a planted sapling becomes a harvestable forest tile. 0 = not a sapling. */
  saplingTimer: number;
}

export const RESOURCE_TILE_TYPES: TileType[] = ['forest', 'stone'];
