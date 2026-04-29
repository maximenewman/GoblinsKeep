import { loadImage } from "../render/loadImage.ts";
import type { ObjectSpawn } from "../app/MapGenerator.ts";
import { Bonus } from "./Bonus.ts";
import { Exit } from "./Exit.ts";
import { InvisibleBarrier } from "./InvisibleBarrier.ts";
import { Key } from "./Key.ts";
import { Lever } from "./Lever.ts";
import { MainObject } from "./MainObject.ts";
import { Trap } from "./Trap.ts";
import { Tree } from "./Tree.ts";

/**
 * The full bundle of object sprites the manager needs to construct any
 * spawn type. Loaded once via {@link ObjectManager.loadSprites} or injected
 * manually in tests via {@link ObjectManager.setSprites}.
 */
export interface ObjectSprites {
  key:           HTMLImageElement;
  trap:          HTMLImageElement;
  bonus:         HTMLImageElement;
  leverInactive: HTMLImageElement;
  leverActive:   HTMLImageElement;
  exitClosed:    HTMLImageElement;
  exitOpen:      HTMLImageElement;
  treeVariant0:  HTMLImageElement;
  treeVariant1:  HTMLImageElement;
}

/**
 * Holds every spawned game object keyed by tile coordinates and provides the
 * lookup / spawn helpers MapHandler relies on.
 *
 * Mirrors ObjectManager.java's surface — including the lowercase {@code anObject}
 * field name — so cross-file diffs against the Java source stay narrow.
 * Differences from Java:
 *   • Sprite loading is async; loadSprites() returns a Promise the caller
 *     awaits before driving spawn().
 *   • spawn(col, row, ObjectSpawn) replaces Java's inline switch in
 *     MapGenerator — the same dispatch lives here so MapGenerator's
 *     MapBuilder callback can route onObjectSpawn directly to it.
 *   • draw() is not yet ported (needs Game's camera).
 */
export class ObjectManager {
  /** Mapping of "col,row" tile keys to the object placed there. */
  readonly anObject = new Map<string, MainObject>();

  private readonly tileSize: number;
  private sprites: ObjectSprites | null = null;

  constructor(tileSize: number) {
    this.tileSize = tileSize;
  }

  /** Loads every object sprite in parallel and caches the bundle. */
  async loadSprites(): Promise<void> {
    const [
      key,
      trap,
      bonus,
      leverInactive,
      leverActive,
      exitClosed,
      exitOpen,
      treeVariant0,
      treeVariant1,
    ] = await Promise.all([
      loadImage(`${import.meta.env.BASE_URL}objects/Key.png`),
      loadImage(`${import.meta.env.BASE_URL}objects/trap1.png`),
      loadImage(`${import.meta.env.BASE_URL}objects/bonus1.png`),
      loadImage(`${import.meta.env.BASE_URL}objects/lever1.png`),
      loadImage(`${import.meta.env.BASE_URL}objects/lever2.png`),
      loadImage(`${import.meta.env.BASE_URL}objects/door1.png`),
      loadImage(`${import.meta.env.BASE_URL}objects/door2.png`),
      loadImage(`${import.meta.env.BASE_URL}objects/goodTree2.png`), // Java case 13 → variant 0
      loadImage(`${import.meta.env.BASE_URL}objects/goodTree1.png`), // Java case 12 → variant 1
    ]);
    this.setSprites({
      key,
      trap,
      bonus,
      leverInactive,
      leverActive,
      exitClosed,
      exitOpen,
      treeVariant0,
      treeVariant1,
    });
  }

  /**
   * Manually injects a pre-loaded sprite bundle. Tests use this with fake
   * HTMLImageElement objects to exercise spawn() without touching the network.
   */
  setSprites(sprites: ObjectSprites): void {
    this.sprites = sprites;
  }

  /**
   * Instantiates the correct MainObject subclass for the given spawn descriptor
   * and places it at the tile. Throws if sprites haven't been loaded.
   */
  spawn(col: number, row: number, spawn: ObjectSpawn): void {
    const sprites = this.assertSprites();
    let object: MainObject;
    switch (spawn.kind) {
      case "KEY":
        object = new Key(sprites.key);
        break;
      case "TRAP":
        object = new Trap(sprites.trap);
        break;
      case "BONUS":
        object = new Bonus(sprites.bonus, spawn.start, spawn.survival);
        break;
      case "LEVER":
        object = new Lever(sprites.leverInactive, sprites.leverActive);
        break;
      case "EXIT":
        object = new Exit(sprites.exitClosed, sprites.exitOpen);
        break;
      case "TREE":
        object = new Tree(spawn.variant === 1 ? sprites.treeVariant1 : sprites.treeVariant0);
        break;
      case "INVISIBLE_BARRIER":
        object = new InvisibleBarrier();
        break;
    }
    this.addObject(col, row, object);
  }

  /** Places an object at the given tile coordinates and stamps its world position. */
  addObject(col: number, row: number, newObject: MainObject): void {
    this.anObject.set(this.generateKey(col, row), newObject);
    newObject.worldX = col * this.tileSize;
    newObject.worldY = row * this.tileSize;
  }

  /** Empties every spawned object. Used by restart to rebuild the world from the map file. */
  clear(): void {
    this.anObject.clear();
  }

  /** Removes an object by its current world (pixel) coordinates — matches the Java signature. */
  removeObject(worldX: number, worldY: number): void {
    const key = this.generateKey(
      Math.floor(worldX / this.tileSize),
      Math.floor(worldY / this.tileSize),
    );
    this.anObject.delete(key);
  }

  /** Finds the lever, if one has been spawned. */
  findLever(): Lever | null {
    for (const o of this.anObject.values()) {
      if (o instanceof Lever) return o;
    }
    return null;
  }

  /**
   * Finds the exit door, if one has been spawned. Method named after the Java
   * original ({@code findDoor}) even though the class is {@code Exit}.
   */
  findDoor(): Exit | null {
    for (const o of this.anObject.values()) {
      if (o instanceof Exit) return o;
    }
    return null;
  }

  private generateKey(col: number, row: number): string {
    return `${col},${row}`;
  }

  private assertSprites(): ObjectSprites {
    if (!this.sprites) {
      throw new Error(
        "ObjectManager: sprites not loaded — call loadSprites() or setSprites() first",
      );
    }
    return this.sprites;
  }
}
