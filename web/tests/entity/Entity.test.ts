import { describe, expect, it } from "vitest";
import { Direction } from "../../src/app/Direction.ts";
import { Entity } from "../../src/entity/Entity.ts";

class TestEntity extends Entity {
  // Expose protected hooks for testing.
  publicCanMove(): boolean {
    return this.canMove();
  }
  publicUpdateAnimation(): void {
    this.updateAnimation();
  }
  publicGetSprite(): HTMLImageElement | null {
    return this.getSpriteForDirection();
  }
  setSprites(slot: keyof Pick<
    Entity,
    "up1" | "up2" | "down1" | "down2" | "left1" | "left2" | "right1" | "right2"
  >, value: HTMLImageElement | null): void {
    this[slot] = value;
  }
}

describe("Entity", () => {
  it("stores constructor coordinates and exposes them via getters", () => {
    const e = new TestEntity(50, 75);
    expect(e.getX()).toBe(50);
    expect(e.getY()).toBe(75);
  });

  it("defaults speed to 1 and direction to DOWN", () => {
    const e = new TestEntity(0, 0);
    expect(e.getSpeed()).toBe(1);
    expect(e.direction).toBe(Direction.DOWN);
  });

  describe("canMove", () => {
    it("returns true when no collision is flagged", () => {
      const e = new TestEntity(0, 0);
      expect(e.publicCanMove()).toBe(true);
    });
    it("returns false while collisionOn is set", () => {
      const e = new TestEntity(0, 0);
      e.collisionOn = true;
      expect(e.publicCanMove()).toBe(false);
    });
  });

  describe("moveEntityTowardDirection", () => {
    it("moves -speed in y when direction is UP", () => {
      const e = new TestEntity(100, 100);
      e.speed = 2;
      e.direction = Direction.UP;
      e.moveEntityTowardDirection();
      expect(e.WorldX).toBe(100);
      expect(e.WorldY).toBe(98);
    });

    it("moves +speed in y when direction is DOWN", () => {
      const e = new TestEntity(100, 100);
      e.speed = 3;
      e.direction = Direction.DOWN;
      e.moveEntityTowardDirection();
      expect(e.WorldY).toBe(103);
    });

    it("moves -speed in x when direction is LEFT", () => {
      const e = new TestEntity(100, 100);
      e.speed = 4;
      e.direction = Direction.LEFT;
      e.moveEntityTowardDirection();
      expect(e.WorldX).toBe(96);
    });

    it("moves +speed in x when direction is RIGHT", () => {
      const e = new TestEntity(100, 100);
      e.speed = 5;
      e.direction = Direction.RIGHT;
      e.moveEntityTowardDirection();
      expect(e.WorldX).toBe(105);
    });

    it("does not move when collisionOn is set", () => {
      const e = new TestEntity(100, 100);
      e.direction = Direction.RIGHT;
      e.collisionOn = true;
      e.moveEntityTowardDirection();
      expect(e.WorldX).toBe(100);
    });
  });

  describe("updateAnimation", () => {
    it("flips SpriteNum after 11 ticks", () => {
      const e = new TestEntity(0, 0);
      expect(e.SpriteNum).toBe(1);
      for (let i = 0; i < 10; i++) e.publicUpdateAnimation();
      expect(e.SpriteNum).toBe(1); // not yet
      e.publicUpdateAnimation();
      expect(e.SpriteNum).toBe(2);
    });

    it("flips back to 1 after another 11 ticks", () => {
      const e = new TestEntity(0, 0);
      for (let i = 0; i < 22; i++) e.publicUpdateAnimation();
      expect(e.SpriteNum).toBe(1);
    });
  });

  describe("getSpriteForDirection", () => {
    const ghost = { tag: "ghost" } as unknown as HTMLImageElement;
    const ghost2 = { tag: "ghost2" } as unknown as HTMLImageElement;

    it("returns null when no sprites are loaded", () => {
      const e = new TestEntity(0, 0);
      expect(e.publicGetSprite()).toBeNull();
    });

    it("returns up1 for UP+SpriteNum 1, up2 for UP+SpriteNum 2", () => {
      const e = new TestEntity(0, 0);
      e.setSprites("up1", ghost);
      e.setSprites("up2", ghost2);
      e.direction = Direction.UP;
      expect(e.publicGetSprite()).toBe(ghost);
      e.SpriteNum = 2;
      expect(e.publicGetSprite()).toBe(ghost2);
    });

    it("returns the right slot per direction", () => {
      const e = new TestEntity(0, 0);
      e.setSprites("right1", ghost);
      e.direction = Direction.RIGHT;
      expect(e.publicGetSprite()).toBe(ghost);
    });
  });
});
