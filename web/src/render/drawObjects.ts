import { Bonus } from "../objects/Bonus.ts";
import { ObjectManager } from "../objects/ObjectManager.ts";
import { Tree } from "../objects/Tree.ts";
import { Camera } from "./Camera.ts";

/**
 * Draws every spawned object through the camera. Skips:
 *   • objects with no image (InvisibleBarrier),
 *   • bonuses outside their alive window — they're scheduled to appear later
 *     or have already expired,
 *   • fully-offscreen objects.
 *
 * Trees are drawn at 2x height anchored one tile above their world position,
 * matching the Java Tree.draw override.
 */
export function drawObjects(
  ctx: CanvasRenderingContext2D,
  om: ObjectManager,
  camera: Camera,
): void {
  const tile = camera.tileSize;
  for (const obj of om.anObject.values()) {
    if (!obj.image) continue;
    if (obj instanceof Bonus && !obj.getAlive()) continue;

    const screenX = camera.toScreenX(obj.worldX);
    const screenY = camera.toScreenY(obj.worldY);
    if (screenX + tile <= 0 || screenX >= camera.screenWidth) continue;
    if (screenY + tile <= 0 || screenY >= camera.screenHeight) continue;

    if (obj instanceof Tree) {
      ctx.drawImage(obj.image, screenX, screenY - tile, tile, tile * 2);
    } else {
      ctx.drawImage(obj.image, screenX, screenY, tile, tile);
    }
  }
}
