import { describe, expect, it } from "vitest";
import { Node } from "../../src/pathfinder/Node.ts";

describe("Node", () => {
  it("stores col and row from the constructor", () => {
    const node = new Node(3, 7);
    expect(node.col).toBe(3);
    expect(node.row).toBe(7);
  });

  it("defaults all cost and flag fields to zero/false", () => {
    const node = new Node(0, 0);
    expect(node.parent).toBeNull();
    expect(node.gCost).toBe(0);
    expect(node.hCost).toBe(0);
    expect(node.fCost).toBe(0);
    expect(node.solid).toBe(false);
    expect(node.open).toBe(false);
    expect(node.explored).toBe(false);
  });

  it("allows the parent pointer to be reassigned", () => {
    const a = new Node(0, 0);
    const b = new Node(1, 0);
    b.parent = a;
    expect(b.parent).toBe(a);
  });
});
