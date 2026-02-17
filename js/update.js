// js/update.js
import { clamp, DIFFICULTIES } from "./state.js";
import {
  spawnHazard,
  spawnStarPickup,
  spawnShieldPickup,
  spawnJetpackPickup,
  spawnDoublePickup,
  spawnSlowPickup,
  spawnMagnetPickup,
  spawnShrinkPickup,
  nextStarDelay,
  nextShieldDelay,
  nextJetpackDelay,
  nextDoubleDelay,
  nextSlowDelay,
  nextMagnetDelay,
  nextShrinkDelay,
  STAR_DOUBLE_CHANCE,
  SHIELD_DOUBLE_CHANCE,
  JETPACK_DOUBLE_CHANCE,
} from "./spawn.js";
import { addWalletStars } from "./storage.js";

// ---------- Collision ----------
function circleRectCollide(cx, cy, cr, rx, ry, rw, rh) {
  const closestX = clamp(cx, rx, rx + rw);
  const closestY = clamp(cy, ry, ry + rh);
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy <= cr * cr;
}

export function update(game, dt) {
  const { state, player, canvas, input } = game;
  if (!state.running || state.paused || state.gameOver) return;

  input.readGamepad();

  const diff = DIFFICULTIES[state.difficultyKey] || DIFFICULTIES.normal;

  state.t += dt;
  state.difficultyRamp = 1 + state.t / 18;

  // timers
  if (player.speedBoostTimer > 0) player.speedBoostTimer -= dt;
  if (player.shieldTimer > 0) player.shieldTimer -= dt;

  if (player.doubleTimer > 0) player.doubleTimer -= dt;
  if (player.slowTimer > 0) player.slowTimer -= dt;
  if (player.magnetTimer > 0) player.magnetTimer -= dt;
  if (player.shrinkTimer > 0) player.shrinkTimer -= dt;

  // shrink effect
  player.r = player.shrinkTimer > 0 ? player.baseR * 0.65 : player.baseR;

  // score
  const scoreMult = player.doubleTimer > 0 ? 2 : 1;
  state.score += dt * 10 * diff.scoreMult * scoreMult;
  game.dom.scoreEl.textContent = String(Math.floor(state.score));

  const holdingShift = state.keys.has("shift");
  const speedBoostMult = player.speedBoostTimer > 0 ? 1.6 : 1.0;
  const speed = player.baseSpeed * (holdingShift ? 1.45 : 1.0) * speedBoostMult;

  // keyboard intent
  let kx = 0, ky = 0;
  if (state.keys.has("a")) kx -= 1;
  if (state.keys.has("d")) kx += 1;
  if (state.keys.has("w")) ky -= 1;
  if (state.keys.has("s")) ky += 1;

  // controller intent
  const gx = input.gamepad.ax;
  const gy = input.gamepad.ay;

  // choose stronger input
  const km = Math.hypot(kx, ky);
  const gm = Math.hypot(gx, gy);

  let mx = 0, my = 0;
  if (gm > km) {
    mx = gx; my = gy;
  } else if (km > 0) {
    mx = kx / km; my = ky / km;
  }

  if (mx || my) {
    player.x += mx * speed * dt;
    player.y += my * speed * dt;
  }

  player.x = clamp(player.x, player.r, canvas.width - player.r);
  player.y = clamp(player.y, player.r, canvas.height - player.r);

  // hazards spawn
  state.spawnTimer -= dt;
  const spawnEvery = 0.9 / diff.spawnMult;
  if (state.spawnTimer <= 0) {
    spawnHazard(game);
    if (state.difficultyKey === "hard" && Math.random() < 0.1) spawnHazard(game);
    state.spawnTimer = spawnEvery;
  }

  // stars spawn
  state.starTimer -= dt;
  if (state.starTimer <= 0) {
    spawnStarPickup(game);
    if (Math.random() < STAR_DOUBLE_CHANCE) spawnStarPickup(game);
    state.starTimer = nextStarDelay();
  }

  // shields spawn
  state.shieldSpawnTimer -= dt;
  if (state.shieldSpawnTimer <= 0) {
    spawnShieldPickup(game);
    if (Math.random() < SHIELD_DOUBLE_CHANCE) spawnShieldPickup(game);
    state.shieldSpawnTimer = nextShieldDelay();
  }

  // jetpacks spawn
  state.jetpackSpawnTimer -= dt;
  if (state.jetpackSpawnTimer <= 0) {
    spawnJetpackPickup(game);
    if (Math.random() < JETPACK_DOUBLE_CHANCE) spawnJetpackPickup(game);
    state.jetpackSpawnTimer = nextJetpackDelay();
  }

  // powerups spawn
  state.doubleSpawnTimer -= dt;
  if (state.doubleSpawnTimer <= 0) {
    spawnDoublePickup(game);
    state.doubleSpawnTimer = nextDoubleDelay();
  }

  state.slowSpawnTimer -= dt;
  if (state.slowSpawnTimer <= 0) {
    spawnSlowPickup(game);
    state.slowSpawnTimer = nextSlowDelay();
  }

  state.magnetSpawnTimer -= dt;
  if (state.magnetSpawnTimer <= 0) {
    spawnMagnetPickup(game);
    state.magnetSpawnTimer = nextMagnetDelay();
  }

  state.shrinkSpawnTimer -= dt;
  if (state.shrinkSpawnTimer <= 0) {
    spawnShrinkPickup(game);
    state.shrinkSpawnTimer = nextShrinkDelay();
  }

  // slow time affects hazards only
  const hazardTime = player.slowTimer > 0 ? 0.45 : 1.0;
  for (const h of state.hazards) {
    h.x += h.vx * dt * hazardTime;
    h.y += h.vy * dt * hazardTime;
    h.rot += h.vr * dt * hazardTime;
  }

  // stars update + magnet
  const magnetOn = player.magnetTimer > 0;
  const magnetRadius = 220;
  const magnetPull = 520;

  state.stars = state.stars.filter((s) => {
    s.spin += dt * 2.0;
    s.pulse += dt * 6.0;

    if (magnetOn) {
      const dx = player.x - s.x;
      const dy = player.y - s.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < magnetRadius) {
        const pull = (1 - d / magnetRadius) * magnetPull;
        s.x += (dx / d) * pull * dt;
        s.y += (dy / d) * pull * dt;
      }
    }

    if (Math.hypot(player.x - s.x, player.y - s.y) < player.r + s.r) {
      state.score += 50 * scoreMult;
      state.runStars += 1;
      addWalletStars(game, 1);
      return false;
    }
    return true;
  });

  // shields collect/expire
  state.shields = state.shields.filter((s) => {
    s.pulse += dt * 4.0;
    s.life -= dt;

    if (Math.hypot(player.x - s.x, player.y - s.y) < player.r + s.r) {
      player.shieldTimer = 5;
      return false;
    }
    return s.life > 0;
  });

  // jetpacks collect/expire
  state.jetpacks = state.jetpacks.filter((j) => {
    j.pulse += dt * 4.0;
    j.life -= dt;

    if (Math.hypot(player.x - j.x, player.y - j.y) < player.r + j.r) {
      player.speedBoostTimer = 7;
      return false;
    }
    return j.life > 0;
  });

  // powerups collect/expire
  state.doubles = state.doubles.filter((p) => {
    p.pulse += dt * 4.0;
    p.life -= dt;

    if (Math.hypot(player.x - p.x, player.y - p.y) < player.r + p.r) {
      player.doubleTimer = 10;
      return false;
    }
    return p.life > 0;
  });

  state.slows = state.slows.filter((p) => {
    p.pulse += dt * 4.0;
    p.life -= dt;

    if (Math.hypot(player.x - p.x, player.y - p.y) < player.r + p.r) {
      player.slowTimer = 7;
      return false;
    }
    return p.life > 0;
  });

  state.magnets = state.magnets.filter((p) => {
    p.pulse += dt * 4.0;
    p.life -= dt;

    if (Math.hypot(player.x - p.x, player.y - p.y) < player.r + p.r) {
      player.magnetTimer = 10;
      return false;
    }
    return p.life > 0;
  });

  state.shrinks = state.shrinks.filter((p) => {
    p.pulse += dt * 4.0;
    p.life -= dt;

    if (Math.hypot(player.x - p.x, player.y - p.y) < player.r + p.r) {
      player.shrinkTimer = 8;
      return false;
    }
    return p.life > 0;
  });

  // collision if no shield
  if (player.shieldTimer <= 0) {
    for (const h of state.hazards) {
      if (circleRectCollide(player.x, player.y, player.r, h.x, h.y, h.w, h.h)) {
        game.core.endGame();
        break;
      }
    }
  }
}
