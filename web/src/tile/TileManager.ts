import { Tile } from "./Tile.ts";

/**
 * Loads an image from a public/ path. Browsers' {@code Image()} is async, so
 * tile loading returns a Promise the caller awaits before drawing.
 *
 * Local helper for now — will be promoted to a shared module once Entity
 * needs it for sprite loading.
 */
function loadImage(path: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${path}`));
    img.src = path;
  });
}

/**
 * Stores tile sprites and the world's tileNum grid. Mirrors TileManager.java
 * but only the data half — the camera-aware draw() method depends on Player
 * and lands once Entity is in place.
 *
 * The mapTileNum grid is populated externally by MapGenerator, just like the
 * Java original. tiles is a sparse array indexed by the numeric ids the map
 * file uses.
 */
export class TileManager {
  readonly tiles: (Tile | undefined)[] = new Array<Tile | undefined>(20);
  readonly mapTileNum: number[][];

  constructor(maxCol: number, maxRow: number) {
    this.mapTileNum = Array.from({ length: maxCol }, () => new Array<number>(maxRow).fill(0));
  }

  /**
   * Loads every tile sprite in parallel. Resolves once all are decoded so
   * drawing never sees a half-loaded sprite.
   */
  async loadTiles(): Promise<void> {
    await Promise.all([
      this.mapNumToTile("/tiles/floor.png", 0, false),
      this.mapNumToTile("/tiles/wall.png", 1, true),
      this.mapNumToTile("/tiles/grass_tile.png", 8, false),
      this.mapNumToTile("/tiles/dirt.png", 9, false),
      this.mapNumToTile("/tiles/grass_tile.png", 14, false),
    ]);
  }

  private async mapNumToTile(path: string, tileNum: number, collision: boolean): Promise<void> {
    const tile = new Tile();
    tile.image = await loadImage(path);
    tile.collision = collision;
    this.tiles[tileNum] = tile;
  }

  /**
   * Returns whether the tile at the given id has collision enabled. Throws if
   * the id was never loaded — preserves the Java NullPointerException behavior
   * so a malformed map file fails fast instead of silently letting the player
   * walk through a "wall" that wasn't registered.
   */
  checkCollisionOfTile(tileNum: number): boolean {
    return this.tiles[tileNum]!.collision;
  }
}
