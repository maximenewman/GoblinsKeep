/**
 * On-screen text rendered on top of the world: a small keys/score HUD in the
 * top-left and a centered end-game banner. Kept in one file because both
 * exist purely for player feedback and share the font setup.
 */

// HUD uses a system monospace so digit glyphs are guaranteed regardless of
// which pixel font happens to be loaded. The end-screen banner is large
// enough that the pixel-art typography is fine there.
const HUD_FONT = "bold 20px ui-monospace, 'Courier New', monospace";
const END_FONT = "60px 'SuperPixel', 'PixelPurl', monospace";
const PROMPT_FONT = "24px 'SuperPixel', 'PixelPurl', monospace";

/** Draws a thin status row showing collected keys and current score. */
export function drawHUD(
  ctx: CanvasRenderingContext2D,
  state: { keysCollected: number; score: number },
): void {
  ctx.save();
  ctx.font = HUD_FONT;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  // Background pill — avoids per-glyph stroke artifacts that hide thin digits
  // in pixel fonts and gives consistent contrast against any tile.
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.fillRect(8, 8, 160, 56);

  ctx.fillStyle = "white";
  ctx.fillText(`Keys ${state.keysCollected}`, 16, 14);
  ctx.fillText(`Score ${state.score}`, 16, 40);
  ctx.restore();
}

/** Dims the playfield and centers a "PAUSED" banner. */
export function drawPauseScreen(
  ctx: CanvasRenderingContext2D,
  screenWidth: number,
  screenHeight: number,
): void {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, 0, screenWidth, screenHeight);

  ctx.font = END_FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 8;
  ctx.lineJoin = "round";
  ctx.strokeStyle = "black";
  ctx.fillStyle = "white";

  const cx = screenWidth / 2;
  const cy = screenHeight / 2;
  ctx.strokeText("PAUSED", cx, cy);
  ctx.fillText("PAUSED", cx, cy);
  ctx.restore();
}

/** Dims the playfield and centers a large win/loss banner. */
export function drawEndScreen(
  ctx: CanvasRenderingContext2D,
  win: boolean,
  screenWidth: number,
  screenHeight: number,
): void {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, 0, screenWidth, screenHeight);

  ctx.font = END_FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 8;
  ctx.lineJoin = "round";
  ctx.strokeStyle = "black";
  ctx.fillStyle = win ? "#34d399" : "#ef4444";

  const message = win ? "YOU WIN!" : "GAME OVER";
  const cx = screenWidth / 2;
  const cy = screenHeight / 2;
  ctx.strokeText(message, cx, cy);
  ctx.fillText(message, cx, cy);

  ctx.font = PROMPT_FONT;
  ctx.lineWidth = 4;
  ctx.fillStyle = "white";
  const prompt = "Press R to restart";
  ctx.strokeText(prompt, cx, cy + 60);
  ctx.fillText(prompt, cx, cy + 60);
  ctx.restore();
}
