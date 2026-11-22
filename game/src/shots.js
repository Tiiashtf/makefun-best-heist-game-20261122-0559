// shots.js — deterministic staged scenes for the screenshots.
// One job: put a real, running game into a photogenic state for each shot.
// Every shot renders the game's own code (same update/render path as play);
// the staging only chooses where the thief, the guards and the alarm are.
//   ?shot=title   — the title screen over the gallery
//   ?shot=heist   — mid-heist: thief crossing the room, cones sweeping, loot in sight
//   ?shot=vault   — at the vault, tumbler mid-crack, alarm climbing
//   ?shot=getaway — the rooftop dash for the van, alarm high

import { tileCenter } from './levels.js';

function placeGuard(game, i, tx, ty, angle, suspicion, state) {
  const g = game.guards[i];
  if (!g) return;
  const c = tileCenter(tx, ty);
  g.x = c.x; g.y = c.y;
  g.angle = angle;
  g.suspicion = suspicion;
  g.state = state || 'patrol';
  g.wait = 0;
  g.route = null;
}

export function stageShot(game, shot) {
  if (shot === 'title') {
    game.screen = 'title';
    return;
  }
  if (shot === 'heist') {
    game.loadLevel(0);
    game.screen = 'playing';
    const p = game.player;
    const c = tileCenter(19, 12);
    p.x = c.x; p.y = c.y; p.angle = Math.PI / 4; p.sneaking = true;
    placeGuard(game, 0, 15, 8, Math.PI / 2, 0.45, 'patrol');
    placeGuard(game, 1, 30, 16, -Math.PI / 2, 0.1, 'patrol');
    game.cameras[0].phase = 0.9;
    game.cameras[0].angle = game.cameras[0].baseDir + Math.sin(0.9) * game.cameras[0].arc;
    game.loot.items[0].taken = true; // one painting already lifted
    game.lootValue = 800;
    game.alarm = 35;
    game.elapsed = 95;
    game.say('Two down, one to go — the Duchess is already in the bag.', 99);
    return;
  }
  if (shot === 'vault') {
    game.loadLevel(1);
    game.screen = 'playing';
    const p = game.player;
    const v = game.loot.vault;
    p.x = v.x; p.y = v.y + 52; p.angle = -Math.PI / 2;
    game.loot.items[0].taken = true;
    game.loot.items[1].taken = true;
    game.lootValue = 1100;
    game.loot.cracking = true;
    game.loot.needle = 0.42;
    game.loot.needleDir = 1;
    game.loot.zoneStart = 0.35;
    game.loot.hits = 1;
    placeGuard(game, 0, 12, 6, 0, 0.6, 'investigate');
    game.guards[0].lastSeen = { x: p.x, y: p.y };
    placeGuard(game, 1, 27, 10, Math.PI, 0, 'patrol');
    placeGuard(game, 2, 20, 21, -Math.PI / 2, 0, 'patrol');
    game.alarm = 58;
    game.elapsed = 214;
    game.say('One tumbler down — hold still, Vesper.', 99);
    return;
  }
  if (shot === 'getaway') {
    game.loadLevel(2);
    game.screen = 'playing';
    const p = game.player;
    const c = tileCenter(20, 18);
    p.x = c.x; p.y = c.y; p.angle = Math.PI / 2; p.running = true; p.moving = true;
    game.loot.items[0].taken = true;
    game.loot.items[1].taken = true;
    game.lootValue = 2400;
    placeGuard(game, 0, 8, 16, Math.PI / 2, 1, 'chase');
    game.guards[0].lastSeen = { x: p.x, y: p.y };
    placeGuard(game, 1, 32, 16, Math.PI / 2, 0.8, 'chase');
    game.guards[1].lastSeen = { x: p.x, y: p.y };
    placeGuard(game, 2, 20, 8, Math.PI / 2, 0.3, 'patrol');
    game.alarm = 82;
    game.elapsed = 301;
    game.say('The van is right there — RUN!', 99);
    return;
  }
  // Unknown shot: just play the level.
  game.screen = 'playing';
}
