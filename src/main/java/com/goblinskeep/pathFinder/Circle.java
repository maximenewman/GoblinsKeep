package com.goblinskeep.pathFinder;

/**
 * A circle defined by a center point and radius.
 * Used by goblins for line-of-sight detection — the player is "in sight" when
 * their center point lies inside the goblin's LOS circle.
 */
public class Circle {

    /** Radius in world units (pixels). */
    public final int radius;

    /** X coordinate of the circle's center, in world units. */
    public final int centerX;

    /** Y coordinate of the circle's center, in world units. */
    public final int centerY;

    /**
     * Constructs a Circle at the given center with the given radius.
     *
     * @param radius  the circle's radius
     * @param centerX the x coordinate of the center
     * @param centerY the y coordinate of the center
     */
    public Circle(int radius, int centerX, int centerY) {
        this.radius = radius;
        this.centerX = centerX;
        this.centerY = centerY;
    }

    /**
     * Tests whether a point lies inside (or on the edge of) the circle.
     *
     * @param pointX the x coordinate of the point
     * @param pointY the y coordinate of the point
     * @return true if the point is within {@code radius} of the center
     */
    public boolean intersects(int pointX, int pointY) {
        int dx = pointX - centerX;
        int dy = pointY - centerY;
        return Math.hypot(dx, dy) <= radius;
    }
}
