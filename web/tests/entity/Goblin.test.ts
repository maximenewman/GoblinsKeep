import { beforeEach, describe, expect, it } from "vitest";
import { Direction } from "../../src/app/Direction.ts";
import { Goblin } from "../../src/entity/Goblin.ts";
import { Player } from "../../src/entity/Player.ts";
import { PlayerInputHandler } from "../../src/input/PlayerInputHandler.ts";

const TILE = 48;
const SCREEN_W = 768;
const SCREEN_H = 432;

class TestGoblin extends Goblin {
  actionCalls = 0;
  getAction(): void {
    this.actionCalls++;
  }
}

const makePlayer = (worldX = 0, worldY = 0): Player => {
  const input = new PlayerInputHandler();
  return new Player(worldX, worldY, input, SCREEN_W, SCREEN_H, TILE);
};

const makeGoblin = (worldX = 0, worldY = 0, player = makePlayer()): TestGoblin =>
  new TestGoblin(player, worldX, worldY, TILE);

describe("Goblin", () => {
  describe("constructor defaults", () => {
    it("places the world position from constructor and sets the documented hitbox", () => {
      const g = makeGoblin(100, 200);
      expect(g.WorldX).toBe(100);
      expect(g.WorldY).toBe(200);
      expect(g.speed).toBe(2);
      expect(g.direction).toBe(Direction.DOWN);
      expect(g.hitboxDefaultX).toBe(11);
      expect(g.hitboxDefaultY).toBe(17);
      expect(g.collisionArea.width).toBe(23);
      expect(g.collisionArea.height).toBe(23);
    });

    it("starts with onPath and inSight off and LOSradius 130", () => {
      const g = makeGoblin();
      expect(g.onPath).toBe(false);
      expect(g.inSight).toBe(false);
      expect(g.LOSradius).toBe(130);
    });
  });

  describe("checkLOS", () => {
    it("flags inSight when the player's center is inside the LOS circle", () => {
      const player = makePlayer(0, 0);
      const g = makeGoblin(50, 0, player);
      g.checkLOS();
      expect(g.inSight).toBe(true);
    });

    it("does not flag inSight when the player is outside the LOS circle", () => {
      const player = makePlayer(0, 0);
      // Goblin 200 px to the right — well outside the 120-radius circle.
      const g = makeGoblin(200, 0, player);
      g.checkLOS();
      expect(g.inSight).toBe(false);
    });
  });

  describe("update / onPath latch", () => {
    let player: Player;
    let g: TestGoblin;

    beforeEach(() => {
      player = makePlayer(0, 0);
      g = makeGoblin(0, 0, player);
    });

    it("engages chase when the player enters LOS", () => {
      g.update();
      expect(g.onPath).toBe(true);
    });

    it("stays in chase even after losing LOS, while still close enough", () => {
      g.update();
      expect(g.onPath).toBe(true);
      // Player teleports just outside LOS but only ~5 tiles away.
      player.WorldX = 5 * TILE;
      g.update();
      expect(g.inSight).toBe(false);
      expect(g.onPath).toBe(true);
    });

    it("disengages only when LOS is lost AND tile distance exceeds threshold", () => {
      g.update();
      // Player teleports 20 tiles away — outside LOS and outside disengage range.
      player.WorldX = 20 * TILE;
      g.update();
      expect(g.onPath).toBe(false);
    });

    it("calls getAction on every update", () => {
      g.update();
      g.update();
      g.update();
      expect(g.actionCalls).toBe(3);
    });
  });

  describe("getEffectiveDirection", () => {
    class ProbeGoblin extends Goblin {
      getAction(): void {}
      probe(): Direction {
        return this["getEffectiveDirection"]();
      }
    }

    it("returns drawDirection rather than the movement direction", () => {
      const g = new ProbeGoblin(makePlayer(), 0, 0, TILE);
      g.direction = Direction.LEFT;
      g.drawDirection = Direction.RIGHT;
      expect(g.probe()).toBe(Direction.RIGHT);
    });
  });
});
