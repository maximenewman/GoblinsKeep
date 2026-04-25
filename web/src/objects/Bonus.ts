import { MainObject } from "./MainObject.ts";

/**
 * A meat / score-bonus pickup that appears at a random time and lasts a random
 * window before disappearing. Mirrors Bonus.java's clamped windows — startTime
 * is normalized into [0, 30) and survivalTime into [30, 60) regardless of what
 * the caller passes.
 */
export class Bonus extends MainObject {
  private readonly startTime: number;
  private readonly survivalTime: number;
  private alive = false;

  constructor(image: HTMLImageElement, startTime: number, survivalTime: number) {
    super("bonus");
    this.image = image;
    this.collision = false;
    this.startTime = startTime % 30;
    this.survivalTime = 30 + (survivalTime % 30);
  }

  /** True iff the bonus is currently within its alive window. */
  isAlive(currentTime: number): boolean {
    return this.startTime <= currentTime && currentTime < this.startTime + this.survivalTime;
  }

  /** Refreshes the cached alive flag for the current tick's drawing/picking logic. */
  updateState(currentTime: number): void {
    this.alive = this.isAlive(currentTime);
  }

  /** Whether {@link updateState} most recently flagged the bonus as alive. */
  getAlive(): boolean {
    return this.alive;
  }
}
