// levels.js — the three floors of THE MARLOWE JOB.
// One job: describe each level (walls, cover, shadows, vents, guards, cameras,
// lasers, loot, vault, exit). A builder turns the description into a grid so
// no hand-counted ASCII row can drift out of shape.
//
// Legend inside the grid: '#' wall, '.' floor, 'C' cover (blocks sight and
// movement), 's' shadow rug (hides the thief), 'V' vent (thief only).

import { TILE } from './config.js';

export const MAP_W = 40;
export const MAP_H = 25;

function buildGrid(def) {
  const grid = [];
  for (let y = 0; y < MAP_H; y++) {
    const row = [];
    for (let x = 0; x < MAP_W; x++) {
      row.push(x === 0 || y === 0 || x === MAP_W - 1 || y === MAP_H - 1 ? '#' : '.');
    }
    grid.push(row);
  }
  for (const [x, y, w, h] of def.walls || []) {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) grid[yy][xx] = '#';
    }
  }
  for (const [x, y, w, h] of def.shadows || []) {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) if (grid[yy][xx] === '.') grid[yy][xx] = 's';
    }
  }
  for (const [x, y] of def.covers || []) grid[y][x] = 'C';
  for (const [x, y] of def.vents || []) grid[y][x] = 'V';
  return grid;
}

export const LEVELS = [
  {
    name: 'Floor 1 — The Halcyon Gallery',
    briefing: 'Three paintings. Two guards, two cameras. Slip in, lift them all, walk out the service door.',
    walls: [
      [13, 1, 1, 5], [13, 8, 1, 4], // west wall, gaps at y 6-7 and 12+
      [26, 13, 1, 6], [26, 21, 1, 3], // east wall, gaps at y 19-20
      [1, 12, 4, 1], [8, 12, 5, 1], // mid wall left, gap x 5-7
      [27, 8, 5, 1], [35, 8, 4, 1], // mid wall right, gap x 32-34
    ],
    shadows: [[2, 2, 3, 2], [15, 18, 4, 2], [28, 10, 3, 2], [33, 21, 4, 2], [8, 15, 2, 3]],
    covers: [[4, 4], [9, 3], [20, 2], [30, 3], [35, 6], [5, 15], [10, 20], [17, 16], [22, 21], [31, 15], [36, 19], [16, 5], [24, 10], [6, 9], [33, 13]],
    vents: [[12, 20], [13, 20], [14, 20]], // thief-only tunnel through the west wall
    loot: [
      { x: 4, y: 2, kind: 'painting', value: 800, name: 'The Duchess in Gold' },
      { x: 35, y: 3, kind: 'painting', value: 700, name: 'Moonlit Harbor' },
      { x: 20, y: 22, kind: 'painting', value: 900, name: 'The Brass Orchid' },
    ],
    vault: null,
    guards: [
      { name: 'Rook', path: [[3, 5], [10, 5], [10, 19], [3, 19]], pause: 1.2 },
      { name: 'Sable', path: [[29, 4], [36, 4], [36, 20], [29, 20]], pause: 1.0 },
    ],
    cameras: [
      { x: 19, y: 1, dir: Math.PI / 2, arc: 1.2, speed: 0.55 },
      { x: 33, y: 23, dir: -Math.PI / 2, arc: 1.2, speed: 0.45 },
    ],
    lasers: [],
    start: [2, 22],
    exit: [37, 2],
    alarmStart: 0,
    requiredLoot: 3,
  },
  {
    name: 'Floor 2 — The Vault Floor',
    briefing: 'The Star Sapphire sleeps behind steel. Crack the vault, mind the lasers, and do not wake the floor.',
    walls: [
      [17, 9, 7, 1], [17, 15, 3, 1], [21, 15, 3, 1], // vault room: door gap at x 20, y 15
      [17, 9, 1, 7], [23, 9, 1, 7], // vault room sides
      [5, 4, 1, 8], [5, 14, 1, 6], // west pillar wall, gap y 12-13
      [31, 5, 1, 7], [31, 14, 1, 6], // east pillar wall, gap y 12-13
      [10, 19, 8, 1], [24, 19, 8, 1], // south wall, gap x 18-23
    ],
    shadows: [[2, 2, 3, 2], [36, 2, 3, 2], [10, 10, 3, 2], [28, 21, 4, 2], [15, 3, 3, 2]],
    covers: [[8, 8], [12, 16], [28, 8], [34, 16], [20, 5], [15, 21], [25, 21], [3, 18], [37, 10], [7, 21]],
    vents: [[30, 12], [31, 12], [32, 12], [4, 12], [5, 12], [6, 12]], // tunnels through both pillar walls
    loot: [
      { x: 3, y: 3, kind: 'gold', value: 500, name: 'Gold bars' },
      { x: 36, y: 21, kind: 'gems', value: 600, name: 'Emerald cache' },
    ],
    vault: { x: 20, y: 11, value: 2500, name: 'The Star Sapphire' },
    guards: [
      { name: 'Mara', path: [[8, 3], [15, 3], [15, 17], [8, 17]], pause: 1.0 },
      { name: 'Ivo', path: [[25, 3], [29, 3], [29, 17], [25, 17]], pause: 1.4 },
      { name: 'Dove', path: [[14, 21], [26, 21], [26, 23], [14, 23]], pause: 0.8 },
    ],
    cameras: [
      { x: 20, y: 1, dir: Math.PI / 2, arc: 1.4, speed: 0.6 },
      { x: 1, y: 12, dir: 0, arc: 1.0, speed: 0.5 },
    ],
    lasers: [
      { x1: 14, y1: 6, x2: 25, y2: 6, period: 3.0, on: 2.0, phase: 0 },
      { x1: 30, y1: 14, x2: 30, y2: 20, period: 4.0, on: 2.4, phase: 1.0 },
      { x1: 2, y1: 17, x2: 9, y2: 17, period: 3.5, on: 2.0, phase: 2.0 },
    ],
    start: [38, 23],
    exit: [2, 23],
    alarmStart: 0,
    requiredLoot: 3, // two stashes + the sapphire
  },
  {
    name: 'Floor 3 — The Rooftop Getaway',
    briefing: 'Alarm already humming. Grab the two cash bags and reach the van. The crew is waiting. Do not keep them waiting.',
    walls: [
      [10, 6, 1, 6], [10, 14, 1, 6], // west vent wall, gap y 12-13
      [29, 6, 1, 6], [29, 14, 1, 6], // east vent wall, gap y 12-13
      [15, 3, 10, 1], // north block, gap x 15-24 open below it
    ],
    shadows: [[2, 18, 4, 2], [34, 18, 4, 2], [17, 10, 4, 2], [6, 6, 3, 2]],
    covers: [[6, 10], [12, 4], [18, 7], [22, 7], [27, 4], [33, 10], [8, 16], [31, 16], [15, 16], [24, 16]],
    vents: [[9, 12], [10, 12], [11, 12], [28, 12], [29, 12], [30, 12]],
    loot: [
      { x: 6, y: 4, kind: 'cash', value: 1200, name: 'Cash bag — north' },
      { x: 34, y: 6, kind: 'cash', value: 1200, name: 'Cash bag — east' },
    ],
    vault: null,
    guards: [
      { name: 'Rook', path: [[4, 8], [14, 8], [14, 20], [4, 20]], pause: 0.8 },
      { name: 'Sable', path: [[25, 8], [35, 8], [35, 20], [25, 20]], pause: 0.8 },
      { name: 'Mara', path: [[16, 4], [23, 4], [23, 14], [16, 14]], pause: 0.6 },
    ],
    cameras: [
      { x: 20, y: 1, dir: Math.PI / 2, arc: 1.6, speed: 0.7 },
      { x: 1, y: 12, dir: 0, arc: 1.2, speed: 0.6 },
    ],
    lasers: [
      { x1: 14, y1: 22, x2: 25, y2: 22, period: 3.0, on: 1.5, phase: 0.5 },
    ],
    start: [20, 2],
    exit: [20, 23],
    alarmStart: 40,
    requiredLoot: 2,
  },
];

// Build every level's grid once, at import time.
for (const level of LEVELS) level.grid = buildGrid(level);

export function tileAt(level, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return '#';
  return level.grid[ty][tx];
}

export function isSolid(level, tx, ty) {
  const t = tileAt(level, tx, ty);
  return t === '#' || t === 'C';
}

// Solid for a guard: vents count as walls for guards.
export function isSolidForGuard(level, tx, ty) {
  const t = tileAt(level, tx, ty);
  return t === '#' || t === 'C' || t === 'V';
}

export function tileCenter(tx, ty) {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

// Breadth-first walkable path for the thief (vents allowed) or a guard.
// Returns an array of tile centers, start tile excluded, or null.
export function findPath(level, sx, sy, tx, ty, forGuard) {
  const solid = forGuard ? isSolidForGuard : isSolid;
  if (solid(level, tx, ty)) return null;
  const key = (x, y) => y * MAP_W + x;
  const prev = new Map();
  const queue = [[sx, sy]];
  prev.set(key(sx, sy), null);
  while (queue.length) {
    const [x, y] = queue.shift();
    if (x === tx && y === ty) {
      const tiles = [];
      let cur = [x, y];
      while (cur) {
        tiles.unshift(cur);
        cur = prev.get(key(cur[0], cur[1]));
      }
      tiles.shift(); // drop the start tile
      return tiles.map(([px, py]) => tileCenter(px, py));
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H) continue;
      if (prev.has(key(nx, ny))) continue;
      if (solid(level, nx, ny)) continue;
      prev.set(key(nx, ny), [x, y]);
      queue.push([nx, ny]);
    }
  }
  return null;
}
