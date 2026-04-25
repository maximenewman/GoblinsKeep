import { MapGenerator, type MapBuilder } from "./app/MapGenerator.ts";
import { ObjectManager } from "./objects/ObjectManager.ts";
import { Camera } from "./render/Camera.ts";
import { drawObjects } from "./render/drawObjects.ts";
import { drawTileMap } from "./render/drawTileMap.ts";
import { TileManager } from "./tile/TileManager.ts";

const WORLD_COL = 60;
const WORLD_ROW = 66;
const TILE_SIZE = 48;
const SCREEN_WIDTH = 768;   // 16 tiles wide
const SCREEN_HEIGHT = 432;  // 9 tiles tall — Pokemon-style zoom on the player

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("2D canvas context unavailable");
}
ctx.imageSmoothingEnabled = false;

const tileM = new TileManager(WORLD_COL, WORLD_ROW);
const objectM = new ObjectManager(TILE_SIZE);

interface TileSpawn { col: number; row: number; }
const spawnState: { player: TileSpawn | null; goblins: TileSpawn[] } = {
  player: null,
  goblins: [],
};

// Player and goblin classes don't exist yet — capture their spawns now and
// draw placeholder rectangles. Object spawns route through ObjectManager.
const builder: MapBuilder = {
  onPlayerSpawn(col, row) {
    spawnState.player = { col, row };
  },
  onGoblinSpawn(col, row) {
    spawnState.goblins.push({ col, row });
  },
  onObjectSpawn(col, row, spawn) {
    objectM.spawn(col, row, spawn);
  },
};

await Promise.all([tileM.loadTiles(), objectM.loadSprites()]);

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
drawObjects(ctx, objectM, camera);

// Placeholder markers until Player/Goblin classes are ported.
const drawSpawnMarker = (col: number, row: number, color: string): void => {
  const x = camera.toScreenX(col * TILE_SIZE);
  const y = camera.toScreenY(row * TILE_SIZE);
  ctx.fillStyle = color;
  ctx.fillRect(x + 8, y + 8, TILE_SIZE - 16, TILE_SIZE - 16);
};

if (spawnState.player) {
  drawSpawnMarker(spawnState.player.col, spawnState.player.row, "#3b82f6");
}
for (const goblin of spawnState.goblins) {
  drawSpawnMarker(goblin.col, goblin.row, "#ef4444");
}
