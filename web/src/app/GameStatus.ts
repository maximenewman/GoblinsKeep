/**
 * The set of possible game states. Drives both update logic and which UI screen
 * is rendered on a given frame, mirroring the Java GameStatus enum.
 *
 * Implemented as a const object of string literals (rather than a TypeScript
 * {@code enum}) because the project's tsconfig sets
 * {@code erasableSyntaxOnly: true}.
 */
export const GameStatus = {
  PLAYING:      "PLAYING",
  PAUSED:       "PAUSED",
  MENU:         "MENU",
  END:          "END",
  RESTART:      "RESTART",
  INSTRUCTIONS: "INSTRUCTIONS",
} as const;

export type GameStatus = (typeof GameStatus)[keyof typeof GameStatus];
