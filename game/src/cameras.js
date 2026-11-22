// cameras.js — the sweeping security cameras.
// One job: sweep a cone back and forth, and raise the alarm while the thief
// stands in it. A camera that spots the thief also sends the nearest guard
// to investigate. EMP disables a camera for a while.

import { CAMERA_RANGE, CAMERA_HALF_ANGLE, ALARM_CAMERA_RATE } from './config.js';
import { inCone } from './vision.js';

export class Camera {
  constructor(def, index = 0) {
    this.x = (def.x + 0.5) * 32;
    this.y = (def.y + 0.5) * 32;
    this.baseDir = def.dir;
    this.arc = def.arc;
    this.speed = def.speed;
    // Fixed phase per camera so a staged scene always looks the same.
    this.phase = index * 1.7;
    this.angle = def.dir;
    this.disabledFor = 0;
    this.seeing = false;
  }

  reset() {
    this.disabledFor = 0;
    this.seeing = false;
  }

  update(level, player, dt, world) {
    if (this.disabledFor > 0) {
      this.disabledFor -= dt;
      this.seeing = false;
      return;
    }
    this.phase += dt * this.speed;
    this.angle = this.baseDir + Math.sin(this.phase) * this.arc;
    const sees = inCone(level, this.x, this.y, this.angle, CAMERA_HALF_ANGLE,
      CAMERA_RANGE, player.x, player.y) &&
      !world.visionBlocked(this.x, this.y, player.x, player.y);
    this.seeing = sees;
    if (sees) {
      world.alarm = Math.min(100, world.alarm + ALARM_CAMERA_RATE * dt);
      world.onCameraSpot(this);
    }
  }
}
