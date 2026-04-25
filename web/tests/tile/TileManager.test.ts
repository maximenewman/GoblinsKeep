import { describe, expect, it } from "vitest";
import { Tile } from "../../src/tile/Tile.ts";
import { TileManager } from "../../src/tile/TileManager.ts";

describe("TileManager", () => {
  it("allocates a maxCol x maxRow mapTileNum grid filled with zeros", () => {
    const tm = new TileManager(60, 66);
    expect(tm.mapTileNum.length).toBe(60);
    expect(tm.mapTileNum[0]?.length).toBe(66);
    expect(tm.mapTileNum[10]?.[20]).toBe(0);
  });

  it("starts with no tile sprites loaded", () => {
    const tm = new TileManager(5, 5);
    expect(tm.tiles[0]).toBeUndefined();
    expect(tm.tiles[1]).toBeUndefined();
  });

  it("checkCollisionOfTile reflects per-tile collision flags", () => {
    const tm = new TileManager(5, 5);
    const floor = new Tile();
    const wall = new Tile();
    wall.collision = true;
    tm.tiles[0] = floor;
    tm.tiles[1] = wall;

    expect(tm.checkCollisionOfTile(0)).toBe(false);
    expect(tm.checkCollisionOfTile(1)).toBe(true);
  });

  it("throws when checking an unloaded tile id (matches Java NPE behavior)", () => {
    const tm = new TileManager(5, 5);
    expect(() => tm.checkCollisionOfTile(7)).toThrow();
  });
});
