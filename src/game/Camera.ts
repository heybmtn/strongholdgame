import { MAP_HEIGHT, MAP_WIDTH, TILE_SIZE } from '../world/Map';
import type { Point } from '../world/Map';

export class Camera {
  x = 0;
  y = 0;
  viewportWidth = 0;
  viewportHeight = 0;

  resize(width: number, height: number) {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.clamp();
  }

  pan(dx: number, dy: number) {
    this.x += dx;
    this.y += dy;
    this.clamp();
  }

  private clamp() {
    const mapPxWidth = MAP_WIDTH * TILE_SIZE;
    const mapPxHeight = MAP_HEIGHT * TILE_SIZE;
    const maxX = Math.max(0, mapPxWidth - this.viewportWidth);
    const maxY = Math.max(0, mapPxHeight - this.viewportHeight);
    this.x = Math.min(Math.max(this.x, 0), maxX);
    this.y = Math.min(Math.max(this.y, 0), maxY);
  }

  worldToScreen(worldX: number, worldY: number): Point {
    return { x: worldX - this.x, y: worldY - this.y };
  }

  screenToWorld(screenX: number, screenY: number): Point {
    return { x: screenX + this.x, y: screenY + this.y };
  }

  visibleTileRange() {
    return {
      minX: Math.max(0, Math.floor(this.x / TILE_SIZE)),
      minY: Math.max(0, Math.floor(this.y / TILE_SIZE)),
      maxX: Math.min(MAP_WIDTH - 1, Math.ceil((this.x + this.viewportWidth) / TILE_SIZE)),
      maxY: Math.min(MAP_HEIGHT - 1, Math.ceil((this.y + this.viewportHeight) / TILE_SIZE)),
    };
  }
}
