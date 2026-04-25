import { beforeEach, describe, expect, it } from "vitest";
import { Bonus } from "../../src/objects/Bonus.ts";
import { Exit } from "../../src/objects/Exit.ts";
import { InvisibleBarrier } from "../../src/objects/InvisibleBarrier.ts";
import { Key } from "../../src/objects/Key.ts";
import { Lever } from "../../src/objects/Lever.ts";
import { ObjectManager, type ObjectSprites } from "../../src/objects/ObjectManager.ts";
import { Trap } from "../../src/objects/Trap.ts";
import { Tree } from "../../src/objects/Tree.ts";

const fake = (tag: string): HTMLImageElement => ({ tag } as unknown as HTMLImageElement);

const fakeSprites = (): ObjectSprites => ({
  key:           fake("key"),
  trap:          fake("trap"),
  bonus:         fake("bonus"),
  leverInactive: fake("lever-inactive"),
  leverActive:   fake("lever-active"),
  exitClosed:    fake("exit-closed"),
  exitOpen:      fake("exit-open"),
  treeVariant0:  fake("tree-0"),
  treeVariant1:  fake("tree-1"),
});

const TILE = 48;

describe("ObjectManager", () => {
  let om: ObjectManager;

  beforeEach(() => {
    om = new ObjectManager(TILE);
    om.setSprites(fakeSprites());
  });

  describe("addObject", () => {
    it("stores the object under a 'col,row' key and stamps world coords", () => {
      const k = new Key(fake("k"));
      om.addObject(3, 7, k);
      expect(om.anObject.get("3,7")).toBe(k);
      expect(k.worldX).toBe(3 * TILE);
      expect(k.worldY).toBe(7 * TILE);
    });

    it("overwrites an object placed at the same tile", () => {
      const a = new Key(fake("a"));
      const b = new Key(fake("b"));
      om.addObject(0, 0, a);
      om.addObject(0, 0, b);
      expect(om.anObject.get("0,0")).toBe(b);
      expect(om.anObject.size).toBe(1);
    });
  });

  describe("removeObject", () => {
    it("removes an object given its world-pixel coordinates", () => {
      const k = new Key(fake("k"));
      om.addObject(2, 4, k);
      om.removeObject(2 * TILE, 4 * TILE);
      expect(om.anObject.size).toBe(0);
    });

    it("does nothing when there is no object at that tile", () => {
      expect(() => om.removeObject(48, 48)).not.toThrow();
      expect(om.anObject.size).toBe(0);
    });
  });

  describe("findLever / findDoor", () => {
    it("findLever returns the only spawned Lever instance", () => {
      const lever = new Lever(fake("a"), fake("b"));
      om.addObject(1, 1, lever);
      om.addObject(2, 2, new Key(fake("k")));
      expect(om.findLever()).toBe(lever);
    });

    it("findLever returns null when none has spawned", () => {
      om.addObject(0, 0, new Key(fake("k")));
      expect(om.findLever()).toBeNull();
    });

    it("findDoor returns the only spawned Exit instance", () => {
      const exit = new Exit(fake("c"), fake("o"));
      om.addObject(5, 5, exit);
      expect(om.findDoor()).toBe(exit);
    });

    it("findDoor returns null when none has spawned", () => {
      expect(om.findDoor()).toBeNull();
    });
  });

  describe("spawn", () => {
    it("spawns a Key with the cached key sprite", () => {
      om.spawn(1, 0, { kind: "KEY" });
      const obj = om.anObject.get("1,0");
      expect(obj).toBeInstanceOf(Key);
      expect(obj?.image).toBe(om["sprites"]?.key);
    });

    it("spawns a Trap with the trap sprite", () => {
      om.spawn(2, 0, { kind: "TRAP" });
      expect(om.anObject.get("2,0")).toBeInstanceOf(Trap);
    });

    it("spawns a Bonus carrying the start/survival values", () => {
      om.spawn(3, 0, { kind: "BONUS", start: 7, survival: 12 });
      const bonus = om.anObject.get("3,0");
      expect(bonus).toBeInstanceOf(Bonus);
      expect((bonus as Bonus).isAlive(7)).toBe(true);
    });

    it("spawns a Lever with both states wired up", () => {
      om.spawn(4, 0, { kind: "LEVER" });
      const lever = om.anObject.get("4,0") as Lever;
      expect(lever).toBeInstanceOf(Lever);
      lever.activate();
      expect(lever.isActive()).toBe(true);
    });

    it("spawns an Exit closed and collidable", () => {
      om.spawn(5, 0, { kind: "EXIT" });
      const exit = om.anObject.get("5,0") as Exit;
      expect(exit).toBeInstanceOf(Exit);
      expect(exit.collision).toBe(true);
      expect(exit.isOpen()).toBe(false);
    });

    it("picks the correct tree variant", () => {
      const sprites = fakeSprites();
      om.setSprites(sprites);
      om.spawn(6, 0, { kind: "TREE", variant: 0 });
      om.spawn(7, 0, { kind: "TREE", variant: 1 });
      expect((om.anObject.get("6,0") as Tree).image).toBe(sprites.treeVariant0);
      expect((om.anObject.get("7,0") as Tree).image).toBe(sprites.treeVariant1);
    });

    it("spawns an InvisibleBarrier with collision and no image", () => {
      om.spawn(8, 0, { kind: "INVISIBLE_BARRIER" });
      const barrier = om.anObject.get("8,0") as InvisibleBarrier;
      expect(barrier).toBeInstanceOf(InvisibleBarrier);
      expect(barrier.collision).toBe(true);
      expect(barrier.image).toBeNull();
    });
  });

  describe("spawn before sprites are loaded", () => {
    it("throws a descriptive error", () => {
      const empty = new ObjectManager(TILE);
      expect(() => empty.spawn(0, 0, { kind: "KEY" })).toThrow(/sprites not loaded/);
    });
  });
});
