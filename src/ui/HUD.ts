import { BUILDING_DEFS, PLACEABLE_BUILDING_TYPES } from '../buildings/BuildingDefs';
import type { BuildingType } from '../buildings/BuildingDefs';
import type { ResourceStore } from '../economy/ResourceStore';
import type { UIState } from '../game/UIState';

export interface HUDCallbacks {
  onSelectBuilding: (type: BuildingType) => void;
  onTogglePlantTree: () => void;
  onSave: () => void;
  onLoad: () => void;
}

export class HUD {
  private woodEl = document.getElementById('wood-count')!;
  private stoneEl = document.getElementById('stone-count')!;
  private foodEl = document.getElementById('food-count')!;
  private populationEl = document.getElementById('population-count')!;
  private buildPanelEl = document.getElementById('build-panel')!;
  private toolsPanelEl = document.getElementById('tools-panel')!;
  private buttons = new Map<BuildingType, HTMLButtonElement>();
  private plantTreeButton: HTMLButtonElement;
  private uiState: UIState;

  constructor(uiState: UIState, callbacks: HUDCallbacks) {
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
      button.addEventListener('click', () => callbacks.onSelectBuilding(type));
      this.buildPanelEl.appendChild(button);
      this.buttons.set(type, button);
    }

    this.plantTreeButton = this.createToolButton('Plant Tree', () => callbacks.onTogglePlantTree());
    this.createToolButton('Save', () => callbacks.onSave());
    this.createToolButton('Load', () => callbacks.onLoad());
  }

  private createToolButton(label: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'build-button';
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', onClick);
    this.toolsPanelEl.appendChild(button);
    return button;
  }

  refresh(
    resources: ResourceStore,
    population: number,
    populationCap: number,
    kidsCount: number,
    foodCapacity: number,
  ) {
    this.woodEl.textContent = String(resources.get('wood'));
    this.stoneEl.textContent = String(resources.get('stone'));
    this.foodEl.textContent = `${resources.get('food')}/${foodCapacity}`;
    this.populationEl.textContent =
      kidsCount > 0 ? `${population}/${populationCap} (${kidsCount} kids)` : `${population}/${populationCap}`;

    for (const [type, button] of this.buttons) {
      const def = BUILDING_DEFS[type];
      button.disabled = !resources.canAfford(def.cost);
      button.classList.toggle('selected', this.uiState.placingBuildingType === type);
    }

    this.plantTreeButton.classList.toggle('selected', this.uiState.plantingTree);
  }
}

function costLabel(cost: { wood?: number; stone?: number }): string {
  const parts: string[] = [];
  if (cost.wood) parts.push(`${cost.wood} wood`);
  if (cost.stone) parts.push(`${cost.stone} stone`);
  return parts.join(', ') || 'free';
}
