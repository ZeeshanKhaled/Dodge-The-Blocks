// js/ui.js
import { CHARACTERS, STANDARD_SHAPES, getChar, BACKDROPS, getBackdrop } from "./state.js";
import {
  saveUnlocked,
  saveSelected,
  saveColour,
  saveBackdrop,
  saveUnlockedBackdrops,
} from "./storage.js";

/* =========================
   Small UI builders
========================= */

function createHudPill(text) {
  const pill = document.createElement("div");
  pill.textContent = text;
  pill.style.padding = "10px 14px";
  pill.style.borderRadius = "999px";
  pill.style.font = "600 14px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  pill.style.letterSpacing = "0.2px";
  pill.style.color = "rgba(255,255,255,0.92)";
  pill.style.background = "rgba(0,0,0,0.35)";
  pill.style.border = "1px solid rgba(255,255,255,0.12)";
  pill.style.boxShadow = "0 12px 30px rgba(0,0,0,0.35)";
  pill.style.backdropFilter = "blur(10px)";
  pill.style.webkitBackdropFilter = "blur(10px)";
  return pill;
}

function createBuffChip(game, imgObj, secondsLeft) {
  const chip = document.createElement("div");
  chip.style.display = "inline-flex";
  chip.style.alignItems = "center";
  chip.style.gap = "6px";
  chip.style.padding = "8px 10px";
  chip.style.borderRadius = "999px";
  chip.style.background = "rgba(0,0,0,0.35)";
  chip.style.border = "1px solid rgba(255,255,255,0.12)";
  chip.style.boxShadow = "0 12px 30px rgba(0,0,0,0.22)";
  chip.style.backdropFilter = "blur(10px)";
  chip.style.webkitBackdropFilter = "blur(10px)";

  const icon = document.createElement("img");
  icon.src = imgObj?.img?.src || "";
  icon.alt = "";
  icon.style.width = "26px";
  icon.style.height = "26px";
  icon.style.objectFit = "contain";

  const t = document.createElement("div");
  t.textContent = String(Math.ceil(secondsLeft));
  t.style.font = "700 13px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  t.style.color = "rgba(255,255,255,0.95)";
  t.style.minWidth = "18px";
  t.style.textAlign = "left";

  if (secondsLeft <= 2) {
    const blink = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(game.state.t * 22));
    chip.style.opacity = String(blink);
    chip.style.border = "1px solid rgba(255,90,90,0.65)";
  }

  chip.appendChild(icon);
  chip.appendChild(t);
  return chip;
}

/* =========================
   Backdrop UI mounting
   (auto-creates HTML if missing)
========================= */

function ensureBackdropUI(game) {
  const { dom } = game;

  // If you've already added these IDs into HTML, we'll reuse them.
  let backdropSelect = document.getElementById("backdropSelect");
  let backdropNameEl = document.getElementById("backdropName");
  let backdropCostEl = document.getElementById("backdropCost");
  let backdropNoteEl = document.getElementById("backdropNote");
  let buyBackdropBtn = document.getElementById("buyBackdropBtn");

  // We insert the dropdown UNDER colourSelect inside the side panel
  const colourSelect = dom.colourSelect;
  if (!colourSelect) return;

  const sidePanel = colourSelect.closest(".side-panel") || colourSelect.parentElement;
  if (!sidePanel) return;

  // Create if missing
  if (!backdropSelect) {
    const label = document.createElement("label");
    label.setAttribute("for", "backdropSelect");
    label.className = "mt-12";
    label.textContent = "Backdrop";

    backdropSelect = document.createElement("select");
    backdropSelect.id = "backdropSelect";
    backdropSelect.setAttribute("aria-label", "Backdrop");

    // Insert right after the colour select
    const colourLabel = sidePanel.querySelector('label[for="colourSelect"]');
    const afterNode = colourSelect;

    sidePanel.insertBefore(label, afterNode.nextSibling);
    sidePanel.insertBefore(backdropSelect, label.nextSibling);
  }

  // Create a shop row for backdrop if missing
  if (!document.getElementById("backdropShopRow")) {
    const row = document.createElement("div");
    row.id = "backdropShopRow";
    row.className = "shop-row";
    row.setAttribute("aria-label", "Backdrop Shop");

    const meta = document.createElement("div");
    meta.className = "shop-meta";

    backdropNameEl = document.createElement("div");
    backdropNameEl.className = "shop-name";
    backdropNameEl.id = "backdropName";
    backdropNameEl.textContent = "—";

    backdropCostEl = document.createElement("div");
    backdropCostEl.className = "shop-cost";
    backdropCostEl.id = "backdropCost";
    backdropCostEl.textContent = "—";

    meta.appendChild(backdropNameEl);
    meta.appendChild(backdropCostEl);

    buyBackdropBtn = document.createElement("button");
    buyBackdropBtn.id = "buyBackdropBtn";
    buyBackdropBtn.className = "ui-btn ui-btn--shop";
    buyBackdropBtn.type = "button";
    buyBackdropBtn.textContent = "Buy";

    row.appendChild(meta);
    row.appendChild(buyBackdropBtn);

    backdropNoteEl = document.createElement("div");
    backdropNoteEl.id = "backdropNote";
    backdropNoteEl.className = "shop-note";
    backdropNoteEl.textContent = "";

    // Put it directly under the backdrop dropdown
    sidePanel.insertBefore(row, backdropSelect.nextSibling);
    sidePanel.insertBefore(backdropNoteEl, row.nextSibling);
  }

  // Store references on dom for easy access
  dom.backdropSelect = backdropSelect;
  dom.backdropNameEl = backdropNameEl;
  dom.backdropCostEl = backdropCostEl;
  dom.backdropNoteEl = backdropNoteEl;
  dom.buyBackdropBtn = buyBackdropBtn;
}

/* =========================
   Init UI
========================= */

export function initUI(game) {
  const { dom } = game;

  // HUD init
  dom.bestEl.textContent = String(game.state.best);
  dom.scoreEl.textContent = "0";
  dom.starsEl.textContent = String(game.state.walletStars);

  dom.difficultyEl.value = game.state.difficultyKey;
  dom.colourSelect.value = game.player.colour;

  // Backdrop UI (insert under colour)
  ensureBackdropUI(game);

  // Fullscreen HUD element
  const fsTarget = game.dom.fsTarget;
  const fsHud = document.createElement("div");
  fsHud.id = "fsHud";
  fsHud.style.position = "absolute";
  fsHud.style.left = "16px";
  fsHud.style.top = "16px";
  fsHud.style.zIndex = "50";
  fsHud.style.display = "none";
  fsHud.style.pointerEvents = "none";
  fsHud.style.gap = "12px";
  fsHud.style.alignItems = "center";
  fsHud.style.flexDirection = "row";

  if (getComputedStyle(fsTarget).position === "static") {
    fsTarget.style.position = "relative";
  }
  fsTarget.appendChild(fsHud);

  game.ui.fsHud = fsHud;

  // Build selects + sync UI
  game.ui.buildCharacterSelect();
  game.ui.buildBackdropSelect();

  game.ui.syncShopUI();
  game.ui.syncBackdropUI();

  game.ui.syncStartUi();
  game.ui.syncGameOverUi();
  game.ui.updateFullscreenHud();

  // Bind backdrop events (if created)
  if (dom.backdropSelect) {
    dom.backdropSelect.addEventListener("change", () => {
      game.ui.onBackdropChange(dom.backdropSelect.value);
    });
  }
  if (dom.buyBackdropBtn) {
    dom.buyBackdropBtn.addEventListener("click", () => game.ui.buyBackdropSelected());
  }

  // Fullscreen button
  if (dom.fsBtn) dom.fsBtn.addEventListener("click", () => game.ui.toggleFullscreen());
  document.addEventListener("fullscreenchange", () => {
    game.ui.setFsUi();
    game.ui.updateFullscreenHud();
  });
}

/* =========================
   UI API used by main/input
========================= */

export function createUiAPI(game) {
  return {
    fsHud: null,

    /* ---------- Characters ---------- */

    buildCharacterSelect() {
      const { characterSelect } = game.dom;
      characterSelect.innerHTML = "";

      for (const c of CHARACTERS) {
        const opt = document.createElement("option");
        opt.value = c.id;

        const locked = game.unlocked.has(c.id) ? "" : " 🔒";
        const price = c.cost > 0 ? ` (${c.cost}★)` : "";
        opt.textContent = `${c.name} ${c.symbol}${price}${locked}`;

        characterSelect.appendChild(opt);
      }

      if (!CHARACTERS.some((c) => c.id === game.state.shopSelectedId)) game.state.shopSelectedId = "orb";
      characterSelect.value = game.state.shopSelectedId;
    },

    syncShopUI() {
      const { shopNameEl, shopCostEl, shopNoteEl, buyBtn, colourSelect } = game.dom;

      const c = getChar(game.state.shopSelectedId);
      const isUnlocked = game.unlocked.has(c.id);

      shopNameEl.textContent = c.name;
      shopCostEl.textContent = c.cost === 0 ? "Free" : `${c.cost}★ to unlock`;

      if (isUnlocked) {
        buyBtn.disabled = true;
        buyBtn.textContent = "Owned";
        shopNoteEl.textContent = "Unlocked ✅ Select it from the dropdown (it equips instantly).";
      } else {
        const canAfford = game.state.walletStars >= c.cost;
        buyBtn.disabled = !canAfford;
        buyBtn.textContent = canAfford ? "Buy" : "Need Stars";
        shopNoteEl.textContent = canAfford
          ? "Buy to unlock permanently."
          : `Collect ${c.cost - game.state.walletStars} more ★ to unlock.`;
      }

      // colour only for standard shapes
      if (STANDARD_SHAPES.has(game.state.shopSelectedId)) {
        colourSelect.disabled = false;
        colourSelect.title = "";
      } else {
        colourSelect.disabled = true;
        colourSelect.title = "Colour is only for standard shapes (Orb/Triangle/Diamond/Hex).";
      }
    },

    buySelected() {
      const c = getChar(game.state.shopSelectedId);
      if (game.unlocked.has(c.id)) return;
      if (game.state.walletStars < c.cost) return;

      game.storage.spendWalletStars(c.cost);
      game.unlocked.add(c.id);
      saveUnlocked(game);

      game.player.shape = c.id;
      saveSelected(game);

      game.state.shopSelectedId = c.id;
      game.ui.buildCharacterSelect();
      game.dom.characterSelect.value = c.id;

      game.ui.syncShopUI();
      game.draw.drawPreview(game);
    },

    onCharacterChange(newId) {
      game.state.shopSelectedId = newId;

      if (game.unlocked.has(newId)) {
        game.player.shape = newId;
        saveSelected(game);
      }

      game.ui.syncShopUI();
      game.draw.drawPreview(game);
    },

    onColourChange(newColour) {
      game.player.colour = newColour;
      saveColour(game);
      game.draw.drawPreview(game);
    },

    /* ---------- Backdrops ---------- */

    buildBackdropSelect() {
      const sel = game.dom.backdropSelect;
      if (!sel) return;

      sel.innerHTML = "";
      for (const b of BACKDROPS) {
        const opt = document.createElement("option");
        opt.value = b.id;

        const locked = game.unlockedBackdrops?.has(b.id) ? "" : " 🔒";
        const price = b.cost > 0 ? ` (${b.cost}★)` : "";
        opt.textContent = `${b.name}${price}${locked}`;

        sel.appendChild(opt);
      }

      // keep selection valid
      const valid = BACKDROPS.some((b) => b.id === game.state.backdrop);
      if (!valid) game.state.backdrop = "default";
      sel.value = game.state.backdrop;
    },

    syncBackdropUI() {
      const { backdropSelect, backdropNameEl, backdropCostEl, backdropNoteEl, buyBackdropBtn } = game.dom;
      if (!backdropSelect || !backdropNameEl || !backdropCostEl || !backdropNoteEl || !buyBackdropBtn) return;

      const selectedId = backdropSelect.value || game.state.backdrop;
      const b = getBackdrop(selectedId);

      const isUnlocked = game.unlockedBackdrops?.has(b.id);

      backdropNameEl.textContent = b.name;
      backdropCostEl.textContent = b.cost === 0 ? "Free" : `${b.cost}★ to unlock`;

      if (isUnlocked) {
        buyBackdropBtn.disabled = true;
        buyBackdropBtn.textContent = "Owned";
        backdropNoteEl.textContent = "Unlocked ✅ Select it from the dropdown (applies instantly).";
      } else {
        const canAfford = game.state.walletStars >= b.cost;
        buyBackdropBtn.disabled = !canAfford;
        buyBackdropBtn.textContent = canAfford ? "Buy" : "Need Stars";
        backdropNoteEl.textContent = canAfford
          ? "Buy to unlock permanently."
          : `Collect ${b.cost - game.state.walletStars} more ★ to unlock.`;
      }
    },

    buyBackdropSelected() {
      const { backdropSelect } = game.dom;
      if (!backdropSelect) return;

      const id = backdropSelect.value;
      const b = getBackdrop(id);

      if (game.unlockedBackdrops?.has(b.id)) return;
      if (game.state.walletStars < b.cost) return;

      game.storage.spendWalletStars(b.cost);

      if (!game.unlockedBackdrops) game.unlockedBackdrops = new Set(["default"]);
      game.unlockedBackdrops.add(b.id);
      saveUnlockedBackdrops(game);

      game.state.backdrop = b.id;
      saveBackdrop(game);

      game.ui.buildBackdropSelect();
      game.dom.backdropSelect.value = b.id;

      game.ui.syncBackdropUI();
    },

    onBackdropChange(newId) {
      // If locked, do NOT apply yet (keeps it shop-based)
      const unlocked = game.unlockedBackdrops?.has(newId);
      if (unlocked) {
        game.state.backdrop = newId;
        saveBackdrop(game);
      }
      game.ui.syncBackdropUI();
    },

    /* ---------- Overlays ---------- */

    syncStartUi() {
      const show = !game.state.startedOnce && !game.state.running && !game.state.gameOver;
      game.dom.startUi.style.display = show ? "flex" : "none";
      game.dom.startUi.setAttribute("aria-hidden", show ? "false" : "true");
    },

    syncGameOverUi() {
      const show = game.state.gameOver;
      game.dom.gameOverUi.style.display = show ? "flex" : "none";
      game.dom.gameOverUi.setAttribute("aria-hidden", show ? "false" : "true");

      if (show) {
        game.dom.finalScoreEl.textContent = String(Math.floor(game.state.score));
        game.dom.finalBestEl.textContent = String(game.state.best);
        game.dom.finalRunStarsEl.textContent = String(game.state.runStars);
        game.dom.finalWalletStarsEl.textContent = String(game.state.walletStars);
      }
    },

    /* ---------- Fullscreen ---------- */

    setFsUi() {
      const fsBtn = game.dom.fsBtn;
      if (!fsBtn) return;
      const on = !!document.fullscreenElement;
      fsBtn.textContent = on ? "Exit Fullscreen" : "Fullscreen";
    },

    async toggleFullscreen() {
      try {
        if (!document.fullscreenElement) await game.dom.fsTarget.requestFullscreen();
        else await document.exitFullscreen();
      } catch {
        // ignore
      }
      game.ui.setFsUi();
      game.ui.updateFullscreenHud();
    },

    updateFullscreenHud() {
      const fsHud = game.ui.fsHud;
      const on = document.fullscreenElement === game.dom.fsTarget;

      if (!on) {
        fsHud.style.display = "none";
        return;
      }

      fsHud.style.display = "flex";
      fsHud.innerHTML = "";

      const score = Math.floor(game.state.score);
      const best = game.state.best;
      const stars = game.state.walletStars;

      const diffKey = (game.state.difficultyKey || "normal").toLowerCase();
      const diffLabel = diffKey.charAt(0).toUpperCase() + diffKey.slice(1);

      fsHud.appendChild(createHudPill(`Score: ${score}   Best: ${best}   Stars: ${stars}   Difficulty: ${diffLabel}`));

      const { images, player } = game;

      if (player.doubleTimer > 0) fsHud.appendChild(createBuffChip(game, images.doublePoints, player.doubleTimer));
      if (player.slowTimer > 0) fsHud.appendChild(createBuffChip(game, images.timeSlow, player.slowTimer));
      if (player.magnetTimer > 0) fsHud.appendChild(createBuffChip(game, images.magnet, player.magnetTimer));
      if (player.shrinkTimer > 0) fsHud.appendChild(createBuffChip(game, images.shrink, player.shrinkTimer));
      if (player.speedBoostTimer > 0) fsHud.appendChild(createBuffChip(game, images.jetpack, player.speedBoostTimer));
    },
  };
}
