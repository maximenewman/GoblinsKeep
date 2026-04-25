/**
 * A single cell in the pathfinding grid. The A* search reads and mutates these
 * fields directly — they're effectively package-private in the Java original
 * and stay open here for the same reason.
 */
export class Node {
  parent: Node | null = null;
  col: number;
  row: number;
  gCost = 0;
  hCost = 0;
  fCost = 0;
  solid = false;
  open = false;
  explored = false;

  constructor(col: number, row: number) {
    this.col = col;
    this.row = row;
  }
}
