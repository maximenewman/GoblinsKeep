import { Direction } from "../app/Direction.ts";
import { Circle } from "../pathfinder/Circle.ts";
import { Camera } from "../render/Camera.ts";
import { CollisionArea } from "../render/CollisionArea.ts";
import { loadImage } from "../render/loadImage.ts";
import { Entity } from "./Entity.ts";
import { Player } from "./Player.ts";

/**
 * Abstract base for hostile entities. Mirrors Goblin.java — same Pascal-cased
 * field naming, same LOS-circle + tile-distance latch for the chase state.
 *
 * Subclasses provide getAction(), which decides per-tick what to do given
 * onPath/inSight + the goblin's current direction. RegularGoblin chases via
 * A* when onPath, otherwise wanders.
 */
export abstract class Goblin extends Entity {
  /** Direction the sprite faces (separate from movement direction so the AI can re-point movement without flipping the sprite). */
  drawDirection: Direction = Direction.DOWN;
  /** Latched chase state — true while pursuing the player. */
  onPath = false;
  /** True iff the player's center sits inside this goblin's LOS circle. */
  inSight = false;
  /** Line-of-sight radius in world pixels. */
  LOSradius = 130;

  protected readonly player: Player;
  protected readonly tileSize: number;

  /** Manhattan tile distance beyond which a chasing goblin gives up if it has lost line of sight. */
  private static readonly DISENGAGE_TILE_DISTANCE = 8;

  constructor(player: Player, worldX: number, worldY: number, tileSize: number) {
    super(worldX, worldY);
    this.player = player;
    this.tileSize = tileSize;
    this.speed = 2;
    this.collisionArea = new CollisionArea(11, 17, 23, 23);
    this.hitboxDefaultX = 11;
    this.hitboxDefaultY = 17;
    this.direction = Direction.DOWN;
  }

  /** Per-tick AI hook. Subclass-specific. */
  abstract getAction(): void;

  /** Loads all eight goblin sprites in parallel. */
  async loadSprites(): Promise<void> {
    const [up1, up2, down1, down2, left1, left2, right1, right2] = await Promise.all([
      loadImage("/goblin/orc_up_1.png"),
      loadImage("/goblin/orc_up_2.png"),
      loadImage("/goblin/orc_down_1.png"),
      loadImage("/goblin/orc_down_2.png"),
      loadImage("/goblin/orc_left_1.png"),
      loadImage("/goblin/orc_left_2.png"),
      loadImage("/goblin/orc_right_1.png"),
      loadImage("/goblin/orc_right_2.png"),
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

  /**
   * Recomputes LOS and updates the {@code onPath} latch. Engages chase when
   * the player enters the LOS circle; disengages only after losing sight AND
   * drifting more than {@link DISENGAGE_TILE_DISTANCE} tiles away — keeps
   * the goblin pursuing briefly around corners.
   */
  update(): void {
    const xDistance = Math.abs(this.WorldX - this.player.WorldX);
    const yDistance = Math.abs(this.WorldY - this.player.WorldY);
    const tileDistance = Math.floor((xDistance + yDistance) / this.tileSize);

    this.checkLOS();

    if (!this.onPath && this.inSight) {
      this.onPath = true;
    }
    if (this.onPath && !this.inSight && tileDistance > Goblin.DISENGAGE_TILE_DISTANCE) {
      this.onPath = false;
    }

    this.getAction();
  }

  /**
   * Sets {@link inSight} based on whether the player's center lies inside the
   * goblin's LOS circle. Operates in world coordinates so the camera transform
   * is irrelevant.
   */
  checkLOS(): void {
    const playerCenterX = this.player.WorldX + this.player.hitboxDefaultX + this.player.collisionArea.width / 2;
    const playerCenterY = this.player.WorldY + this.player.hitboxDefaultY + this.player.collisionArea.height / 2;
    const goblinCenterX = this.WorldX + this.hitboxDefaultX + this.collisionArea.width / 2;
    const goblinCenterY = this.WorldY + this.hitboxDefaultY + this.collisionArea.height / 2;
    const losRange = new Circle(this.LOSradius, goblinCenterX, goblinCenterY);
    this.inSight = losRange.intersects(playerCenterX, playerCenterY);
  }

  protected override getEffectiveDirection(): Direction {
    return this.drawDirection;
  }

  /** Renders the goblin at its world position through the camera. Skips when fully offscreen. */
  draw(ctx: CanvasRenderingContext2D, camera: Camera): void {
    const sprite = this.getSpriteForDirection();
    if (!sprite) return;

    const screenX = camera.toScreenX(this.WorldX);
    const screenY = camera.toScreenY(this.WorldY);
    const tile = this.tileSize;
    if (screenX + tile <= 0 || screenX >= camera.screenWidth) return;
    if (screenY + tile <= 0 || screenY >= camera.screenHeight) return;

    ctx.drawImage(sprite, screenX, screenY, tile, tile);
  }
}
