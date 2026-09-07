import type { Camera } from '../game/Camera';
import type { World } from '../game/World';
import type { UIState } from '../game/UIState';
import { drawTiles } from './TileRenderer';
import { drawBuildings, drawPlacementGhost } from './BuildingRenderer';
import { drawVillagers } from './EntityRenderer';

export class Renderer {
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  private get ctx(): CanvasRenderingContext2D {
    return this.canvas.getContext('2d')!;
  }

  resizeToWindow() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  draw(camera: Camera, world: World, uiState: UIState) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, camera.viewportWidth, camera.viewportHeight);
    ctx.translate(-camera.x, -camera.y);

    drawTiles(ctx, world.map, camera);
    drawBuildings(ctx, world.buildings);
    drawVillagers(ctx, world.villagers);
    drawPlacementGhost(ctx, uiState);

    ctx.restore();
  }
}
