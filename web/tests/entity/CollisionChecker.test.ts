import { beforeEach, describe, expect, it, vi } from "vitest";
import { Direction } from "../../src/app/Direction.ts";
import { CollisionChecker } from "../../src/entity/CollisionChecker.ts";
import { Player } from "../../src/entity/Player.ts";
import { PlayerInputHandler } from "../../src/input/PlayerInputHandler.ts";
import { ObjectManager } from "../../src/objects/ObjectManager.ts";
import { Tile } from "../../src/tile/Tile.ts";
import { TileManager } from "../../src/tile/TileManager.ts";

const TILE = 48;
const SCREEN_W = 768;
const SCREEN_H = 432;

const fake = (tag: string): HTMLImageElement => ({ tag } as unknown as HTMLImageElement);

const makeTileManager = (cols = 5, rows = 5): TileManager => {
  const tm = new TileManager(cols, rows);
  // Tile 0 = floor (no collision). Tile 1 = wall (collision).
  tm.tiles[0] = new Tile();
  const wall = new Tile();
  wall.collision = true;
  tm.tiles[1] = wall;
  return tm;
};

const makeObjectManager = (): ObjectManager => {
  const om = new ObjectManager(TILE);
  om.setSprites({
    key:           fake("key"),
    trap:          fake("trap"),
    bonus:         fake("bonus"),
    leverInactive: fake("lever-inactive"),
    leverActive:   fake("lever-active"),
    exitClosed:    fake("exit-closed"),
    exitOpen:      fake("exit-open"),
    treeVariant0:  fake("tree-0"),
    treeVariant1:  fake("tree-1"),
  });
  return om;
};

const makePlayer = (worldX: number, worldY: number): Player => {
  const input = new PlayerInputHandler();
  const player = new Player(worldX, worldY, input, SCREEN_W, SCREEN_H, TILE);
  // Speed 24 = half a tile. Big enough that a step from a tile center
  // crosses cleanly into an adjacent tile in any direction, which is what
  // most of these tests assert about. Individual tests override when they
  // care about the speed boundary.
  player.speed = 24;
  return player;
};

describe("CollisionChecker tile blocking", () => {
  let tm: TileManager;
  let om: ObjectManager;
  let checker: CollisionChecker;

  beforeEach(() => {
    tm = makeTileManager();
    om = makeObjectManager();
    checker = new CollisionChecker(tm, om, TILE);
  });

  it("blocks a move into a wall tile (RIGHT)", () => {
    // Player on tile (1,1); wall on tile (2,1). Hitbox center pushes right
    // into the wall when speed = 4.
    tm.mapTileNum[2]![1] = 1;
    const player = makePlayer(1 * TILE, 1 * TILE);
    player.direction = Direction.RIGHT;
    checker.checkTileCollision(player);
    expect(player.collisionOn).toBe(true);
  });

  it("blocks a move into a wall tile (LEFT)", () => {
    tm.mapTileNum[0]![1] = 1;
    const player = makePlayer(1 * TILE, 1 * TILE);
    player.direction = Direction.LEFT;
    checker.checkTileCollision(player);
    expect(player.collisionOn).toBe(true);
  });

  it("blocks a move into a wall tile (UP)", () => {
    tm.mapTileNum[1]![0] = 1;
    const player = makePlayer(1 * TILE, 1 * TILE);
    player.direction = Direction.UP;
    checker.checkTileCollision(player);
    expect(player.collisionOn).toBe(true);
  });

  it("blocks a move into a wall tile (DOWN)", () => {
    tm.mapTileNum[1]![2] = 1;
    const player = makePlayer(1 * TILE, 1 * TILE);
    player.direction = Direction.DOWN;
    checker.checkTileCollision(player);
    expect(player.collisionOn).toBe(true);
  });

  it("does not block a move toward an open tile", () => {
    // All tiles default to 0 = floor. No collision possible.
    const player = makePlayer(1 * TILE, 1 * TILE);
    player.direction = Direction.RIGHT;
    checker.checkTileCollision(player);
    expect(player.collisionOn).toBe(false);
  });

  it("treats off-map tiles as solid", () => {
    const player = makePlayer(0, 1 * TILE);
    player.direction = Direction.LEFT;
    checker.checkTileCollision(player);
    expect(player.collisionOn).toBe(true);
  });
});

describe("CollisionChecker object blocking", () => {
  let tm: TileManager;
  let om: ObjectManager;
  let checker: CollisionChecker;

  beforeEach(() => {
    tm = makeTileManager(10, 10);
    om = makeObjectManager();
    checker = new CollisionChecker(tm, om, TILE);
  });

  it("a collidable object (closed Exit) sets collisionOn", () => {
    om.spawn(2, 1, { kind: "EXIT" });
    const player = makePlayer(1 * TILE, 1 * TILE);
    player.direction = Direction.RIGHT;
    checker.checkPlayerCollisions(player);
    expect(player.collisionOn).toBe(true);
  });

  it("a non-collidable object (Key) does not set collisionOn", () => {
    om.spawn(2, 1, { kind: "KEY" });
    const player = makePlayer(1 * TILE, 1 * TILE);
    player.direction = Direction.RIGHT;
    checker.checkPlayerCollisions(player);
    expect(player.collisionOn).toBe(false);
  });

  it("fires onPlayerObjectCollision when the player overlaps any object", () => {
    om.spawn(2, 1, { kind: "KEY" });
    const player = makePlayer(1 * TILE, 1 * TILE);
    player.direction = Direction.RIGHT;
    const onTouch = vi.fn();
    checker.onPlayerObjectCollision = onTouch;
    checker.checkPlayerCollisions(player);
    expect(onTouch).toHaveBeenCalledTimes(1);
    const arg = onTouch.mock.calls[0]?.[0] as { name: string };
    expect(arg.name).toBe("key");
  });

  it("does not fire onPlayerObjectCollision when no object is in range", () => {
    om.spawn(5, 5, { kind: "KEY" });
    const player = makePlayer(1 * TILE, 1 * TILE);
    player.direction = Direction.RIGHT;
    const onTouch = vi.fn();
    checker.onPlayerObjectCollision = onTouch;
    checker.checkPlayerCollisions(player);
    expect(onTouch).not.toHaveBeenCalled();
  });

  it("respects the object's defaultCollisionArea offsets (Key has +6 inset)", () => {
    om.spawn(2, 1, { kind: "KEY" });
    // The Key's hitbox is the inner 36x36 of its tile (offset 6). With the
    // player at tile (1,1) moving right at speed 1, the leading edge of the
    // player only barely reaches the start of tile 2 — not far enough to
    // intersect the Key's inset hitbox.
    const player = makePlayer(1 * TILE, 1 * TILE);
    player.speed = 1;
    player.direction = Direction.RIGHT;
    const onTouch = vi.fn();
    checker.onPlayerObjectCollision = onTouch;
    checker.checkPlayerCollisions(player);
    expect(onTouch).not.toHaveBeenCalled();
  });
});
