// js/main.js
import { createState, createPlayer, LS } from "./state.js";
import {
  loadProgress,
  addWalletStars,
  spendWalletStars,
  saveBackdrop,
  saveUnlockedBackdrops,
} from "./storage.js";
import { loadImages } from "./images.js";
import { createUiAPI, initUI } from "./ui.js";
import { createInput } from "./input.js";
import { draw, drawPreview } from "./draw.js";
import { update } from "./update.js";
import {
  nextStarDelay,
  nextShieldDelay,
  nextJetpackDelay,
  nextDoubleDelay,
  nextSlowDelay,
  nextMagnetDelay,
  nextShrinkDelay,
} from "./spawn.js";

document.addEventListener("DOMContentLoaded", () => {

  /* =========================================
     DOM
  ========================================= */

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const dom = {
    scoreEl: document.getElementById("score"),
    bestEl: document.getElementById("best"),
    starsEl: document.getElementById("stars"),

    difficultyEl: document.getElementById("difficulty"),
    characterSelect: document.getElementById("characterSelect"),
    colourSelect: document.getElementById("colourSelect"),
    backdropSelect: document.getElementById("backdropSelect"), // may be null

    startUi: document.getElementById("startUi"),
    startBtn: document.getElementById("startBtn"),

    gameOverUi: document.getElementById("gameOverUi"),
    restartBtn: document.getElementById("restartBtn"),
    backBtn: document.getElementById("backBtn"),

    finalScoreEl: document.getElementById("finalScore"),
    finalBestEl: document.getElementById("finalBest"),
    finalRunStarsEl: document.getElementById("finalRunStars"),
    finalWalletStarsEl: document.getElementById("finalWalletStars"),

    shopNameEl: document.getElementById("shopName"),
    shopCostEl: document.getElementById("shopCost"),
    shopNoteEl: document.getElementById("shopNote"),
    buyBtn: document.getElementById("buyBtn"),

    previewCanvas: document.getElementById("preview"),
    pctx: document.getElementById("preview")?.getContext("2d") || null,

    padStatusEl: document.getElementById("padStatus"),

    fsBtn: document.getElementById("fsBtn"),
    fsTarget: document.querySelector(".game-stage") || canvas,
  };

  /* =========================================
     Load Progress + Images
  ========================================= */

  const progress = loadProgress();

  const state = createState(progress);
  const player = createPlayer(canvas, progress);

  state.shopSelectedId = player.shape;

  // Backdrop (safe default)
  state.backdrop = progress.backdrop || "default";

  const images = loadImages();

  /* =========================================
     Game Object
  ========================================= */

  const game = {
    canvas,
    ctx,
    previewCanvas: dom.previewCanvas,
    pctx: dom.pctx,
    dom,
    images,
    state,
    player,

    // Character unlocks
    unlocked: progress.unlocked,

    // Backdrop unlocks (always ensure default exists)
    unlockedBackdrops:
      progress.unlockedBackdrops instanceof Set
        ? progress.unlockedBackdrops
        : new Set(["default"]),

    ui: null,
    input: null,
    draw: { draw, drawPreview },
    update: { update },

    storage: {
      addWalletStars: (a) => addWalletStars(game, a),
      spendWalletStars: (a) => spendWalletStars(game, a),

      saveBackdrop: () => saveBackdrop(game),
      saveUnlockedBackdrops: () => saveUnlockedBackdrops(game),
    },

    core: null,
  };

  // Ensure default backdrop always unlocked
  if (!game.unlockedBackdrops.has("default")) {
    game.unlockedBackdrops.add("default");
  }

  /* =========================================
     Core Actions
  ========================================= */

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

    state.doubles = [];
    state.doubleSpawnTimer = nextDoubleDelay();

    state.slows = [];
    state.slowSpawnTimer = nextSlowDelay();

    state.magnets = [];
    state.magnetSpawnTimer = nextMagnetDelay();

    state.shrinks = [];
    state.shrinkSpawnTimer = nextShrinkDelay();

    dom.scoreEl.textContent = "0";

    player.x = canvas.width / 2;
    player.y = canvas.height / 2;

    player.speedBoostTimer = 0;
    player.shieldTimer = 0;
    player.doubleTimer = 0;
    player.slowTimer = 0;
    player.magnetTimer = 0;
    player.shrinkTimer = 0;

    player.r = player.baseR;

    state.running = !toStartScreen;

    game.ui.syncStartUi();
    game.ui.syncGameOverUi();
    game.ui.updateFullscreenHud();
  }

  function startGame() {
    if (state.gameOver) return;

    state.running = true;
    state.startedOnce = true;
    state.paused = false;

    game.ui.syncStartUi();
    game.ui.syncGameOverUi();
    game.ui.updateFullscreenHud();
  }

  function endGame() {
    state.running = false;
    state.gameOver = true;

    const s = Math.floor(state.score);

    if (s > state.best) {
      state.best = s;
      localStorage.setItem(LS.BEST, String(s));
      dom.bestEl.textContent = String(s);
    }

    game.ui.syncStartUi();
    game.ui.syncGameOverUi();
    game.ui.updateFullscreenHud();
  }

  game.core = { reset, startGame, endGame };

  /* =========================================
     UI + Input
  ========================================= */

  game.ui = createUiAPI(game);
  initUI(game);

  game.input = createInput(game);
  game.input.bindEvents();

  /* =========================================
     Boot
  ========================================= */

  reset(true);
  drawPreview(game);
  game.ui.setFsUi();
  game.ui.updateFullscreenHud();

  /* =========================================
     Game Loop
  ========================================= */

  function loop(now) {
    const dt = Math.min(0.033, (now - state.lastTime) / 1000);
    state.lastTime = now;

    update(game, dt);
    draw(game);
    drawPreview(game);

    game.ui.syncStartUi();
    game.ui.syncGameOverUi();
    game.ui.updateFullscreenHud();

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});
