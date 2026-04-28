import { MapGenerator, type MapBuilder } from "./app/MapGenerator.ts";
import { MapHandler } from "./app/MapHandler.ts";
import { Sound } from "./audio/Sound.ts";
import { CollisionChecker } from "./entity/CollisionChecker.ts";
import { Player } from "./entity/Player.ts";
import { RegularGoblin } from "./entity/RegularGoblin.ts";
import { PlayerInputHandler } from "./input/PlayerInputHandler.ts";
import { ObjectManager } from "./objects/ObjectManager.ts";
import { PathFinder, type Grid } from "./pathfinder/PathFinder.ts";
import { Camera } from "./render/Camera.ts";
import { drawObjects } from "./render/drawObjects.ts";
import { drawTileMap } from "./render/drawTileMap.ts";
import { drawEndScreen, drawHUD, drawPauseScreen } from "./render/drawOverlay.ts";
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

const sound = new Sound();

await Promise.all([
  tileM.loadTiles(),
  objectM.loadSprites(),
  sound.loadAll(),
  document.fonts.ready,
]);

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

let mapHandler = new MapHandler(objectM);
mapHandler.seedBonusStates();
const collisionChecker = new CollisionChecker(tileM, objectM, TILE_SIZE);
const wireCollisionCallbacks = (): void => {
  collisionChecker.onPlayerObjectCollision = (obj) => mapHandler.handleObject(obj);
  collisionChecker.onPlayerEnemyCollision = () => mapHandler.playerCollisionWithEnemy();
};
wireCollisionCallbacks();

// Pathfinder reads from the world tile grid via a thin Grid adapter so it
// doesn't depend on TileManager directly. Unloaded tiles are treated as solid
// so a malformed map can't make the search NPE.
const grid: Grid = {
  maxCol: tileM.mapTileNum.length,
  maxRow: tileM.mapTileNum[0]?.length ?? 0,
  isSolid: (col, row) => {
    const tileNum = tileM.mapTileNum[col]?.[row];
    if (tileNum === undefined) return true;
    const tile = tileM.tiles[tileNum];
    if (!tile) return true;
    return tile.collision;
  },
};
const pathFinder = new PathFinder(grid);

const spawnGoblins = (): RegularGoblin[] =>
  spawnState.goblins.map(({ col, row }) =>
    new RegularGoblin(
      player,
      col * TILE_SIZE,
      row * TILE_SIZE,
      TILE_SIZE,
      pathFinder,
      collisionChecker,
      () => mapHandler.playerCollisionWithEnemy(),
    ),
  );

let goblins: RegularGoblin[] = spawnGoblins();
await Promise.all(goblins.map((g) => g.loadSprites()));

// Kick off the menu loop. AudioContext starts suspended on most browsers, so
// the first user gesture (any keydown / pointerdown) calls sound.unlock() to
// resume it — the queued source becomes audible at that point.
sound.setFile(Sound.MAIN_MENU);
sound.loop();

const unlockAudio = (): void => {
  void sound.unlock();
  window.removeEventListener("keydown", unlockAudio);
  window.removeEventListener("pointerdown", unlockAudio);
};
window.addEventListener("keydown", unlockAudio);
window.addEventListener("pointerdown", unlockAudio);

let paused = false;
/** Latches once the end screen pauses music, so we don't restart pause every frame. */
let endMusicHandled = false;
/** Guards against R being held / pressed twice while the async restart is mid-flight. */
let restarting = false;

const restart = async (): Promise<void> => {
  if (restarting) return;
  restarting = true;

  objectM.clear();
  spawnState.player = null;
  spawnState.goblins = [];
  mapGen.loadMap(mapText);

  const start = spawnState.player ?? { col: 0, row: 0 };
  player.WorldX = start.col * TILE_SIZE;
  player.WorldY = start.row * TILE_SIZE;
  camera.targetWorldX = player.WorldX;
  camera.targetWorldY = player.WorldY;

  mapHandler = new MapHandler(objectM);
  mapHandler.seedBonusStates();
  wireCollisionCallbacks();

  goblins = spawnGoblins();
  await Promise.all(goblins.map((g) => g.loadSprites()));

  paused = false;
  endMusicHandled = false;
  sound.setFile(Sound.MAIN_MENU);
  sound.loop();

  restarting = false;
};

window.addEventListener("keydown", (event) => {
  if (event.code === "KeyM") {
    sound.toggle();
    return;
  }
  if (event.code === "KeyR" && mapHandler.gameEnded()) {
    void restart();
    return;
  }
  if (event.code === "KeyP" || event.code === "Escape") {
    if (mapHandler.gameEnded()) return;
    paused = !paused;
    if (paused) sound.pause();
    else sound.resume();
  }
});

let lastTime = performance.now();
let accumulator = 0;

const tick = (now: number): void => {
  const dt = Math.min(now - lastTime, MAX_DT_MS);
  lastTime = now;
  accumulator += dt;

  while (accumulator >= TICK_MS) {
    if (!paused && !mapHandler.gameEnded()) {
      player.update(collisionChecker);
      mapHandler.updateTimer();
      for (const goblin of goblins) {
        goblin.update();
      }
    }
    camera.targetWorldX = player.WorldX;
    camera.targetWorldY = player.WorldY;
    accumulator -= TICK_MS;
  }

  if (mapHandler.gameEnded() && !endMusicHandled) {
    sound.pause();
    endMusicHandled = true;
  }

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  drawTileMap(ctx, tileM, camera);
  drawObjects(ctx, objectM, camera);
  player.draw(ctx);
  for (const goblin of goblins) {
    goblin.draw(ctx, camera);
  }
  drawHUD(ctx, {
    keysCollected: mapHandler.getKeysCollected(),
    score: mapHandler.getScore(),
  });
  if (mapHandler.gameEnded()) {
    drawEndScreen(ctx, mapHandler.isGameWin(), SCREEN_WIDTH, SCREEN_HEIGHT);
  } else if (paused) {
    drawPauseScreen(ctx, SCREEN_WIDTH, SCREEN_HEIGHT);
  }

  requestAnimationFrame(tick);
};

requestAnimationFrame(tick);
