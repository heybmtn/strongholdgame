const TICK_MS = 1000 / 20;
const MAX_FRAME_MS = 250;

export class GameLoop {
  private accumulator = 0;
  private lastTime = 0;
  private rafId = 0;
  private running = false;
  private update: (dtSeconds: number) => void;
  private render: () => void;

  constructor(update: (dtSeconds: number) => void, render: () => void) {
    this.update = update;
    this.render = render;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private tick = (now: number) => {
    if (!this.running) return;
    const frameMs = Math.min(now - this.lastTime, MAX_FRAME_MS);
    this.lastTime = now;
    this.accumulator += frameMs;

    while (this.accumulator >= TICK_MS) {
      this.update(TICK_MS / 1000);
      this.accumulator -= TICK_MS;
    }

    this.render();
    this.rafId = requestAnimationFrame(this.tick);
  };
}
