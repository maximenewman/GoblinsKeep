import { describe, expect, it } from "vitest";
import { Camera } from "../../src/render/Camera.ts";

describe("Camera", () => {
  it("places the target world position at the screen-center minus tileSize/2", () => {
    const cam = new Camera(500, 300, 768, 576, 48);
    // (768 - 48) / 2 = 360 ; (576 - 48) / 2 = 264
    expect(cam.toScreenX(500)).toBe(360);
    expect(cam.toScreenY(300)).toBe(264);
  });

  it("offsets nearby world points relative to the target", () => {
    const cam = new Camera(500, 300, 768, 576, 48);
    expect(cam.toScreenX(500 + 48)).toBe(360 + 48);
    expect(cam.toScreenX(500 - 96)).toBe(360 - 96);
    expect(cam.toScreenY(300 + 48)).toBe(264 + 48);
  });

  it("re-targets when targetWorldX/Y are reassigned", () => {
    const cam = new Camera(0, 0, 768, 576, 48);
    expect(cam.toScreenX(0)).toBe(360);
    cam.targetWorldX = 1000;
    expect(cam.toScreenX(1000)).toBe(360);
    expect(cam.toScreenX(1048)).toBe(408);
  });
});
