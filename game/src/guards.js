// guards.js — the patrol guards.
// One job: move a guard along its route, notice the thief, and react.
// States: patrol -> suspicious -> chase -> search -> return -> patrol.
// A guard that loses the thief searches the last seen spot, then walks home.

import {
  GUARD_PATROL, GUARD_CHASE, GUARD_INVESTIGATE, LOCKDOWN_SPEED,
  GUARD_RANGE, GUARD_HALF_ANGLE, DETECT_RATE, SUSPICION_DECAY,
  CHASE_GIVE_UP, SEARCH_TIME, RUN_FACTOR, ALARM_SPOT_LUMP,
} from './config.js';
import { tileCenter, findPath } from './levels.js';
import { inCone, visibilityAt } from './vision.js';

export class Guard {
  constructor(def) {
    this.name = def.name;
    this.path = def.path.map(([x, y]) => tileCenter(x, y));
    this.pause = def.pause || 1;
    this.x = this.path[0].x;
    this.y = this.path[0].y;
    this.angle = 0;
    this.wp = 1 % this.path.length;
    this.wait = 0;
    this.state = 'patrol';
    this.suspicion = 0;
    this.lastSeen = null;
    this.unseenFor = 0;
    this.searchFor = 0;
    this.route = null; // BFS waypoints for investigate/chase
    this.routeTarget = null;
    this.stuckFor = 0;
    this.lastX = this.x;
    this.lastY = this.y;
    this.alerted = false; // raised the alarm at least once
  }

  reset() {
    this.x = this.path[0].x;
    this.y = this.path[0].y;
    this.wp = 1 % this.path.length;
    this.wait = 0;
    this.state = 'patrol';
    this.suspicion = 0;
    this.lastSeen = null;
    this.unseenFor = 0;
    this.searchFor = 0;
    this.route = null;
    this.alerted = false;
  }

  // Walk toward (tx,ty) at `speed`, sliding along walls. Returns true if it
  // got within 4 px, false otherwise. `level` supplies the collision grid.
  stepToward(level, tx, ty, speed, dt, collide) {
    const dx = tx - this.x, dy = ty - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 4) return true;
    const nx = this.x + (dx / d) * speed * dt;
    const ny = this.y + (dy / d) * speed * dt;
    this.angle = Math.atan2(dy, dx);
    if (collide(level, nx, this.y, 13)) this.x = nx;
    if (collide(level, this.x, ny, 13)) this.y = ny;
    return false;
  }

  // Follow a BFS route; replan when the target moved far or the route ends.
  followRoute(level, tx, ty, speed, dt, collide) {
    const needPlan = !this.route || !this.routeTarget ||
      Math.hypot(tx - this.routeTarget.x, ty - this.routeTarget.y) > 64;
    if (needPlan) {
      const sx = Math.floor(this.x / 32), sy = Math.floor(this.y / 32);
      const ex = Math.floor(tx / 32), ey = Math.floor(ty / 32);
      this.route = findPath(level, sx, sy, ex, ey, true);
      this.routeTarget = { x: tx, y: ty };
      if (!this.route) return this.stepToward(level, tx, ty, speed, dt, collide);
    }
    while (this.route.length) {
      const next = this.route[0];
      if (this.stepToward(level, next.x, next.y, speed, dt, collide)) {
        this.route.shift();
      } else {
        break;
      }
    }
    return this.route.length === 0;
  }

  investigate(level, x, y) {
    if (this.state === 'chase') return;
    this.state = 'investigate';
    this.lastSeen = { x, y };
    this.route = null;
    this.unseenFor = 0;
  }

  update(level, player, dt, world) {
    // Bound: guards collide as guards (vents are walls for them).
    const collide = (l, x, y, r) => world.guardCollide(l, x, y, r);
    const speedMul = world.lockdown ? LOCKDOWN_SPEED : 1;
    const sees = inCone(level, this.x, this.y, this.angle, GUARD_HALF_ANGLE,
      GUARD_RANGE, player.x, player.y) && !world.visionBlocked(this.x, this.y, player.x, player.y);

    if (sees) {
      const vis = visibilityAt(level, player.x, player.y, player.sneaking) *
        (player.running ? RUN_FACTOR : 1);
      this.suspicion = Math.min(1, this.suspicion + DETECT_RATE * vis * dt);
      this.lastSeen = { x: player.x, y: player.y };
      this.unseenFor = 0;
      if (this.suspicion >= 1 && this.state !== 'chase') {
        this.state = 'chase';
        this.route = null;
        if (!this.alerted) {
          this.alerted = true;
          world.alarm = Math.min(100, world.alarm + ALARM_SPOT_LUMP);
          world.onSpotted(this);
        }
      }
    } else {
      this.suspicion = Math.max(0, this.suspicion - SUSPICION_DECAY * dt);
      this.unseenFor += dt;
    }

    // Stuck detection: if barely moving while trying to walk, give up the route.
    const moved = Math.hypot(this.x - this.lastX, this.y - this.lastY);
    this.lastX = this.x; this.lastY = this.y;
    if ((this.state === 'chase' || this.state === 'investigate') && moved < 0.15) {
      this.stuckFor += dt;
      if (this.stuckFor > 1.5) { this.route = null; this.stuckFor = 0; }
    } else {
      this.stuckFor = 0;
    }

    switch (this.state) {
      case 'patrol': {
        if (this.wait > 0) {
          this.wait -= dt;
          this.angle += dt * 0.6; // look around while waiting
          break;
        }
        const target = this.path[this.wp];
        if (this.stepToward(level, target.x, target.y, GUARD_PATROL * speedMul, dt, collide)) {
          this.wp = (this.wp + 1) % this.path.length;
          this.wait = this.pause;
        }
        break;
      }
      case 'investigate': {
        if (!this.lastSeen) { this.state = 'patrol'; break; }
        if (this.followRoute(level, this.lastSeen.x, this.lastSeen.y,
          GUARD_INVESTIGATE * speedMul, dt, collide)) {
          this.state = 'search';
          this.searchFor = SEARCH_TIME;
        }
        break;
      }
      case 'chase': {
        if (sees || (this.lastSeen && this.unseenFor < CHASE_GIVE_UP)) {
          const tx = sees ? player.x : this.lastSeen.x;
          const ty = sees ? player.y : this.lastSeen.y;
          this.followRoute(level, tx, ty, GUARD_CHASE * speedMul, dt, collide);
        } else {
          this.state = 'search';
          this.searchFor = SEARCH_TIME;
        }
        break;
      }
      case 'search': {
        this.searchFor -= dt;
        this.angle += dt * 1.8; // scan the room
        if (this.searchFor <= 0) {
          this.state = 'return';
          this.route = null;
        }
        break;
      }
      case 'return': {
        const home = this.path[0];
        if (this.followRoute(level, home.x, home.y, GUARD_PATROL * speedMul, dt, collide)) {
          this.state = 'patrol';
          this.wp = 1 % this.path.length;
        }
        break;
      }
    }
  }
}
