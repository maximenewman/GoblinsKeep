import { Direction } from "../app/Direction.ts";
import { CollisionArea } from "../render/CollisionArea.ts";

/**
 * Base class for everything that moves in the world (Player, Goblin). Mirrors
 * the layout of Entity.java — same eight-sprite slot pattern, same
 * Pascal-cased WorldX / WorldY / SpriteCounter / SpriteNum field names that
 * the Java code uses everywhere — so the diff against the Java source stays
 * narrow.
 *
 * The {@code gp} reference and {@code draw()} / {@code isVisibleOnScreen()}
 * are intentionally not yet here; they need the future Game class for camera
 * coordinates and will be added once Game lands.
 */
export abstract class Entity {
  WorldX: number;
  WorldY: number;
  speed = 1;

  // Sprite slots populated by subclasses' image-loading methods.
  up1:    HTMLImageElement | null = null;
  up2:    HTMLImageElement | null = null;
  down1:  HTMLImageElement | null = null;
  down2:  HTMLImageElement | null = null;
  left1:  HTMLImageElement | null = null;
  left2:  HTMLImageElement | null = null;
  right1: HTMLImageElement | null = null;
  right2: HTMLImageElement | null = null;

  direction: Direction = Direction.DOWN;
  SpriteCounter = 0;
  SpriteNum: 1 | 2 = 1;

  collisionArea: CollisionArea;
  hitboxDefaultX = 0;
  hitboxDefaultY = 0;

  collisionOn = false;
  actionLockCounter = 0;

  constructor(worldX: number, worldY: number) {
    this.WorldX = worldX;
    this.WorldY = worldY;
    this.collisionArea = new CollisionArea(0, 0, 0, 0);
  }

  /** Movement gate. Player overrides to also require keyboard input. */
  protected canMove(): boolean {
    return !this.collisionOn;
  }

  /**
   * Direction used for selecting which sprite to render. Goblin overrides this
   * to return its drawDirection so the sprite faces the AI-chosen heading
   * even when the underlying movement direction has been re-pointed by
   * collision avoidance.
   */
  protected getEffectiveDirection(): Direction {
    return this.direction;
  }

  /** Animation gate. Subclasses can suppress the per-tick frame swap. */
  protected canUpdateSprite(): boolean {
    return true;
  }

  /** Toggles SpriteNum between 1 and 2 every 11 ticks (matches Java's `> 10`). */
  protected updateAnimation(): void {
    if (!this.canUpdateSprite()) return;
    this.SpriteCounter++;
    if (this.SpriteCounter > 10) {
      this.SpriteNum = this.SpriteNum === 1 ? 2 : 1;
      this.SpriteCounter = 0;
    }
  }

  /** Returns the sprite for the entity's current direction + frame. */
  protected getSpriteForDirection(): HTMLImageElement | null {
    const dir = this.getEffectiveDirection();
    const num = this.SpriteNum;
    if (dir === Direction.UP)    return num === 1 ? this.up1   : this.up2;
    if (dir === Direction.DOWN)  return num === 1 ? this.down1 : this.down2;
    if (dir === Direction.LEFT)  return num === 1 ? this.left1 : this.left2;
    return num === 1 ? this.right1 : this.right2;
  }

  getX(): number { return this.WorldX; }
  getY(): number { return this.WorldY; }
  setX(newX: number): void { this.WorldX = newX; }
  setY(newY: number): void { this.WorldY = newY; }
  getSpeed(): number { return this.speed; }

  /**
   * Moves the entity by speed pixels in its current direction (when allowed)
   * and ticks the sprite animation. Preserves the Java sign convention: UP's
   * dy is +1 but is *subtracted* from WorldY, so UP visually decreases y.
   */
  moveEntityTowardDirection(): void {
    if (!this.canMove()) return;
    const speed = this.speed;
    if (this.direction === Direction.UP) {
      this.WorldY -= Direction.UP.dy * speed;
    } else if (this.direction === Direction.DOWN) {
      this.WorldY -= Direction.DOWN.dy * speed;
    } else if (this.direction === Direction.LEFT) {
      this.WorldX += Direction.LEFT.dx * speed;
    } else {
      this.WorldX += Direction.RIGHT.dx * speed;
    }
    this.updateAnimation();
  }
}
