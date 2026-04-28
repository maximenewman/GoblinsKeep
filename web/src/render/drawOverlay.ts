/**
 * On-screen text rendered on top of the world: a small keys/score HUD in the
 * top-left and a centered end-game banner. Kept in one file because both
 * exist purely for player feedback and share the font setup.
 */

const HUD_FONT = "20px 'SuperPixel', 'PixelPurl', monospace";
const END_FONT = "60px 'SuperPixel', 'PixelPurl', monospace";

/** Draws a thin status row showing collected keys and current score. */
export function drawHUD(
  ctx: CanvasRenderingContext2D,
  state: { keysCollected: number; score: number },
): void {
  ctx.save();
  ctx.font = HUD_FONT;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.lineWidth = 4;
  ctx.lineJoin = "round";
  ctx.strokeStyle = "black";
  ctx.fillStyle = "white";

  const lines = [`Keys ${state.keysCollected}`, `Score ${state.score}`];
  for (let i = 0; i < lines.length; i++) {
    const y = 12 + i * 26;
    ctx.strokeText(lines[i]!, 12, y);
    ctx.fillText(lines[i]!, 12, y);
  }
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
  ctx.restore();
}
