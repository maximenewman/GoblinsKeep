import { describe, expect, it } from "vitest";
import { CollisionArea } from "../../src/render/CollisionArea.ts";

describe("CollisionArea", () => {
  it("stores x, y, width, height from the constructor", () => {
    const a = new CollisionArea(1, 2, 10, 20);
    expect(a.x).toBe(1);
    expect(a.y).toBe(2);
    expect(a.width).toBe(10);
    expect(a.height).toBe(20);
  });

  it("intersects when boxes overlap", () => {
    const a = new CollisionArea(0, 0, 10, 10);
    const b = new CollisionArea(5, 5, 10, 10);
    expect(a.intersects(b)).toBe(true);
    expect(b.intersects(a)).toBe(true);
  });

  it("does not intersect when boxes are disjoint", () => {
    const a = new CollisionArea(0, 0, 10, 10);
    const c = new CollisionArea(20, 20, 5, 5);
    expect(a.intersects(c)).toBe(false);
  });

  it("does not intersect when boxes share only an edge (java.awt.Rectangle semantics)", () => {
    const a = new CollisionArea(0, 0, 10, 10);
    const b = new CollisionArea(10, 0, 10, 10);
    expect(a.intersects(b)).toBe(false);
  });
});
