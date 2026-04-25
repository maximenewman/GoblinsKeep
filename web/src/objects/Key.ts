import { MainObject } from "./MainObject.ts";

/**
 * A key fragment the player collects to unlock the lever. Five are needed.
 */
export class Key extends MainObject {
  constructor(image: HTMLImageElement) {
    super("key");
    this.image = image;
    this.collision = false;
    this.defaultCollisionAreaX += 6;
    this.defaultCollisionAreaY += 6;
    this.collisionArea.width -= 12;
    this.collisionArea.height -= 12;
  }
}
