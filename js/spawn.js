// js/spawn.js
import { clamp, rand, DIFFICULTIES } from "./state.js";

// ---------- Natural randomness ----------
function nextDelay(mean, min, max) {
  const u = Math.max(1e-6, Math.random());
  const exp = -Math.log(u) * mean;
  return clamp(exp, min, max);
}

const STAR_MEAN = 11;
const JETPACK_MEAN = 30;
const SHIELD_MEAN = 22;

// powerups (rare)
const DOUBLE_MEAN = 70;
const SLOW_MEAN = 55;
const MAGNET_MEAN = 60;
const SHRINK_MEAN = 50;

export const STAR_DOUBLE_CHANCE = 0.1;
export const SHIELD_DOUBLE_CHANCE = 0.04;
export const JETPACK_DOUBLE_CHANCE = 0.03;

export const nextStarDelay = () => nextDelay(STAR_MEAN, 6, 18);
export const nextJetpackDelay = () => nextDelay(JETPACK_MEAN, 16, 48);
export const nextShieldDelay = () => nextDelay(SHIELD_MEAN, 12, 38);

export const nextDoubleDelay = () => nextDelay(DOUBLE_MEAN, 45, 120);
export const nextSlowDelay = () => nextDelay(SLOW_MEAN, 35, 100);
export const nextMagnetDelay = () => nextDelay(MAGNET_MEAN, 35, 110);
export const nextShrinkDelay = () => nextDelay(SHRINK_MEAN, 28, 95);

// ---------- Spawning ----------
export function spawnHazard(game) {
  const { canvas } = game;
  const side = Math.floor(rand(0, 4));
  const size = rand(18, 44);
  let x, y;

  if (side === 0) {
    x = rand(0, canvas.width);
    y = -size;
  } else if (side === 1) {
    x = canvas.width + size;
    y = rand(0, canvas.height);
  } else if (side === 2) {
    x = rand(0, canvas.width);
    y = canvas.height + size;
  } else {
    x = -size;
    y = rand(0, canvas.height);
  }

  const dx = game.player.x - x;
  const dy = game.player.y - y;
  const mag = Math.hypot(dx, dy) || 1;

  const diff = DIFFICULTIES[game.state.difficultyKey] || DIFFICULTIES.normal;
  const ramp = 1 + (game.state.difficultyRamp - 1) * 0.18;
  const speed = rand(140, 220) * ramp * diff.enemySpeedMult;

  game.state.hazards.push({
    x,
    y,
    w: size,
    h: size,
    vx: (dx / mag) * speed + rand(-25, 25),
    vy: (dy / mag) * speed + rand(-25, 25),
    rot: rand(0, Math.PI * 2),
    vr: rand(-2, 2),
  });
}

export function spawnStarPickup(game) {
  const { canvas } = game;
  game.state.stars.push({
    x: rand(60, canvas.width - 60),
    y: rand(60, canvas.height - 60),
    r: 12,
    spin: rand(0, Math.PI * 2),
    pulse: rand(0, Math.PI * 2),
  });
}

export function spawnShieldPickup(game) {
  const { canvas } = game;
  game.state.shields.push({
    x: rand(60, canvas.width - 60),
    y: rand(60, canvas.height - 60),
    r: 16,
    pulse: rand(0, Math.PI * 2),
    life: 5,
  });
}

export function spawnJetpackPickup(game) {
  const { canvas } = game;
  game.state.jetpacks.push({
    x: rand(60, canvas.width - 60),
    y: rand(60, canvas.height - 60),
    r: 18,
    pulse: rand(0, Math.PI * 2),
    life: 5,
  });
}

export function spawnDoublePickup(game) {
  const { canvas } = game;
  game.state.doubles.push({
    x: rand(60, canvas.width - 60),
    y: rand(60, canvas.height - 60),
    r: 16,
    pulse: rand(0, Math.PI * 2),
    life: 7,
  });
}
export function spawnSlowPickup(game) {
  const { canvas } = game;
  game.state.slows.push({
    x: rand(60, canvas.width - 60),
    y: rand(60, canvas.height - 60),
    r: 16,
    pulse: rand(0, Math.PI * 2),
    life: 7,
  });
}
export function spawnMagnetPickup(game) {
  const { canvas } = game;
  game.state.magnets.push({
    x: rand(60, canvas.width - 60),
    y: rand(60, canvas.height - 60),
    r: 16,
    pulse: rand(0, Math.PI * 2),
    life: 7,
  });
}
export function spawnShrinkPickup(game) {
  const { canvas } = game;
  game.state.shrinks.push({
    x: rand(60, canvas.width - 60),
    y: rand(60, canvas.height - 60),
    r: 16,
    pulse: rand(0, Math.PI * 2),
    life: 7,
  });
}
