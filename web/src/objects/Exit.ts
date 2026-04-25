import { MainObject } from "./MainObject.ts";

/**
 * The exit door. Locked (collidable) until the lever is activated, then
 * {@link open} swaps the sprite and clears collision so the player can leave.
 */
export class Exit extends MainObject {
  private readonly closedImage: HTMLImageElement;
  private readonly openImage: HTMLImageElement;

  constructor(closedImage: HTMLImageElement, openImage: HTMLImageElement) {
    super("exit");
    this.closedImage = closedImage;
    this.openImage = openImage;
    this.image = closedImage;
    this.collision = true;
  }

  open(): void {
    this.image = this.openImage;
    this.collision = false;
  }

  isOpen(): boolean {
    return this.image === this.openImage;
  }

  reset(): void {
    this.image = this.closedImage;
    this.collision = true;
  }
}
