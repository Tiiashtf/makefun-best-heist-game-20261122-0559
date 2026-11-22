// vision.js — line of sight and vision cones.
// One job: answer "can this watcher see that point?" Walls and cover block
// sight; shadow rugs, vents and floor do not.

import { TILE } from './config.js';
import { tileAt } from './levels.js';

function blocksSight(tile) {
  return tile === '#' || tile === 'C';
}

// Digital-differential raycast over the tile grid. Returns true when the
// segment from (x0,y0) to (x1,y1) crosses no sight-blocking tile.
export function hasLOS(level, x0, y0, x1, y1) {
  const dx = x1 - x0, dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const steps = Math.ceil(dist / (TILE / 4));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const tx = Math.floor((x0 + dx * t) / TILE);
    const ty = Math.floor((y0 + dy * t) / TILE);
    if (blocksSight(tileAt(level, tx, ty))) return false;
  }
  return true;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Is (px,py) inside the cone cast from (ox,oy) facing `angle`, with the
// given half-angle and range, with a clear line of sight?
export function inCone(level, ox, oy, angle, halfAngle, range, px, py) {
  const dx = px - ox, dy = py - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 4) return true;
  if (Math.abs(angleDiff(Math.atan2(dy, dx), angle)) > halfAngle) return false;
  return hasLOS(level, ox, oy, px, py);
}

// How visible is the thief at (px,py)? 1 = standing in the open, less when
// sneaking or crouched in shadow. Guards multiply their detection rate by this.
export function visibilityAt(level, px, py, sneaking) {
  let v = sneaking ? 0.55 : 1;
  const tile = tileAt(level, Math.floor(px / TILE), Math.floor(py / TILE));
  if (tile === 's') v *= 0.42;
  return v;
}
