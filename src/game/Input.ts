import type { Camera } from './Camera';
import type { Point } from '../world/Map';

const PAN_SPEED = 400; // px/sec

export interface InputCallbacks {
  onHoverWorld: (world: Point) => void;
  onClickWorld: (world: Point) => void;
  onCancel: () => void;
}

export class Input {
  private keysHeld = new Set<string>();
  private downPos: Point | null = null;
  private readonly clickDragThreshold = 5;
  private canvas: HTMLCanvasElement;
  private camera: Camera;
  private callbacks: InputCallbacks;

  constructor(canvas: HTMLCanvasElement, camera: Camera, callbacks: InputCallbacks) {
    this.canvas = canvas;
    this.camera = camera;
    this.callbacks = callbacks;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    canvas.addEventListener('mousemove', this.handleMouseMove);
    canvas.addEventListener('mousedown', this.handleMouseDown);
    canvas.addEventListener('mouseup', this.handleMouseUp);
    canvas.addEventListener('contextmenu', this.handleContextMenu);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keysHeld.add(e.key.toLowerCase());
    if (e.key === 'Escape') this.callbacks.onCancel();
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keysHeld.delete(e.key.toLowerCase());
  };

  private toWorld(e: MouseEvent): Point {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    return this.camera.screenToWorld(screenX, screenY);
  }

  private handleMouseMove = (e: MouseEvent) => {
    this.callbacks.onHoverWorld(this.toWorld(e));
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;
    this.downPos = { x: e.clientX, y: e.clientY };
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (e.button !== 0 || !this.downPos) return;
    const dx = e.clientX - this.downPos.x;
    const dy = e.clientY - this.downPos.y;
    this.downPos = null;
    if (Math.hypot(dx, dy) > this.clickDragThreshold) return;
    this.callbacks.onClickWorld(this.toWorld(e));
  };

  private handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    this.callbacks.onCancel();
  };

  /** Call once per simulation tick to apply held-key camera panning. */
  tick(dt: number) {
    let dx = 0;
    let dy = 0;
    if (this.keysHeld.has('w') || this.keysHeld.has('arrowup')) dy -= 1;
    if (this.keysHeld.has('s') || this.keysHeld.has('arrowdown')) dy += 1;
    if (this.keysHeld.has('a') || this.keysHeld.has('arrowleft')) dx -= 1;
    if (this.keysHeld.has('d') || this.keysHeld.has('arrowright')) dx += 1;
    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      this.camera.pan((dx / len) * PAN_SPEED * dt, (dy / len) * PAN_SPEED * dt);
    }
  }
}
