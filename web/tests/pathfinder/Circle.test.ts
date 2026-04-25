import { describe, expect, it } from "vitest";
import { Circle } from "../../src/pathfinder/Circle.ts";

describe("Circle", () => {
  it("stores radius and center from the constructor", () => {
    const c = new Circle(120, 50, 75);
    expect(c.radius).toBe(120);
    expect(c.centerX).toBe(50);
    expect(c.centerY).toBe(75);
  });

  it("includes the center itself", () => {
    const c = new Circle(10, 0, 0);
    expect(c.intersects(0, 0)).toBe(true);
  });

  it("includes a point on the boundary", () => {
    const c = new Circle(5, 0, 0);
    expect(c.intersects(3, 4)).toBe(true);
  });

  it("includes a point inside the radius", () => {
    const c = new Circle(120, 100, 100);
    expect(c.intersects(110, 110)).toBe(true);
  });

  it("excludes a point outside the radius", () => {
    const c = new Circle(5, 0, 0);
    expect(c.intersects(10, 10)).toBe(false);
  });

  it("excludes a point just past the boundary", () => {
    const c = new Circle(5, 0, 0);
    expect(c.intersects(4, 4)).toBe(false);
  });
});
