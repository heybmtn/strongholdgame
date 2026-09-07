import type { Villager, VillagerJob } from '../entities/Villager';

const JOB_COLORS: Record<VillagerJob, string> = {
  idle: '#eeeeee',
  woodcutter: '#8a5a2b',
  quarrier: '#9a9a90',
};

export function drawVillagers(ctx: CanvasRenderingContext2D, villagers: Villager[]) {
  for (const villager of villagers) {
    ctx.fillStyle = JOB_COLORS[villager.job];
    ctx.beginPath();
    ctx.arc(villager.position.x, villager.position.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (villager.carrying) {
      ctx.fillStyle = villager.carrying.type === 'wood' ? '#c98a3a' : '#cfcfc4';
      ctx.beginPath();
      ctx.arc(villager.position.x, villager.position.y - 8, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
