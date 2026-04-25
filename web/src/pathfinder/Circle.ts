/**
 * A circle defined by a center point and radius. Used by goblins for
 * line-of-sight detection — the player is "in sight" when their center point
 * lies inside the goblin's LOS circle.
 */
export class Circle {
  readonly radius: number;
  readonly centerX: number;
  readonly centerY: number;

  constructor(radius: number, centerX: number, centerY: number) {
    this.radius = radius;
    this.centerX = centerX;
    this.centerY = centerY;
  }

  /**
   * Tests whether a point lies inside (or on the edge of) the circle.
   */
  intersects(pointX: number, pointY: number): boolean {
    const dx = pointX - this.centerX;
    const dy = pointY - this.centerY;
    return Math.hypot(dx, dy) <= this.radius;
  }
}
