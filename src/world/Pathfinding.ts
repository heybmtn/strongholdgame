import type { Point } from './Map';

/**
 * Phase 1 stub: straight-line movement, no obstacle avoidance.
 * Kept as its own module so Phase 2+ can drop in real pathfinding
 * without changing call sites in Simulation.ts.
 */
export function findPath(_from: Point, to: Point): Point[] {
  return [to];
}
