import type { BuildingType } from '../buildings/BuildingDefs';
import type { Point } from '../world/Map';

export interface UIState {
  placingBuildingType: BuildingType | null;
  hoverTile: Point | null;
  ghostValid: boolean;
}

export function createUIState(): UIState {
  return { placingBuildingType: null, hoverTile: null, ghostValid: false };
}
