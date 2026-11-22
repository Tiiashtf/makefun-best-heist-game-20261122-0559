// config.js — tuning and look for THE MARLOWE JOB.
// One job each: this file holds only numbers, names and colours. Nothing here
// moves, draws or decides; the other modules read these values.

export const TILE = 32;
export const VIEW_W = 1280;
export const VIEW_H = 800;

// Movement (pixels per second).
export const PLAYER_WALK = 132;
export const PLAYER_RUN = 196;
export const PLAYER_SNEAK = 72;
export const GUARD_PATROL = 58;
export const GUARD_CHASE = 108;
export const GUARD_INVESTIGATE = 82;
export const LOCKDOWN_SPEED = 1.3;

// Vision.
export const GUARD_RANGE = 265;
export const GUARD_HALF_ANGLE = 0.62; // radians, ~35 degrees
export const CAMERA_RANGE = 300;
export const CAMERA_HALF_ANGLE = 0.5;
export const SHADOW_FACTOR = 0.42; // detection rate while standing in shadow
export const SNEAK_FACTOR = 0.55;
export const RUN_FACTOR = 1.6;

// Detection fills suspicion 0..1; a full guard spots the thief.
export const DETECT_RATE = 1.15; // per second, point blank, standing, lit
export const SUSPICION_DECAY = 0.45;
export const CHASE_GIVE_UP = 3.5; // seconds without seeing the thief
export const SEARCH_TIME = 4.0;

// Alarm 0..100. Camera seeing the thief adds per second; a guard spotting
// adds a lump; a live laser adds a lump. It decays while nobody sees you.
export const ALARM_CAMERA_RATE = 14;
export const ALARM_SPOT_LUMP = 25;
export const ALARM_LASER_LUMP = 20;
export const ALARM_VAULT_MISS = 8;
export const ALARM_DECAY = 2.5;
export const LOCKDOWN_SECONDS = 8;

// Tools: each use costs loot dollars and one unit of stock.
export const TOOLS = {
  smoke: { key: '1', name: 'Smoke bomb', cost: 150, stock: 3, radius: 115, seconds: 6 },
  emp: { key: '2', name: 'EMP pulse', cost: 200, stock: 2, radius: 230, seconds: 12 },
  noise: { key: '3', name: 'Coin toss', cost: 50, stock: 5, radius: 330 },
};

// Vault cracking: 3 green-zone hits open the vault.
export const VAULT_HITS = 3;
export const VAULT_ZONE = 0.22; // width of the green zone, 0..1

export const HEARTS = 3;
export const CAUGHT_DISTANCE = 26;

// Palette: night-heist navy and teal, gold loot, red danger, green safety.
// Cover, danger and loot must read at a glance, even shrunk to a contact sheet.
export const COLORS = {
  floorA: '#16202e',
  floorB: '#131c29',
  wall: '#2e4a63',
  wallTop: '#3d647f',
  cover: '#5a4632',
  coverTop: '#7a5f43',
  shadow: '#0d2b26',
  shadowEdge: '#1d5c50',
  vent: '#3a3f4a',
  laserOn: '#ff2e4d',
  laserOff: '#5c1f2b',
  lootGold: '#f5c542',
  lootFrame: '#8a6d1f',
  exit: '#2fd67a',
  exitDark: '#0f7a44',
  guard: '#e8b13c',
  guardCone: 'rgba(232, 177, 60, 0.20)',
  guardConeAlert: 'rgba(255, 62, 62, 0.30)',
  camera: '#7fd4ff',
  cameraCone: 'rgba(127, 212, 255, 0.16)',
  player: '#f2f2f2',
  playerCoat: '#23232e',
  smoke: 'rgba(180, 190, 205, 0.55)',
  alarmLow: '#2fd67a',
  alarmMid: '#f5c542',
  alarmHigh: '#ff3e3e',
  hudBg: 'rgba(8, 12, 20, 0.82)',
  hudText: '#e8eef5',
  hudDim: '#9fb0c3',
};

export const GAME_NAME = 'THE MARLOWE JOB';
export const THIEF_NAME = 'Vesper';
export const CREW_CONTACT = 'Marlowe';
