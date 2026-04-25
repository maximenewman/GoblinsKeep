/**
 * The four cardinal directions an entity can move in. Each direction carries
 * the dx/dy delta the Java original used.
 *
 * Note the sign convention from Direction.java: UP has dy = +1 and DOWN has
 * dy = -1. The Java {@code moveEntityTowardDirection} subtracts the dy from
 * WorldY, so UP visually decreases y on screen. This port preserves the raw
 * dy values; movement code applies the same subtraction.
 *
 * Implemented as a const object rather than a TypeScript {@code enum} because
 * the project's tsconfig sets {@code erasableSyntaxOnly: true}, which forbids
 * runtime enum emission.
 */
export const Direction = {
  UP:    { dx:  0, dy:  1 },
  DOWN:  { dx:  0, dy: -1 },
  LEFT:  { dx: -1, dy:  0 },
  RIGHT: { dx:  1, dy:  0 },
} as const;

export type Direction = (typeof Direction)[keyof typeof Direction];
