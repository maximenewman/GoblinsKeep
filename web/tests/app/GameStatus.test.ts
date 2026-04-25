import { describe, expect, it } from "vitest";
import { GameStatus } from "../../src/app/GameStatus.ts";

describe("GameStatus", () => {
  it("exposes the six game states from the Java enum", () => {
    expect(GameStatus).toEqual({
      PLAYING: "PLAYING",
      PAUSED: "PAUSED",
      MENU: "MENU",
      END: "END",
      RESTART: "RESTART",
      INSTRUCTIONS: "INSTRUCTIONS",
    });
  });

  it("each state is a distinct value", () => {
    const all = Object.values(GameStatus);
    expect(new Set(all).size).toBe(all.length);
  });
});
