export type TileType = 'grass' | 'forest' | 'stone' | 'water';

export interface Tile {
  type: TileType;
  resourceAmount: number;
  buildingId: string | null;
}

export const RESOURCE_TILE_TYPES: TileType[] = ['forest', 'stone'];
