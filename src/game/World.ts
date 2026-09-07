import type { GameMap } from '../world/Map';
import type { ResourceStore } from '../economy/ResourceStore';
import type { Villager } from '../entities/Villager';
import type { Building } from '../entities/Building';

export interface World {
  map: GameMap;
  resources: ResourceStore;
  villagers: Villager[];
  buildings: Building[];
}
