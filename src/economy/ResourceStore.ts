export type ResourceKind = 'wood' | 'stone' | 'food';

export interface ResourceCost {
  wood?: number;
  stone?: number;
  food?: number;
}

export interface ResourceSnapshot {
  wood: number;
  stone: number;
  food: number;
}

export class ResourceStore {
  private wood: number;
  private stone: number;
  private food: number;

  constructor(startingWood = 50, startingStone = 20, startingFood = 0) {
    this.wood = startingWood;
    this.stone = startingStone;
    this.food = startingFood;
  }

  get(type: ResourceKind): number {
    if (type === 'wood') return this.wood;
    if (type === 'stone') return this.stone;
    return this.food;
  }

  add(type: ResourceKind, amount: number) {
    if (type === 'wood') this.wood += amount;
    else if (type === 'stone') this.stone += amount;
    else this.food += amount;
  }

  /** Adds food clamped at the given storage capacity. Food is the only capped resource. */
  addFoodCapped(amount: number, capacity: number) {
    this.food = Math.min(capacity, this.food + amount);
  }

  canAfford(cost: ResourceCost): boolean {
    return (
      (cost.wood ?? 0) <= this.wood &&
      (cost.stone ?? 0) <= this.stone &&
      (cost.food ?? 0) <= this.food
    );
  }

  spend(cost: ResourceCost) {
    this.wood -= cost.wood ?? 0;
    this.stone -= cost.stone ?? 0;
    this.food -= cost.food ?? 0;
  }

  serialize(): ResourceSnapshot {
    return { wood: this.wood, stone: this.stone, food: this.food };
  }

  loadFrom(data: ResourceSnapshot) {
    this.wood = data.wood;
    this.stone = data.stone;
    this.food = data.food;
  }
}
