import { describe, expect, it, vi } from "vitest";
import { PathFinder, type Grid } from "../../src/pathfinder/PathFinder.ts";

class FakeGrid implements Grid {
  readonly maxCol: number;
  readonly maxRow: number;
  private readonly walls: Set<string>;

  constructor(
    maxCol: number,
    maxRow: number,
    walls: ReadonlyArray<readonly [number, number]> = [],
  ) {
    this.maxCol = maxCol;
    this.maxRow = maxRow;
    this.walls = new Set(walls.map(([c, r]) => `${c},${r}`));
  }

  isSolid(col: number, row: number): boolean {
    return this.walls.has(`${col},${row}`);
  }
}

describe("PathFinder", () => {
  describe("createNodes", () => {
    it("builds a maxCol x maxRow grid of Node instances", () => {
      const pf = new PathFinder(new FakeGrid(5, 4));
      expect(pf.node.length).toBe(5);
      expect(pf.node[0]?.length).toBe(4);
      expect(pf.node[2]?.[3]?.col).toBe(2);
      expect(pf.node[2]?.[3]?.row).toBe(3);
    });
  });

  describe("setNodes", () => {
    it("sets startNode and goalNode for valid coordinates", () => {
      const pf = new PathFinder(new FakeGrid(10, 10));
      pf.setNodes(0, 0, 9, 9);
      expect(pf.startNode?.col).toBe(0);
      expect(pf.startNode?.row).toBe(0);
      expect(pf.goalNode?.col).toBe(9);
      expect(pf.goalNode?.row).toBe(9);
    });

    it("leaves goalNode null and warns for an out-of-bounds goal", () => {
      const pf = new PathFinder(new FakeGrid(10, 10));
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      pf.setNodes(0, 0, 10, 0);
      expect(pf.goalNode).toBeNull();
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });

    it("leaves startNode null for a negative start coordinate", () => {
      const pf = new PathFinder(new FakeGrid(10, 10));
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      pf.setNodes(-1, 0, 9, 9);
      expect(pf.startNode).toBeNull();
      warn.mockRestore();
    });

    it("flags solid tiles based on the grid", () => {
      const pf = new PathFinder(new FakeGrid(5, 5, [[2, 2]]));
      pf.setNodes(0, 0, 4, 4);
      expect(pf.node[2]?.[2]?.solid).toBe(true);
      expect(pf.node[1]?.[2]?.solid).toBe(false);
    });
  });

  describe("getCost", () => {
    it("computes Manhattan g/h/f costs from start and goal", () => {
      const pf = new PathFinder(new FakeGrid(10, 10));
      pf.setNodes(0, 0, 5, 5);
      const node = pf.node[3]?.[2];
      expect(node?.gCost).toBe(5);
      expect(node?.hCost).toBe(5);
      expect(node?.fCost).toBe(10);
    });
  });

  describe("search", () => {
    it("finds a path on an open grid", () => {
      const pf = new PathFinder(new FakeGrid(10, 10));
      pf.setNodes(0, 0, 9, 9);
      expect(pf.search()).toBe(true);
      expect(pf.goalReached).toBe(true);
      expect(pf.pathList.length).toBeGreaterThan(0);
      const last = pf.pathList[pf.pathList.length - 1]!;
      expect(last.col).toBe(9);
      expect(last.row).toBe(9);
    });

    it("returns false when the goal is fully walled off", () => {
      const walls: Array<readonly [number, number]> = [
        [4, 5], [6, 5], [5, 4], [5, 6],
      ];
      const pf = new PathFinder(new FakeGrid(10, 10, walls));
      pf.setNodes(0, 0, 5, 5);
      expect(pf.search()).toBe(false);
      expect(pf.goalReached).toBe(false);
    });

    it("does not include startNode in pathList", () => {
      const pf = new PathFinder(new FakeGrid(10, 10));
      pf.setNodes(0, 0, 3, 0);
      pf.search();
      const cols = pf.pathList.map((n) => n.col);
      expect(cols).toEqual([1, 2, 3]);
    });
  });

  describe("resetNodes", () => {
    it("clears flags and lists", () => {
      const pf = new PathFinder(new FakeGrid(5, 5));
      pf.setNodes(0, 0, 4, 4);
      pf.search();
      expect(pf.pathList.length).toBeGreaterThan(0);
      pf.resetNodes();
      expect(pf.openList.length).toBe(0);
      expect(pf.pathList.length).toBe(0);
      expect(pf.goalReached).toBe(false);
      expect(pf.step).toBe(0);
    });
  });
});
