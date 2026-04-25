import { describe, expect, it } from "vitest";
import { Bonus } from "../../src/objects/Bonus.ts";
import { Exit } from "../../src/objects/Exit.ts";
import { InvisibleBarrier } from "../../src/objects/InvisibleBarrier.ts";
import { Key } from "../../src/objects/Key.ts";
import { Lever } from "../../src/objects/Lever.ts";
import { Trap } from "../../src/objects/Trap.ts";
import { Tree } from "../../src/objects/Tree.ts";

const fakeImage = (tag: string): HTMLImageElement =>
  ({ tag } as unknown as HTMLImageElement);

describe("Key", () => {
  it("has name 'key', no collision, image set, and shrunken hitbox", () => {
    const img = fakeImage("key");
    const k = new Key(img);
    expect(k.name).toBe("key");
    expect(k.collision).toBe(false);
    expect(k.image).toBe(img);
    expect(k.defaultCollisionAreaX).toBe(6);
    expect(k.defaultCollisionAreaY).toBe(6);
    expect(k.collisionArea.width).toBe(36);
    expect(k.collisionArea.height).toBe(36);
  });
});

describe("Lever", () => {
  it("starts inactive with the inactive sprite", () => {
    const off = fakeImage("lever-off");
    const on = fakeImage("lever-on");
    const lever = new Lever(off, on);
    expect(lever.name).toBe("lever");
    expect(lever.collision).toBe(false);
    expect(lever.image).toBe(off);
    expect(lever.isActive()).toBe(false);
  });

  it("activate() swaps to the active sprite", () => {
    const off = fakeImage("lever-off");
    const on = fakeImage("lever-on");
    const lever = new Lever(off, on);
    lever.activate();
    expect(lever.image).toBe(on);
    expect(lever.isActive()).toBe(true);
  });

  it("applies the documented collisionArea tweaks", () => {
    const lever = new Lever(fakeImage("a"), fakeImage("b"));
    expect(lever.defaultCollisionAreaX).toBe(6);
    expect(lever.defaultCollisionAreaY).toBe(-12);
    expect(lever.collisionArea.width).toBe(36);
    expect(lever.collisionArea.height).toBe(42);
  });
});

describe("Trap", () => {
  it("has name 'trap', no movement collision, image set", () => {
    const img = fakeImage("trap");
    const t = new Trap(img);
    expect(t.name).toBe("trap");
    expect(t.collision).toBe(false);
    expect(t.image).toBe(img);
  });
});

describe("Exit", () => {
  it("starts closed and collidable", () => {
    const closed = fakeImage("door-closed");
    const open = fakeImage("door-open");
    const exit = new Exit(closed, open);
    expect(exit.name).toBe("exit");
    expect(exit.image).toBe(closed);
    expect(exit.collision).toBe(true);
    expect(exit.isOpen()).toBe(false);
  });

  it("open() swaps the sprite and clears collision", () => {
    const closed = fakeImage("door-closed");
    const open = fakeImage("door-open");
    const exit = new Exit(closed, open);
    exit.open();
    expect(exit.image).toBe(open);
    expect(exit.collision).toBe(false);
    expect(exit.isOpen()).toBe(true);
  });
});

describe("Bonus", () => {
  it("clamps startTime into [0,30) and survivalTime into [30,60)", () => {
    const img = fakeImage("bonus");
    const b = new Bonus(img, 35, 25);
    // 35 % 30 = 5; 30 + (25 % 30) = 55
    expect(b.isAlive(4)).toBe(false);
    expect(b.isAlive(5)).toBe(true);
    expect(b.isAlive(59)).toBe(true);
    expect(b.isAlive(60)).toBe(false);
  });

  it("updateState caches the alive flag for the given tick", () => {
    const b = new Bonus(fakeImage("b"), 0, 30);
    b.updateState(0);
    expect(b.getAlive()).toBe(true);
    b.updateState(60);
    expect(b.getAlive()).toBe(false);
  });
});

describe("Tree", () => {
  it("has name 'tree', no collision, accepts a single image", () => {
    const img = fakeImage("tree");
    const t = new Tree(img);
    expect(t.name).toBe("tree");
    expect(t.collision).toBe(false);
    expect(t.image).toBe(img);
  });
});

describe("InvisibleBarrier", () => {
  it("has name 'invisible', collision on, no image", () => {
    const b = new InvisibleBarrier();
    expect(b.name).toBe("invisible");
    expect(b.collision).toBe(true);
    expect(b.image).toBeNull();
  });
});
