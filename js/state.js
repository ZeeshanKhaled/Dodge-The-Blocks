// js/state.js

// ======================================================
// Helpers
// ======================================================

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const rand = (a, b) => a + Math.random() * (b - a);

// ======================================================
// Storage Keys
// ======================================================

export const LS = {
  BEST: "dodge_best",
  WALLET: "dodge_wallet_stars",
  UNLOCKED: "dodge_unlocked_chars",
  SELECTED: "dodge_selected_char",
  COLOUR: "dodge_colour",

  // Backdrops
  BACKDROP: "dodge_backdrop",
  UNLOCKED_BACKDROPS: "dodge_unlocked_backdrops",
};

// ======================================================
// Colours
// ======================================================

export const COLOURS = {
  red: "#ff4d4d",
  orange: "#ff9c3a",
  yellow: "#ffd966",
  green: "#7dff7a",
  blue: "#7cf7ff",
  purple: "#a98bff",
  pink: "#ff7ad9",
};

export const OPPOSITE = {
  red: "blue",
  blue: "red",
  orange: "purple",
  purple: "orange",
  yellow: "purple",
  green: "pink",
  pink: "green",
};

export const STANDARD_SHAPES = new Set(["orb", "triangle", "diamond", "hex"]);

// ======================================================
// Difficulty
// ======================================================

export const DIFFICULTIES = {
  easy: { enemySpeedMult: 0.85, spawnMult: 0.8, scoreMult: 0.9 },
  normal: { enemySpeedMult: 1.0, spawnMult: 1.0, scoreMult: 1.0 },
  hard: { enemySpeedMult: 1.2, spawnMult: 1.25, scoreMult: 1.15 },
};

// ======================================================
// Characters (Shop)
// ======================================================

export const CHARACTERS = [
  { id: "orb", name: "Orb", cost: 0, symbol: "●" },
  { id: "triangle", name: "Triangle", cost: 0, symbol: "▲" },
  { id: "diamond", name: "Diamond", cost: 0, symbol: "◆" },
  { id: "hex", name: "Hex", cost: 0, symbol: "⬡" },

  { id: "shuriken", name: "Shuriken", cost: 20, symbol: "✦" },
  { id: "ghost", name: "Ghost", cost: 30, symbol: "👻" },
  { id: "rocket", name: "Rocket", cost: 40, symbol: "🚀" },

  { id: "ufo", name: "UFO", cost: 45, symbol: "🛸" },
  { id: "football", name: "Football", cost: 50, symbol: "⚽" },
  { id: "basketball", name: "Basketball", cost: 55, symbol: "🏀" },
  { id: "golfball", name: "Golf Ball", cost: 60, symbol: "⛳" },
  { id: "diasword", name: "Diamond Sword", cost: 70, symbol: "🗡" },
];

export const DEFAULT_UNLOCKED = ["orb", "triangle", "diamond", "hex"];

export function getChar(id) {
  return CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
}

// ======================================================
// Backdrops (Shop Ready)
// ======================================================

export const BACKDROPS = [
  { id: "default", name: "Default", cost: 0 },
  { id: "deepOcean", name: "Deep Ocean", cost: 25 },
  { id: "midnight", name: "Midnight Sky", cost: 20 },
  { id: "nebula", name: "Soft Nebula", cost: 30 },
  { id: "void", name: "Subtle Void", cost: 15 },
];

export const DEFAULT_UNLOCKED_BACKDROPS = ["default"];

export function getBackdrop(id) {
  return BACKDROPS.find((b) => b.id === id) || BACKDROPS[0];
}

// ======================================================
// Colour Logic
// ======================================================

export function getPlayerColourHex(player) {
  if (STANDARD_SHAPES.has(player.shape))
    return COLOURS[player.colour] || COLOURS.blue;

  if (player.shape === "shuriken") return "#cfd8ff";
  if (player.shape === "ghost") return "#aee8ff";
  if (player.shape === "rocket") return "#ff6a7d";
  if (player.shape === "ufo") return "#b9ffcc";
  if (player.shape === "football") return "#d4a574";
  if (player.shape === "basketball") return "#ff9c3a";
  if (player.shape === "golfball") return "#e8ecff";
  if (player.shape === "diasword") return "#7cf7ff";

  return COLOURS.blue;
}

export function getPreviewColourHex(player, previewShape) {
  if (STANDARD_SHAPES.has(previewShape))
    return COLOURS[player.colour] || COLOURS.blue;

  if (previewShape === "shuriken") return "#cfd8ff";
  if (previewShape === "ghost") return "#aee8ff";
  if (previewShape === "rocket") return "#ff6a7d";
  if (previewShape === "ufo") return "#b9ffcc";
  if (previewShape === "football") return "#d4a574";
  if (previewShape === "basketball") return "#ff9c3a";
  if (previewShape === "golfball") return "#e8ecff";
  if (previewShape === "diasword") return "#7cf7ff";

  return COLOURS.blue;
}

export function getHazardColourHex(player) {
  const oppKey = OPPOSITE[player.colour] || "red";
  return COLOURS[oppKey] || "#ff4d4d";
}

// ======================================================
// Game State Factory
// ======================================================

export function createState({
  best,
  walletStars,
  backdrop,
}) {
  return {
    running: false,
    paused: false,
    gameOver: false,
    startedOnce: false,

    t: 0,
    score: 0,
    best: Number(best || 0),
    lastTime: performance.now(),

    keys: new Set(),

    hazards: [],
    spawnTimer: 0,

    stars: [],
    starTimer: 0,
    runStars: 0,
    walletStars: Number(walletStars || 0),

    shields: [],
    shieldSpawnTimer: 0,

    jetpacks: [],
    jetpackSpawnTimer: 0,

    doubles: [],
    doubleSpawnTimer: 0,

    slows: [],
    slowSpawnTimer: 0,

    magnets: [],
    magnetSpawnTimer: 0,

    shrinks: [],
    shrinkSpawnTimer: 0,

    difficultyKey: "normal",
    difficultyRamp: 1,

    // Shop selection
    shopSelectedId: "orb",

    // Backdrop selection
    backdrop: backdrop || "default",
  };
}

// ======================================================
// Player Factory
// ======================================================

export function createPlayer(canvas, { selected, colour }) {
  return {
    x: canvas.width / 2,
    y: canvas.height / 2,

    baseR: 14,
    r: 14,

    baseSpeed: 260,

    speedBoostTimer: 0,
    shieldTimer: 0,

    doubleTimer: 0,
    slowTimer: 0,
    magnetTimer: 0,
    shrinkTimer: 0,

    shape: selected || "orb",
    colour: colour || "blue",
  };
}
