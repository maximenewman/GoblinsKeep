import { MainObject } from "./MainObject.ts";

/**
 * Decorative tree. The Java original picks one of two sprites based on a
 * variant int in the constructor; this port has the caller pick the sprite
 * (MapGenerator emits the variant tag and ObjectManager will resolve it),
 * keeping Tree itself ignorant of which silhouette it carries.
 */
export class Tree extends MainObject {
  constructor(image: HTMLImageElement) {
    super("tree");
    this.image = image;
    this.collision = false;
  }
}
