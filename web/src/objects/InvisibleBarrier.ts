import { MainObject } from "./MainObject.ts";

/**
 * Invisible trigger placed outside the exit door. The player touching it
 * fires the win condition. Has collision so collision detection picks it up,
 * but never renders.
 */
export class InvisibleBarrier extends MainObject {
  constructor() {
    super("invisible");
    this.collision = true;
  }
}
