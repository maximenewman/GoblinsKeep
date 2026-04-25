import { Node } from "./Node.ts";

/**
 * Grid abstraction the pathfinder reads from. Lets the A* search be unit-tested
 * without standing up a full Game + TileManager. The eventual Game class will
 * implement this interface.
 */
export interface Grid {
  readonly maxCol: number;
  readonly maxRow: number;
  isSolid(col: number, row: number): boolean;
}

/**
 * A* pathfinder over a rectangular grid. Mirrors pathFinder.java closely so
 * the algorithm-level behavior is unchanged from the Java original.
 *
 * Only the search core is ported here. The Entity-aware searchPath() helper
 * (which derives a goblin's start tile, sets its direction, and stores the
 * resulting path) lands once Entity is ported.
 */
export class PathFinder {
  private readonly grid: Grid;
  node: Node[][] = [];
  openList: Node[] = [];
  pathList: Node[] = [];
  startNode: Node | null = null;
  goalNode: Node | null = null;
  currentNode: Node | null = null;
  goalReached = false;

  /**
   * Loop guard from the Java original. Never incremented in search() — the
   * loop actually terminates by exhausting the open list. Preserved verbatim.
   */
  step = 0;

  constructor(grid: Grid) {
    this.grid = grid;
    this.createNodes();
  }

  createNodes(): void {
    this.node = [];
    for (let col = 0; col < this.grid.maxCol; col++) {
      const column: Node[] = [];
      for (let row = 0; row < this.grid.maxRow; row++) {
        column.push(new Node(col, row));
      }
      this.node.push(column);
    }
  }

  resetNodes(): void {
    for (let col = 0; col < this.grid.maxCol; col++) {
      for (let row = 0; row < this.grid.maxRow; row++) {
        const n = this.node[col]![row]!;
        n.open = false;
        n.explored = false;
        n.solid = false;
      }
    }
    this.openList = [];
    this.pathList = [];
    this.goalReached = false;
    this.step = 0;
  }

  setNodes(startCol: number, startRow: number, goalCol: number, goalRow: number): void {
    if (
      goalCol >= this.grid.maxCol || goalCol < 0 ||
      goalRow >= this.grid.maxRow || goalRow < 0 ||
      startCol >= this.grid.maxCol || startCol < 0 ||
      startRow >= this.grid.maxRow || startRow < 0
    ) {
      console.warn(
        `PathFinder.setNodes invalid coordinates: start(${startCol},${startRow}), goal(${goalCol},${goalRow})`,
      );
      return;
    }

    this.resetNodes();
    this.startNode = this.node[startCol]![startRow]!;
    this.currentNode = this.startNode;
    this.goalNode = this.node[goalCol]![goalRow]!;
    this.openList.push(this.currentNode);

    for (let col = 0; col < this.grid.maxCol; col++) {
      for (let row = 0; row < this.grid.maxRow; row++) {
        const n = this.node[col]![row]!;
        if (this.grid.isSolid(col, row)) {
          n.solid = true;
        }
        this.getCost(n);
      }
    }
  }

  getCost(node: Node): void {
    const start = this.startNode;
    const goal = this.goalNode;
    if (!start || !goal) {
      return;
    }
    const xFromStart = Math.abs(node.col - start.col);
    const yFromStart = Math.abs(node.row - start.row);
    node.gCost = xFromStart + yFromStart;

    const xToGoal = Math.abs(node.col - goal.col);
    const yToGoal = Math.abs(node.row - goal.row);
    node.hCost = xToGoal + yToGoal;
    node.fCost = node.gCost + node.hCost;
  }

  search(): boolean {
    while (!this.goalReached && this.step < 500) {
      const current = this.currentNode;
      if (!current) {
        break;
      }
      const { col, row } = current;
      current.explored = true;
      this.openList = this.openList.filter((n) => n !== current);

      if (row - 1 >= 0)             this.openNode(this.node[col]![row - 1]!);
      if (col - 1 >= 0)             this.openNode(this.node[col - 1]![row]!);
      if (row + 1 < this.grid.maxRow) this.openNode(this.node[col]![row + 1]!);
      if (col + 1 < this.grid.maxCol) this.openNode(this.node[col + 1]![row]!);

      let bestIndex = 0;
      let bestF = 999;
      for (let i = 0; i < this.openList.length; i++) {
        const candidate = this.openList[i]!;
        if (candidate.fCost < bestF) {
          bestIndex = i;
          bestF = candidate.fCost;
        } else if (candidate.fCost === bestF) {
          if (candidate.gCost < this.openList[bestIndex]!.gCost) {
            bestIndex = i;
          }
        }
      }

      if (this.openList.length === 0) {
        break;
      }

      this.currentNode = this.openList[bestIndex]!;
      if (this.currentNode === this.goalNode) {
        this.goalReached = true;
        this.trackThePath();
      }
    }
    return this.goalReached;
  }

  openNode(node: Node): void {
    if (!node.open && !node.explored && !node.solid) {
      node.open = true;
      node.parent = this.currentNode;
      this.openList.push(node);
    }
  }

  trackThePath(): void {
    let current: Node | null = this.goalNode;
    while (current && current !== this.startNode) {
      this.pathList.unshift(current);
      current = current.parent;
    }
  }
}
