import { GameStatus } from "./app/GameStatus.ts";
import { MapGenerator, type MapBuilder } from "./app/MapGenerator.ts";
import { MapHandler, type MessageHandler } from "./app/MapHandler.ts";
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
import {
  drawEndScreen,
  drawHUD,
  drawInstructionsScreen,
  drawMenuScreen,
  drawMessage,
  drawPauseScreen,
} from "./render/drawOverlay.ts";
import { loadImage } from "./render/loadImage.ts";
import { TileManager } from "./tile/TileManager.ts";

const WORLD_COL = 60;
const WORLD_ROW = 66;
const TILE_SIZE = 48;
const SCREEN_WIDTH = 768;   // 16 tiles wide  — matches Java GamePanel.maxScreenCol
const SCREEN_HEIGHT = 576;  // 12 tiles tall — matches Java GamePanel.maxScreenRow (4:3)
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

const [, , , , titleImage, winImage, loseEnemyImage, loseScoreImage, keyImage] = await Promise.all([
  tileM.loadTiles(),
  objectM.loadSprites(),
  sound.loadAll(),
  document.fonts.ready,
  loadImage("/UI_img/titleScreen.png"),
  loadImage("/UI_img/win.png"),
  loadImage("/UI_img/end screen (bg).png"),
  loadImage("/UI_img/lose.png"),
  loadImage("/objects/Key.png"),
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

// Brief status text ("Lever Unlocked", "Door Locked!", etc) shown above the
// player. Java holds these on UI; here we keep them in main and wire MapHandler
// to the implementation below.
let activeMessage = "";
let messageCounter = 0;
const MESSAGE_DURATION_TICKS = 120; // 2 seconds at 60Hz, matches Java UI.drawPlaying

const messageHandler: MessageHandler = {
  showMessage(text: string): void {
    activeMessage = text;
    messageCounter = 0;
  },
};

let mapHandler = new MapHandler(objectM, messageHandler);
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

let status: GameStatus = GameStatus.MENU;
let cursor = 0;
let playTime = 0;
/** Guards against double-fire while the async restart is mid-flight. */
let restarting = false;

// Per-state menu options. QUIT is dropped from MENU and END since browser
// tabs can't self-close — BACK TO MENU covers the "leave" intent.
const MENU_OPTIONS = ["PLAY", "INSTRUCTIONS"] as const;
const PAUSE_OPTIONS = ["RESUME", "RESTART", "BACK TO MENU"] as const;
const END_OPTIONS = ["RESTART", "BACK TO MENU"] as const;
const INSTRUCTIONS_OPTIONS = ["BACK TO MENU"] as const;

const INSTRUCTIONS_LINES: readonly string[] = [
  "After getting trapped in the Goblin king's maze-like castle,",
  "you must now find your way out and escape to the woods",
  "MOVEMENT: WASD or Arrow Keys to move UP, LEFT, DOWN, RIGHT",
  "MUSIC: Press M to toggle background music on/off",
  "PAUSE: Press P or Esc to pause/resume",
  "MENUS: Up/Down to navigate, Enter or Space to select",
  "HOW TO ESCAPE:",
  "Collect the 5 key fragments to unlock the lever",
  "After the lever is unlocked find it and activate it to open the escape door",
  "Once the escape door is opened, find it to escape out the castle",
  "Collect meat to increase your score",
  "If you step into an acid puddle you will lose score",
  "If the roaming goblins capture you or your score becomes negative you will lose",
  "Credits: Hugo Najafi, Maxime Nereyabagabo, Arun Paudel, Vamsi Suggu",
  "Refactor: Maxime Nereyabagabo",
];

const optionsFor = (s: GameStatus): readonly string[] => {
  if (s === GameStatus.MENU) return MENU_OPTIONS;
  if (s === GameStatus.PAUSED) return PAUSE_OPTIONS;
  if (s === GameStatus.END) return END_OPTIONS;
  if (s === GameStatus.INSTRUCTIONS) return INSTRUCTIONS_OPTIONS;
  return [];
};

const setStatus = (next: GameStatus): void => {
  status = next;
  cursor = 0;
};

const goToMenu = (): void => {
  setStatus(GameStatus.MENU);
  sound.setFile(Sound.MAIN_MENU);
  sound.loop();
};

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

  mapHandler = new MapHandler(objectM, messageHandler);
  mapHandler.seedBonusStates();
  wireCollisionCallbacks();
  activeMessage = "";
  messageCounter = 0;

  goblins = spawnGoblins();
  await Promise.all(goblins.map((g) => g.loadSprites()));

  playTime = 0;
  setStatus(GameStatus.PLAYING);
  sound.setFile(Sound.INTRO);
  sound.loop();

  restarting = false;
};

const selectMenuOption = (option: string): void => {
  switch (option) {
    case "PLAY":
    case "RESTART":
      void restart();
      break;
    case "RESUME":
      setStatus(GameStatus.PLAYING);
      sound.resume();
      break;
    case "INSTRUCTIONS":
      setStatus(GameStatus.INSTRUCTIONS);
      break;
    case "BACK TO MENU":
      // From INSTRUCTIONS the menu loop is already the active track — flip
      // status only so the audio keeps playing without a restart.
      if (status === GameStatus.INSTRUCTIONS) {
        setStatus(GameStatus.MENU);
      } else {
        goToMenu();
      }
      break;
  }
};

window.addEventListener("keydown", (event) => {
  if (event.code === "KeyM") {
    sound.toggle();
    return;
  }
  if (event.code === "KeyP" || event.code === "Escape") {
    if (status === GameStatus.PLAYING) {
      setStatus(GameStatus.PAUSED);
      sound.pause();
    } else if (status === GameStatus.PAUSED) {
      setStatus(GameStatus.PLAYING);
      sound.resume();
    }
    return;
  }

  const options = optionsFor(status);
  if (options.length === 0) return;

  if (event.code === "ArrowUp" || event.code === "KeyW") {
    cursor = (cursor - 1 + options.length) % options.length;
  } else if (event.code === "ArrowDown" || event.code === "KeyS") {
    cursor = (cursor + 1) % options.length;
  } else if (event.code === "Enter" || event.code === "Space") {
    selectMenuOption(options[cursor]);
  }
});

let lastTime = performance.now();
let accumulator = 0;

const tick = (now: number): void => {
  const dt = Math.min(now - lastTime, MAX_DT_MS);
  lastTime = now;
  accumulator += dt;

  while (accumulator >= TICK_MS) {
    if (status === GameStatus.PLAYING) {
      player.update(collisionChecker);
      mapHandler.updateTimer();
      for (const goblin of goblins) {
        goblin.update();
      }
      playTime += 1 / TICK_HZ;
      if (activeMessage !== "") {
        messageCounter++;
        if (messageCounter > MESSAGE_DURATION_TICKS) {
          activeMessage = "";
          messageCounter = 0;
        }
      }
      if (mapHandler.gameEnded()) {
        setStatus(GameStatus.END);
        sound.pause();
      }
    }
    camera.targetWorldX = player.WorldX;
    camera.targetWorldY = player.WorldY;
    accumulator -= TICK_MS;
  }

  if (status === GameStatus.MENU) {
    drawMenuScreen(ctx, titleImage, MENU_OPTIONS, cursor, SCREEN_WIDTH, SCREEN_HEIGHT);
  } else if (status === GameStatus.INSTRUCTIONS) {
    drawInstructionsScreen(
      ctx,
      titleImage,
      INSTRUCTIONS_LINES,
      INSTRUCTIONS_OPTIONS,
      cursor,
      SCREEN_WIDTH,
      SCREEN_HEIGHT,
    );
  } else if (status === GameStatus.END) {
    const win = mapHandler.isGameWin();
    const endImage = win
      ? winImage
      : (mapHandler.getEndReason() === "SCORE" ? loseScoreImage : loseEnemyImage);
    drawEndScreen(ctx, endImage, win, END_OPTIONS, cursor, SCREEN_WIDTH, SCREEN_HEIGHT);
  } else {
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
      playTime,
    }, keyImage);
    if (activeMessage !== "" && status === GameStatus.PLAYING) {
      drawMessage(ctx, activeMessage, player.screenY - 10, SCREEN_WIDTH);
    }
    if (status === GameStatus.PAUSED) {
      drawPauseScreen(ctx, PAUSE_OPTIONS, cursor, SCREEN_WIDTH, SCREEN_HEIGHT);
    }
  }

  requestAnimationFrame(tick);
};

requestAnimationFrame(tick);
