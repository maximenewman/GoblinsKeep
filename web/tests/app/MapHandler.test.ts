import { beforeEach, describe, expect, it, vi } from "vitest";
import { MapHandler, type MessageHandler } from "../../src/app/MapHandler.ts";
import { Bonus } from "../../src/objects/Bonus.ts";
import { Exit } from "../../src/objects/Exit.ts";
import { Key } from "../../src/objects/Key.ts";
import { Lever } from "../../src/objects/Lever.ts";
import { ObjectManager } from "../../src/objects/ObjectManager.ts";

const TILE = 48;

const fake = (tag: string): HTMLImageElement => ({ tag } as unknown as HTMLImageElement);

const makeObjectManager = (): ObjectManager => {
  const om = new ObjectManager(TILE);
  om.setSprites({
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
  return om;
};

describe("MapHandler", () => {
  let om: ObjectManager;
  let messages: MessageHandler;
  let map: MapHandler;

  beforeEach(() => {
    om = makeObjectManager();
    messages = { showMessage: vi.fn() };
    map = new MapHandler(om, messages);
  });

  describe("initial state", () => {
    it("starts at score 0, no keys, no end, no win", () => {
      expect(map.getScore()).toBe(0);
      expect(map.getKeysCollected()).toBe(0);
      expect(map.gameEnded()).toBe(false);
      expect(map.isGameWin()).toBe(false);
    });
  });

  describe("keyCollected", () => {
    it("increments by one", () => {
      map.keyCollected();
      expect(map.getKeysCollected()).toBe(1);
    });

    it("emits 'Lever Unlocked' on the keysNeeded-th key", () => {
      for (let i = 0; i < map.keysNeeded - 1; i++) map.keyCollected();
      expect(messages.showMessage).not.toHaveBeenCalled();
      map.keyCollected();
      expect(messages.showMessage).toHaveBeenCalledWith("Lever Unlocked");
    });
  });

  describe("trapHit", () => {
    it("deducts 50 points on the first hit and respects the cooldown on the second", () => {
      map.trapHit();
      expect(map.getScore()).toBe(-50);
      // Second hit during cooldown — score unchanged.
      map.trapHit();
      expect(map.getScore()).toBe(-50);
    });

    it("ends the game (loss) once the score goes negative", () => {
      map.trapHit();
      expect(map.getScore()).toBe(-50);
      expect(map.gameEnded()).toBe(true);
      expect(map.isGameWin()).toBe(false);
    });

    it("re-arms the cooldown after TWO_MIN ticks", () => {
      map.trapHit();
      const initial = map.getScore();
      for (let i = 0; i < 120; i++) map.updateTimer();
      map.trapHit();
      expect(map.getScore()).toBe(initial - 50);
    });
  });

  describe("leverTouched", () => {
    it("with insufficient keys, only emits the 'Get more Keys!' message", () => {
      const lever = new Lever(fake("a"), fake("b"));
      om.addObject(0, 0, lever);
      map.leverTouched();
      expect(lever.isActive()).toBe(false);
      expect(messages.showMessage).toHaveBeenCalledWith("Get more Keys!");
    });

    it("with keysNeeded keys, opens the exit and activates the lever", () => {
      const lever = new Lever(fake("a"), fake("b"));
      const exit = new Exit(fake("c"), fake("o"));
      om.addObject(0, 0, lever);
      om.addObject(1, 0, exit);

      for (let i = 0; i < map.keysNeeded; i++) map.keyCollected();
      map.leverTouched();

      expect(lever.isActive()).toBe(true);
      expect(exit.isOpen()).toBe(true);
      expect(messages.showMessage).toHaveBeenCalledWith("Exit Opened");
    });
  });

  describe("doorTouched", () => {
    it("warns about the lock until enough keys are collected", () => {
      map.doorTouched();
      expect(messages.showMessage).toHaveBeenCalledWith(
        "Door Locked! Lever Activation Needed",
      );
    });
  });

  describe("exitTouched", () => {
    it("ends the game with a win when the exit is open", () => {
      const lever = new Lever(fake("a"), fake("b"));
      const exit = new Exit(fake("c"), fake("o"));
      om.addObject(0, 0, lever);
      om.addObject(1, 0, exit);

      for (let i = 0; i < map.keysNeeded; i++) map.keyCollected();
      map.leverTouched();
      map.exitTouched();

      expect(map.gameEnded()).toBe(true);
      expect(map.isGameWin()).toBe(true);
    });

    it("emits 'Door locked!' and does not end the game when the exit is closed", () => {
      map.exitTouched();
      expect(map.gameEnded()).toBe(false);
      expect(messages.showMessage).toHaveBeenCalledWith("Door locked!");
    });
  });

  describe("playerCollisionWithEnemy", () => {
    it("ends the game with a loss", () => {
      map.playerCollisionWithEnemy();
      expect(map.gameEnded()).toBe(true);
      expect(map.isGameWin()).toBe(false);
    });
  });

  describe("collectedBonus", () => {
    it("awards 100 points only when the bonus is alive", () => {
      const liveBonus = new Bonus(fake("b"), 0, 30);
      liveBonus.updateState(0); // alive at currentTime=0
      map.collectedBonus(liveBonus);
      expect(map.getScore()).toBe(100);

      const futureBonus = new Bonus(fake("b"), 5, 30);
      // currentTime is still 0 — futureBonus shouldn't be alive.
      map.collectedBonus(futureBonus);
      expect(map.getScore()).toBe(100);
    });
  });

  describe("updateTimer", () => {
    it("advances bonus alive states once every ONE_MIN ticks", () => {
      const bonus = new Bonus(fake("b"), 1, 30);
      om.addObject(0, 0, bonus);
      map.collectedBonus(bonus);
      // currentTime starts at 0 and the bonus's start is 1, so it's not yet alive.
      expect(map.getScore()).toBe(0);
      // 60 timer ticks = one game-second — currentTime increments to 1 → alive.
      for (let i = 0; i < 60; i++) map.updateTimer();
      map.collectedBonus(bonus);
      expect(map.getScore()).toBe(100);
    });
  });

  describe("handleObject", () => {
    it("dispatches the 'key' name to keyCollected and removes the key", () => {
      const key = new Key(fake("k"));
      om.addObject(2, 3, key);
      map.handleObject(key);
      expect(map.getKeysCollected()).toBe(1);
      expect(om.anObject.size).toBe(0);
    });

    it("dispatches the 'trap' name to trapHit", () => {
      const trapObj = { name: "trap", worldX: 0, worldY: 0 } as unknown;
      map.handleObject(trapObj as Parameters<typeof map.handleObject>[0]);
      expect(map.getScore()).toBe(-50);
    });
  });
});
