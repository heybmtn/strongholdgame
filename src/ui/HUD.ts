import { BUILDING_DEFS, PLACEABLE_BUILDING_TYPES } from '../buildings/BuildingDefs';
import type { BuildingType } from '../buildings/BuildingDefs';
import type { ResourceStore } from '../economy/ResourceStore';
import type { UIState } from '../game/UIState';

export class HUD {
  private woodEl = document.getElementById('wood-count')!;
  private stoneEl = document.getElementById('stone-count')!;
  private populationEl = document.getElementById('population-count')!;
  private buildPanelEl = document.getElementById('build-panel')!;
  private buttons = new Map<BuildingType, HTMLButtonElement>();
  private uiState: UIState;

  constructor(uiState: UIState, onSelectBuilding: (type: BuildingType) => void) {
    this.uiState = uiState;
    for (const type of PLACEABLE_BUILDING_TYPES) {
      const def = BUILDING_DEFS[type];
      const button = document.createElement('button');
      button.className = 'build-button';
      button.type = 'button';

      const label = document.createElement('span');
      label.textContent = def.name;
      const cost = document.createElement('span');
      cost.className = 'cost';
      cost.textContent = costLabel(def.cost);

      button.append(label, cost);
      button.addEventListener('click', () => onSelectBuilding(type));
      this.buildPanelEl.appendChild(button);
      this.buttons.set(type, button);
    }
  }

  refresh(resources: ResourceStore, population: number, populationCap: number) {
    this.woodEl.textContent = String(resources.get('wood'));
    this.stoneEl.textContent = String(resources.get('stone'));
    this.populationEl.textContent = `${population}/${populationCap}`;

    for (const [type, button] of this.buttons) {
      const def = BUILDING_DEFS[type];
      button.disabled = !resources.canAfford(def.cost);
      button.classList.toggle('selected', this.uiState.placingBuildingType === type);
    }
  }
}

function costLabel(cost: { wood?: number; stone?: number }): string {
  const parts: string[] = [];
  if (cost.wood) parts.push(`${cost.wood} wood`);
  if (cost.stone) parts.push(`${cost.stone} stone`);
  return parts.join(', ') || 'free';
}
