import type { Building } from '../entities/Building';
import { BUILDING_DEFS } from '../buildings/BuildingDefs';
import { TILE_SIZE } from '../world/Map';
import type { UIState } from '../game/UIState';

const BUILDING_COLORS: Record<Building['type'], string> = {
  keep: '#8a5a2b',
  house: '#b08d57',
  woodcutterHut: '#5a7a3a',
  quarry: '#7a7a72',
  farm: '#c9a227',
};

export function drawBuildings(ctx: CanvasRenderingContext2D, buildings: Building[]) {
  for (const building of buildings) {
    const def = BUILDING_DEFS[building.type];
    const px = building.tileX * TILE_SIZE;
    const py = building.tileY * TILE_SIZE;
    const w = def.footprint.w * TILE_SIZE;
    const h = def.footprint.h * TILE_SIZE;

    ctx.fillStyle = BUILDING_COLORS[building.type];
    ctx.globalAlpha = building.state === 'underConstruction' ? 0.55 : 1;
    ctx.fillRect(px, py, w, h);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#111';
    ctx.strokeRect(px, py, w, h);

    ctx.fillStyle = '#fff';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(def.name, px + w / 2, py + h / 2, w - 4);

    if (building.state === 'underConstruction') {
      const progress = Math.min(1, building.constructionProgress / def.buildTimeSeconds);
      const barW = w - 6;
      const barH = 5;
      const barX = px + 3;
      const barY = py + h - barH - 3;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#8fd18f';
      ctx.fillRect(barX, barY, barW * progress, barH);
    }
  }
}

export function drawPlacementGhost(ctx: CanvasRenderingContext2D, uiState: UIState) {
  if (!uiState.hoverTile) return;
  if (!uiState.placingBuildingType && !uiState.plantingTree) return;

  let w = TILE_SIZE;
  let h = TILE_SIZE;
  if (uiState.placingBuildingType) {
    const def = BUILDING_DEFS[uiState.placingBuildingType];
    w = def.footprint.w * TILE_SIZE;
    h = def.footprint.h * TILE_SIZE;
  }
  const px = uiState.hoverTile.x * TILE_SIZE;
  const py = uiState.hoverTile.y * TILE_SIZE;

  ctx.fillStyle = uiState.ghostValid ? 'rgba(80,200,80,0.4)' : 'rgba(200,60,60,0.4)';
  ctx.fillRect(px, py, w, h);
  ctx.strokeStyle = uiState.ghostValid ? '#5f5' : '#f55';
  ctx.strokeRect(px, py, w, h);
}
