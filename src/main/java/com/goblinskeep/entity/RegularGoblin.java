package com.goblinskeep.entity;

import java.awt.*;
import java.util.ArrayList;
import java.util.Random;
import com.goblinskeep.app.Direction;
import com.goblinskeep.app.GamePanel;
import com.goblinskeep.pathFinder.Node;

/**
 * Represents a regular goblin entity that can move randomly or follow a path.
 */
public class RegularGoblin extends Goblin {

    /**
     * The path that the goblin follows.
     */
    public ArrayList<Node> myPath = new ArrayList<>();

    /** Ticks the goblin must wait between random direction changes. */
    private static final int RANDOM_DIRECTION_INTERVAL = 75;

    private final Random random = new Random();

    /**
     * Constructs a RegularGoblin with the specified GamePanel and Player.
     *
     * @param gp the GamePanel instance
     * @param player the Player instance
     * @param WorldX the RegularGoblin X coordinate in the world
     * @param WorldY the RegularGoblin Y coordinate in the world
     */
    public RegularGoblin(GamePanel gp, Player player, int WorldX, int WorldY) {
        super(gp, player, WorldX, WorldY);
        collisionArea = new Rectangle(8, 16, 32, 32); // Set collision area
        hitboxDefaultX = 8;
        hitboxDefaultY = 16;

    }

    /**
     * Determines the action of the regular goblin. When the player is being chased
     * ({@code onPath}), runs A* toward the player's current tile. Otherwise wanders
     * randomly. Either way, applies the resulting direction and moves.
     */
    @Override
    public void getAction() {
        if (onPath) {
            Point goalCoordinates = gp.Player.getCenterTileCoordinates();
            gp.pathFinder.searchPath(goalCoordinates.x, goalCoordinates.y, this);
        } else {
            randomMovement();
        }
        drawDirection = direction;
        moveAlongPath();
    }

    /**
     * Resolves collisions for this tick, then moves the goblin in its current direction.
     * During random wandering, a tile collision flips the direction so the goblin bounces
     * off walls instead of standing still until the next direction roll.
     */
    private void moveAlongPath(){
        collisionOn = false;
        checkCollisions();
        if (collisionOn && !onPath) {
            reverseDirection();
            collisionOn = false;
        }
        moveEntityTowardDirection();
    }

    /**
     * Picks a fresh random cardinal direction every {@link #RANDOM_DIRECTION_INTERVAL}
     * ticks. The first {@code RANDOM_DIRECTION_INTERVAL - 1} calls are no-ops so the
     * goblin commits to a heading instead of jittering each frame.
     */
    private void randomMovement() {
        actionLockCounter++;
        if (actionLockCounter < RANDOM_DIRECTION_INTERVAL) {
            return;
        }
        actionLockCounter = 0;
        direction = switch (random.nextInt(4)) {
            case 0 -> Direction.UP;
            case 1 -> Direction.DOWN;
            case 2 -> Direction.LEFT;
            default -> Direction.RIGHT;
        };
    }

    private void reverseDirection() {
        direction = switch (direction) {
            case UP -> Direction.DOWN;
            case DOWN -> Direction.UP;
            case LEFT -> Direction.RIGHT;
            case RIGHT -> Direction.LEFT;
        };
        drawDirection = direction;
    }


    /**
     * Returns the path that the goblin follows.
     *
     * @return the path as an ArrayList of Nodes
     */
    public ArrayList<Node> getPath() {
        return myPath;
    }

    private void checkCollisions(){
        gp.collisionChecker.handleEnemyCollisions(this);
        interactPlayer(47);
    }



    /**
     * Interacts with the player if within a specified range.
     *
     * @param hitDistance the range within which the goblin interacts with the player
     */
    public void interactPlayer(int hitDistance) {

        double playerMiddleX = gp.Player.WorldX + gp.Player.hitboxDefaultX + ((double) gp.Player.collisionArea.width / 2);
        double playerMiddleY = gp.Player.WorldY + gp.Player.hitboxDefaultY+ ((double) gp.Player.collisionArea.height / 2);
        double goblinMiddleX = this.WorldX + this.hitboxDefaultX + ((double) this.collisionArea.width / 2);
        double goblinMiddleY = this.WorldY + this.hitboxDefaultY + ((double) this.collisionArea.height / 2);

        double edgeY = Math.abs(playerMiddleY - goblinMiddleY);
        double edgeX = Math.abs(playerMiddleX - goblinMiddleX);

        double distanceApart = Math.hypot(edgeY, edgeX);
        if (distanceApart <= hitDistance)
        {
            gp.map.playerCollisionWithEnemy();
        }
    }
    
}
