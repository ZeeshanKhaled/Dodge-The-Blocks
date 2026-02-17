// js/input.js
export function createInput(game) {
  const gamepad = { ax: 0, ay: 0, deadzone: 0.18 };

  function readGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = pads && pads[0];

    if (!gp) {
      gamepad.ax = 0;
      gamepad.ay = 0;

      if (game.dom.padStatusEl) {
        game.dom.padStatusEl.textContent = "• Controller: Not connected";
        game.dom.padStatusEl.classList.remove("is-connected");
      }
      return;
    }

    if (game.dom.padStatusEl) {
      game.dom.padStatusEl.textContent = "• Controller: Connected";
      game.dom.padStatusEl.classList.add("is-connected");
    }

    let x = gp.axes[0] || 0;
    let y = gp.axes[1] || 0;

    const dz = gamepad.deadzone;
    if (Math.hypot(x, y) < dz) {
      x = 0;
      y = 0;
    }

    gamepad.ax = x;
    gamepad.ay = y;

    if (gp.buttons?.[0]?.pressed) game.core.startGame();
    if (gp.buttons?.[9]?.pressed) {
      if (game.state.startedOnce && !game.state.gameOver) game.state.paused = !game.state.paused;
    }
  }

  function bindEvents() {
    // Fullscreen button
    if (game.dom.fsBtn) game.dom.fsBtn.addEventListener("click", () => game.ui.toggleFullscreen());
    document.addEventListener("fullscreenchange", () => {
      game.ui.setFsUi();
      game.ui.updateFullscreenHud();
    });

    // Keyboard
    window.addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();

      if (k === "escape" && document.fullscreenElement) {
        document.exitFullscreen();
        e.preventDefault();
        return;
      }

      if (k === "enter" || k === " ") {
        game.core.startGame();
        e.preventDefault();
        return;
      }

      if (k === "p") {
        if (game.state.startedOnce && !game.state.gameOver) game.state.paused = !game.state.paused;
        e.preventDefault();
        return;
      }

      if (k === "r") {
        game.state.startedOnce = false;
        game.core.reset(true);
        e.preventDefault();
        return;
      }

      game.state.keys.add(k);
    });

    window.addEventListener("keyup", (e) => {
      game.state.keys.delete(e.key.toLowerCase());
    });

    // UI controls
    game.dom.difficultyEl.addEventListener("change", () => game.ui.onDifficultyChange(game.dom.difficultyEl.value));

    game.dom.characterSelect.addEventListener("change", () => game.ui.onCharacterChange(game.dom.characterSelect.value));

    game.dom.colourSelect.addEventListener("change", () => game.ui.onColourChange(game.dom.colourSelect.value));

    game.dom.buyBtn.addEventListener("click", () => game.ui.buySelected());

    game.dom.startBtn.addEventListener("click", () => game.core.startGame());

    game.dom.restartBtn.addEventListener("click", () => {
      game.state.startedOnce = false;
      game.core.reset(true);
      game.core.startGame();
    });

    game.dom.backBtn.addEventListener("click", () => {
      game.state.startedOnce = false;
      game.core.reset(true);
    });
  }

  return { gamepad, readGamepad, bindEvents };
}
