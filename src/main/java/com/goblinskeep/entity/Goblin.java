package com.goblinskeep.entity;

import java.awt.*;
import com.goblinskeep.app.Direction;
import com.goblinskeep.app.GamePanel;
import com.goblinskeep.pathFinder.Circle;

/**
 * Represents a goblin enemy in the game.
 * This is an abstract class that defines common goblin behavior and appearance.
 * Goblins are hostile NPCs that interact with the player and game environment.
 */
public abstract class Goblin extends Entity{
    /** Reference to the player, used for AI movement and interaction. */
    protected Player player;

    /** The direction in which the goblin is currently facing/drawn. */
    protected Direction drawDirection = Direction.UP;

    /** Indicates whether the goblin is currently following a path to the player. */
    public boolean onPath;

    /** Indicates whether the goblin currently has line of sight to the player. */
    public boolean inSight;

    /** Line-of-sight radius in world pixels. The goblin starts chasing when the player's center enters this circle. */
    public int LOSradius = 120;

    /** Manhattan tile distance beyond which a chasing goblin gives up if it has lost line of sight. */
    private static final int DISENGAGE_TILE_DISTANCE = 10;

    /**
     * Constructs a goblin with references to the game panel and player.
     *
     * @param gp     The game panel instance.
     * @param player The player instance.
     * @param WorldX the Goblin X coordinate in the world
     * @param WorldY the Goblin Y coordinate in the world
     */
    public Goblin(GamePanel gp, Player player, int WorldX, int WorldY) {
        super(gp, WorldX, WorldY);  // Pass values up to Entity constructor
        // this.gp = gp;
        this.player = player;
        this.speed = 2;
        this.collisionArea = new Rectangle(11, 17, 23, 23); // Set collision area
        this.hitboxDefaultX = collisionArea.x;
        this.hitboxDefaultY = collisionArea.y;
        direction = Direction.DOWN;
        getGoblinImage();
    }


    /**
     * Defines the goblin's behavior (to be implemented by subclasses).
     * This method should contain movement and AI logic.
     */
    public abstract void getAction();


    /**
     * Loads (using loadImage) and assigns sprite images for goblin animations in different directions.
     * Called when initializing the goblin's appearance.
     */
    public void getGoblinImage(){
        up1    = Entity.loadImage("/goblin/orc_up_1.png");
        up2    = Entity.loadImage("/goblin/orc_up_2.png");
        down1  = Entity.loadImage("/goblin/orc_down_1.png");
        down2  = Entity.loadImage("/goblin/orc_down_2.png");
        right1 = Entity.loadImage("/goblin/orc_right_1.png");
        right2 = Entity.loadImage("/goblin/orc_right_2.png");
        left1  = Entity.loadImage("/goblin/orc_left_1.png");
        left2  = Entity.loadImage("/goblin/orc_left_2.png");
    }
    
    /**
     * Updates the goblin's state. Recomputes line-of-sight, latches the chase state on
     * when the player enters LOS, latches it off only when LOS is lost AND the player is
     * more than {@link #DISENGAGE_TILE_DISTANCE} tiles away (so the goblin keeps pursuing
     * briefly after a corner). Then delegates to the subclass's {@link #getAction()}.
     */
    public void update(){
        int xDistance = Math.abs(WorldX - gp.Player.WorldX);
        int yDistance = Math.abs(WorldY - gp.Player.WorldY);
        int tileDistance = (xDistance + yDistance) / gp.tileSize;

        checkLOS();

        if (!onPath && inSight) {
            onPath = true;
        }
        if (onPath && !inSight && tileDistance > DISENGAGE_TILE_DISTANCE) {
            onPath = false;
        }

        getAction();
    }

    /**
     * Sets {@link #inSight} based on whether the player's center lies inside this goblin's
     * LOS circle. Operates in world coordinates so the camera transform is irrelevant.
     */
    public void checkLOS() {
        int playerCenterX = gp.Player.WorldX + gp.Player.hitboxDefaultX + (gp.Player.collisionArea.width / 2);
        int playerCenterY = gp.Player.WorldY + gp.Player.hitboxDefaultY + (gp.Player.collisionArea.height / 2);
        int goblinCenterX = WorldX + hitboxDefaultX + (collisionArea.width / 2);
        int goblinCenterY = WorldY + hitboxDefaultY + (collisionArea.height / 2);
        Circle losRange = new Circle(LOSradius, goblinCenterX, goblinCenterY);
        inSight = losRange.intersects(playerCenterX, playerCenterY);
    }

    /**
     * Retrieves the effective direction for rendering the goblin.
     *
     * @return The direction in which the goblin is currently drawn.
     */
    @Override
    protected Direction getEffectiveDirection() {
        return drawDirection; // Default behavior for Player
    }
}
