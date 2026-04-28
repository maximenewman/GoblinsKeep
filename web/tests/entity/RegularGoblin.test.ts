import { describe, expect, it, vi } from "vitest";
import { Direction } from "../../src/app/Direction.ts";
import { CollisionChecker } from "../../src/entity/CollisionChecker.ts";
import { RegularGoblin } from "../../src/entity/RegularGoblin.ts";
import { Player } from "../../src/entity/Player.ts";
import { PlayerInputHandler } from "../../src/input/PlayerInputHandler.ts";
import { ObjectManager } from "../../src/objects/ObjectManager.ts";
import { PathFinder, type Grid } from "../../src/pathfinder/PathFinder.ts";
import { Tile } from "../../src/tile/Tile.ts";
import { TileManager } from "../../src/tile/TileManager.ts";

const TILE = 48;
const SCREEN_W = 768;
const SCREEN_H = 432;

const fake = (tag: string): HTMLImageElement => ({ tag } as unknown as HTMLImageElement);

class FakeGrid implements Grid {
  readonly maxCol: number;
  readonly maxRow: number;
  constructor(maxCol: number, maxRow: number) {
    this.maxCol = maxCol;
    this.maxRow = maxRow;
  }
  isSolid(): boolean {
    return false;
  }
}

const makePlayer = (worldX = 0, worldY = 0): Player => {
  const input = new PlayerInputHandler();
  return new Player(worldX, worldY, input, SCREEN_W, SCREEN_H, TILE);
};

const makeTileManager = (): TileManager => {
  const tm = new TileManager(20, 20);
  tm.tiles[0] = new Tile();
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

interface Harness {
  goblin: RegularGoblin;
  player: Player;
  pathFinder: PathFinder;
  collisionChecker: CollisionChecker;
  onPlayerHit: ReturnType<typeof vi.fn>;
}

const makeHarness = (
  goblinPos: { x: number; y: number },
  playerPos: { x: number; y: number } = { x: 0, y: 0 },
  random: (() => number) = () => 0,
): Harness => {
  const player = makePlayer(playerPos.x, playerPos.y);
  const tileM = makeTileManager();
  const objectM = makeObjectManager();
  const pathFinder = new PathFinder(new FakeGrid(20, 20));
  const collisionChecker = new CollisionChecker(tileM, objectM, TILE);
  const onPlayerHit = vi.fn();
  const goblin = new RegularGoblin(
    player,
    goblinPos.x,
    goblinPos.y,
    TILE,
    pathFinder,
    collisionChecker,
    onPlayerHit,
    random,
  );
  return { goblin, player, pathFinder, collisionChecker, onPlayerHit };
};

describe("RegularGoblin", () => {
  describe("constructor", () => {
    it("overrides the base hitbox to 32x32 with offset (8, 16)", () => {
      const { goblin } = makeHarness({ x: 0, y: 0 });
      expect(goblin.hitboxDefaultX).toBe(8);
      expect(goblin.hitboxDefaultY).toBe(16);
      expect(goblin.collisionArea.width).toBe(32);
      expect(goblin.collisionArea.height).toBe(32);
    });
  });

  describe("randomMovement", () => {
    it("does not change direction before RANDOM_DIRECTION_INTERVAL ticks elapse", () => {
      const { goblin } = makeHarness({ x: 10 * TILE, y: 10 * TILE });
      goblin.direction = Direction.RIGHT;
      // Player far away → onPath stays false, getAction takes the random branch.
      for (let i = 0; i < 74; i++) goblin.getAction();
      expect(goblin.direction).toBe(Direction.RIGHT);
    });

    it("rolls a new direction once the interval elapses", () => {
      // random() always returns 0 → roll 0 → Direction.UP.
      const { goblin } = makeHarness(
        { x: 10 * TILE, y: 10 * TILE },
        { x: 0, y: 0 },
        () => 0,
      );
      goblin.direction = Direction.RIGHT;
      for (let i = 0; i < 75; i++) goblin.getAction();
      expect(goblin.direction).toBe(Direction.UP);
    });

    it.each([
      [0.0, Direction.UP],
      [0.3, Direction.DOWN],
      [0.6, Direction.LEFT],
      [0.9, Direction.RIGHT],
    ])("random %f maps to %s", (roll, expected) => {
      const { goblin } = makeHarness(
        { x: 10 * TILE, y: 10 * TILE },
        { x: 0, y: 0 },
        () => roll,
      );
      for (let i = 0; i < 75; i++) goblin.getAction();
      expect(goblin.direction).toBe(expected);
    });
  });

  describe("interactPlayer", () => {
    it("fires onPlayerHit when within 47 px center-to-center", () => {
      // Goblin and player at the same tile → distance ~ small.
      const { goblin, onPlayerHit } = makeHarness({ x: 0, y: 0 }, { x: 0, y: 0 });
      goblin.interactPlayer(47);
      expect(onPlayerHit).toHaveBeenCalledTimes(1);
    });

    it("does not fire when the goblin is far away", () => {
      const { goblin, onPlayerHit } = makeHarness(
        { x: 10 * TILE, y: 10 * TILE },
        { x: 0, y: 0 },
      );
      goblin.interactPlayer(47);
      expect(onPlayerHit).not.toHaveBeenCalled();
    });
  });
});
