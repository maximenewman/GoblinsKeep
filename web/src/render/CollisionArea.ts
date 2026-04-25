/**
 * Axis-aligned bounding rectangle. Mutable — CollisionChecker shifts the x/y
 * to test predicted positions before committing a move. Mirrors the parts of
 * java.awt.Rectangle the Java original used for collision.
 */
export class CollisionArea {
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  intersects(other: CollisionArea): boolean {
    return (
      this.x < other.x + other.width &&
      this.x + this.width > other.x &&
      this.y < other.y + other.height &&
      this.y + this.height > other.y
    );
  }
}
