import { MainObject } from "./MainObject.ts";

/**
 * Acid puddle / trap. Walking onto one deducts score; the player can pass
 * through (no movement collision).
 */
export class Trap extends MainObject {
  constructor(image: HTMLImageElement) {
    super("trap");
    this.image = image;
    this.collision = false;
  }
}
