import { describe, expect, it } from "vitest";
import {
  MapGenerator,
  type MapBuilder,
  type ObjectSpawn,
} from "../../src/app/MapGenerator.ts";
import { TileManager } from "../../src/tile/TileManager.ts";

interface SpawnRecord {
  type: "player" | "goblin" | "object";
  col: number;
  row: number;
  spawn?: ObjectSpawn;
}

class RecordingBuilder implements MapBuilder {
  readonly events: SpawnRecord[] = [];
  onPlayerSpawn(col: number, row: number): void {
    this.events.push({ type: "player", col, row });
  }
  onGoblinSpawn(col: number, row: number): void {
    this.events.push({ type: "goblin", col, row });
  }
  onObjectSpawn(col: number, row: number, spawn: ObjectSpawn): void {
    this.events.push({ type: "object", col, row, spawn });
  }
}

const fixedRandom = (values: number[]): ((max: number) => number) => {
  let i = 0;
  return () => values[i++ % values.length]!;
};

describe("MapGenerator", () => {
  it("writes raw cell values into rawMapData and parses tile ids", () => {
    const tm = new TileManager(5, 1);
    const mg = new MapGenerator(tm, new RecordingBuilder());
    mg.loadMap("00 01 08 09 14");
    expect(mg.rawMapData[0]?.[0]).toBe(0);
    expect(mg.rawMapData[1]?.[0]).toBe(1);
    expect(mg.rawMapData[4]?.[0]).toBe(14);
    expect(tm.mapTileNum[0]?.[0]).toBe(0);
    expect(tm.mapTileNum[1]?.[0]).toBe(1);
    expect(tm.mapTileNum[4]?.[0]).toBe(14);
  });

  it("fires onPlayerSpawn for code 6 and clears the underlying tile to 0", () => {
    const tm = new TileManager(3, 1);
    const builder = new RecordingBuilder();
    const mg = new MapGenerator(tm, builder);
    mg.loadMap("00 06 00");
    expect(builder.events).toEqual([{ type: "player", col: 1, row: 0 }]);
    expect(tm.mapTileNum[1]?.[0]).toBe(0);
  });

  it("fires onGoblinSpawn for code 11 and clears the underlying tile to 0", () => {
    const tm = new TileManager(3, 1);
    const builder = new RecordingBuilder();
    const mg = new MapGenerator(tm, builder);
    mg.loadMap("00 11 00");
    expect(builder.events).toEqual([{ type: "goblin", col: 1, row: 0 }]);
    expect(tm.mapTileNum[1]?.[0]).toBe(0);
  });

  it("dispatches every object code with the right kind and tileNum", () => {
    const tm = new TileManager(8, 1);
    const builder = new RecordingBuilder();
    const mg = new MapGenerator(tm, builder, fixedRandom([7, 12]));
    mg.loadMap("02 03 04 05 07 12 13 22");

    const objectEvents = builder.events.filter((e) => e.type === "object");
    expect(objectEvents.map((e) => e.spawn)).toEqual([
      { kind: "KEY" },
      { kind: "BONUS", start: 7, survival: 12 },
      { kind: "TRAP" },
      { kind: "LEVER" },
      { kind: "EXIT" },
      { kind: "TREE", variant: 1 },
      { kind: "TREE", variant: 0 },
      { kind: "KEY" },
    ]);

    expect(tm.mapTileNum[0]?.[0]).toBe(0);
    expect(tm.mapTileNum[1]?.[0]).toBe(0);
    expect(tm.mapTileNum[2]?.[0]).toBe(0);
    expect(tm.mapTileNum[3]?.[0]).toBe(0);
    expect(tm.mapTileNum[4]?.[0]).toBe(0);
    expect(tm.mapTileNum[5]?.[0]).toBe(8);
    expect(tm.mapTileNum[6]?.[0]).toBe(8);
    expect(tm.mapTileNum[7]?.[0]).toBe(8);
  });

  it("invisible barriers map to tileNum 8 (case 15) or 9 (case 16)", () => {
    const tm = new TileManager(2, 1);
    const builder = new RecordingBuilder();
    const mg = new MapGenerator(tm, builder);
    mg.loadMap("15 16");
    expect(builder.events).toHaveLength(2);
    expect(tm.mapTileNum[0]?.[0]).toBe(8);
    expect(tm.mapTileNum[1]?.[0]).toBe(9);
  });

  it("parses multi-row maps correctly", () => {
    const tm = new TileManager(3, 2);
    const builder = new RecordingBuilder();
    const mg = new MapGenerator(tm, builder);
    mg.loadMap("00 06 00\n11 00 00");
    expect(builder.events).toEqual([
      { type: "player", col: 1, row: 0 },
      { type: "goblin", col: 0, row: 1 },
    ]);
  });

  it("tolerates short input without throwing", () => {
    const tm = new TileManager(10, 10);
    const mg = new MapGenerator(tm, new RecordingBuilder());
    expect(() => mg.loadMap("00 00")).not.toThrow();
    expect(() => mg.loadMap("")).not.toThrow();
  });

  it("default case writes the raw value through to mapTileNum", () => {
    const tm = new TileManager(1, 1);
    const mg = new MapGenerator(tm, new RecordingBuilder());
    mg.loadMap("17");
    expect(tm.mapTileNum[0]?.[0]).toBe(17);
  });
});
