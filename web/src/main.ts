import { MapGenerator, type MapBuilder } from "./app/MapGenerator.ts";
import { Player } from "./entity/Player.ts";
import { PlayerInputHandler } from "./input/PlayerInputHandler.ts";
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
const PLAYER_SPEED = 5;
const TICK_HZ = 60;
const TICK_MS = 1000 / TICK_HZ;
/** Cap the per-rAF dt so a backgrounded tab doesn't accumulate thousands of catch-up ticks. */
const MAX_DT_MS = TICK_MS * 5;

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");
if (!ctx) {
  throw new Error("2D canvas context unavailable");
}
ctx.imageSmoothingEnabled = false;

const tileM = new TileManager(WORLD_COL, WORLD_ROW);
const objectM = new ObjectManager(TILE_SIZE);
const input = new PlayerInputHandler();
input.attach();

interface TileSpawn { col: number; row: number; }
const spawnState: { player: TileSpawn | null; goblins: TileSpawn[] } = {
  player: null,
  goblins: [],
};

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

const playerStart = spawnState.player ?? { col: 0, row: 0 };
const player = new Player(
  playerStart.col * TILE_SIZE,
  playerStart.row * TILE_SIZE,
  input,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  TILE_SIZE,
);
player.speed = PLAYER_SPEED;
await player.loadSprites();

const camera = new Camera(
  player.WorldX,
  player.WorldY,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  TILE_SIZE,
);

let lastTime = performance.now();
let accumulator = 0;

const drawGoblinMarkers = (): void => {
  ctx.fillStyle = "#ef4444";
  for (const g of spawnState.goblins) {
    const x = camera.toScreenX(g.col * TILE_SIZE);
    const y = camera.toScreenY(g.row * TILE_SIZE);
    ctx.fillRect(x + 8, y + 8, TILE_SIZE - 16, TILE_SIZE - 16);
  }
};

const tick = (now: number): void => {
  const dt = Math.min(now - lastTime, MAX_DT_MS);
  lastTime = now;
  accumulator += dt;

  while (accumulator >= TICK_MS) {
    player.update();
    camera.targetWorldX = player.WorldX;
    camera.targetWorldY = player.WorldY;
    accumulator -= TICK_MS;
  }

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  drawTileMap(ctx, tileM, camera);
  drawObjects(ctx, objectM, camera);
  player.draw(ctx);
  drawGoblinMarkers();

  requestAnimationFrame(tick);
};

requestAnimationFrame(tick);
