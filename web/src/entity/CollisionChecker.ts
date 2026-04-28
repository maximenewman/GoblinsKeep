import { Direction } from "../app/Direction.ts";
import { MainObject } from "../objects/MainObject.ts";
import { ObjectManager } from "../objects/ObjectManager.ts";
import { CollisionArea } from "../render/CollisionArea.ts";
import { TileManager } from "../tile/TileManager.ts";
import { Entity } from "./Entity.ts";
import { Player } from "./Player.ts";

/**
 * Per-tick collision detection for entities against the world tile grid and
 * spawned objects. Mirrors CollisionChecker.java but ports only the player
 * paths in this commit — enemy-vs-enemy and player-vs-enemy land once Goblin
 * is in place.
 *
 * Differences from Java:
 *   • The Java original mutates {@code entity.collisionArea} during checks
 *     and resets afterward. This port computes predicted rectangles in
 *     locals so nothing is mutated.
 *   • Object-touch dispatch is a callback ({@link onPlayerObjectCollision})
 *     instead of a hardcoded {@code gp.map.handleObject} call so MapHandler
 *     can wire in once it's ported.
 *   • Tiles outside the world grid are treated as solid — keeps the player
 *     from walking off the edge.
 */
export class CollisionChecker {
  private readonly tileM: TileManager;
  private readonly objectM: ObjectManager;
  private readonly tileSize: number;

  /** Fires once per tick with whichever object the player overlaps last (any of them). */
  onPlayerObjectCollision: ((object: MainObject) => void) | null = null;

  /** Fires when an enemy's predicted move would land on the player. */
  onPlayerEnemyCollision: (() => void) | null = null;

  constructor(tileM: TileManager, objectM: ObjectManager, tileSize: number) {
    this.tileM = tileM;
    this.objectM = objectM;
    this.tileSize = tileSize;
  }

  /**
   * Sets player.collisionOn=true if the predicted move is blocked by a wall
   * tile or a collidable object. Fires onPlayerObjectCollision for any object
   * the predicted box overlaps (collidable or not) so MapHandler can run the
   * touch logic for keys, traps, the lever, etc.
   */
  checkPlayerCollisions(player: Player): void {
    this.checkTileCollision(player);
    const touched = this.checkObjectCollision(player, true);
    if (touched) {
      this.onPlayerObjectCollision?.(touched);
    }
  }

  /**
   * Per-tick collision checks for an enemy. Tile collisions block the move
   * the same way they do for the player. If the enemy's predicted next box
   * overlaps the player, blocks the enemy and fires the
   * onPlayerEnemyCollision callback (MapHandler will route it to
   * playerCollisionWithEnemy).
   *
   * Goblin-vs-goblin separation isn't ported yet — overlapping goblins are
   * a minor visual issue, no stuck states.
   */
  handleEnemyCollisions(enemy: Entity, player: Player): void {
    this.checkTileCollision(enemy);
    const enemyNext = this.predictedEntityArea(enemy);
    const playerArea = new CollisionArea(
      player.WorldX + player.hitboxDefaultX,
      player.WorldY + player.hitboxDefaultY,
      player.collisionArea.width,
      player.collisionArea.height,
    );
    if (enemyNext.intersects(playerArea)) {
      enemy.collisionOn = true;
      this.onPlayerEnemyCollision?.();
    }
  }

  /**
   * Predicts the entity's leading edge after one speed-step in its current
   * direction; flags collisionOn if either of the two leading corners lands
   * on a tile with collision.
   */
  checkTileCollision(entity: Entity): void {
    const ts = this.tileSize;
    const leftWorldX = entity.WorldX + entity.hitboxDefaultX;
    const rightWorldX = leftWorldX + entity.collisionArea.width;
    const topWorldY = entity.WorldY + entity.hitboxDefaultY;
    const bottomWorldY = topWorldY + entity.collisionArea.height;

    let leftCol = Math.floor(leftWorldX / ts);
    let rightCol = Math.floor(rightWorldX / ts);
    let topRow = Math.floor(topWorldY / ts);
    let bottomRow = Math.floor(bottomWorldY / ts);

    const speed = entity.speed;
    const dir = entity.direction;

    let tileA = 0;
    let tileB = 0;

    if (dir === Direction.UP) {
      topRow = Math.floor((topWorldY - dir.dy * speed) / ts);
      tileA = this.tileNumAt(leftCol, topRow);
      tileB = this.tileNumAt(rightCol, topRow);
    } else if (dir === Direction.DOWN) {
      bottomRow = Math.floor((bottomWorldY - dir.dy * speed) / ts);
      tileA = this.tileNumAt(leftCol, bottomRow);
      tileB = this.tileNumAt(rightCol, bottomRow);
    } else if (dir === Direction.LEFT) {
      leftCol = Math.floor((leftWorldX + dir.dx * speed) / ts);
      tileA = this.tileNumAt(leftCol, topRow);
      tileB = this.tileNumAt(leftCol, bottomRow);
    } else if (dir === Direction.RIGHT) {
      rightCol = Math.floor((rightWorldX + dir.dx * speed) / ts);
      tileA = this.tileNumAt(rightCol, topRow);
      tileB = this.tileNumAt(rightCol, bottomRow);
    }

    if (this.tileBlocks(tileA) || this.tileBlocks(tileB)) {
      entity.collisionOn = true;
    }
  }

  /**
   * Walks the object collection, intersecting the entity's predicted bounding
   * box with each object's hitbox. Sets collisionOn for collidable hits and
   * returns the last overlapped object (used by player-touch dispatch).
   */
  checkObjectCollision(entity: Entity, isPlayer: boolean): MainObject | null {
    const entityNext = this.predictedEntityArea(entity);
    let touched: MainObject | null = null;

    for (const obj of this.objectM.anObject.values()) {
      const objArea = new CollisionArea(
        obj.worldX + obj.defaultCollisionAreaX,
        obj.worldY + obj.defaultCollisionAreaY,
        obj.collisionArea.width,
        obj.collisionArea.height,
      );
      if (entityNext.intersects(objArea)) {
        if (obj.collision) {
          entity.collisionOn = true;
        }
        if (isPlayer) {
          touched = obj;
        }
      }
    }

    return touched;
  }

  /** Computes a fresh CollisionArea representing the entity's next-tick world bounds. */
  private predictedEntityArea(entity: Entity): CollisionArea {
    const dir = entity.direction;
    const speed = entity.speed;
    let dx = 0;
    let dy = 0;
    if (dir === Direction.UP) dy = -speed;
    else if (dir === Direction.DOWN) dy = speed;
    else if (dir === Direction.LEFT) dx = -speed;
    else if (dir === Direction.RIGHT) dx = speed;

    return new CollisionArea(
      entity.WorldX + entity.hitboxDefaultX + dx,
      entity.WorldY + entity.hitboxDefaultY + dy,
      entity.collisionArea.width,
      entity.collisionArea.height,
    );
  }

  private tileNumAt(col: number, row: number): number {
    if (col < 0 || col >= this.tileM.mapTileNum.length) return -1;
    const column = this.tileM.mapTileNum[col]!;
    if (row < 0 || row >= column.length) return -1;
    return column[row]!;
  }

  private tileBlocks(tileNum: number): boolean {
    if (tileNum < 0) return true; // off-map → blocked
    return this.tileM.checkCollisionOfTile(tileNum);
  }
}
