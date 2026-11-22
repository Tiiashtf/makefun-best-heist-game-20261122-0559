// lasers.js — the timed laser grids.
// One job: hold the beams, switch them on and off on their timers, and tell
// the game when the thief crosses a live one. A live beam is a red line the
// thief must time or go around; EMP freezes every beam in its radius.

import { TILE, ALARM_LASER_LUMP } from './config.js';

export class LaserGrid {
  constructor(defs) {
    this.beams = defs.map((d) => ({
      x1: d.x1 * TILE + TILE / 2,
      y1: d.y1 * TILE + TILE / 2,
      x2: d.x2 * TILE + TILE / 2,
      y2: d.y2 * TILE + TILE / 2,
      period: d.period,
      on: d.on,
      phase: d.phase || 0,
      t: d.phase || 0,
      disabledFor: 0,
      tripped: false, // latch: one alarm lump per crossing, not per frame
    }));
  }

  reset() {
    for (const b of this.beams) {
      b.t = b.phase;
      b.disabledFor = 0;
      b.tripped = false;
    }
  }

  isLive(b) {
    if (b.disabledFor > 0) return false;
    return (b.t % b.period) < b.on;
  }

  // Distance from a point to the beam segment.
  static distToBeam(b, x, y) {
    const dx = b.x2 - b.x1, dy = b.y2 - b.y1;
    const len2 = dx * dx + dy * dy;
    let t = len2 ? ((x - b.x1) * dx + (y - b.y1) * dy) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    const px = b.x1 + dx * t, py = b.y1 + dy * t;
    return Math.hypot(x - px, y - py);
  }

  update(player, dt, world) {
    for (const b of this.beams) {
      b.t += dt;
      if (b.disabledFor > 0) b.disabledFor -= dt;
      const live = this.isLive(b);
      const touching = live && LaserGrid.distToBeam(b, player.x, player.y) < 14;
      if (touching && !b.tripped) {
        b.tripped = true;
        world.alarm = Math.min(100, world.alarm + ALARM_LASER_LUMP);
        world.onLaserTrip(b);
      } else if (!touching) {
        b.tripped = false;
      }
    }
  }
}
