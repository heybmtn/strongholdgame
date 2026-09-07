import type { Point } from '../world/Map';

let nextId = 1;

export function generateId(prefix: string): string {
  return `${prefix}-${nextId++}`;
}

export interface Entity {
  id: string;
  position: Point;
}
