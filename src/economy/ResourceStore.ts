export interface ResourceCost {
  wood?: number;
  stone?: number;
}

export class ResourceStore {
  private wood: number;
  private stone: number;

  constructor(startingWood = 50, startingStone = 20) {
    this.wood = startingWood;
    this.stone = startingStone;
  }

  get(type: 'wood' | 'stone'): number {
    return type === 'wood' ? this.wood : this.stone;
  }

  add(type: 'wood' | 'stone', amount: number) {
    if (type === 'wood') this.wood += amount;
    else this.stone += amount;
  }

  canAfford(cost: ResourceCost): boolean {
    return (cost.wood ?? 0) <= this.wood && (cost.stone ?? 0) <= this.stone;
  }

  spend(cost: ResourceCost) {
    this.wood -= cost.wood ?? 0;
    this.stone -= cost.stone ?? 0;
  }
}
