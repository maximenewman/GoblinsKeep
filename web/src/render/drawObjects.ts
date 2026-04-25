import { ObjectManager } from "../objects/ObjectManager.ts";
import { Tree } from "../objects/Tree.ts";
import { Camera } from "./Camera.ts";

/**
 * Draws every spawned object through the camera. Skips objects with no image
 * (InvisibleBarrier) and culls fully-offscreen ones. Trees are drawn at 2x
 * height anchored one tile above their world position — same as the Java
 * Tree.draw override.
 */
export function drawObjects(
  ctx: CanvasRenderingContext2D,
  om: ObjectManager,
  camera: Camera,
): void {
  const tile = camera.tileSize;
  for (const obj of om.anObject.values()) {
    if (!obj.image) continue;

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
