import type { Tile, TileType } from './Tile';

export const TILE_SIZE = 32;
export const MAP_WIDTH = 60;
export const MAP_HEIGHT = 40;

export interface Point {
  x: number;
  y: number;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class GameMap {
  readonly width = MAP_WIDTH;
  readonly height = MAP_HEIGHT;
  private tiles: Tile[];

  constructor(seed = 1) {
    this.tiles = new Array(this.width * this.height);
    for (let i = 0; i < this.tiles.length; i++) {
      this.tiles[i] = { type: 'grass', resourceAmount: 0, buildingId: null, saplingTimer: 0 };
    }
    this.generate(seed);
  }

  private index(x: number, y: number): number {
    return y * this.width + x;
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  getTile(x: number, y: number): Tile | null {
    if (!this.inBounds(x, y)) return null;
    return this.tiles[this.index(x, y)];
  }

  setTileType(x: number, y: number, type: TileType, resourceAmount = 0) {
    const tile = this.getTile(x, y);
    if (!tile) return;
    tile.type = type;
    tile.resourceAmount = resourceAmount;
  }

  isBuildable(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    if (!tile) return false;
    return tile.type === 'grass' && tile.buildingId === null;
  }

  isAreaBuildable(x: number, y: number, w: number, h: number): boolean {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        if (!this.isBuildable(x + dx, y + dy)) return false;
      }
    }
    return true;
  }

  occupyArea(x: number, y: number, w: number, h: number, buildingId: string) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const tile = this.getTile(x + dx, y + dy);
        if (tile) tile.buildingId = buildingId;
      }
    }
  }

  isPlantable(x: number, y: number): boolean {
    const tile = this.getTile(x, y);
    if (!tile) return false;
    return tile.type === 'grass' && tile.buildingId === null && tile.saplingTimer === 0;
  }

  plantTree(x: number, y: number, growSeconds: number): boolean {
    if (!this.isPlantable(x, y)) return false;
    const tile = this.getTile(x, y)!;
    tile.saplingTimer = growSeconds;
    return true;
  }

  forEachTile(fn: (tile: Tile, x: number, y: number) => void) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        fn(this.tiles[this.index(x, y)], x, y);
      }
    }
  }

  getTilesSnapshot(): Tile[] {
    return this.tiles.map((tile) => ({ ...tile }));
  }

  loadTiles(tiles: Tile[]) {
    this.tiles = tiles.map((tile) => ({ ...tile }));
  }

  private generate(seed: number) {
    const rand = mulberry32(seed);
    const spawnCx = Math.floor(this.width / 2);
    const spawnCy = Math.floor(this.height / 2);
    const spawnRadius = 5;

    const inSpawnArea = (x: number, y: number) =>
      Math.abs(x - spawnCx) <= spawnRadius && Math.abs(y - spawnCy) <= spawnRadius;

    const scatterBlobs = (
      count: number,
      minSize: number,
      maxSize: number,
      type: TileType,
      resourceAmount: number,
    ) => {
      for (let i = 0; i < count; i++) {
        let seedX = Math.floor(rand() * this.width);
        let seedY = Math.floor(rand() * this.height);
        if (inSpawnArea(seedX, seedY)) continue;

        const targetSize = minSize + Math.floor(rand() * (maxSize - minSize));
        let cx = seedX;
        let cy = seedY;
        let placed = 0;
        let attempts = 0;
        while (placed < targetSize && attempts < targetSize * 6) {
          attempts++;
          if (this.inBounds(cx, cy) && !inSpawnArea(cx, cy)) {
            const tile = this.getTile(cx, cy)!;
            if (tile.type === 'grass') {
              tile.type = type;
              tile.resourceAmount = resourceAmount;
              placed++;
            }
          }
          const dir = Math.floor(rand() * 4);
          if (dir === 0) cx++;
          else if (dir === 1) cx--;
          else if (dir === 2) cy++;
          else cy--;
          cx = Math.max(0, Math.min(this.width - 1, cx));
          cy = Math.max(0, Math.min(this.height - 1, cy));
        }
      }
    };

    scatterBlobs(8, 15, 30, 'forest', 100);
    scatterBlobs(4, 6, 10, 'stone', 150);
  }

  findNearestResourceTile(from: Point, type: TileType): Point | null {
    let best: Point | null = null;
    let bestDist = Infinity;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.tiles[this.index(x, y)];
        if (tile.type !== type || tile.resourceAmount <= 0) continue;
        const dx = x - from.x;
        const dy = y - from.y;
        const dist = dx * dx + dy * dy;
        if (dist < bestDist) {
          bestDist = dist;
          best = { x, y };
        }
      }
    }
    return best;
  }
}

export function tileToWorldCenter(tileX: number, tileY: number): Point {
  return { x: tileX * TILE_SIZE + TILE_SIZE / 2, y: tileY * TILE_SIZE + TILE_SIZE / 2 };
}

export function worldToTile(worldX: number, worldY: number): Point {
  return { x: Math.floor(worldX / TILE_SIZE), y: Math.floor(worldY / TILE_SIZE) };
}
