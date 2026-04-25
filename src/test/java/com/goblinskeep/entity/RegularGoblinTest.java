package com.goblinskeep.entity;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import com.goblinskeep.app.GamePanel;

/**
 * Unit tests for the {@link RegularGoblin} class.
 * This class tests the behavior of regular goblins, including movement, interaction, and pathfinding.
 */
public class RegularGoblinTest {

    /** initialize GamePanel */
    private GamePanel gp;
    /** initialize RegularGoblin */
    private RegularGoblin regularGoblin;

    /**
     * Sets up the test environment by initializing the {@link GamePanel} and {@link RegularGoblin}.
     */
    @BeforeEach
    void setUp(){
        gp = new GamePanel();
        regularGoblin =  new RegularGoblin(gp, gp.Player,0,0);
    }

    /**
     * Tests the constructor of the {@link RegularGoblin} class.
     */
    @Test
    void testConstructor() {
        RegularGoblin goblin = new RegularGoblin(gp, gp.Player,0,0);
        assertEquals(8, goblin.hitboxDefaultX);
        assertEquals(16, goblin.hitboxDefaultY);
        assertNotNull(goblin);
    }

    /**
     * Tests the {@link RegularGoblin#getAction()} method.
     */
    @Test
    void getActionTest(){
        regularGoblin.drawDirection = null;
        regularGoblin.getAction();
        assertNotNull(regularGoblin.drawDirection);
    }

    /**
     * Tests the {@link RegularGoblin#getPath()} method.
     */
    @Test
    void getPathTest(){
        regularGoblin.getAction();
        assertNotNull(regularGoblin.getPath());
    }

    /**
     * Tests the {@link RegularGoblin#interactPlayer(int)} method.
     */
    @Test
    void interactPlayerTest(){
        regularGoblin.WorldX = gp.Player.WorldX;
        regularGoblin.WorldY = gp.Player.WorldY;
        regularGoblin.interactPlayer(45);
        assertTrue(gp.map.gameEnded());
    }

    /**
     * Places the goblin one tile east of the player (inside LOS), then iterates updates
     * until the goblin's chase closes the gap and ends the game.
     */
    @Test
    void simulateMovementLeft(){
        Goblin goblin = gp.getGoblinIterator().next();
        goblin.WorldX = gp.Player.WorldX + gp.tileSize;
        goblin.WorldY = gp.Player.WorldY;
        for (int i = 0; i < 2000; i++){
            goblin.update();
        }
        assertTrue(gp.map.gameEnded());
    }

    /**
     * Repositions the player and spawns the goblin one tile east of them (inside LOS),
     * then iterates updates until the chase ends the game.
     */
    @Test
    void simulateMovementRight(){
        gp.Player.WorldX = 35 * gp.tileSize;
        gp.Player.WorldY = 10 * gp.tileSize;
        Goblin goblin = gp.getGoblinIterator().next();
        goblin.WorldX = gp.Player.WorldX + gp.tileSize;
        goblin.WorldY = gp.Player.WorldY;
        for (int i = 0; i < 2000; i++){
            goblin.update();
        }
        assertTrue(gp.map.gameEnded());
    }
}
