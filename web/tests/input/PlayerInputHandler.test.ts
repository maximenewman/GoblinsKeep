import { describe, expect, it } from "vitest";
import { PlayerInputHandler } from "../../src/input/PlayerInputHandler.ts";

describe("PlayerInputHandler", () => {
  it("flags default to false", () => {
    const h = new PlayerInputHandler();
    expect(h.up).toBe(false);
    expect(h.down).toBe(false);
    expect(h.left).toBe(false);
    expect(h.right).toBe(false);
    expect(h.debugMode).toBe(false);
  });

  describe("WASD presses set the matching flag", () => {
    it.each([
      ["KeyW", "up"],
      ["KeyS", "down"],
      ["KeyA", "left"],
      ["KeyD", "right"],
    ] as const)("%s sets %s", (code, flag) => {
      const h = new PlayerInputHandler();
      h.onKeyDown(code);
      expect(h[flag]).toBe(true);
      h.onKeyUp(code);
      expect(h[flag]).toBe(false);
    });
  });

  describe("Arrow keys set the matching flag", () => {
    it.each([
      ["ArrowUp", "up"],
      ["ArrowDown", "down"],
      ["ArrowLeft", "left"],
      ["ArrowRight", "right"],
    ] as const)("%s sets %s", (code, flag) => {
      const h = new PlayerInputHandler();
      h.onKeyDown(code);
      expect(h[flag]).toBe(true);
      h.onKeyUp(code);
      expect(h[flag]).toBe(false);
    });
  });

  it("F toggles debugMode on each keydown and ignores keyup", () => {
    const h = new PlayerInputHandler();
    h.onKeyDown("KeyF");
    expect(h.debugMode).toBe(true);
    h.onKeyUp("KeyF");
    expect(h.debugMode).toBe(true);
    h.onKeyDown("KeyF");
    expect(h.debugMode).toBe(false);
  });

  it("ignores keys outside the bound set", () => {
    const h = new PlayerInputHandler();
    h.onKeyDown("KeyZ");
    h.onKeyDown("Space");
    h.onKeyDown("Enter");
    expect(h.up).toBe(false);
    expect(h.down).toBe(false);
    expect(h.left).toBe(false);
    expect(h.right).toBe(false);
    expect(h.debugMode).toBe(false);
  });

  describe("attach", () => {
    class FakeTarget implements EventTarget {
      private readonly listeners = new Map<string, EventListener>();
      addEventListener(type: string, listener: EventListener): void {
        this.listeners.set(type, listener);
      }
      removeEventListener(type: string, listener: EventListener): void {
        if (this.listeners.get(type) === listener) {
          this.listeners.delete(type);
        }
      }
      dispatchEvent(event: Event): boolean {
        this.listeners.get(event.type)?.(event);
        return true;
      }
      hasListener(type: string): boolean {
        return this.listeners.has(type);
      }
    }

    it("registers and tears down keydown/keyup listeners", () => {
      const h = new PlayerInputHandler();
      const target = new FakeTarget();
      const detach = h.attach(target);
      expect(target.hasListener("keydown")).toBe(true);
      expect(target.hasListener("keyup")).toBe(true);
      detach();
      expect(target.hasListener("keydown")).toBe(false);
      expect(target.hasListener("keyup")).toBe(false);
    });

    it("translates events through onKeyDown / onKeyUp", () => {
      const h = new PlayerInputHandler();
      const target = new FakeTarget();
      h.attach(target);
      target.dispatchEvent(
        Object.assign(new Event("keydown"), { code: "KeyW" }),
      );
      expect(h.up).toBe(true);
      target.dispatchEvent(
        Object.assign(new Event("keyup"), { code: "KeyW" }),
      );
      expect(h.up).toBe(false);
    });
  });
});
