import { TileManager } from "../tile/TileManager.ts";

/**
 * Discriminated union covering every interactable object the map file can spawn.
 * Mirrors the case constants in MapGenerator.java's switch — Bonus carries the
 * randomized start/survival values; Tree carries its variant flag.
 */
export type ObjectSpawn =
  | { kind: "KEY" }
  | { kind: "BONUS"; start: number; survival: number }
  | { kind: "TRAP" }
  | { kind: "LEVER" }
  | { kind: "EXIT" }
  | { kind: "TREE"; variant: 0 | 1 }
  | { kind: "INVISIBLE_BARRIER" };

/**
 * Callback surface MapGenerator drives during parsing. The parser stays free
 * of Player/Goblin/Object types so it can be unit-tested without them; once
 * those are ported, Game will implement this interface and instantiate the
 * real entities/objects.
 */
export interface MapBuilder {
  onPlayerSpawn(col: number, row: number): void;
  onGoblinSpawn(col: number, row: number): void;
  onObjectSpawn(col: number, row: number, spawn: ObjectSpawn): void;
}

/**
 * Default randomInt — Math.random in [0, max).
 */
const defaultRandomInt = (max: number): number => Math.floor(Math.random() * max);

/**
 * Parses a Goblin's Keep map text and dispatches tile assignments to the
 * provided {@link TileManager} and entity/object spawns to the provided
 * {@link MapBuilder}. Map files are space-separated integer grids — the
 * numeric codes match MapGenerator.java's case statements exactly.
 */
export class MapGenerator {
  readonly rawMapData: number[][];
  private readonly tileM: TileManager;
  private readonly builder: MapBuilder;
  private readonly maxCol: number;
  private readonly maxRow: number;
  private readonly randomInt: (max: number) => number;

  constructor(
    tileM: TileManager,
    builder: MapBuilder,
    randomInt: (max: number) => number = defaultRandomInt,
  ) {
    this.tileM = tileM;
    this.builder = builder;
    this.maxCol = tileM.mapTileNum.length;
    this.maxRow = tileM.mapTileNum[0]?.length ?? 0;
    this.randomInt = randomInt;
    this.rawMapData = Array.from(
      { length: this.maxCol },
      () => new Array<number>(this.maxRow).fill(0),
    );
  }

  /**
   * Reads the map text line-by-line and dispatches each cell. Lines or cells
   * that run short are tolerated silently — matches the Java original's
   * try/catch-and-print behavior.
   */
  loadMap(mapText: string): void {
    const lines = mapText.split(/\r?\n/);
    for (let row = 0; row < this.maxRow; row++) {
      const line = lines[row];
      if (line === undefined) break;
      const cells = line.trim().split(/\s+/);
      for (let col = 0; col < this.maxCol; col++) {
        const cellStr = cells[col];
        if (cellStr === undefined || cellStr === "") break;
        const num = Number.parseInt(cellStr, 10);
        if (Number.isNaN(num)) continue;
        this.handleCell(col, row, num);
        this.rawMapData[col]![row] = num;
      }
    }
  }

  private handleCell(col: number, row: number, num: number): void {
    switch (num) {
      case 2:
        this.builder.onObjectSpawn(col, row, { kind: "KEY" });
        this.tileM.mapTileNum[col]![row] = 0;
        break;
      case 3: {
        const start = this.randomInt(30);
        const survival = this.randomInt(30);
        this.builder.onObjectSpawn(col, row, { kind: "BONUS", start, survival });
        this.tileM.mapTileNum[col]![row] = 0;
        break;
      }
      case 4:
        this.builder.onObjectSpawn(col, row, { kind: "TRAP" });
        this.tileM.mapTileNum[col]![row] = 0;
        break;
      case 5:
        this.builder.onObjectSpawn(col, row, { kind: "LEVER" });
        this.tileM.mapTileNum[col]![row] = 0;
        break;
      case 6:
        this.builder.onPlayerSpawn(col, row);
        this.tileM.mapTileNum[col]![row] = 0;
        break;
      case 7:
        this.builder.onObjectSpawn(col, row, { kind: "EXIT" });
        this.tileM.mapTileNum[col]![row] = 0;
        break;
      case 11:
        this.builder.onGoblinSpawn(col, row);
        this.tileM.mapTileNum[col]![row] = 0;
        break;
      case 12:
        this.builder.onObjectSpawn(col, row, { kind: "TREE", variant: 1 });
        this.tileM.mapTileNum[col]![row] = 8;
        break;
      case 13:
        this.builder.onObjectSpawn(col, row, { kind: "TREE", variant: 0 });
        this.tileM.mapTileNum[col]![row] = 8;
        break;
      case 15:
        this.builder.onObjectSpawn(col, row, { kind: "INVISIBLE_BARRIER" });
        this.tileM.mapTileNum[col]![row] = 8;
        break;
      case 16:
        this.builder.onObjectSpawn(col, row, { kind: "INVISIBLE_BARRIER" });
        this.tileM.mapTileNum[col]![row] = 9;
        break;
      case 22:
        this.builder.onObjectSpawn(col, row, { kind: "KEY" });
        this.tileM.mapTileNum[col]![row] = 8;
        break;
      default:
        this.tileM.mapTileNum[col]![row] = num;
        break;
    }
  }
}
