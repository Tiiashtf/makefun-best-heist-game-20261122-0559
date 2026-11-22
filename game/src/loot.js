// loot.js — the take: paintings, gold, gems, cash, and the vault.
// One job: hold what can be stolen, crack the vault's tumbler, and know when
// the thief has enough to leave. Loot is collected by walking over it; the
// vault needs the timing minigame (press E in the green zone, three times).

import { TILE, VAULT_HITS, VAULT_ZONE, ALARM_VAULT_MISS } from './config.js';
import { tileCenter } from './levels.js';

export class Loot {
  constructor(levelDef) {
    this.items = levelDef.loot.map((d) => ({
      ...d,
      ...tileCenter(d.x, d.y),
      taken: false,
    }));
    this.vault = levelDef.vault
      ? { ...levelDef.vault, ...tileCenter(levelDef.vault.x, levelDef.vault.y), open: false, taken: false }
      : null;
    this.exit = tileCenter(levelDef.exit[0], levelDef.exit[1]);
    this.required = levelDef.requiredLoot;
    // Vault crack state.
    this.cracking = false;
    this.needle = 0;
    this.needleDir = 1;
    this.needleSpeed = 1.6;
    this.zoneStart = 0.3;
    this.hits = 0;
    this.crackMessage = '';
    this.crackMessageFor = 0;
  }

  get takenCount() {
    let n = this.items.filter((i) => i.taken).length;
    if (this.vault && this.vault.taken) n += 1;
    return n;
  }

  get hasEnough() {
    return this.takenCount >= this.required;
  }

  startCrack() {
    if (!this.vault || this.vault.open) return false;
    this.cracking = true;
    this.needle = 0;
    this.needleDir = 1;
    this.hits = 0;
    this.zoneStart = 0.25 + Math.random() * 0.5;
    return true;
  }

  stopCrack() {
    this.cracking = false;
  }

  // One crack attempt: true when the needle is inside the green zone.
  tryCrack(world) {
    if (!this.cracking) return false;
    const inZone = this.needle >= this.zoneStart && this.needle <= this.zoneStart + VAULT_ZONE;
    if (inZone) {
      this.hits += 1;
      world.sfx('vaultClick');
      if (this.hits >= VAULT_HITS) {
        this.vault.open = true;
        this.cracking = false;
        this.crackMessage = 'VAULT OPEN — take the Star Sapphire!';
        this.crackMessageFor = 4;
        world.sfx('vaultOpen');
      } else {
        this.zoneStart = 0.1 + Math.random() * (0.9 - VAULT_ZONE - 0.1);
        this.needleSpeed = Math.min(2.6, this.needleSpeed + 0.25);
        this.crackMessage = `Tumbler ${this.hits} of ${VAULT_HITS} — again!`;
        this.crackMessageFor = 2;
      }
      return true;
    }
    world.alarm = Math.min(100, world.alarm + ALARM_VAULT_MISS);
    this.crackMessage = 'Wrong — the vault groans. Alarm +8.';
    this.crackMessageFor = 2;
    world.sfx('vaultMiss');
    return false;
  }

  update(dt, player, world) {
    if (this.cracking) {
      this.needle += this.needleDir * this.needleSpeed * dt;
      if (this.needle >= 1) { this.needle = 1; this.needleDir = -1; }
      if (this.needle <= 0) { this.needle = 0; this.needleDir = 1; }
    }
    if (this.crackMessageFor > 0) this.crackMessageFor -= dt;

    for (const item of this.items) {
      if (!item.taken && Math.hypot(player.x - item.x, player.y - item.y) < 26) {
        item.taken = true;
        world.onLoot(item);
      }
    }
    if (this.vault && this.vault.open && !this.vault.taken &&
      Math.hypot(player.x - this.vault.x, player.y - this.vault.y) < 34) {
      this.vault.taken = true;
      world.onLoot({ name: this.vault.name, value: this.vault.value });
    }
  }

  nearVault(player) {
    return this.vault && !this.vault.open &&
      Math.hypot(player.x - this.vault.x, player.y - this.vault.y) < 56;
  }

  nearExit(player) {
    return Math.hypot(player.x - this.exit.x, player.y - this.exit.y) < 34;
  }
}

export { TILE };
