// js/storage.js
import { LS, DEFAULT_UNLOCKED, DEFAULT_UNLOCKED_BACKDROPS } from "./state.js";

/* =========================================
   Generic Helpers
========================================= */

export function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadNumber(key, fallback = 0) {
  const n = Number(localStorage.getItem(key));
  return Number.isFinite(n) ? n : fallback;
}

export function saveNumber(key, value) {
  localStorage.setItem(key, String(value));
}

/* =========================================
   UI Refresh (supports multiple shops)
========================================= */

function refreshShopUI(game) {
  // character shop
  if (game?.ui?.syncShopUI) game.ui.syncShopUI();

  // backdrop shop (we'll add this later)
  if (game?.ui?.syncBackdropUI) game.ui.syncBackdropUI();
}

/* =========================================
   Load All Progress
========================================= */

export function loadProgress() {
  const best = loadNumber(LS.BEST, 0);
  const walletStars = loadNumber(LS.WALLET, 0);

  const selected = localStorage.getItem(LS.SELECTED) || "orb";
  const colour = localStorage.getItem(LS.COLOUR) || "blue";

  // ---------- Characters ----------
  const unlockedArr = loadJSON(LS.UNLOCKED, DEFAULT_UNLOCKED);
  const unlocked = new Set(unlockedArr || []);
  DEFAULT_UNLOCKED.forEach((id) => unlocked.add(id));

  // ---------- Backdrops ----------
  const backdrop = localStorage.getItem(LS.BACKDROP) || "default";

  const unlockedBackdropArr = loadJSON(
    LS.UNLOCKED_BACKDROPS,
    DEFAULT_UNLOCKED_BACKDROPS
  );
  const unlockedBackdrops = new Set(unlockedBackdropArr || []);
  DEFAULT_UNLOCKED_BACKDROPS.forEach((id) => unlockedBackdrops.add(id));

  return {
    best,
    walletStars,
    unlocked,
    selected,
    colour,
    backdrop,
    unlockedBackdrops,
  };
}

/* =========================================
   Wallet
========================================= */

export function addWalletStars(game, amount) {
  game.state.walletStars += amount;
  game.dom.starsEl.textContent = String(game.state.walletStars);
  saveNumber(LS.WALLET, game.state.walletStars);
  refreshShopUI(game);
}

export function spendWalletStars(game, amount) {
  game.state.walletStars = Math.max(0, game.state.walletStars - amount);
  game.dom.starsEl.textContent = String(game.state.walletStars);
  saveNumber(LS.WALLET, game.state.walletStars);
  refreshShopUI(game);
}

/* =========================================
   Save Character Settings
========================================= */

export function saveSelected(game) {
  localStorage.setItem(LS.SELECTED, game.player.shape);
}

export function saveColour(game) {
  localStorage.setItem(LS.COLOUR, game.player.colour);
}

export function saveUnlocked(game) {
  saveJSON(LS.UNLOCKED, Array.from(game.unlocked));
}

/* =========================================
   Save Backdrop Settings
========================================= */

export function saveBackdrop(game) {
  localStorage.setItem(LS.BACKDROP, game.state.backdrop);
}

export function saveUnlockedBackdrops(game) {
  saveJSON(LS.UNLOCKED_BACKDROPS, Array.from(game.unlockedBackdrops));
}
    