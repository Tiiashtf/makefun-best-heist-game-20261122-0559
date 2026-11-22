// main.js — bootstrap, the frame loop, and the self-test autopilot.
// One job: start the game, run it, and (only under ?selftest=1) prove it can
// be won by playing it with a bot through the same update path a human uses.

import { Game } from './game.js';
import { Input } from './input.js';
import { draw } from './render.js';
import { stageShot } from './shots.js';
import { VIEW_W, VIEW_H, TILE } from './config.js';
import { LEVELS, tileCenter, findPath, isSolid } from './levels.js';

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const selftest = params.get('selftest') === '1';

const canvas = document.getElementById('game');
canvas.width = VIEW_W;
canvas.height = VIEW_H;
const ctx = canvas.getContext('2d');
const input = new Input(canvas);
const game = new Game();

// A minimal input the bot drives: no keys, no clicks; movement comes from
// the click-to-move path the bot sets with game.setMoveTarget.
class BotInput {
  constructor() { this.run = false; }
  moveVector() { return { x: 0, y: 0 }; }
  held(name) { return name === 'shift' && this.run; }
  consume() { return false; }
  consumeClick() { return null; }
}

function nearestShadowTile(game) {
  const p = game.player;
  let best = null, bestD = Infinity;
  for (let ty = 0; ty < 25; ty++) {
    for (let tx = 0; tx < 40; tx++) {
      if (game.level.grid[ty][tx] !== 's') continue;
      const c = tileCenter(tx, ty);
      const d = Math.hypot(c.x - p.x, c.y - p.y);
      if (d < bestD) { bestD = d; best = c; }
    }
  }
  return best;
}

// One bot decision per tick. Returns nothing; it steers through the game's
// own public methods, exactly as a player's keys and clicks would.
function botThink(game, bot, state) {
  const p = game.player;
  const loot = game.loot;

  // Vault: stand at it and work the tumbler.
  if (loot.cracking) {
    if (loot.needle >= loot.zoneStart && loot.needle <= loot.zoneStart + 0.22) {
      game.pressVaultKey();
    }
    return;
  }
  if (loot.vault && !loot.vault.open && loot.takenCount >= loot.items.length) {
    if (loot.nearVault(p)) { game.startVault(); return; }
    state.target = { x: loot.vault.x, y: loot.vault.y, kind: 'vault' };
  } else if (loot.vault && loot.vault.open && !loot.vault.taken) {
    state.target = { x: loot.vault.x, y: loot.vault.y, kind: 'sapphire' };
  } else if (!loot.hasEnough) {
    let best = null, bestD = Infinity;
    for (const item of loot.items) {
      if (item.taken) continue;
      const d = Math.hypot(item.x - p.x, item.y - p.y);
      if (d < bestD) { bestD = d; best = item; }
    }
    if (best) state.target = { x: best.x, y: best.y, kind: 'loot' };
  } else {
    state.target = { x: loot.exit.x, y: loot.exit.y, kind: 'exit' };
  }

  // Flee: a chasing guard nearby means run, and smoke if we can afford it.
  const chaser = game.guards.find((g) => g.state === 'chase' &&
    Math.hypot(g.x - p.x, g.y - p.y) < 220);
  bot.run = !!chaser;
  if (chaser && game.tools.canAfford('smoke', game.lootValue)) {
    game.useTool('smoke', p.x, p.y);
  }

  // Re-plan when the target moved, the path ran out, or we are stuck.
  const moved = Math.hypot(p.x - state.lastX, p.y - state.lastY);
  state.lastX = p.x; state.lastY = p.y;
  if (moved < 0.5) state.stuckFor += 1 / 60; else state.stuckFor = 0;
  const targetKey = state.target ? `${state.target.kind}:${Math.round(state.target.x)},${Math.round(state.target.y)}` : '';
  state.replanFor -= 1 / 60;
  if (targetKey !== state.targetKey || !game.movePath || !game.movePath.length ||
      state.replanFor <= 0 || state.stuckFor > 2) {
    state.targetKey = targetKey;
    state.replanFor = 0.75;
    if (state.stuckFor > 2) {
      state.stuckFor = 0;
      const shadow = nearestShadowTile(game);
      if (shadow) { game.setMoveTarget(shadow.x, shadow.y); return; }
    }
    if (state.target) game.setMoveTarget(state.target.x, state.target.y);
  }
}

function runSelftest() {
  const bot = new BotInput();
  const state = { target: null, targetKey: '', replanFor: 0, stuckFor: 0, lastX: 0, lastY: 0 };
  const results = [];
  const dt = 1 / 60;
  let total = 0;
  game.start();
  let guard = 0;
  while (guard < 60 * 600) { // at most 10 minutes of game time
    guard += 1;
    if (game.screen === 'briefing') { game.screen = 'playing'; continue; }
    if (game.screen === 'levelClear') {
      results.push({ level: game.levelIndex, won: true, time: +game.elapsed.toFixed(1), loot: game.lootValue, hearts: game.hearts, alarm: Math.round(game.alarm) });
      game.nextLevel();
      state.targetKey = '';
      state.target = null;
      continue;
    }
    if (game.screen === 'caught') { game.respawn(); continue; }
    if (game.screen === 'win') {
      // The levelClear branch already recorded this floor; do not double it.
      if (!results.length || results[results.length - 1].level !== game.levelIndex) {
        results.push({ level: game.levelIndex, won: true, time: +game.elapsed.toFixed(1), loot: game.lootValue, hearts: game.hearts, alarm: Math.round(game.alarm) });
      }
      break;
    }
    if (game.screen === 'busted') {
      results.push({ level: game.levelIndex, won: false, time: +game.elapsed.toFixed(1), loot: game.lootValue, hearts: game.hearts, alarm: Math.round(game.alarm) });
      break;
    }
    if (game.screen !== 'playing') break;
    botThink(game, bot, state);
    game.update(dt, bot);
    total += dt;
    if (game.screen === 'playing' && game.elapsed > 240 && results.length === game.levelIndex) {
      // A level that takes over 4 minutes is a failure of the bot, not proof.
      results.push({ level: game.levelIndex, won: false, time: +game.elapsed.toFixed(1), loot: game.lootValue, hearts: game.hearts, alarm: Math.round(game.alarm), note: 'timeout' });
      break;
    }
  }
  const won = game.screen === 'win';
  const report = { won, levels: results, totalTime: +total.toFixed(1), finalLoot: game.lootValue, hearts: game.hearts };
  const el = document.getElementById('selftest');
  el.textContent = JSON.stringify(report);
  document.title = `SELFTEST ${won ? 'WIN' : 'FAIL'} ${JSON.stringify(report)}`;
  draw(ctx, game);
  return report;
}

if (selftest) {
  runSelftest();
} else if (shot) {
  stageShot(game, shot);
  draw(ctx, game);
  // Keep rendering so pulsing loot and cones animate for the screenshot.
  const loop = () => { game.time += 1 / 60; draw(ctx, game); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
} else {
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (game.screen === 'playing') game.update(dt, input);
    else if (game.screen === 'paused') game.pausedAdvance(input);
    else game.advance(input);
    draw(ctx, game);
    requestAnimationFrame(loop);
  };
  draw(ctx, game);
  requestAnimationFrame(loop);
}
