import { MainObject } from "./MainObject.ts";

/**
 * The lever that unlocks the exit door once the player has collected the
 * required number of keys. Holds both sprite states up-front so {@link activate}
 * can swap synchronously — matches Java's eager-load pattern.
 */
export class Lever extends MainObject {
  private readonly inactiveImage: HTMLImageElement;
  private readonly activeImage: HTMLImageElement;

  constructor(inactiveImage: HTMLImageElement, activeImage: HTMLImageElement) {
    super("lever");
    this.inactiveImage = inactiveImage;
    this.activeImage = activeImage;
    this.image = inactiveImage;
    this.collision = false;
    this.defaultCollisionAreaX += 6;
    this.defaultCollisionAreaY -= 12;
    this.collisionArea.width -= 12;
    this.collisionArea.height -= 6;
  }

  activate(): void {
    this.image = this.activeImage;
  }

  isActive(): boolean {
    return this.image === this.activeImage;
  }

  reset(): void {
    this.image = this.inactiveImage;
  }
}
