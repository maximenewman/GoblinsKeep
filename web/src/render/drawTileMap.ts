import { TileManager } from "../tile/TileManager.ts";
import { Camera } from "./Camera.ts";

/**
 * Draws every tile of the world grid, shifted by the camera. Tiles fully
 * offscreen are skipped (cheap rect cull) — the world is 60×66 tiles which is
 * far larger than the viewport, so culling matters.
 */
export function drawTileMap(
  ctx: CanvasRenderingContext2D,
  tileM: TileManager,
  camera: Camera,
): void {
  const maxCol = tileM.mapTileNum.length;
  const maxRow = tileM.mapTileNum[0]?.length ?? 0;
  const tileSize = camera.tileSize;

  for (let col = 0; col < maxCol; col++) {
    const column = tileM.mapTileNum[col]!;
    const worldX = col * tileSize;
    const screenX = camera.toScreenX(worldX);
    if (screenX + tileSize <= 0 || screenX >= camera.screenWidth) continue;

    for (let row = 0; row < maxRow; row++) {
      const worldY = row * tileSize;
      const screenY = camera.toScreenY(worldY);
      if (screenY + tileSize <= 0 || screenY >= camera.screenHeight) continue;

      const tileNum = column[row]!;
      const tile = tileM.tiles[tileNum];
      if (tile?.image) {
        ctx.drawImage(tile.image, screenX, screenY, tileSize, tileSize);
      }
    }
  }
}
