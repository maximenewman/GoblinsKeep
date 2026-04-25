/**
 * A single tile in the world grid: an image to render and a collision flag.
 * Populated by TileManager during initialization.
 */
export class Tile {
  image: HTMLImageElement | null = null;
  collision = false;
}
