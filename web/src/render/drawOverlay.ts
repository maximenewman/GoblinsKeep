/**
 * On-screen text rendered on top of the world: the in-play HUD (key icon,
 * key counter, score, timer) plus the menu / pause / end overlays. All ports
 * mirror Java's UI / MenuUI / PauseUI / EndUI surface.
 */

const TILE = 48;
const HUD_FONT = "40px 'PixelPurl', monospace";
const TITLE_FONT = "80px 'SuperPixel', 'PixelPurl', monospace";
const BANNER_FONT = "60px 'SuperPixel', 'PixelPurl', monospace";
const OPTION_FONT = "40px 'SuperPixel', 'PixelPurl', monospace";
const BODY_FONT = "28px 'PixelPurl', monospace";
const MESSAGE_FONT = "20px 'PixelPurl', monospace";

/** Strokes a black border under the white fill — same look as Java's drawTextWithBorder. */
function drawBorderedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  borderWidth: number,
): void {
  ctx.lineJoin = "round";
  ctx.lineWidth = borderWidth;
  ctx.strokeStyle = "black";
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
}

/**
 * In-play HUD — key icon + "x = N", "score = N", "Time MM:SS" across the top row.
 * Mirrors Java UI.drawPlaying (40f UIFont, key sprite at tileSize/2,tileSize/2-10,
 * counters at the same tile offsets).
 */
export function drawHUD(
  ctx: CanvasRenderingContext2D,
  state: { keysCollected: number; score: number; playTime: number },
  keyImage: HTMLImageElement,
): void {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(keyImage, TILE / 2, TILE / 2 - 10, TILE, TILE);

  ctx.font = HUD_FONT;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "white";

  drawBorderedText(ctx, `x = ${state.keysCollected}`, (TILE * 3) / 2, TILE, 3);
  drawBorderedText(ctx, `score = ${state.score}`, TILE * 6 + TILE / 2, TILE, 3);

  const seconds = Math.floor(state.playTime);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  drawBorderedText(ctx, `Time: ${mm}:${ss}`, TILE * 12, TILE, 3);
  ctx.restore();
}

/**
 * Brief centered status text (e.g. "Lever Unlocked", "Door Locked!") drawn
 * above the player. Mirrors Java UI.drawPlaying's message block.
 */
export function drawMessage(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number,
  screenWidth: number,
): void {
  ctx.save();
  ctx.font = MESSAGE_FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "white";
  drawBorderedText(ctx, text, screenWidth / 2, y, 2);
  ctx.restore();
}

/**
 * Centered cursor menu — mirrors Java's drawCursorOptionsCentered. Each
 * option baseline starts at startY and stacks downward by one tile; ">" is
 * drawn one tile to the left of the selected one.
 */
function drawCursorOptions(
  ctx: CanvasRenderingContext2D,
  options: readonly string[],
  cursor: number,
  startY: number,
  screenWidth: number,
): void {
  ctx.save();
  ctx.font = OPTION_FONT;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "white";

  for (let i = 0; i < options.length; i++) {
    const text = options[i];
    const y = startY + TILE * i;
    const textWidth = ctx.measureText(text).width;
    const x = (screenWidth - textWidth) / 2;
    drawBorderedText(ctx, text, x, y, 4);
    if (cursor === i) {
      drawBorderedText(ctx, ">", x - TILE, y, 4);
    }
  }
  ctx.restore();
}

/**
 * Title screen — castle bg full-bleed + "Goblins Keep" banner + cursor
 * menu. Mirrors Java MenuUI.draw with title at y = tileSize * 3.
 */
export function drawMenuScreen(
  ctx: CanvasRenderingContext2D,
  background: HTMLImageElement,
  options: readonly string[],
  cursor: number,
  screenWidth: number,
  screenHeight: number,
): void {
  ctx.save();
  ctx.drawImage(background, 0, 0, screenWidth, screenHeight);

  ctx.font = TITLE_FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "white";
  drawBorderedText(ctx, "Goblins Keep", screenWidth / 2, TILE * 3, 6);
  ctx.restore();

  drawCursorOptions(ctx, options, cursor, TILE * 8, screenWidth);
}

/**
 * Paused overlay — keeps the frozen world visible underneath, dims with 30%
 * black (matches Java UI.drawPaused), draws "PAUSED" + cursor menu.
 */
export function drawPauseScreen(
  ctx: CanvasRenderingContext2D,
  options: readonly string[],
  cursor: number,
  screenWidth: number,
  screenHeight: number,
): void {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fillRect(0, 0, screenWidth, screenHeight);

  ctx.font = TITLE_FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "white";
  drawBorderedText(ctx, "PAUSED", screenWidth / 2, TILE * 3, 6);
  ctx.restore();

  drawCursorOptions(ctx, options, cursor, TILE * 8, screenWidth);
}

/**
 * Instructions screen — title bg + 60% black dim, "INSTRUCTIONS" header,
 * body lines, and the BACK TO MENU cursor option. Mirrors Java InstructionsUI.draw.
 */
export function drawInstructionsScreen(
  ctx: CanvasRenderingContext2D,
  background: HTMLImageElement,
  lines: readonly string[],
  options: readonly string[],
  cursor: number,
  screenWidth: number,
  screenHeight: number,
): void {
  ctx.save();
  ctx.drawImage(background, 0, 0, screenWidth, screenHeight);
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, 0, screenWidth, screenHeight);

  ctx.font = BANNER_FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "white";
  drawBorderedText(ctx, "INSTRUCTIONS", screenWidth / 2, TILE * 1.5, 6);

  ctx.font = BODY_FONT;
  // Body lines are tighter than the title — pull line height in to give the
  // BACK TO MENU cursor room at the bottom even with 15+ instruction lines.
  const BODY_START_Y = 110;
  const BODY_LINE_HEIGHT = 28;
  for (let i = 0; i < lines.length; i++) {
    drawBorderedText(ctx, lines[i], screenWidth / 2, BODY_START_Y + i * BODY_LINE_HEIGHT, 2);
  }
  ctx.restore();

  // Cursor sits one tile below the last line, then clamped just above the
  // canvas bottom so a long instruction list still leaves the option visible.
  const lastBodyY = BODY_START_Y + (lines.length - 1) * BODY_LINE_HEIGHT;
  const cursorY = Math.min(lastBodyY + TILE, screenHeight - 24);
  drawCursorOptions(ctx, options, cursor, cursorY, screenWidth);
}

/**
 * End screen — win/lose art full-bleed, 35% black dim (matches Java
 * EndUI.drawBackground + AlphaComposite 0.35), banner, score breakdown,
 * and cursor menu.
 */
export function drawEndScreen(
  ctx: CanvasRenderingContext2D,
  background: HTMLImageElement,
  state: {
    win: boolean;
    keysCollected: number;
    regularScore: number;
    playTime: number;
  },
  options: readonly string[],
  cursor: number,
  screenWidth: number,
  screenHeight: number,
): void {
  ctx.save();
  ctx.drawImage(background, 0, 0, screenWidth, screenHeight);
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.fillRect(0, 0, screenWidth, screenHeight);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Banner — Java uses "CONGRATULATIONS" + "YOU WON!" on win, "YOU LOSE" on loss.
  ctx.font = BANNER_FONT;
  ctx.fillStyle = state.win ? "#34d399" : "#ef4444";
  if (state.win) {
    drawBorderedText(ctx, "CONGRATULATIONS", screenWidth / 2, TILE * 2, 6);
    drawBorderedText(ctx, "YOU WON!", screenWidth / 2, TILE * 2 + 72, 6);
  } else {
    drawBorderedText(ctx, "YOU LOSE", screenWidth / 2, TILE * 2, 6);
  }

  // Total score = keys × 250 + regular score, plus playtime, both larger.
  const keyBonus = state.keysCollected * 250;
  const total = keyBonus + state.regularScore;
  const seconds = Math.floor(state.playTime);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  ctx.font = HUD_FONT;
  ctx.fillStyle = "white";
  drawBorderedText(ctx, `Total Score: ${total}`, screenWidth / 2, TILE * 5, 4);
  drawBorderedText(ctx, `Time: ${mm}:${ss}`, screenWidth / 2, TILE * 6, 4);

  // Score breakdown — smaller body text.
  ctx.font = BODY_FONT;
  drawBorderedText(
    ctx,
    `Keys Collected: ${state.keysCollected} x 250 = ${keyBonus}`,
    screenWidth / 2,
    TILE * 7,
    2,
  );
  drawBorderedText(
    ctx,
    `Regular Score: ${state.regularScore}`,
    screenWidth / 2,
    TILE * 7 + 36,
    2,
  );
  ctx.restore();

  drawCursorOptions(ctx, options, cursor, TILE * 9 + 24, screenWidth);
}
