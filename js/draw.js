// js/draw.js
import { getHazardColourHex, getPlayerColourHex, getPreviewColourHex } from "./state.js";

/* =========================================================
   BACKDROPS (subtle + playable)
   - Drawn first, behind everything
========================================================= */

function drawBackdrop(ctx, canvas, backdropId, t) {
  switch (backdropId) {
    case "deepOcean":
      drawDeepOcean(ctx, canvas, t);
      return;

    case "midnight":
      drawMidnight(ctx, canvas, t);
      return;

    case "nebula":
      drawNebula(ctx, canvas, t);
      return;

    case "void":
      drawVoid(ctx, canvas, t);
      return;

    default:
      drawDefaultBackdrop(ctx, canvas, t);
      return;
  }
}

function drawDefaultBackdrop(ctx, canvas, t) {
  // your original subtle dot vibe (kept)
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.globalAlpha = 0.25;
  for (let i = 0; i < 80; i++) {
    const x = (i * 113) % canvas.width;
    const y = (i * 71 + t * 30) % canvas.height;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;

  ctx.restore();
}

function drawDeepOcean(ctx, canvas, t) {
  const w = canvas.width;
  const h = canvas.height;

  ctx.save();

  // Base gradient
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#07121f");
  g.addColorStop(0.55, "#05101a");
  g.addColorStop(1, "#030913");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Subtle vignette
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = "rgba(0,0,0,1)";
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2, w * 0.62, h * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Light rays (very soft)
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 7; i++) {
    const x = (w * (0.12 + i * 0.13)) + Math.sin(t * 0.3 + i) * 18;
    const rayW = 140 + i * 14;
    const rayG = ctx.createLinearGradient(x, 0, x + rayW, h);
    rayG.addColorStop(0, "rgba(90,180,255,0)");
    rayG.addColorStop(0.5, "rgba(90,180,255,1)");
    rayG.addColorStop(1, "rgba(90,180,255,0)");
    ctx.fillStyle = rayG;
    ctx.fillRect(x - rayW / 2, 0, rayW, h);
  }
  ctx.globalAlpha = 1;

  // Floating particles (small, slow)
  ctx.globalAlpha = 0.10;
  ctx.fillStyle = "rgba(170,220,255,1)";
  for (let i = 0; i < 90; i++) {
    const px = (i * 97) % w;
    const py = ((i * 53) + (t * 18)) % h;
    const s = (i % 3) === 0 ? 2 : 1;
    ctx.fillRect(px, py, s, s);
  }
  ctx.globalAlpha = 1;

  // Caustics (subtle wavy highlights)
  ctx.globalAlpha = 0.05;
  ctx.strokeStyle = "rgba(120,220,255,1)";
  ctx.lineWidth = 2;
  for (let y = 80; y < h; y += 62) {
    ctx.beginPath();
    for (let x = 0; x <= w; x += 32) {
      const yy = y + Math.sin((x * 0.015) + (t * 1.3)) * 6 + Math.sin((t * 0.7) + y * 0.02) * 4;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // ✅ Occasional fish silhouette (every ~12s, visible ~3.5s)
  drawOceanFish(ctx, w, h, t);

  ctx.restore();
}

function drawOceanFish(ctx, w, h, t) {
  const period = 12;         // seconds per cycle
  const showFor = 3.5;       // seconds visible
  const local = t % period;

  if (local > showFor) return;

  // fade in/out
  const half = showFor / 2;
  const alpha = local < half ? (local / half) : ((showFor - local) / half);

  // fish travels left->right with slight bob
  const x0 = -120;
  const x1 = w + 120;
  const p = local / showFor;
  const x = x0 + (x1 - x0) * p;

  const yBase = h * 0.62;
  const y = yBase + Math.sin(t * 1.4) * 10;

  ctx.save();
  ctx.globalAlpha = 0.10 * alpha; // dark + subtle
  ctx.fillStyle = "rgba(0,0,0,1)";

  // fish body
  ctx.beginPath();
  ctx.ellipse(x, y, 52, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // tail
  ctx.beginPath();
  ctx.moveTo(x - 52, y);
  ctx.lineTo(x - 80, y - 18);
  ctx.lineTo(x - 80, y + 18);
  ctx.closePath();
  ctx.fill();

  // tiny fin
  ctx.globalAlpha = 0.08 * alpha;
  ctx.beginPath();
  ctx.moveTo(x - 10, y);
  ctx.quadraticCurveTo(x - 24, y - 22, x + 10, y - 10);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawMidnight(ctx, canvas, t) {
  const w = canvas.width, h = canvas.height;

  ctx.save();
  ctx.fillStyle = "#070a12";
  ctx.fillRect(0, 0, w, h);

  // very subtle star drift
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "rgba(255,255,255,1)";
  for (let i = 0; i < 70; i++) {
    const x = (i * 137 + Math.sin(t * 0.2) * 10) % w;
    const y = (i * 59 + t * 6) % h;
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawNebula(ctx, canvas, t) {
  const w = canvas.width, h = canvas.height;

  ctx.save();
  ctx.fillStyle = "#070712";
  ctx.fillRect(0, 0, w, h);

  // soft blobs
  const blobs = [
    { x: w * 0.35, y: h * 0.35, r: 260 },
    { x: w * 0.62, y: h * 0.52, r: 300 },
  ];

  for (let i = 0; i < blobs.length; i++) {
    const b = blobs[i];
    const ox = Math.sin(t * 0.25 + i) * 18;
    const oy = Math.cos(t * 0.22 + i) * 14;

    const g = ctx.createRadialGradient(b.x + ox, b.y + oy, 0, b.x + ox, b.y + oy, b.r);
    g.addColorStop(0, "rgba(170,120,255,0.10)");
    g.addColorStop(0.55, "rgba(120,200,255,0.05)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  ctx.restore();
}

function drawVoid(ctx, canvas, t) {
  const w = canvas.width, h = canvas.height;

  ctx.save();
  ctx.fillStyle = "#05060a";
  ctx.fillRect(0, 0, w, h);

  // subtle scanline shimmer
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = "rgba(255,255,255,1)";
  const offset = (t * 18) % 10;
  for (let y = -10; y < h + 10; y += 10) {
    ctx.fillRect(0, y + offset, w, 1);
  }
  ctx.globalAlpha = 1;

  ctx.restore();
}

/* =========================================================
   Existing draw helpers (unchanged)
========================================================= */

function drawStar(ctx, x, y, outerR, innerR, rotation) {
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

function drawShieldIcon(ctx, x, y, r, pulse, life) {
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

function drawJetpackIcon(ctx, imgObj, x, y, r, pulse, life) {
  const flashing = life <= 2;
  const blink = flashing ? 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(life * 12 * Math.PI)) : 1;
  const bob = Math.sin(pulse * 2) * 2;

  ctx.save();
  ctx.translate(x, y + bob);

  ctx.globalAlpha = 0.2 * blink;
  ctx.fillStyle = "#ffb24d";
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1 * blink;

  if (imgObj?.ready && imgObj.img.naturalWidth > 0) {
    const size = r * 2.1;
    ctx.drawImage(imgObj.img, -size / 2, -size / 2, size, size);
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

function drawPowerIcon(ctx, x, y, r, pulse, life, imgObj, fallbackLabel, bg) {
  const flashing = life <= 2;
  const blink = flashing ? 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(life * 12 * Math.PI)) : 1;
  const bob = Math.sin(pulse * 2) * 2;

  ctx.save();
  ctx.translate(x, y + bob);

  ctx.globalAlpha = 0.22 * blink;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.9, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.95 * blink;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1 * blink;
  if (imgObj?.ready && imgObj.img.naturalWidth > 0) {
    const size = r * 2.0;
    ctx.drawImage(imgObj.img, -size / 2, -size / 2, size, size);
  } else {
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.font = `900 ${r * 0.9}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(fallbackLabel, 0, 0);
  }

  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawImageChar(context, imgObj, x, y, targetH) {
  if (!imgObj?.ready || imgObj.img.naturalWidth <= 0) return false;
  const w = targetH * (imgObj.img.naturalWidth / imgObj.img.naturalHeight);
  context.drawImage(imgObj.img, x - w / 2, y - targetH / 2, w, targetH);
  return true;
}

function drawCharacter(game, context, shape, x, y, r, t, color) {
  const { images } = game;

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

  if (shape === "ghost" && drawImageChar(context, images.ghost, x, y, r * 2.6)) return;
  if (shape === "rocket" && drawImageChar(context, images.rocketChar, x, y, r * 2.8)) return;
  if (shape === "ufo" && drawImageChar(context, images.ufo, x, y, r * 2.7)) return;
  if (shape === "football" && drawImageChar(context, images.football, x, y, r * 2.55)) return;
  if (shape === "basketball" && drawImageChar(context, images.basketball, x, y, r * 2.55)) return;
  if (shape === "golfball" && drawImageChar(context, images.golfball, x, y, r * 2.55)) return;
  if (shape === "diasword" && drawImageChar(context, images.diaSword, x, y, r * 3.1)) return;

  context.restore();
}

/* =========================================================
   MAIN DRAW
========================================================= */

export function draw(game) {
  const { canvas, ctx, state, player, images } = game;

  // ✅ Backdrop first (replaces the old clearRect + dots)
  drawBackdrop(ctx, canvas, state.backdrop, state.t);

  const hazardColor = getHazardColourHex(player);

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
    drawStar(ctx, s.x, s.y, s.r * pulse, s.r * 0.5 * pulse, s.spin);
  }

  // shields
  for (const s of state.shields) drawShieldIcon(ctx, s.x, s.y, s.r, s.pulse, s.life);

  // jetpacks
  for (const j of state.jetpacks) drawJetpackIcon(ctx, images.jetpack, j.x, j.y, j.r, j.pulse, j.life);

  // powerups (images)
  for (const p of state.doubles) drawPowerIcon(ctx, p.x, p.y, p.r, p.pulse, p.life, images.doublePoints, "2x", "#ffd966");
  for (const p of state.slows) drawPowerIcon(ctx, p.x, p.y, p.r, p.pulse, p.life, images.timeSlow, "⏱", "#a98bff");
  for (const p of state.magnets) drawPowerIcon(ctx, p.x, p.y, p.r, p.pulse, p.life, images.magnet, "🧲", "#7cf7ff");
  for (const p of state.shrinks) drawPowerIcon(ctx, p.x, p.y, p.r, p.pulse, p.life, images.shrink, "⇲", "#7dff7a");

  // player
  const baseCol = getPlayerColourHex(player);
  const playerCol = player.speedBoostTimer > 0 ? "#a6ff7c" : baseCol;
  drawCharacter(game, ctx, player.shape, player.x, player.y, player.r, state.t, playerCol);

  // shield ring
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

export function drawPreview(game) {
  const { previewCanvas, pctx, state, player } = game;
  if (!previewCanvas || !pctx) return;

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

  const previewColor = getPreviewColourHex(player, state.shopSelectedId);
  drawCharacter(game, pctx, state.shopSelectedId, cx, cy, 18, state.t, previewColor);

  if (player.shieldTimer > 0) {
    const flashing = player.shieldTimer <= 2;
    const blink = flashing ? 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(player.shieldTimer * 12 * Math.PI)) : 1;

    pctx.save();
    pctx.globalAlpha = 0.22 * blink;
    pctx.fillStyle = "#66b3ff";
    pctx.beginPath();
    pctx.arc(cx, cy, 36, 0, Math.PI * 2);
    pctx.fill();
    pctx.restore();

    pctx.globalAlpha = 1 * blink;
    pctx.beginPath();
    pctx.arc(cx, cy, 34, 0, Math.PI * 2);
    pctx.strokeStyle = "#66b3ff";
    pctx.lineWidth = 3;
    pctx.stroke();
    pctx.globalAlpha = 1;
  }
}
