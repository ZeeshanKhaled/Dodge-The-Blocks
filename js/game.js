// js/game.js
document.addEventListener("DOMContentLoaded", () => {
  // ---------- DOM ----------
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const starsEl = document.getElementById("stars");

  const difficultyEl = document.getElementById("difficulty");
  const characterSelect = document.getElementById("characterSelect");
  const colourSelect = document.getElementById("colourSelect");

  const startUi = document.getElementById("startUi");
  const startBtn = document.getElementById("startBtn");

  const gameOverUi = document.getElementById("gameOverUi");
  const restartBtn = document.getElementById("restartBtn");
  const backBtn = document.getElementById("backBtn");

  const finalScoreEl = document.getElementById("finalScore");
  const finalBestEl = document.getElementById("finalBest");
  const finalRunStarsEl = document.getElementById("finalRunStars");
  const finalWalletStarsEl = document.getElementById("finalWalletStars");

  const shopNameEl = document.getElementById("shopName");
  const shopCostEl = document.getElementById("shopCost");
  const shopNoteEl = document.getElementById("shopNote");
  const buyBtn = document.getElementById("buyBtn");

  const previewCanvas = document.getElementById("preview");
  const pctx = previewCanvas.getContext("2d");

  // Optional jetpack image (put file in: images/jetpack.png)
  const jetpackImg = new Image();
  jetpackImg.src = "images/jetpack.png";
  let jetpackImgReady = false;
  jetpackImg.onload = () => (jetpackImgReady = true);

  // ---------- Helpers ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);

  // ---------- Storage ----------
  const LS = {
    BEST: "dodge_best",
    WALLET: "dodge_wallet_stars",
    UNLOCKED: "dodge_unlocked_chars",
    SELECTED: "dodge_selected_char",
    COLOUR: "dodge_colour",
  };

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function saveJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // ---------- Colours ----------
  const COLOURS = {
    red: "#ff4d4d",
    orange: "#ff9c3a",
    yellow: "#ffd966",
    green: "#7dff7a",
    blue: "#7cf7ff",
    purple: "#a98bff",
    pink: "#ff7ad9",
  };

  // Opposites for hazards
  const OPPOSITE = {
    red: "blue",
    blue: "red",
    orange: "purple",
    purple: "orange",
    yellow: "purple",
    green: "pink",
    pink: "green",
  };

  const STANDARD_SHAPES = new Set(["orb", "triangle", "diamond", "hex"]);

  // ---------- Difficulty ----------
  const DIFFICULTIES = {
    easy: { enemySpeedMult: 0.85, spawnMult: 0.8, scoreMult: 0.9 },
    normal: { enemySpeedMult: 1.0, spawnMult: 1.0, scoreMult: 1.0 },
    hard: { enemySpeedMult: 1.2, spawnMult: 1.25, scoreMult: 1.15 },
  };

  // ---------- Natural randomness for spawns ----------
  function nextDelay(mean, min, max) {
    const u = Math.max(1e-6, Math.random());
    const exp = -Math.log(u) * mean;
    return clamp(exp, min, max);
  }

  const STAR_MEAN = 11; // ⭐ more frequent
  const JETPACK_MEAN = 30; // 🚀 old star-ish pace
  const SHIELD_MEAN = 22; // 🛡

  const nextStarDelay = () => nextDelay(STAR_MEAN, 6, 18);
  const nextJetpackDelay = () => nextDelay(JETPACK_MEAN, 16, 48);
  const nextShieldDelay = () => nextDelay(SHIELD_MEAN, 12, 38);

  const STAR_DOUBLE_CHANCE = 0.1;
  const SHIELD_DOUBLE_CHANCE = 0.04;
  const JETPACK_DOUBLE_CHANCE = 0.03;

  // ---------- Characters / Shop ----------
  const CHARACTERS = [
    { id: "orb", name: "Orb", cost: 0, symbol: "●" },
    { id: "triangle", name: "Triangle", cost: 0, symbol: "▲" },
    { id: "diamond", name: "Diamond", cost: 0, symbol: "◆" },
    { id: "hex", name: "Hex", cost: 0, symbol: "⬡" },

    { id: "shuriken", name: "Shuriken", cost: 20, symbol: "✦" },
    { id: "ghost", name: "Ghost Orb", cost: 30, symbol: "☁" },
    { id: "rocket", name: "Rocket", cost: 40, symbol: "🚀" },
  ];

  const DEFAULT_UNLOCKED = ["orb", "triangle", "diamond", "hex"];
  let unlocked = new Set(loadJSON(LS.UNLOCKED, DEFAULT_UNLOCKED));
  DEFAULT_UNLOCKED.forEach((id) => unlocked.add(id));

  function getChar(id) {
    return CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
  }

  // ---------- Game State ----------
  const state = {
    running: false,
    paused: false,
    gameOver: false,
    startedOnce: false,

    t: 0,
    score: 0,
    best: Number(localStorage.getItem(LS.BEST) || 0),
    lastTime: performance.now(),

    keys: new Set(),

    hazards: [],
    spawnTimer: 0,

    // ⭐ currency
    stars: [],
    starTimer: nextStarDelay(),
    runStars: 0,
    walletStars: Number(localStorage.getItem(LS.WALLET) || 0),

    // 🛡
    shields: [],
    shieldSpawnTimer: nextShieldDelay(),

    // 🚀
    jetpacks: [],
    jetpackSpawnTimer: nextJetpackDelay(),

    difficultyKey: "normal",
    difficultyRamp: 1,
  };

  const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    r: 14,
    baseSpeed: 260,

    speedBoostTimer: 0, // 🚀
    shieldTimer: 0, // 🛡

    shape: localStorage.getItem(LS.SELECTED) || "orb",
    colour: localStorage.getItem(LS.COLOUR) || "blue",
  };

  // ✅ SHOP selection is separate from equipped character
  let shopSelectedId = player.shape;

  // ---------- UI init ----------
  bestEl.textContent = String(state.best);
  scoreEl.textContent = "0";
  starsEl.textContent = String(state.walletStars);

  difficultyEl.value = state.difficultyKey;
  colourSelect.value = player.colour;

  // ---------- Colour logic ----------
  function getPlayerColourHex() {
    if (STANDARD_SHAPES.has(player.shape)) return COLOURS[player.colour] || COLOURS.blue;
    if (player.shape === "shuriken") return "#cfd8ff";
    if (player.shape === "ghost") return "#aee8ff";
    if (player.shape === "rocket") return "#ff6a7d";
    return COLOURS.blue;
  }

  function getPreviewColourHex(previewShape) {
    // Preview uses standard colour if preview is standard; otherwise fixed per special character
    if (STANDARD_SHAPES.has(previewShape)) return COLOURS[player.colour] || COLOURS.blue;
    if (previewShape === "shuriken") return "#cfd8ff";
    if (previewShape === "ghost") return "#aee8ff";
    if (previewShape === "rocket") return "#ff6a7d";
    return COLOURS.blue;
  }

  function getHazardColourHex() {
    const oppKey = OPPOSITE[player.colour] || "red";
    return COLOURS[oppKey] || "#ff4d4d";
  }

  // ---------- Wallet ----------
  function addWalletStars(amount) {
    state.walletStars += amount;
    starsEl.textContent = String(state.walletStars);
    localStorage.setItem(LS.WALLET, String(state.walletStars));
    syncShopUI();
  }

  function spendWalletStars(amount) {
    state.walletStars = Math.max(0, state.walletStars - amount);
    starsEl.textContent = String(state.walletStars);
    localStorage.setItem(LS.WALLET, String(state.walletStars));
    syncShopUI();
  }

  // ---------- Shop / Character select ----------
  function buildCharacterSelect() {
    characterSelect.innerHTML = "";

    for (const c of CHARACTERS) {
      const opt = document.createElement("option");
      opt.value = c.id;

      const locked = unlocked.has(c.id) ? "" : " 🔒";
      const price = c.cost > 0 ? ` (${c.cost}★)` : "";
      opt.textContent = `${c.name} ${c.symbol}${price}${locked}`;

      // ✅ DO NOT disable locked options
      characterSelect.appendChild(opt);
    }

    // keep dropdown on current shop selection
    if (!CHARACTERS.some((c) => c.id === shopSelectedId)) shopSelectedId = "orb";
    characterSelect.value = shopSelectedId;
  }

  function syncShopUI() {
    const c = getChar(shopSelectedId);
    const isUnlocked = unlocked.has(c.id);

    shopNameEl.textContent = c.name;
    shopCostEl.textContent = c.cost === 0 ? "Free" : `${c.cost}★ to unlock`;

    if (isUnlocked) {
      buyBtn.disabled = true;
      buyBtn.textContent = "Owned";
      shopNoteEl.textContent = "Unlocked ✅ Select it from the dropdown (it equips instantly).";
    } else {
      const canAfford = state.walletStars >= c.cost;
      buyBtn.disabled = !canAfford;
      buyBtn.textContent = canAfford ? "Buy" : "Need Stars";
      shopNoteEl.textContent = canAfford
        ? "Buy to unlock permanently."
        : `Collect ${c.cost - state.walletStars} more ★ to unlock.`;
    }

    if (STANDARD_SHAPES.has(shopSelectedId)) {
      colourSelect.disabled = false;
      colourSelect.title = "";
    } else {
      colourSelect.disabled = true;
      colourSelect.title = "Colour is only for standard shapes (Orb/Triangle/Diamond/Hex).";
    }
  }

  // ---------- Overlays ----------
  function syncStartUi() {
    const show = !state.startedOnce && !state.running && !state.gameOver;
    startUi.style.display = show ? "flex" : "none";
    startUi.setAttribute("aria-hidden", show ? "false" : "true");
  }

  function syncGameOverUi() {
    const show = state.gameOver;
    gameOverUi.style.display = show ? "flex" : "none";
    gameOverUi.setAttribute("aria-hidden", show ? "false" : "true");

    if (show) {
      finalScoreEl.textContent = String(Math.floor(state.score));
      finalBestEl.textContent = String(state.best);
      finalRunStarsEl.textContent = String(state.runStars);
      finalWalletStarsEl.textContent = String(state.walletStars);
    }
  }

  // ---------- Core ----------
  function reset(toStartScreen = true) {
    state.paused = false;
    state.gameOver = false;

    state.t = 0;
    state.score = 0;
    state.spawnTimer = 0;

    state.hazards = [];

    state.stars = [];
    state.starTimer = nextStarDelay();
    state.runStars = 0;

    state.shields = [];
    state.shieldSpawnTimer = nextShieldDelay();

    state.jetpacks = [];
    state.jetpackSpawnTimer = nextJetpackDelay();

    scoreEl.textContent = "0";

    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.speedBoostTimer = 0;
    player.shieldTimer = 0;

    state.running = !toStartScreen;

    syncStartUi();
    syncGameOverUi();
  }

  function startGame() {
    if (state.gameOver) return;
    state.running = true;
    state.startedOnce = true;
    state.paused = false;
    syncStartUi();
    syncGameOverUi();
  }

  function endGame() {
    state.running = false;
    state.gameOver = true;

    const s = Math.floor(state.score);
    if (s > state.best) {
      state.best = s;
      localStorage.setItem(LS.BEST, String(s));
      bestEl.textContent = String(s);
    }

    syncStartUi();
    syncGameOverUi();
  }

  // ---------- Spawning ----------
  function spawnHazard() {
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

    const dx = player.x - x;
    const dy = player.y - y;
    const mag = Math.hypot(dx, dy) || 1;

    const diff = DIFFICULTIES[state.difficultyKey] || DIFFICULTIES.normal;
    const ramp = 1 + (state.difficultyRamp - 1) * 0.18;
    const speed = rand(140, 220) * ramp * diff.enemySpeedMult;

    state.hazards.push({
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

  function spawnStarPickup() {
    state.stars.push({
      x: rand(60, canvas.width - 60),
      y: rand(60, canvas.height - 60),
      r: 12,
      spin: rand(0, Math.PI * 2),
      pulse: rand(0, Math.PI * 2),
    });
  }

  function spawnShieldPickup() {
    state.shields.push({
      x: rand(60, canvas.width - 60),
      y: rand(60, canvas.height - 60),
      r: 16,
      pulse: rand(0, Math.PI * 2),
      life: 5,
    });
  }

  function spawnJetpackPickup() {
    state.jetpacks.push({
      x: rand(60, canvas.width - 60),
      y: rand(60, canvas.height - 60),
      r: 18,
      pulse: rand(0, Math.PI * 2),
      life: 5,
    });
  }

  // ---------- Collision ----------
  function circleRectCollide(cx, cy, cr, rx, ry, rw, rh) {
    const closestX = clamp(cx, rx, rx + rw);
    const closestY = clamp(cy, ry, ry + rh);
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy <= cr * cr;
  }

  // ---------- Draw helpers ----------
  function drawStar(x, y, outerR, innerR, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 === 0 ? outerR : innerR;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawShieldIcon(x, y, r, pulse, life) {
    const flashing = life <= 2;
    const blink = flashing ? 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(life * 12 * Math.PI)) : 1;
    const scale = 1 + Math.sin(pulse) * 0.06;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.globalAlpha = 0.22 * blink;
    ctx.fillStyle = "#66b3ff";
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.95 * blink;
    ctx.fillStyle = "#66b3ff";
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.1);
    ctx.quadraticCurveTo(r * 1.1, -r * 0.7, r * 0.95, -r * 0.05);
    ctx.quadraticCurveTo(r * 0.85, r * 0.95, 0, r * 1.2);
    ctx.quadraticCurveTo(-r * 0.85, r * 0.95, -r * 0.95, -r * 0.05);
    ctx.quadraticCurveTo(-r * 1.1, -r * 0.7, 0, -r * 1.1);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawJetpackIcon(x, y, r, pulse, life) {
    const flashing = life <= 2;
    const blink = flashing ? 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(life * 12 * Math.PI)) : 1;
    const bob = Math.sin(pulse * 2) * 2;

    ctx.save();
    ctx.translate(x, y + bob);

    // glow
    ctx.globalAlpha = 0.2 * blink;
    ctx.fillStyle = "#ffb24d";
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1 * blink;

    // ✅ Use image if available, otherwise fallback symbol
    if (jetpackImgReady && jetpackImg.naturalWidth > 0) {
      const w = r * 2.1;
      const h = r * 2.1;
      ctx.drawImage(jetpackImg, -w / 2, -h / 2, w, h);
    } else {
      ctx.fillStyle = "#ffb24d";
      ctx.font = `900 ${r * 1.6}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🚀", 0, 0);
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawCharacter(context, shape, x, y, r, t, color) {
    context.save();
    context.fillStyle = color;

    if (shape === "orb") {
      context.beginPath();
      context.arc(x, y, r, 0, Math.PI * 2);
      context.fill();
      context.restore();
      return;
    }

    if (shape === "triangle") {
      context.beginPath();
      context.moveTo(x, y - r);
      context.lineTo(x + r, y + r);
      context.lineTo(x - r, y + r);
      context.closePath();
      context.fill();
      context.restore();
      return;
    }

    if (shape === "diamond") {
      context.beginPath();
      context.moveTo(x, y - r);
      context.lineTo(x + r, y);
      context.lineTo(x, y + r);
      context.lineTo(x - r, y);
      context.closePath();
      context.fill();
      context.restore();
      return;
    }

    if (shape === "hex") {
      context.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        const px = x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r;
        if (i === 0) context.moveTo(px, py);
        else context.lineTo(px, py);
      }
      context.closePath();
      context.fill();
      context.restore();
      return;
    }

    if (shape === "shuriken") {
      context.translate(x, y);
      context.rotate(t * 4.5);

      context.beginPath();
      for (let i = 0; i < 8; i++) {
        const rr = i % 2 === 0 ? r : r * 0.45;
        const a = (Math.PI / 4) * i;
        context.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      context.closePath();
      context.fill();

      context.globalAlpha = 0.35;
      context.fillStyle = "#ffffff";
      context.beginPath();
      context.arc(0, 0, r * 0.2, 0, Math.PI * 2);
      context.fill();

      context.restore();
      context.globalAlpha = 1;
      return;
    }

    if (shape === "ghost") {
      context.beginPath();
      context.arc(x, y - r * 0.15, r, Math.PI, 0);

      const baseY = y + r * 0.9;
      const leftX = x - r;
      const rightX = x + r;

      for (let i = 0; i <= 4; i++) {
        const px = leftX + (i / 4) * (rightX - leftX);
        const wave = Math.sin(t * 6 + i * 1.2) * (r * 0.12);
        context.lineTo(px, baseY + wave);
      }
      context.closePath();
      context.fill();

      context.globalAlpha = 0.55;
      context.fillStyle = "rgba(0,0,0,0.75)";
      context.beginPath();
      context.arc(x - r * 0.35, y - r * 0.05, r * 0.16, 0, Math.PI * 2);
      context.arc(x + r * 0.35, y - r * 0.05, r * 0.16, 0, Math.PI * 2);
      context.fill();

      context.restore();
      context.globalAlpha = 1;
      return;
    }

    if (shape === "rocket") {
      context.beginPath();
      context.moveTo(x, y - r * 1.15);
      context.quadraticCurveTo(x + r * 0.95, y, x, y + r * 1.15);
      context.quadraticCurveTo(x - r * 0.95, y, x, y - r * 1.15);
      context.closePath();
      context.fill();

      context.globalAlpha = 0.25;
      context.fillStyle = "#ffffff";
      context.beginPath();
      context.arc(x, y - r * 0.1, r * 0.28, 0, Math.PI * 2);
      context.fill();

      context.globalAlpha = 1;
      context.restore();
      return;
    }

    context.restore();
  }

  function drawPreview() {
    pctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    pctx.globalAlpha = 0.15;
    for (let i = 0; i < 28; i++) {
      const x = (i * 37) % previewCanvas.width;
      const y = (i * 19) % previewCanvas.height;
      pctx.fillRect(x, y, 2, 2);
    }
    pctx.globalAlpha = 1;

    const cx = previewCanvas.width / 2;
    const cy = previewCanvas.height / 2;

    const previewColor = getPreviewColourHex(shopSelectedId);
    drawCharacter(pctx, shopSelectedId, cx, cy, 18, state.t, previewColor);

    if (player.shieldTimer > 0) {
      const flashing = player.shieldTimer <= 2;
      const blink = flashing ? 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(player.shieldTimer * 12 * Math.PI)) : 1;

      pctx.save();
      pctx.globalAlpha = 0.22 * blink;
      pctx.fillStyle = "#66b3ff";
      pctx.beginPath();
      pctx.arc(cx, cy, 18 + 18, 0, Math.PI * 2);
      pctx.fill();
      pctx.restore();

      pctx.globalAlpha = 1 * blink;
      pctx.beginPath();
      pctx.arc(cx, cy, 18 + 16, 0, Math.PI * 2);
      pctx.strokeStyle = "#66b3ff";
      pctx.lineWidth = 3;
      pctx.stroke();
      pctx.globalAlpha = 1;
    }
  }

  // ---------- Update ----------
  function update(dt) {
    if (!state.running || state.paused || state.gameOver) return;

    const diff = DIFFICULTIES[state.difficultyKey] || DIFFICULTIES.normal;

    state.t += dt;
    state.difficultyRamp = 1 + state.t / 18;

    state.score += dt * 10 * diff.scoreMult;
    scoreEl.textContent = String(Math.floor(state.score));

    if (player.speedBoostTimer > 0) player.speedBoostTimer -= dt;
    if (player.shieldTimer > 0) player.shieldTimer -= dt;

    const holdingShift = state.keys.has("shift");
    const speedBoostMult = player.speedBoostTimer > 0 ? 1.6 : 1.0;
    const speed = player.baseSpeed * (holdingShift ? 1.45 : 1.0) * speedBoostMult;

    let mx = 0,
      my = 0;
    if (state.keys.has("a")) mx -= 1;
    if (state.keys.has("d")) mx += 1;
    if (state.keys.has("w")) my -= 1;
    if (state.keys.has("s")) my += 1;

    const mag = Math.hypot(mx, my);
    if (mag > 0) {
      player.x += (mx / mag) * speed * dt;
      player.y += (my / mag) * speed * dt;
    }

    player.x = clamp(player.x, player.r, canvas.width - player.r);
    player.y = clamp(player.y, player.r, canvas.height - player.r);

    // hazards
    state.spawnTimer -= dt;
    const spawnEvery = 0.9 / diff.spawnMult;
    if (state.spawnTimer <= 0) {
      spawnHazard();
      if (state.difficultyKey === "hard" && Math.random() < 0.1) spawnHazard();
      state.spawnTimer = spawnEvery;
    }

    // ⭐ stars
    state.starTimer -= dt;
    if (state.starTimer <= 0) {
      spawnStarPickup();
      if (Math.random() < STAR_DOUBLE_CHANCE) spawnStarPickup();
      state.starTimer = nextStarDelay();
    }

    // 🛡 shields
    state.shieldSpawnTimer -= dt;
    if (state.shieldSpawnTimer <= 0) {
      spawnShieldPickup();
      if (Math.random() < SHIELD_DOUBLE_CHANCE) spawnShieldPickup();
      state.shieldSpawnTimer = nextShieldDelay();
    }

    // 🚀 jetpacks
    state.jetpackSpawnTimer -= dt;
    if (state.jetpackSpawnTimer <= 0) {
      spawnJetpackPickup();
      if (Math.random() < JETPACK_DOUBLE_CHANCE) spawnJetpackPickup();
      state.jetpackSpawnTimer = nextJetpackDelay();
    }

    // hazards update
    for (const h of state.hazards) {
      h.x += h.vx * dt;
      h.y += h.vy * dt;
      h.rot += h.vr * dt;
    }

    // ⭐ stars collect
    state.stars = state.stars.filter((s) => {
      s.spin += dt * 2.0;
      s.pulse += dt * 6.0;

      if (Math.hypot(player.x - s.x, player.y - s.y) < player.r + s.r) {
        state.score += 50;
        state.runStars += 1;
        addWalletStars(1);
        return false;
      }
      return true;
    });

    // 🛡 shields collect/expire
    state.shields = state.shields.filter((s) => {
      s.pulse += dt * 4.0;
      s.life -= dt;

      if (Math.hypot(player.x - s.x, player.y - s.y) < player.r + s.r) {
        player.shieldTimer = 5;
        return false;
      }
      return s.life > 0;
    });

    // 🚀 jetpacks collect/expire
    state.jetpacks = state.jetpacks.filter((j) => {
      j.pulse += dt * 4.0;
      j.life -= dt;

      if (Math.hypot(player.x - j.x, player.y - j.y) < player.r + j.r) {
        player.speedBoostTimer = 7;
        return false;
      }
      return j.life > 0;
    });

    // collision if no shield
    if (player.shieldTimer <= 0) {
      for (const h of state.hazards) {
        if (circleRectCollide(player.x, player.y, player.r, h.x, h.y, h.w, h.h)) {
          endGame();
          break;
        }
      }
    }
  }

  // ---------- Draw ----------
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // background dots
    ctx.globalAlpha = 0.25;
    for (let i = 0; i < 80; i++) {
      const x = (i * 113) % canvas.width;
      const y = (i * 71 + state.t * 30) % canvas.height;
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.globalAlpha = 1;

    const hazardColor = getHazardColourHex();

    // hazards
    for (const h of state.hazards) {
      ctx.save();
      ctx.translate(h.x + h.w / 2, h.y + h.h / 2);
      ctx.rotate(h.rot);

      ctx.fillStyle = hazardColor;
      ctx.fillRect(-h.w / 2, -h.h / 2, h.w, h.h);

      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(-h.w / 2 + 4, -h.h / 2 + 4, h.w - 8, h.h - 8);

      ctx.restore();
    }

    // stars
    for (const s of state.stars) {
      const pulse = 1 + Math.sin(s.pulse) * 0.12;

      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = "rgba(255,217,102,1)";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 2.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = "rgba(255,217,102,0.98)";
      drawStar(s.x, s.y, s.r * pulse, s.r * 0.5 * pulse, s.spin);
    }

    // shields
    for (const s of state.shields) drawShieldIcon(s.x, s.y, s.r, s.pulse, s.life);

    // jetpacks
    for (const j of state.jetpacks) drawJetpackIcon(j.x, j.y, j.r, j.pulse, j.life);

    // player
    const baseCol = getPlayerColourHex();
    const playerCol = player.speedBoostTimer > 0 ? "#a6ff7c" : baseCol;
    drawCharacter(ctx, player.shape, player.x, player.y, player.r, state.t, playerCol);

    // shield ring (flash last 2s)
    if (player.shieldTimer > 0) {
      const wobble = 1 + Math.sin(state.t * 8) * 0.05;

      const flashing = player.shieldTimer <= 2;
      const blink = flashing ? 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(player.shieldTimer * 12 * Math.PI)) : 1;

      ctx.save();
      ctx.globalAlpha = 0.22 * blink;
      ctx.fillStyle = "#66b3ff";
      ctx.beginPath();
      ctx.arc(player.x, player.y, (player.r + 14) * wobble, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.globalAlpha = 1 * blink;
      ctx.beginPath();
      ctx.arc(player.x, player.y, (player.r + 12) * wobble, 0, Math.PI * 2);
      ctx.strokeStyle = "#66b3ff";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  // ---------- Loop ----------
  function loop(now) {
    const dt = Math.min(0.033, (now - state.lastTime) / 1000);
    state.lastTime = now;

    update(dt);
    draw();
    drawPreview();

    syncStartUi();
    syncGameOverUi();

    requestAnimationFrame(loop);
  }

  // ---------- Events ----------
  difficultyEl.addEventListener("change", () => {
    state.difficultyKey = difficultyEl.value;
    state.startedOnce = false;
    reset(true);
  });

  characterSelect.addEventListener("change", () => {
    shopSelectedId = characterSelect.value;

    // ✅ Equip immediately ONLY if unlocked
    if (unlocked.has(shopSelectedId)) {
      player.shape = shopSelectedId;
      localStorage.setItem(LS.SELECTED, shopSelectedId);
    }

    syncShopUI();
    drawPreview();
  });

  colourSelect.addEventListener("change", () => {
    player.colour = colourSelect.value;
    localStorage.setItem(LS.COLOUR, player.colour);
    drawPreview();
  });

  buyBtn.addEventListener("click", () => {
    const c = getChar(shopSelectedId);
    if (unlocked.has(c.id)) return;
    if (state.walletStars < c.cost) return;

    spendWalletStars(c.cost);
    unlocked.add(c.id);
    saveJSON(LS.UNLOCKED, Array.from(unlocked));

    // ✅ after purchase: equip it
    player.shape = c.id;
    localStorage.setItem(LS.SELECTED, c.id);

    shopSelectedId = c.id;
    buildCharacterSelect();
    characterSelect.value = c.id;

    syncShopUI();
    drawPreview();
  });

  startBtn.addEventListener("click", () => startGame());

  restartBtn.addEventListener("click", () => {
    state.startedOnce = false;
    reset(true);
    startGame();
  });

  backBtn.addEventListener("click", () => {
    state.startedOnce = false;
    reset(true);
  });

  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();

    if (k === "enter" || k === " ") {
      startGame();
      e.preventDefault();
      return;
    }

    if (k === "p") {
      if (state.startedOnce && !state.gameOver) state.paused = !state.paused;
      e.preventDefault();
      return;
    }

    if (k === "r") {
      state.startedOnce = false;
      reset(true);
      e.preventDefault();
      return;
    }

    state.keys.add(k);
  });

  window.addEventListener("keyup", (e) => {
    state.keys.delete(e.key.toLowerCase());
  });

  // ---------- Boot ----------
  buildCharacterSelect();
  syncShopUI();

  reset(true);
  drawPreview();
  syncStartUi();
  syncGameOverUi();

  requestAnimationFrame(loop);
});
