import { MapGenerator, type MapBuilder } from "./app/MapGenerator.ts";
import { Camera } from "./render/Camera.ts";
import { drawTileMap } from "./render/drawTileMap.ts";
import { TileManager } from "./tile/TileManager.ts";

const WORLD_COL = 60;
const WORLD_ROW = 66;
const TILE_SIZE = 48;
const SCREEN_WIDTH = 768;
const SCREEN_HEIGHT = 576;

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("2D canvas context unavailable");
}
ctx.imageSmoothingEnabled = false;

const tileM = new TileManager(WORLD_COL, WORLD_ROW);
const spawnState: { player: { col: number; row: number } | null } = { player: null };

// MapBuilder routes spawns. Object spawns are dropped this turn — the next
// commit wires them through ObjectManager so they actually render.
const builder: MapBuilder = {
  onPlayerSpawn(col, row) {
    spawnState.player = { col, row };
  },
  onGoblinSpawn() {},
  onObjectSpawn() {},
};

await tileM.loadTiles();

const mapText = await fetch("/maps/world1.txt").then((r) => r.text());
const mapGen = new MapGenerator(tileM, builder);
mapGen.loadMap(mapText);

const camera = new Camera(
  (spawnState.player?.col ?? 0) * TILE_SIZE,
  (spawnState.player?.row ?? 0) * TILE_SIZE,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  TILE_SIZE,
);

ctx.fillStyle = "black";
ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
drawTileMap(ctx, tileM, camera);
