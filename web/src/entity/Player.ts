import { Direction } from "../app/Direction.ts";
import { PlayerInputHandler } from "../input/PlayerInputHandler.ts";
import { CollisionArea } from "../render/CollisionArea.ts";
import { loadImage } from "../render/loadImage.ts";
import { Entity } from "./Entity.ts";

/**
 * The player character. Mirrors Player.java — same hitbox / screen-center
 * layout. Always drawn at a fixed screen position because the player is the
 * camera target.
 *
 * Differences from Java:
 *   • Sprites load async — call {@link loadSprites} once and await before
 *     starting the game loop.
 *   • CollisionChecker integration is deferred; for now {@link update} just
 *     reads input and moves freely. Walls are unenforced until the checker
 *     is ported.
 *   • The Java {@code gp.debugMode} propagation isn't here — Game (when
 *     ported) will read input.debugMode directly.
 */
export class Player extends Entity {
  readonly screenX: number;
  readonly screenY: number;
  readonly tileSize: number;
  private readonly input: PlayerInputHandler;

  constructor(
    startX: number,
    startY: number,
    input: PlayerInputHandler,
    screenWidth: number,
    screenHeight: number,
    tileSize: number,
  ) {
    super(startX, startY);
    this.input = input;
    this.tileSize = tileSize;
    this.direction = Direction.DOWN;
    this.collisionArea = new CollisionArea(8, 16, 32, 32);
    this.hitboxDefaultX = 8;
    this.hitboxDefaultY = 16;
    this.screenX = (screenWidth - tileSize) / 2;
    this.screenY = (screenHeight - tileSize) / 2;
  }

  async loadSprites(): Promise<void> {
    const [up1, up2, down1, down2, left1, left2, right1, right2] = await Promise.all([
      loadImage("/player/up1.png"),
      loadImage("/player/up2.png"),
      loadImage("/player/down1.png"),
      loadImage("/player/down2.png"),
      loadImage("/player/left1.png"),
      loadImage("/player/left2.png"),
      loadImage("/player/right1.png"),
      loadImage("/player/right2.png"),
    ]);
    this.up1 = up1;
    this.up2 = up2;
    this.down1 = down1;
    this.down2 = down2;
    this.left1 = left1;
    this.left2 = left2;
    this.right1 = right1;
    this.right2 = right2;
  }

  update(): void {
    this.collisionOn = false;
    this.updateDirection();
    this.moveEntityTowardDirection();
  }

  private updateDirection(): void {
    if (this.input.up) {
      this.direction = Direction.UP;
    } else if (this.input.down) {
      this.direction = Direction.DOWN;
    } else if (this.input.left) {
      this.direction = Direction.LEFT;
    } else if (this.input.right) {
      this.direction = Direction.RIGHT;
    }
  }

  private hasInput(): boolean {
    return this.input.up || this.input.down || this.input.left || this.input.right;
  }

  protected override canMove(): boolean {
    return !this.collisionOn && this.hasInput();
  }

  /** Draws the player at its fixed screen-centered position. */
  draw(ctx: CanvasRenderingContext2D): void {
    const sprite = this.getSpriteForDirection();
    if (sprite) {
      ctx.drawImage(sprite, this.screenX, this.screenY, this.tileSize, this.tileSize);
    }
  }

  /** Tile coordinates of the player's hitbox center. */
  getCenterTileCoordinates(): { col: number; row: number } {
    const col = Math.floor(
      (this.WorldX + this.hitboxDefaultX + this.collisionArea.width / 2) / this.tileSize,
    );
    const row = Math.floor(
      (this.WorldY + this.hitboxDefaultY + this.collisionArea.height / 2) / this.tileSize,
    );
    return { col, row };
  }
}
