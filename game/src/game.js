// game.js — the heist itself: state, movement, alarm, hearts, scoring.
// One job: own the game state and step it forward. Guards, cameras, lasers,
// loot and tools each do their own job; this file wires them together.

import {
  TILE, VIEW_W, VIEW_H, PLAYER_WALK, PLAYER_RUN, PLAYER_SNEAK,
  HEARTS, CAUGHT_DISTANCE, ALARM_DECAY, LOCKDOWN_SECONDS, TOOLS,
} from './config.js';
import { LEVELS, tileCenter, isSolid, isSolidForGuard, findPath } from './levels.js';
import { Guard } from './guards.js';
import { Camera } from './cameras.js';
import { LaserGrid } from './lasers.js';
import { Loot } from './loot.js';
import { Tools } from './tools.js';
import { SoundFX } from './audio.js';

export class Game {
  constructor() {
    this.sfxObj = new SoundFX();
    this.tools = new Tools();
    this.screen = 'title'; // title | briefing | playing | caught | levelClear | win | busted | paused
    this.levelIndex = 0;
    this.hearts = HEARTS;
    this.lootValue = 0;
    this.spent = 0;
    this.alarm = 0;
    this.lockdown = 0;
    this.elapsed = 0;
    this.time = 0; // wall-clock-ish time for pulsing animations
    this.message = '';
    this.messageFor = 0;
    this.caughtBy = '';
    this.grade = 'C';
    this.loadLevel(0);
  }

  get level() { return LEVELS[this.levelIndex]; }

  get objective() {
    if (this.level.vault && !this.loot.vault.open) {
      return `Steal ${this.loot.required} items — crack the vault for the sapphire`;
    }
    return this.loot.hasEnough ? 'Reach the EXIT' : `Steal ${this.loot.required - this.loot.takenCount} more, then reach EXIT`;
  }

  loadLevel(index) {
    this.levelIndex = index;
    const def = LEVELS[index];
    this.guards = def.guards.map((g) => new Guard(g));
    this.cameras = def.cameras.map((c, i) => new Camera(c, i));
    this.lasers = new LaserGrid(def.lasers);
    this.loot = new Loot(def);
    const start = tileCenter(def.start[0], def.start[1]);
    this.player = {
      x: start.x, y: start.y, angle: -Math.PI / 2,
      sneaking: false, running: false, moving: false,
    };
    this.moveTarget = null;
    this.movePath = null;
    this.alarm = def.alarmStart;
    this.lockdown = 0;
    this.tools.reset();
  }

  // Circle-vs-tile collision: true when the circle is free to sit there.
  collideAt(x, y, r, forGuard) {
    const solid = forGuard ? isSolidForGuard : isSolid;
    const x0 = Math.floor((x - r) / TILE), x1 = Math.floor((x + r) / TILE);
    const y0 = Math.floor((y - r) / TILE), y1 = Math.floor((y + r) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (!solid(this.level, tx, ty)) continue;
        const cx = Math.max(tx * TILE, Math.min(x, tx * TILE + TILE));
        const cy = Math.max(ty * TILE, Math.min(y, ty * TILE + TILE));
        if ((x - cx) ** 2 + (y - cy) ** 2 < r * r) return false;
      }
    }
    return true;
  }

  collide(level, x, y, r) { return this.collideAt(x, y, r, false); }
  guardCollide(level, x, y, r) { return this.collideAt(x, y, r, true); }

  visionBlocked(x0, y0, x1, y1) {
    return this.tools.visionBlocked(x0, y0, x1, y1);
  }

  sfx(name) { this.sfxObj.play(name); }

  say(text, seconds = 3) {
    this.message = text;
    this.messageFor = seconds;
  }

  onSpotted(guard) {
    this.sfx('spotted');
    this.say(`${guard.name} spotted Vesper!`, 2.5);
  }

  onCameraSpot() {
    // Throttled by the alarm itself: no extra message every frame.
  }

  onLaserTrip() {
    this.sfx('vaultMiss');
    this.say('Laser tripped! The alarm jumps.', 2.5);
    for (const guard of this.guards) {
      if (guard.state === 'patrol') guard.investigate(this.level, this.player.x, this.player.y);
    }
  }

  onLoot(item) {
    this.lootValue += item.value;
    this.sfx('pickup');
    this.say(`${item.name} — +$${item.value.toLocaleString()}`, 2.5);
  }

  setMoveTarget(x, y) {
    this.moveTarget = { x, y };
    const sx = Math.floor(this.player.x / TILE), sy = Math.floor(this.player.y / TILE);
    const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
    this.movePath = findPath(this.level, sx, sy, tx, ty, false);
  }

  useTool(kind, x, y) {
    const spent = this.tools.use(kind, x, y, this);
    if (spent > 0) {
      this.lootValue -= spent;
      this.spent += spent;
    }
    return spent;
  }

  startVault() {
    if (this.loot.nearVault(this.player) && this.loot.startCrack()) {
      this.say('Cracking… press E in the green.', 2);
      return true;
    }
    return false;
  }

  pressVaultKey() {
    if (this.loot.cracking) this.loot.tryCrack(this);
  }

  start() {
    this.levelIndex = 0;
    this.hearts = HEARTS;
    this.lootValue = 0;
    this.spent = 0;
    this.elapsed = 0;
    this.loadLevel(0);
    this.screen = 'briefing';
  }

  nextLevel() {
    if (this.levelIndex < LEVELS.length - 1) {
      this.loadLevel(this.levelIndex + 1);
      this.screen = 'briefing';
    } else {
      this.finishJob();
    }
  }

  finishJob() {
    this.screen = 'win';
    this.grade = this.lootValue >= 7000 ? 'S' : this.lootValue >= 6000 ? 'A' : this.lootValue >= 4500 ? 'B' : 'C';
    this.sfx('win');
  }

  caught(guard) {
    this.hearts -= 1;
    this.caughtBy = guard.name;
    this.sfx('caught');
    this.sfxObj.stopAlarm();
    if (this.hearts <= 0) {
      this.screen = 'busted';
      return;
    }
    this.screen = 'caught';
  }

  respawn() {
    const start = tileCenter(this.level.start[0], this.level.start[1]);
    this.player.x = start.x;
    this.player.y = start.y;
    this.player.angle = -Math.PI / 2;
    this.moveTarget = null;
    this.movePath = null;
    this.loot.stopCrack();
    for (const g of this.guards) g.reset();
    for (const c of this.cameras) c.reset();
    this.lasers.reset();
    this.alarm = Math.max(0, this.alarm - 40);
    this.lockdown = 0;
    this.screen = 'playing';
  }

  update(dt, input) {
    this.time += dt;
    if (this.screen !== 'playing') return;
    this.elapsed += dt;

    const p = this.player;
    const frozen = this.loot.cracking; // cracking the vault: feet planted, hands busy
    const vec = frozen ? { x: 0, y: 0 } : input.moveVector();
    p.sneaking = input.held('c');
    p.running = input.held('shift') && !p.sneaking && (vec.x !== 0 || vec.y !== 0);
    const speed = p.sneaking ? PLAYER_SNEAK : p.running ? PLAYER_RUN : PLAYER_WALK;

    // Keyboard movement cancels a click-to-move order.
    if (vec.x !== 0 || vec.y !== 0) {
      this.moveTarget = null;
      this.movePath = null;
      p.moving = true;
      p.angle = Math.atan2(vec.y, vec.x);
      const nx = p.x + vec.x * speed * dt;
      const ny = p.y + vec.y * speed * dt;
      if (this.collide(this.level, nx, p.y, 13)) p.x = nx;
      if (this.collide(this.level, p.x, ny, 13)) p.y = ny;
    } else if (this.movePath && this.movePath.length) {
      const next = this.movePath[0];
      const dx = next.x - p.x, dy = next.y - p.y;
      const d = Math.hypot(dx, dy);
      p.moving = true;
      p.angle = Math.atan2(dy, dx);
      if (d < 5) {
        this.movePath.shift();
      } else {
        const nx = p.x + (dx / d) * speed * dt;
        const ny = p.y + (dy / d) * speed * dt;
        if (this.collide(this.level, nx, p.y, 13)) p.x = nx;
        if (this.collide(this.level, p.x, ny, 13)) p.y = ny;
      }
    } else {
      p.moving = false;
    }

    // Tool selection and use.
    if (input.consume('1')) this.tools.selected = 'smoke';
    if (input.consume('2')) this.tools.selected = 'emp';
    if (input.consume('3')) this.tools.selected = 'noise';
    const click = input.consumeClick();
    if (click) {
      const kind = this.tools.selected;
      if (kind === 'emp') {
        this.useTool('emp', p.x, p.y);
      } else if (this.tools.canAfford(kind, this.lootValue)) {
        this.useTool(kind, click.x, click.y);
      } else {
        this.say(`${TOOLS[kind].name}: need $${TOOLS[kind].cost} loot and stock — steal more first.`, 2.5);
      }
    }

    // Vault.
    if (input.consume('e', ' ')) {
      if (this.loot.cracking) this.pressVaultKey();
      else if (this.loot.nearVault(p)) this.startVault();
    }
    if (input.consume('escape') && this.loot.cracking) this.loot.stopCrack();

    // Pause / mute.
    if (input.consume('p')) this.screen = 'paused';
    if (input.consume('m')) this.sfxObj.toggleMute();

    this.tools.update(dt);
    this.loot.update(dt, p, this);

    for (const guard of this.guards) guard.update(this.level, p, dt, this);
    for (const cam of this.cameras) cam.update(this.level, p, dt, this);
    this.lasers.update(p, dt, this);

    // Alarm decay and lockdown.
    const anyCameraSeeing = this.cameras.some((c) => c.seeing);
    if (!anyCameraSeeing) this.alarm = Math.max(0, this.alarm - ALARM_DECAY * dt);
    if (this.alarm >= 100 && this.lockdown <= 0) {
      this.lockdown = LOCKDOWN_SECONDS;
      this.say('LOCKDOWN — the exit is sealed!', 3);
      this.sfx('caught');
    }
    if (this.lockdown > 0) {
      this.lockdown -= dt;
      if (this.lockdown <= 0) this.alarm = 55;
    }
    this.sfxObj.alarmLoop(this.alarm >= 75 && this.screen === 'playing');

    if (this.messageFor > 0) this.messageFor -= dt;

    // Caught?
    for (const guard of this.guards) {
      if (guard.state === 'chase' &&
        Math.hypot(guard.x - p.x, guard.y - p.y) < CAUGHT_DISTANCE) {
        this.caught(guard);
        return;
      }
    }

    // Level clear: at the exit with the loot, and not in lockdown.
    if (this.loot.hasEnough && this.loot.nearExit(p) && this.lockdown <= 0) {
      this.sfx('levelClear');
      this.screen = 'levelClear';
    }
  }

  // Screens other than 'playing': one click or Enter advances.
  advance(input) {
    const click = input.consumeClick();
    const enter = input.consume('enter');
    if (!click && !enter) return;
    if (this.screen === 'title') this.start();
    else if (this.screen === 'briefing') this.screen = 'playing';
    else if (this.screen === 'caught') this.respawn();
    else if (this.screen === 'levelClear') this.nextLevel();
    else if (this.screen === 'win' || this.screen === 'busted') this.start();
  }

  pausedAdvance(input) {
    if (input.consume('p', 'enter')) this.screen = 'playing';
  }
}

export { VIEW_W, VIEW_H };
