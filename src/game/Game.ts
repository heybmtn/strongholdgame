import { GameMap, TILE_SIZE, tileToWorldCenter, worldToTile } from '../world/Map';
import type { Point } from '../world/Map';
import { ResourceStore } from '../economy/ResourceStore';
import { createVillager } from '../entities/Villager';
import type { Villager } from '../entities/Villager';
import { createBuilding } from '../entities/Building';
import type { Building } from '../entities/Building';
import { BUILDING_DEFS } from '../buildings/BuildingDefs';
import type { BuildingType } from '../buildings/BuildingDefs';
import type { World } from './World';
import { Camera } from './Camera';
import { Input } from './Input';
import { GameLoop } from './GameLoop';
import { createUIState } from './UIState';
import type { UIState } from './UIState';
import { tick as simulationTick, MAX_POPULATION, SAPLING_GROW_SECONDS } from '../simulation/Simulation';
import { Renderer } from '../rendering/Renderer';
import { HUD } from '../ui/HUD';
import { applySaveToWorld, loadSave, saveGame } from '../persistence/SaveGame';

const STARTING_VILLAGERS = 3;

export class Game {
  private world: World;
  private camera = new Camera();
  private uiState: UIState = createUIState();
  private input: Input;
  private renderer: Renderer;
  private hud: HUD;
  private loop: GameLoop;

  constructor(canvas: HTMLCanvasElement) {
    const map = new GameMap();
    this.world = {
      map,
      resources: new ResourceStore(),
      villagers: [] as Villager[],
      buildings: [] as Building[],
    };

    this.renderer = new Renderer(canvas);
    this.input = new Input(canvas, this.camera, {
      onHoverWorld: (world) => this.handleHover(world),
      onClickWorld: (world) => this.handleClick(world),
      onCancel: () => this.cancelPlacement(),
    });
    this.hud = new HUD(this.uiState, {
      onSelectBuilding: (type) => this.selectBuildingToPlace(type),
      onTogglePlantTree: () => this.togglePlantTree(),
      onSave: () => this.save(),
      onLoad: () => this.load(),
    });
    this.loop = new GameLoop(
      (dt) => this.update(dt),
      () => this.render(),
    );
  }

  init() {
    this.spawnKeep();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  start() {
    this.loop.start();
  }

  private spawnKeep() {
    const { map } = this.world;
    const tileX = Math.floor(map.width / 2) - 1;
    const tileY = Math.floor(map.height / 2) - 1;
    const def = BUILDING_DEFS.keep;
    const worldCenter = {
      x: tileX * TILE_SIZE + (def.footprint.w * TILE_SIZE) / 2,
      y: tileY * TILE_SIZE + (def.footprint.h * TILE_SIZE) / 2,
    };
    const keep = createBuilding('keep', tileX, tileY, worldCenter, 'active');
    map.occupyArea(tileX, tileY, def.footprint.w, def.footprint.h, keep.id);
    this.world.buildings.push(keep);

    for (let i = 0; i < STARTING_VILLAGERS; i++) {
      const angle = (i / STARTING_VILLAGERS) * Math.PI * 2;
      const spawnPoint: Point = {
        x: worldCenter.x + Math.cos(angle) * 40,
        y: worldCenter.y + Math.sin(angle) * 40,
      };
      this.world.villagers.push(createVillager(spawnPoint, 'adult'));
    }
  }

  private resize() {
    this.renderer.resizeToWindow();
    this.camera.resize(window.innerWidth, window.innerHeight);
  }

  private update(dt: number) {
    this.input.tick(dt);
    simulationTick(dt, this.world);

    const activeBuildings = this.world.buildings.filter((b) => b.state === 'active');
    const populationCap = Math.min(
      activeBuildings.reduce((sum, b) => sum + (BUILDING_DEFS[b.type].populationCap ?? 0), 0),
      MAX_POPULATION,
    );
    const foodCapacity = activeBuildings.reduce((sum, b) => sum + (BUILDING_DEFS[b.type].foodCapacity ?? 0), 0);
    const kidsCount = this.world.villagers.filter((v) => v.ageGroup === 'kid').length;

    this.hud.refresh(this.world.resources, this.world.villagers.length, populationCap, kidsCount, foodCapacity);
  }

  private render() {
    this.renderer.draw(this.camera, this.world, this.uiState);
  }

  private selectBuildingToPlace(type: BuildingType) {
    this.uiState.plantingTree = false;
    this.uiState.placingBuildingType = this.uiState.placingBuildingType === type ? null : type;
  }

  private togglePlantTree() {
    this.uiState.placingBuildingType = null;
    this.uiState.plantingTree = !this.uiState.plantingTree;
  }

  private cancelPlacement() {
    this.uiState.placingBuildingType = null;
    this.uiState.plantingTree = false;
  }

  private handleHover(worldPoint: Point) {
    const tile = worldToTile(worldPoint.x, worldPoint.y);
    this.uiState.hoverTile = tile;
    this.uiState.ghostValid = this.uiState.plantingTree
      ? this.world.map.isPlantable(tile.x, tile.y)
      : this.isPlacementValid(tile);
  }

  private isPlacementValid(tile: Point): boolean {
    const type = this.uiState.placingBuildingType;
    if (!type) return false;
    const def = BUILDING_DEFS[type];
    const buildable = this.world.map.isAreaBuildable(tile.x, tile.y, def.footprint.w, def.footprint.h);
    const affordable = this.world.resources.canAfford(def.cost);
    return buildable && affordable;
  }

  private handleClick(worldPoint: Point) {
    const tile = worldToTile(worldPoint.x, worldPoint.y);

    if (this.uiState.plantingTree) {
      this.world.map.plantTree(tile.x, tile.y, SAPLING_GROW_SECONDS);
      return;
    }

    const type = this.uiState.placingBuildingType;
    if (!type) return;
    if (!this.isPlacementValid(tile)) return;

    const def = BUILDING_DEFS[type];
    this.world.resources.spend(def.cost);
    const worldCenter = tileToWorldCenter(tile.x, tile.y);
    worldCenter.x += ((def.footprint.w - 1) * TILE_SIZE) / 2;
    worldCenter.y += ((def.footprint.h - 1) * TILE_SIZE) / 2;

    const building = createBuilding(type, tile.x, tile.y, worldCenter, 'underConstruction');
    this.world.map.occupyArea(tile.x, tile.y, def.footprint.w, def.footprint.h, building.id);
    this.world.buildings.push(building);
    this.uiState.placingBuildingType = null;
  }

  private save() {
    saveGame(this.world);
  }

  private load() {
    const data = loadSave();
    if (!data) return;
    applySaveToWorld(data, this.world);
    this.cancelPlacement();
  }
}
