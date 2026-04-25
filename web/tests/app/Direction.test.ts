import { describe, expect, it } from "vitest";
import { Direction } from "../../src/app/Direction.ts";

describe("Direction", () => {
  it("UP has dx=0, dy=1", () => {
    expect(Direction.UP).toEqual({ dx: 0, dy: 1 });
  });

  it("DOWN has dx=0, dy=-1", () => {
    expect(Direction.DOWN).toEqual({ dx: 0, dy: -1 });
  });

  it("LEFT has dx=-1, dy=0", () => {
    expect(Direction.LEFT).toEqual({ dx: -1, dy: 0 });
  });

  it("RIGHT has dx=1, dy=0", () => {
    expect(Direction.RIGHT).toEqual({ dx: 1, dy: 0 });
  });

  it("each direction is a distinct singleton", () => {
    const all = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
    expect(new Set(all).size).toBe(4);
  });
});
