import { Bonus } from "../objects/Bonus.ts";
import { MainObject } from "../objects/MainObject.ts";
import { ObjectManager } from "../objects/ObjectManager.ts";

/**
 * Receives short status strings ("Lever Unlocked", "Door Locked!", etc).
 * UI implements this once the in-game HUD is ported.
 */
export interface MessageHandler {
  showMessage(message: string): void;
}

/**
 * Tracks game state and handles player-object touch dispatch. Mirrors
 * MapHandler.java's surface so tests and call sites read the same against
 * the Java source.
 *
 * Differences from Java:
 *   • {@link showMessage} routes through an injected {@link MessageHandler};
 *     dropped on the floor when none is given.
 *   • Bonus updates iterate {@link ObjectManager.anObject} for live Bonus
 *     instances rather than carrying a parallel list — the data is already
 *     there and stays accurate as bonuses are removed on collect.
 *   • Touching {@code InvisibleBarrier} no longer ALSO sets player.collisionOn;
 *     the Java fall-through into the {@code default} branch was redundant
 *     because CollisionChecker already blocks on obj.collision = true.
 */
export class MapHandler {
  /** Number of keys required before the lever can be activated. */
  keysNeeded = 5;

  private readonly objects: ObjectManager;
  private readonly messages: MessageHandler | null;

  private _keysCollected = 0;
  private _score = 0;
  private _exitOpen = false;
  private _gameEnded = false;
  private _gameWin = false;

  private canDeductPoints = true;
  private trapCounter = 0;
  private currentTime = 0;
  private currentTimeCounter = 0;

  private static readonly ONE_MIN = 60;
  private static readonly TWO_MIN = 120;

  constructor(objects: ObjectManager, messages?: MessageHandler | null) {
    this.objects = objects;
    this.messages = messages ?? null;
  }

  /** Dispatches per-object touch logic based on the object's name. */
  handleObject(obj: MainObject): void {
    switch (obj.name) {
      case "key":
        this.keyCollected();
        this.objects.removeObject(obj.worldX, obj.worldY);
        break;
      case "bonus":
        this.collectedBonus(obj as Bonus);
        break;
      case "trap":
        this.trapHit();
        break;
      case "lever":
        this.leverTouched();
        break;
      case "exit":
        this.doorTouched();
        break;
      case "invisible":
        this.exitTouched();
        break;
    }
  }

  keyCollected(): void {
    this._keysCollected++;
    if (this._keysCollected === this.keysNeeded) {
      this.showMessage("Lever Unlocked");
    }
  }

  collectedBonus(bonus: Bonus): void {
    if (bonus.isAlive(this.currentTime)) {
      this._score += 100;
      this.objects.removeObject(bonus.worldX, bonus.worldY);
    }
  }

  trapHit(): void {
    if (this.canDeductPoints) {
      this._score -= 50;
      this.canDeductPoints = false;
    }
    if (this._score < 0) {
      this._gameEnded = true;
      this._gameWin = false;
    }
  }

  leverTouched(): void {
    if (this._keysCollected >= this.keysNeeded) {
      this._exitOpen = true;
      this.keysNeeded = -1;
      this.objects.findLever()?.activate();
      this.objects.findDoor()?.open();
      this.showMessage("Exit Opened");
    } else {
      this.showMessage("Get more Keys!");
    }
  }

  doorTouched(): void {
    if (this._keysCollected < this.keysNeeded) {
      this.showMessage("Door Locked! Lever Activation Needed");
    }
  }

  exitTouched(): void {
    if (this._exitOpen) {
      this._gameEnded = true;
      this._gameWin = true;
    } else {
      this.showMessage("Door locked!");
    }
  }

  playerCollisionWithEnemy(): void {
    this._gameEnded = true;
    this._gameWin = false;
  }

  /**
   * Seeds the cached alive flag on every spawned Bonus from the current
   * game time. Without this, bonuses whose startTime is 0 would still draw
   * as invisible until the first {@link updateTimer} tick after a full
   * ONE_MIN window — visually wrong from the moment the world is set up.
   */
  seedBonusStates(): void {
    for (const obj of this.objects.anObject.values()) {
      if (obj instanceof Bonus) {
        obj.updateState(this.currentTime);
      }
    }
  }

  /**
   * Drives the bonus alive-window clock and the trap-deduction cooldown.
   * Should be called once per game tick.
   */
  updateTimer(): void {
    this.currentTimeCounter++;
    if (this.currentTimeCounter >= MapHandler.ONE_MIN) {
      this.currentTime++;
      this.currentTimeCounter = 0;
      for (const obj of this.objects.anObject.values()) {
        if (obj instanceof Bonus) {
          obj.updateState(this.currentTime);
        }
      }
    }
    if (!this.canDeductPoints) {
      this.trapCounter++;
      if (this.trapCounter === MapHandler.TWO_MIN) {
        this.trapCounter = 0;
        this.canDeductPoints = true;
      }
    }
  }

  // ---- Public accessors (named to match the Java API) ----
  gameEnded(): boolean { return this._gameEnded; }
  isGameWin(): boolean { return this._gameWin; }
  getScore(): number { return this._score; }
  getKeysCollected(): number { return this._keysCollected; }

  // ---- Test seams kept verbatim from MapHandler.java ----
  setGameEnded(value: boolean): void { this._gameEnded = value; }
  setGameWin(): void { this._gameWin = true; }

  private showMessage(message: string): void {
    this.messages?.showMessage(message);
  }
}
