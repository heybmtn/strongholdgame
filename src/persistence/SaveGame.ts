import type { World } from '../game/World';
import type { Villager } from '../entities/Villager';
import type { Building } from '../entities/Building';
import type { Tile } from '../world/Tile';
import type { ResourceSnapshot } from '../economy/ResourceStore';

const SAVE_KEY = 'strongholdgame-save-v1';
const SAVE_VERSION = 1;

export interface SaveData {
  version: number;
  resources: ResourceSnapshot;
  villagers: Villager[];
  buildings: Building[];
  tiles: Tile[];
  mapWidth: number;
  mapHeight: number;
}

export function saveGame(world: World) {
  const data: SaveData = {
    version: SAVE_VERSION,
    resources: world.resources.serialize(),
    villagers: world.villagers,
    buildings: world.buildings,
    tiles: world.map.getTilesSnapshot(),
    mapWidth: world.map.width,
    mapHeight: world.map.height,
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable (private browsing, quota exceeded, etc). Nothing to do.
  }
}

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    if (data.version !== SAVE_VERSION) return null;
    return data;
  } catch {
    return null;
  }
}

export function applySaveToWorld(data: SaveData, world: World) {
  world.resources.loadFrom(data.resources);
  world.map.loadTiles(data.tiles);
  world.villagers = data.villagers;
  world.buildings = data.buildings;
}
