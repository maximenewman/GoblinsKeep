/**
 * Translates world coordinates to screen coordinates by following a target
 * point. Whatever world position is set as the target lands at the center of
 * the viewport minus tileSize/2 — matching the Java pattern where the player
 * is drawn at {@code (screenWidth/2 - tileSize/2, screenHeight/2 - tileSize/2)}
 * and everything else is offset by the player's world position.
 */
export class Camera {
  targetWorldX: number;
  targetWorldY: number;
  readonly screenWidth: number;
  readonly screenHeight: number;
  readonly tileSize: number;

  constructor(
    targetWorldX: number,
    targetWorldY: number,
    screenWidth: number,
    screenHeight: number,
    tileSize: number,
  ) {
    this.targetWorldX = targetWorldX;
    this.targetWorldY = targetWorldY;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.tileSize = tileSize;
  }

  /** Half-tile-aligned center x in screen pixels. */
  private get centerX(): number {
    return (this.screenWidth - this.tileSize) / 2;
  }

  /** Half-tile-aligned center y in screen pixels. */
  private get centerY(): number {
    return (this.screenHeight - this.tileSize) / 2;
  }

  /** World x → screen x. */
  toScreenX(worldX: number): number {
    return worldX - this.targetWorldX + this.centerX;
  }

  /** World y → screen y. */
  toScreenY(worldY: number): number {
    return worldY - this.targetWorldY + this.centerY;
  }
}
