import { Direction } from "../app/Direction.ts";
import { Node } from "../pathfinder/Node.ts";
import { PathFinder } from "../pathfinder/PathFinder.ts";
import { CollisionArea } from "../render/CollisionArea.ts";
import { CollisionChecker } from "./CollisionChecker.ts";
import { Goblin } from "./Goblin.ts";
import { Player } from "./Player.ts";

/**
 * Concrete goblin: A* chases the player when onPath, otherwise wanders.
 *
 * The Java pathFinder.searchPath helper is inlined here rather than added to
 * PathFinder — keeps PathFinder free of Entity/Goblin coupling. The
 * direction-picking heuristic (where am I relative to the next path node;
 * fall back to a perpendicular direction if blocked) is preserved verbatim
 * from the Java original.
 *
 * The {@code onPlayerHit} callback is fired when the goblin's center comes
 * within {@code hitDistance} pixels of the player's center — a slightly
 * looser proximity check than the rectangle overlap that
 * {@link CollisionChecker.handleEnemyCollisions} uses, matching Java's
 * {@code interactPlayer}.
 */
export class RegularGoblin extends Goblin {
  myPath: Node[] = [];

  private readonly pathFinder: PathFinder;
  private readonly collisionChecker: CollisionChecker;
  private readonly onPlayerHit: () => void;
  private readonly random: () => number;

  /** Ticks the goblin must wait between random-direction rolls. */
  private static readonly RANDOM_DIRECTION_INTERVAL = 75;

  /** Center-to-center distance at which a touch counts as a hit. */
  private static readonly HIT_DISTANCE = 47;

  constructor(
    player: Player,
    worldX: number,
    worldY: number,
    tileSize: number,
    pathFinder: PathFinder,
    collisionChecker: CollisionChecker,
    onPlayerHit: () => void,
    random: () => number = Math.random,
  ) {
    super(player, worldX, worldY, tileSize);
    this.pathFinder = pathFinder;
    this.collisionChecker = collisionChecker;
    this.onPlayerHit = onPlayerHit;
    this.random = random;
    // Java RegularGoblin overrides the Goblin base hitbox to a larger 32x32 box.
    this.collisionArea = new CollisionArea(8, 16, 32, 32);
    this.hitboxDefaultX = 8;
    this.hitboxDefaultY = 16;
  }

  override getAction(): void {
    if (this.onPath) {
      const goal = this.player.getCenterTileCoordinates();
      this.searchPath(goal.col, goal.row);
    } else {
      this.randomMovement();
    }
    this.drawDirection = this.direction;
    this.moveAlongPath();
  }

  /** Returns the path the goblin is currently following (post-search). */
  getPath(): Node[] {
    return this.myPath;
  }

  /**
   * Runs A* from the goblin's current tile to the goal, stores the resulting
   * path, and points the goblin's direction toward the next node. Uses the
   * same dual-axis heuristic as Java pathFinder.searchPath: prefer vertical
   * movement when the column lines up, horizontal when the row lines up,
   * otherwise pick the dominant axis and fall back to the perpendicular if
   * a wall blocks the preferred direction.
   */
  private searchPath(goalCol: number, goalRow: number): void {
    const startCol = Math.floor((this.WorldX + this.hitboxDefaultX) / this.tileSize);
    const startRow = Math.floor((this.WorldY + this.hitboxDefaultY) / this.tileSize);

    this.pathFinder.setNodes(startCol, startRow, goalCol, goalRow);
    if (!this.pathFinder.search()) {
      return;
    }

    this.myPath = [...this.pathFinder.pathList];
    const next = this.myPath[0];
    if (!next) return;

    const nextX = next.col * this.tileSize;
    const nextY = next.row * this.tileSize;

    const enLeftX   = this.WorldX + this.hitboxDefaultX;
    const enRightX  = enLeftX + this.collisionArea.width;
    const enTopY    = this.WorldY + this.hitboxDefaultY;
    const enBottomY = enTopY + this.collisionArea.height;
    const tile      = this.tileSize;

    if (enTopY > nextY && enLeftX >= nextX && enRightX < nextX + tile) {
      this.direction = Direction.UP;
    } else if (enTopY < nextY && enLeftX >= nextX && enRightX < nextX + tile) {
      this.direction = Direction.DOWN;
    } else if (enTopY >= nextY && enBottomY < nextY + tile) {
      this.direction = enLeftX > nextX ? Direction.LEFT : Direction.RIGHT;
    } else if (enTopY > nextY && enLeftX > nextX) {
      this.direction = Direction.UP;
      this.collisionChecker.checkTileCollision(this);
      if (this.collisionOn) this.direction = Direction.LEFT;
    } else if (enTopY > nextY && enLeftX < nextX) {
      this.direction = Direction.UP;
      this.collisionChecker.checkTileCollision(this);
      if (this.collisionOn) this.direction = Direction.RIGHT;
    } else if (enTopY < nextY && enLeftX > nextX) {
      this.direction = Direction.DOWN;
      this.collisionChecker.checkTileCollision(this);
      if (this.collisionOn) this.direction = Direction.LEFT;
    } else if (enTopY < nextY && enLeftX < nextX) {
      this.direction = Direction.DOWN;
      this.collisionChecker.checkTileCollision(this);
      if (this.collisionOn) this.direction = Direction.RIGHT;
    }
  }

  /**
   * Picks a fresh random cardinal direction every
   * {@link RANDOM_DIRECTION_INTERVAL} ticks. The intervening calls are no-ops
   * so the goblin commits to a heading rather than jittering every frame.
   */
  private randomMovement(): void {
    this.actionLockCounter++;
    if (this.actionLockCounter < RegularGoblin.RANDOM_DIRECTION_INTERVAL) return;
    this.actionLockCounter = 0;
    const roll = Math.floor(this.random() * 4);
    const choices = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
    this.direction = choices[roll] ?? Direction.RIGHT;
  }

  /**
   * Resolves collisions then moves. During random wandering, a tile collision
   * reverses the heading so the goblin bounces off walls instead of standing
   * still until the next direction roll.
   */
  private moveAlongPath(): void {
    this.collisionOn = false;
    this.checkCollisions();
    if (this.collisionOn && !this.onPath) {
      this.reverseDirection();
      this.collisionOn = false;
    }
    this.moveEntityTowardDirection();
  }

  private checkCollisions(): void {
    this.collisionChecker.handleEnemyCollisions(this, this.player);
    this.interactPlayer(RegularGoblin.HIT_DISTANCE);
  }

  /**
   * Center-to-center proximity check. Fires {@link onPlayerHit} when the
   * goblin gets within {@code hitDistance} pixels of the player's center —
   * looser than the rectangle overlap CollisionChecker uses, matches Java's
   * interactPlayer.
   */
  interactPlayer(hitDistance: number): void {
    const playerMidX = this.player.WorldX + this.player.hitboxDefaultX + this.player.collisionArea.width / 2;
    const playerMidY = this.player.WorldY + this.player.hitboxDefaultY + this.player.collisionArea.height / 2;
    const goblinMidX = this.WorldX + this.hitboxDefaultX + this.collisionArea.width / 2;
    const goblinMidY = this.WorldY + this.hitboxDefaultY + this.collisionArea.height / 2;
    const distance = Math.hypot(playerMidX - goblinMidX, playerMidY - goblinMidY);
    if (distance <= hitDistance) {
      this.onPlayerHit();
    }
  }

  private reverseDirection(): void {
    if (this.direction === Direction.UP) this.direction = Direction.DOWN;
    else if (this.direction === Direction.DOWN) this.direction = Direction.UP;
    else if (this.direction === Direction.LEFT) this.direction = Direction.RIGHT;
    else this.direction = Direction.LEFT;
    this.drawDirection = this.direction;
  }
}
