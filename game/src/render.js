// render.js — everything the player sees.
// One job: draw the room, the people in it, and the HUD, from the game state.
// Safe cover, danger and loot each have their own colour so the frame reads
// at a glance, even shrunk to a contact sheet.

import { TILE, VIEW_W, VIEW_H, COLORS, TOOLS, GAME_NAME, VAULT_ZONE } from './config.js';
import { MAP_W, MAP_H, tileAt } from './levels.js';

function conePath(ctx, x, y, angle, halfAngle, range) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, halfAngle, range, fill) {
  conePath(ctx, x, y, angle, halfAngle, range);
  ctx.fillStyle = fill;
  ctx.fill();
}

export function drawRoom(ctx, game) {
  const level = game.level;
  for (let ty = 0; ty < MAP_H; ty++) {
    for (let tx = 0; tx < MAP_W; tx++) {
      const t = tileAt(level, tx, ty);
      const px = tx * TILE, py = ty * TILE;
      if (t === '#') {
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = COLORS.wallTop;
        ctx.fillRect(px, py, TILE, 5);
        continue;
      }
      ctx.fillStyle = (tx + ty) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(px, py, TILE, TILE);
      if (t === 's') {
        ctx.fillStyle = COLORS.shadow;
        ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
        ctx.strokeStyle = COLORS.shadowEdge;
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 3.5, py + 3.5, TILE - 7, TILE - 7);
      } else if (t === 'V') {
        ctx.fillStyle = COLORS.vent;
        ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
        ctx.strokeStyle = '#20242e';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(px + 7, py + 9 + i * 7);
          ctx.lineTo(px + TILE - 7, py + 9 + i * 7);
          ctx.stroke();
        }
      } else if (t === 'C') {
        ctx.fillStyle = COLORS.cover;
        ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
        ctx.fillStyle = COLORS.coverTop;
        ctx.fillRect(px + 3, py + 3, TILE - 6, 6);
        ctx.strokeStyle = '#2c2115';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 3.5, py + 3.5, TILE - 7, TILE - 7);
      }
    }
  }

  // Exit door: a green doorway with an EXIT sign.
  const ex = game.loot.exit;
  ctx.fillStyle = COLORS.exitDark;
  ctx.fillRect(ex.x - 22, ex.y - 22, 44, 44);
  ctx.fillStyle = COLORS.exit;
  ctx.fillRect(ex.x - 18, ex.y - 18, 36, 36);
  ctx.fillStyle = '#062b16';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', ex.x, ex.y + 4);

  // Vault: a steel door in the floor.
  if (game.loot.vault) {
    const v = game.loot.vault;
    ctx.fillStyle = '#4a505c';
    ctx.fillRect(v.x - 26, v.y - 26, 52, 52);
    ctx.fillStyle = v.open ? '#2fd67a' : '#8b93a3';
    ctx.beginPath();
    ctx.arc(v.x, v.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#20242e';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#20242e';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(v.open ? 'OPEN' : 'VAULT', v.x, v.y - 32);
  }
}

function drawLoot(ctx, game) {
  for (const item of game.loot.items) {
    if (item.taken) continue;
    const pulse = 1 + Math.sin(game.time * 3 + item.x) * 0.08;
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.scale(pulse, pulse);
    if (item.kind === 'painting') {
      ctx.fillStyle = COLORS.lootFrame;
      ctx.fillRect(-14, -11, 28, 22);
      ctx.fillStyle = '#3a2f5e';
      ctx.fillRect(-11, -8, 22, 16);
      ctx.fillStyle = COLORS.lootGold;
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (item.kind === 'gold') {
      ctx.fillStyle = COLORS.lootGold;
      for (let i = 0; i < 3; i++) ctx.fillRect(-10 + i * 2, 4 - i * 5, 18 - i * 4, 5);
    } else if (item.kind === 'gems') {
      ctx.fillStyle = '#54e0ff';
      ctx.beginPath();
      ctx.moveTo(0, -12); ctx.lineTo(10, 0); ctx.lineTo(0, 12); ctx.lineTo(-10, 0);
      ctx.closePath(); ctx.fill();
    } else {
      ctx.fillStyle = '#2fae5f';
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e8eef5';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('$', 0, 4);
    }
    ctx.restore();
    ctx.fillStyle = COLORS.lootGold;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`$${item.value}`, item.x, item.y - 18);
  }
  const v = game.loot.vault;
  if (v && v.open && !v.taken) {
    ctx.fillStyle = '#54e0ff';
    ctx.beginPath();
    ctx.moveTo(v.x, v.y - 12); ctx.lineTo(v.x + 10, v.y); ctx.lineTo(v.x, v.y + 12); ctx.lineTo(v.x - 10, v.y);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = COLORS.lootGold;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`$${v.value}`, v.x, v.y - 34);
  }
}

function drawLasers(ctx, game) {
  for (const b of game.lasers.beams) {
    const live = game.lasers.isLive(b);
    ctx.strokeStyle = live ? COLORS.laserOn : COLORS.laserOff;
    ctx.lineWidth = live ? 3 : 2;
    if (live) {
      ctx.shadowColor = COLORS.laserOn;
      ctx.shadowBlur = 10;
    }
    ctx.beginPath();
    ctx.moveTo(b.x1, b.y1);
    ctx.lineTo(b.x2, b.y2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = live ? '#ff8fa0' : '#7a3a44';
    ctx.beginPath(); ctx.arc(b.x1, b.y1, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(b.x2, b.y2, 5, 0, Math.PI * 2); ctx.fill();
  }
}

function drawCameras(ctx, game) {
  for (const cam of game.cameras) {
    if (cam.disabledFor <= 0) {
      drawCone(ctx, cam.x, cam.y, cam.angle, 0.5, 300, COLORS.cameraCone);
    }
    ctx.fillStyle = cam.disabledFor > 0 ? '#5a6a7a' : COLORS.camera;
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0b1520';
    ctx.beginPath();
    ctx.arc(cam.x + Math.cos(cam.angle) * 4, cam.y + Math.sin(cam.angle) * 4, 3, 0, Math.PI * 2);
    ctx.fill();
    if (cam.seeing) {
      ctx.strokeStyle = '#ff3e3e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cam.x, cam.y, 12 + Math.sin(game.time * 8) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawGuards(ctx, game) {
  for (const g of game.guards) {
    const alert = g.state === 'chase';
    const suspicious = g.suspicion > 0.05;
    drawCone(ctx, g.x, g.y, g.angle, 0.62, 265,
      alert ? COLORS.guardConeAlert : suspicious ? 'rgba(255, 120, 60, 0.25)' : COLORS.guardCone);
    // Body: amber uniform, dark cap.
    ctx.fillStyle = COLORS.guard;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a2a10';
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(g.angle) * 5, g.y + Math.sin(g.angle) * 5, 6, 0, Math.PI * 2);
    ctx.fill();
    // Facing tick.
    ctx.strokeStyle = '#3a2a10';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.angle) * 18, g.y + Math.sin(g.angle) * 18);
    ctx.stroke();
    // Suspicion arc + mark.
    if (g.suspicion > 0.05 || alert) {
      ctx.strokeStyle = alert ? '#ff3e3e' : '#ffb13c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(g.x, g.y, 19, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * g.suspicion);
      ctx.stroke();
      ctx.fillStyle = alert ? '#ff3e3e' : '#ffb13c';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(alert ? '!' : '?', g.x, g.y - 24);
    }
    ctx.fillStyle = '#e8eef5';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(g.name, g.x, g.y + 26);
  }
}

function drawPlayer(ctx, game) {
  const p = game.player;
  // Noise ring while running: shows how loud running is.
  if (p.running && p.moving) {
    ctx.strokeStyle = 'rgba(232, 238, 245, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 26 + Math.sin(game.time * 10) * 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = COLORS.playerCoat;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
  ctx.fill();
  // White shirt front + hat brim: the thief reads at a glance.
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.angle) * 4, p.y + Math.sin(p.angle) * 4, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.player;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + Math.cos(p.angle) * 18, p.y + Math.sin(p.angle) * 18);
  ctx.stroke();
  if (p.sneaking) {
    ctx.fillStyle = '#9fb0c3';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('sneaking', p.x, p.y - 20);
  }
}

function drawTools(ctx, game) {
  for (const s of game.tools.smokes) {
    const grad = ctx.createRadialGradient(s.x, s.y, 10, s.x, s.y, s.radius);
    grad.addColorStop(0, COLORS.smoke);
    grad.addColorStop(1, 'rgba(180, 190, 205, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  if (game.tools.noiseAt) {
    ctx.strokeStyle = '#f5c542';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(game.tools.noiseAt.x, game.tools.noiseAt.y, 12 + Math.sin(game.time * 12) * 3, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawHud(ctx, game) {
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, 0, VIEW_W, 52);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(game.level.name, 14, 21);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '12px sans-serif';
  ctx.fillText(`Loot ${game.loot.takenCount}/${game.loot.required}  •  ${game.objective}`, 14, 40);

  // Alarm meter, top centre: the number the whole game revolves around.
  const aw = 340, ax = VIEW_W / 2 - aw / 2;
  const alarm = game.alarm;
  const aColor = alarm < 40 ? COLORS.alarmLow : alarm < 75 ? COLORS.alarmMid : COLORS.alarmHigh;
  ctx.fillStyle = '#0b1520';
  ctx.fillRect(ax - 2, 10, aw + 4, 24);
  ctx.fillStyle = aColor;
  ctx.fillRect(ax, 12, (aw * alarm) / 100, 20);
  ctx.strokeStyle = '#e8eef5';
  ctx.lineWidth = 1;
  ctx.strokeRect(ax - 2.5, 9.5, aw + 5, 25);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`ALARM ${Math.round(alarm)}%${game.lockdown > 0 ? ' — LOCKDOWN!' : ''}`, VIEW_W / 2, 27);
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '11px sans-serif';
  ctx.fillText(game.lockdown > 0 ? 'exit sealed — stay out of sight' : 'seen = alarm rises • hidden = it falls', VIEW_W / 2, 46);

  // Right side: loot, hearts, timer.
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.lootGold;
  ctx.font = 'bold 17px sans-serif';
  ctx.fillText(`$${game.lootValue.toLocaleString()}`, VIEW_W - 14, 21);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '12px sans-serif';
  const mm = Math.floor(game.elapsed / 60);
  const ss = Math.floor(game.elapsed % 60).toString().padStart(2, '0');
  ctx.fillText(`♥`.repeat(game.hearts) + `  ${mm}:${ss}`, VIEW_W - 14, 40);

  // Tool bar, bottom left.
  const kinds = ['smoke', 'emp', 'noise'];
  kinds.forEach((kind, i) => {
    const t = TOOLS[kind];
    const x = 14 + i * 190, y = VIEW_H - 44;
    ctx.fillStyle = game.tools.selected === kind ? 'rgba(245, 197, 66, 0.25)' : COLORS.hudBg;
    ctx.fillRect(x, y, 180, 34);
    ctx.strokeStyle = game.tools.selected === kind ? COLORS.lootGold : '#3a4a5e';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, 180, 34);
    const afford = game.tools.canAfford(kind, game.lootValue);
    ctx.fillStyle = afford ? COLORS.hudText : '#5a6a7a';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`[${t.key}] ${t.name}  $${t.cost}  ×${game.tools.stock[kind]}`, x + 8, y + 21);
  });
  ctx.fillStyle = COLORS.hudDim;
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('WASD move • Shift run • C sneak • 1/2/3 tool • click: use tool • E vault • P pause • M mute', VIEW_W - 14, VIEW_H - 16);

  // Vault crack overlay.
  if (game.loot.cracking) {
    const bw = 420, bx = VIEW_W / 2 - bw / 2, by = VIEW_H - 150;
    ctx.fillStyle = COLORS.hudBg;
    ctx.fillRect(bx - 12, by - 34, bw + 24, 84);
    ctx.strokeStyle = COLORS.lootGold;
    ctx.strokeRect(bx - 11.5, by - 33.5, bw + 23, 83);
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`CRACKING THE VAULT — ${game.loot.hits}/${3} tumblers`, VIEW_W / 2, by - 12);
    ctx.fillStyle = '#0b1520';
    ctx.fillRect(bx, by, bw, 16);
    const zx = bx + game.loot.zoneStart * bw;
    ctx.fillStyle = COLORS.exit;
    ctx.fillRect(zx, by, VAULT_ZONE * bw, 16);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx + game.loot.needle * bw - 2, by - 4, 4, 24);
    ctx.fillStyle = COLORS.hudDim;
    ctx.font = '12px sans-serif';
    ctx.fillText('Press E when the needle is in the green — a miss feeds the alarm', VIEW_W / 2, by + 34);
  }
  if (game.loot.crackMessageFor > 0) {
    ctx.fillStyle = COLORS.lootGold;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.loot.crackMessage, VIEW_W / 2, VIEW_H - 170);
  }

  // Transient message line.
  if (game.messageFor > 0) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.message, VIEW_W / 2, 74);
  }
}

function panel(ctx, title, lines, foot) {
  ctx.fillStyle = 'rgba(8, 12, 20, 0.88)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = COLORS.lootGold;
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, VIEW_W / 2, 240);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '17px sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 300 + i * 30));
  if (foot) {
    ctx.fillStyle = COLORS.hudDim;
    ctx.font = '14px sans-serif';
    ctx.fillText(foot, VIEW_W / 2, 300 + lines.length * 30 + 30);
  }
}

export function draw(ctx, game) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (game.screen === 'title') {
    drawRoom(ctx, game);
    drawLoot(ctx, game);
    drawGuards(ctx, game);
    panel(ctx, GAME_NAME, [
      'A three-floor museum heist. You are Vesper, the best second-story thief in the city.',
      'Steal the art, crack the vault, reach the van — and never let the alarm hit 100%.',
      'Guards patrol with vision cones. Cameras sweep. Lasers blink. Shadows hide you.',
      'Smoke, EMP and coin tosses cost loot — spend it like it matters, because it does.',
    ], 'Click or press Enter to start — WASD to move, Shift to run, C to sneak');
    return;
  }
  if (game.screen === 'briefing') {
    drawRoom(ctx, game);
    panel(ctx, game.level.name, [game.level.briefing, '', `Loot to steal: ${game.loot.required}  •  Guards: ${game.guards.length}  •  Cameras: ${game.cameras.length}${game.lasers.beams.length ? `  •  Lasers: ${game.lasers.beams.length}` : ''}`], 'Click or press Enter to begin the floor');
    return;
  }
  drawRoom(ctx, game);
  drawLoot(ctx, game);
  drawLasers(ctx, game);
  drawCameras(ctx, game);
  drawGuards(ctx, game);
  drawPlayer(ctx, game);
  drawTools(ctx, game);
  drawHud(ctx, game);
  if (game.screen === 'caught') {
    panel(ctx, 'BUSTED!', [
      `${game.caughtBy} grabbed Vesper under the lights.`,
      game.hearts > 0 ? `The crew drags you out — ${game.hearts} ${game.hearts === 1 ? 'heart' : 'hearts'} left. The loot stays yours.` : 'That was the last heart.',
    ], game.hearts > 0 ? 'Click or press Enter to slip back in' : 'Click or press Enter to try the whole job again');
  } else if (game.screen === 'levelClear') {
    panel(ctx, 'FLOOR CLEAR', [
      `The ${game.level.name.split('—')[1].trim()} is behind you. Haul so far: $${game.lootValue.toLocaleString()}.`,
      game.levelIndex < 2 ? 'Marlowe has the next floor cased. It gets louder up there.' : '',
    ], 'Click or press Enter for the next floor');
  } else if (game.screen === 'win') {
    panel(ctx, 'CLEAN GETAWAY', [
      `The van pulls away with $${game.lootValue.toLocaleString()} of the Halcyon's finest.`,
      `Time ${Math.floor(game.elapsed / 60)}:${Math.floor(game.elapsed % 60).toString().padStart(2, '0')}  •  Hearts left ${game.hearts}  •  Grade ${game.grade}`,
      'Marlowe is already counting it. Vesper is already gone.',
    ], 'Click or press Enter to run the job again');
  } else if (game.screen === 'busted') {
    panel(ctx, 'THE JOB IS BLOWN', [
      'Three strikes and the Halcyon keeps its art — this time.',
      `You kept $${game.lootValue.toLocaleString()} before they caught you for good.`,
    ], 'Click or press Enter to plan the job again');
  } else if (game.screen === 'paused') {
    panel(ctx, 'PAUSED', ['The museum waits. The guards do not — they just stand there.'], 'Press P to keep moving');
  }
}
