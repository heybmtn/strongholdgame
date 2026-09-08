import type { GameMap } from '../world/Map';
import { TILE_SIZE } from '../world/Map';
import type { Camera } from '../game/Camera';
import type { TileType } from '../world/Tile';
import { SAPLING_GROW_SECONDS } from '../simulation/Simulation';

const TILE_COLORS: Record<TileType, string> = {
  grass: '#3a6b35',
  forest: '#1f4d20',
  stone: '#6e6e66',
  water: '#2a4d6e',
};

export function drawTiles(ctx: CanvasRenderingContext2D, map: GameMap, camera: Camera) {
  const range = camera.visibleTileRange();
  for (let y = range.minY; y <= range.maxY; y++) {
    for (let x = range.minX; x <= range.maxX; x++) {
      const tile = map.getTile(x, y);
      if (!tile) continue;
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;
      ctx.fillStyle = TILE_COLORS[tile.type];
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);

      if (tile.type === 'forest' && tile.resourceAmount > 0) {
        ctx.fillStyle = '#0f3510';
        ctx.beginPath();
        ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, TILE_SIZE * 0.28, 0, Math.PI * 2);
        ctx.fill();
      } else if (tile.type === 'stone' && tile.resourceAmount > 0) {
        ctx.fillStyle = '#9a9a90';
        const s = TILE_SIZE * 0.4;
        ctx.fillRect(px + (TILE_SIZE - s) / 2, py + (TILE_SIZE - s) / 2, s, s);
      }

      if (tile.saplingTimer > 0) {
        const progress = 1 - tile.saplingTimer / SAPLING_GROW_SECONDS;
        const radius = TILE_SIZE * (0.08 + 0.2 * progress);
        ctx.fillStyle = '#5fae4a';
        ctx.beginPath();
        ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
