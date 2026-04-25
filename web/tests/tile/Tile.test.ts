import { describe, expect, it } from "vitest";
import { Tile } from "../../src/tile/Tile.ts";

describe("Tile", () => {
  it("defaults to no image and no collision", () => {
    const tile = new Tile();
    expect(tile.image).toBeNull();
    expect(tile.collision).toBe(false);
  });

  it("allows image and collision to be set", () => {
    const tile = new Tile();
    tile.collision = true;
    expect(tile.collision).toBe(true);
  });
});
