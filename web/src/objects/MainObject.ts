import { CollisionArea } from "../render/CollisionArea.ts";

/**
 * Base class for every interactable object in the world (Key, Bonus, Trap,
 * Lever, Exit, Tree, InvisibleBarrier). Mirrors MainObject.java — same field
 * layout and lowercase {@code worldX}/{@code worldY}/{@code name} naming so
 * external code (CollisionChecker, MapHandler) reads identically against the
 * Java source.
 *
 * Subclasses pass their {@code name} string up to this constructor; the name
 * is what {@code MapHandler.handleObject} switches on to decide what
 * touching the object does.
 *
 * The {@code draw()} method is deferred until Game lands — it needs camera
 * coordinates from gp.Player.
 */
export abstract class MainObject {
  image: HTMLImageElement | null = null;
  name: string;
  collision = false;
  worldX = 0;
  worldY = 0;
  collisionArea: CollisionArea = new CollisionArea(0, 0, 48, 48);
  defaultCollisionAreaX = 0;
  defaultCollisionAreaY = 0;

  protected constructor(name: string) {
    this.name = name;
  }
}
