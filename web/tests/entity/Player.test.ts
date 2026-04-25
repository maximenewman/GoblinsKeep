import { beforeEach, describe, expect, it } from "vitest";
import { Direction } from "../../src/app/Direction.ts";
import { Player } from "../../src/entity/Player.ts";
import { PlayerInputHandler } from "../../src/input/PlayerInputHandler.ts";

const TILE = 48;
const SCREEN_W = 768;
const SCREEN_H = 432;

const makePlayer = (startX = 0, startY = 0): { player: Player; input: PlayerInputHandler } => {
  const input = new PlayerInputHandler();
  const player = new Player(startX, startY, input, SCREEN_W, SCREEN_H, TILE);
  return { player, input };
};

describe("Player", () => {
  describe("constructor", () => {
    it("places the world position from the constructor and centers the screen position", () => {
      const { player } = makePlayer(528, 432);
      expect(player.WorldX).toBe(528);
      expect(player.WorldY).toBe(432);
      expect(player.screenX).toBe((SCREEN_W - TILE) / 2);
      expect(player.screenY).toBe((SCREEN_H - TILE) / 2);
    });

    it("starts facing DOWN and uses the documented hitbox", () => {
      const { player } = makePlayer();
      expect(player.direction).toBe(Direction.DOWN);
      expect(player.hitboxDefaultX).toBe(8);
      expect(player.hitboxDefaultY).toBe(16);
      expect(player.collisionArea.x).toBe(8);
      expect(player.collisionArea.y).toBe(16);
      expect(player.collisionArea.width).toBe(32);
      expect(player.collisionArea.height).toBe(32);
    });
  });

  describe("update", () => {
    let player: Player;
    let input: PlayerInputHandler;

    beforeEach(() => {
      ({ player, input } = makePlayer(100, 100));
      player.speed = 4;
    });

    it("does not move while no movement key is held", () => {
      player.update();
      expect(player.WorldX).toBe(100);
      expect(player.WorldY).toBe(100);
    });

    it("up press moves the player up by speed pixels", () => {
      input.up = true;
      player.update();
      expect(player.direction).toBe(Direction.UP);
      expect(player.WorldX).toBe(100);
      expect(player.WorldY).toBe(96);
    });

    it("down press moves the player down by speed pixels", () => {
      input.down = true;
      player.update();
      expect(player.direction).toBe(Direction.DOWN);
      expect(player.WorldY).toBe(104);
    });

    it("left press moves the player left by speed pixels", () => {
      input.left = true;
      player.update();
      expect(player.direction).toBe(Direction.LEFT);
      expect(player.WorldX).toBe(96);
    });

    it("right press moves the player right by speed pixels", () => {
      input.right = true;
      player.update();
      expect(player.direction).toBe(Direction.RIGHT);
      expect(player.WorldX).toBe(104);
    });

    it("clears collisionOn at the start of every update", () => {
      player.collisionOn = true;
      input.right = true;
      player.update();
      expect(player.collisionOn).toBe(false);
      expect(player.WorldX).toBe(104);
    });
  });

  describe("getCenterTileCoordinates", () => {
    it("returns the tile holding the hitbox center", () => {
      // Hitbox center = (WorldX + 8 + 16, WorldY + 16 + 16) = (WorldX + 24, WorldY + 32)
      const { player } = makePlayer(11 * TILE, 9 * TILE);
      const center = player.getCenterTileCoordinates();
      expect(center.col).toBe(11);
      expect(center.row).toBe(9);
    });

    it("rounds down at tile boundaries", () => {
      const { player } = makePlayer(0, 0);
      // Hitbox center pixel = (24, 32), both inside tile (0, 0).
      expect(player.getCenterTileCoordinates()).toEqual({ col: 0, row: 0 });
    });
  });
});
