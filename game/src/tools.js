// tools.js — the thief's kit, bought with stolen loot.
// One job: run the three tools and answer "can this watcher see through it?"
//   1 Smoke bomb — a cloud that blocks every line of sight inside it.
//   2 EMP pulse — freezes cameras and lasers around the thief.
//   3 Coin toss — a clink that sends nearby guards to investigate the spot.

import { TOOLS } from './config.js';

export class Tools {
  constructor() {
    this.stock = {
      smoke: TOOLS.smoke.stock,
      emp: TOOLS.emp.stock,
      noise: TOOLS.noise.stock,
    };
    this.smokes = []; // {x, y, radius, left}
    this.noiseAt = null; // {x, y, left} — the last coin toss
    this.selected = 'smoke';
  }

  reset() {
    this.stock = {
      smoke: TOOLS.smoke.stock,
      emp: TOOLS.emp.stock,
      noise: TOOLS.noise.stock,
    };
    this.smokes = [];
    this.noiseAt = null;
    this.selected = 'smoke';
  }

  canAfford(kind, lootValue) {
    return this.stock[kind] > 0 && lootValue >= TOOLS[kind].cost;
  }

  // Use a tool. Returns the dollars spent, or 0 when it could not be used.
  use(kind, x, y, world) {
    if (this.stock[kind] <= 0) return 0;
    const cost = TOOLS[kind].cost;
    if (world.lootValue < cost) return 0;
    this.stock[kind] -= 1;
    if (kind === 'smoke') {
      this.smokes.push({ x, y, radius: TOOLS.smoke.radius, left: TOOLS.smoke.seconds });
      world.sfx('smoke');
    } else if (kind === 'emp') {
      for (const cam of world.cameras) {
        if (Math.hypot(cam.x - x, cam.y - y) < TOOLS.emp.radius) {
          cam.disabledFor = Math.max(cam.disabledFor, TOOLS.emp.seconds);
        }
      }
      for (const beam of world.lasers.beams) {
        const mx = (beam.x1 + beam.x2) / 2, my = (beam.y1 + beam.y2) / 2;
        if (Math.hypot(mx - x, my - y) < TOOLS.emp.radius) {
          beam.disabledFor = Math.max(beam.disabledFor, TOOLS.emp.seconds);
        }
      }
      world.sfx('emp');
    } else if (kind === 'noise') {
      this.noiseAt = { x, y, left: 1.2 };
      world.sfx('coin');
      for (const guard of world.guards) {
        if (Math.hypot(guard.x - x, guard.y - y) < TOOLS.noise.radius) {
          guard.investigate(world.level, x, y);
        }
      }
    }
    return cost;
  }

  // Does smoke block the sight line between two points? A cloud blocks it
  // when either end sits inside a cloud, or the segment crosses one.
  visionBlocked(x0, y0, x1, y1) {
    for (const s of this.smokes) {
      if (Math.hypot(x0 - s.x, y0 - s.y) < s.radius) return true;
      if (Math.hypot(x1 - s.x, y1 - s.y) < s.radius) return true;
      if (segmentHitsCircle(x0, y0, x1, y1, s.x, s.y, s.radius)) return true;
    }
    return false;
  }

  update(dt) {
    for (const s of this.smokes) s.left -= dt;
    this.smokes = this.smokes.filter((s) => s.left > 0);
    if (this.noiseAt) {
      this.noiseAt.left -= dt;
      if (this.noiseAt.left <= 0) this.noiseAt = null;
    }
  }
}

function segmentHitsCircle(x0, y0, x1, y1, cx, cy, r) {
  const dx = x1 - x0, dy = y1 - y0;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((cx - x0) * dx + (cy - y0) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  const px = x0 + dx * t, py = y0 + dy * t;
  return Math.hypot(cx - px, cy - py) < r;
}
