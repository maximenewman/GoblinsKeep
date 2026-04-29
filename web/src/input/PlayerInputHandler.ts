/**
 * Tracks the held state of the four movement directions and the debug toggle.
 *
 * The pure {@link onKeyDown}/{@link onKeyUp} methods take a DOM
 * {@code KeyboardEvent.code} string so unit tests can drive them directly
 * without mocking real DOM events. {@link attach} installs window-level
 * listeners that route to those methods at runtime.
 *
 * Mirrors PlayerInputHandler.java's surface (public {@code up} / {@code down}
 * / {@code left} / {@code right} / {@code debugMode} fields) so callers read
 * the same names as the Java source.
 */
export class PlayerInputHandler {
  up = false;
  down = false;
  left = false;
  right = false;
  debugMode = false;

  /**
   * Updates flags for a key-press event. Use {@code KeyboardEvent.code}
   * values like "KeyW" / "ArrowUp" — never {@code key}, which is locale and
   * modifier dependent.
   */
  onKeyDown(code: string): void {
    switch (code) {
      case "KeyW":
      case "ArrowUp":
        this.up = true;
        break;
      case "KeyS":
      case "ArrowDown":
        this.down = true;
        break;
      case "KeyA":
      case "ArrowLeft":
        this.left = true;
        break;
      case "KeyD":
      case "ArrowRight":
        this.right = true;
        break;
      case "KeyF":
        this.debugMode = !this.debugMode;
        break;
    }
  }

  /** Updates flags for a key-release event. */
  onKeyUp(code: string): void {
    switch (code) {
      case "KeyW":
      case "ArrowUp":
        this.up = false;
        break;
      case "KeyS":
      case "ArrowDown":
        this.down = false;
        break;
      case "KeyA":
      case "ArrowLeft":
        this.left = false;
        break;
      case "KeyD":
      case "ArrowRight":
        this.right = false;
        break;
    }
  }

  /**
   * Releases every movement key. Called on window blur — without it, alt-tabbing
   * while a direction is held swallows the keyup event and the player keeps
   * walking until the user re-focuses and taps the same key.
   */
  clear(): void {
    this.up = false;
    this.down = false;
    this.left = false;
    this.right = false;
  }

  /**
   * Installs keydown/keyup listeners on the given target (window by default)
   * that route to {@link onKeyDown}/{@link onKeyUp}. Also clears held keys on
   * window blur so focus loss doesn't strand the player walking. Returns a
   * detach function for cleanup.
   */
  attach(target: EventTarget = window): () => void {
    const downListener = (e: Event) => this.onKeyDown((e as KeyboardEvent).code);
    const upListener = (e: Event) => this.onKeyUp((e as KeyboardEvent).code);
    const blurListener = () => this.clear();
    target.addEventListener("keydown", downListener);
    target.addEventListener("keyup", upListener);
    target.addEventListener("blur", blurListener);
    return () => {
      target.removeEventListener("keydown", downListener);
      target.removeEventListener("keyup", upListener);
      target.removeEventListener("blur", blurListener);
    };
  }
}
