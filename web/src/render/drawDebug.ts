import { RegularGoblin } from "../entity/RegularGoblin.ts";
import { Camera } from "./Camera.ts";

/**
 * Debug overlay toggled by the F key (input.debugMode). For each goblin,
 * draws its LOS circle (yellow/red depending on whether the player is in
 * sight) and — when chasing — the A* path tiles in cyan.
 *
 * Mirrors Java GamePanel.draw's debug branch, which renders the same circle
 * + path squares when gp.debugMode is on.
 */
export function drawDebug(
  ctx: CanvasRenderingContext2D,
  goblins: readonly RegularGoblin[],
  camera: Camera,
  tileSize: number,
): void {
  ctx.save();
  ctx.lineWidth = 2;

  for (const g of goblins) {
    const cx = g.WorldX + g.hitboxDefaultX + g.collisionArea.width / 2;
    const cy = g.WorldY + g.hitboxDefaultY + g.collisionArea.height / 2;
    const screenCx = camera.toScreenX(cx);
    const screenCy = camera.toScreenY(cy);

    ctx.strokeStyle = g.inSight ? "rgba(255, 80, 80, 0.85)" : "rgba(255, 220, 80, 0.6)";
    ctx.beginPath();
    ctx.arc(screenCx, screenCy, g.LOSradius, 0, Math.PI * 2);
    ctx.stroke();

    if (g.onPath) {
      ctx.fillStyle = "rgba(0, 200, 255, 0.35)";
      ctx.strokeStyle = "rgba(0, 200, 255, 0.7)";
      for (const node of g.getPath()) {
        const sx = camera.toScreenX(node.col * tileSize);
        const sy = camera.toScreenY(node.row * tileSize);
        ctx.fillRect(sx, sy, tileSize, tileSize);
        ctx.strokeRect(sx, sy, tileSize, tileSize);
      }
    }
  }

  ctx.restore();
}
