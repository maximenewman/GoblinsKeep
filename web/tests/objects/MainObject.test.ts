import { describe, expect, it } from "vitest";
import { MainObject } from "../../src/objects/MainObject.ts";

class TestObject extends MainObject {
  constructor(name: string) {
    super(name);
  }
}

describe("MainObject", () => {
  it("stores the name passed to the constructor", () => {
    const o = new TestObject("key");
    expect(o.name).toBe("key");
  });

  it("defaults image to null and collision to false", () => {
    const o = new TestObject("trap");
    expect(o.image).toBeNull();
    expect(o.collision).toBe(false);
  });

  it("defaults world position to (0, 0)", () => {
    const o = new TestObject("exit");
    expect(o.worldX).toBe(0);
    expect(o.worldY).toBe(0);
  });

  it("defaults collisionArea to a 48x48 rectangle at the origin", () => {
    const o = new TestObject("lever");
    expect(o.collisionArea.x).toBe(0);
    expect(o.collisionArea.y).toBe(0);
    expect(o.collisionArea.width).toBe(48);
    expect(o.collisionArea.height).toBe(48);
  });

  it("each instance has its own collisionArea (no shared reference)", () => {
    const a = new TestObject("a");
    const b = new TestObject("b");
    a.collisionArea.x = 99;
    expect(b.collisionArea.x).toBe(0);
  });
});
