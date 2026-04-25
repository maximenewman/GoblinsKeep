package com.goblinskeep.pathFinder;

import com.goblinskeep.app.GamePanel;
import com.goblinskeep.app.GameStatus;
import com.goblinskeep.entity.RegularGoblin;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for the {@link pathFinder} class.
 */
class pathFinderTest {
    /** initialize GamePanel */
    private GamePanel gp;
    /** initialize pathFinder */
    private pathFinder pf;

    /**
     * Sets up the test environment by initializing the GamePanel and pathFinder instances.
     */
    @BeforeEach
    void setUp() {
        gp = new GamePanel();
        pf = new pathFinder(gp);
    }

    /**
     * Tests the creation of nodes in the pathFinder.
     */
    @Test
    void testCreateNodes() {
        pf.createNodes();
        assertNotNull(pf.node);
        assertEquals(gp.maxWorldCol, pf.node.length);
        assertEquals(gp.maxWorldRow, pf.node[0].length);
    }

    /**
     * Tests resetting the nodes in the pathFinder.
     */
    @Test
    void testResetNodes() {
        pf.createNodes();
        pf.node[0][0].open = true;
        pf.node[0][0].explored = true;
        pf.node[0][0].solid = true;

        pf.resetNodes();
        assertFalse(pf.node[0][0].open);
        assertFalse(pf.node[0][0].explored);
        assertFalse(pf.node[0][0].solid);
    }

    /**
     * Tests setting the start and goal nodes in the pathFinder.
     */
    @Test
    void testSetNodes() {
        pf.createNodes();
        pf.setNodes(0, 0, gp.maxWorldCol - 1, gp.maxWorldRow - 1);
        assertNotNull(pf.startNode);
        assertNotNull(pf.goalNode);
        assertEquals(0, pf.startNode.col);
        assertEquals(0, pf.startNode.row);
        assertEquals(gp.maxWorldCol - 1, pf.goalNode.col);
        assertEquals(gp.maxWorldRow - 1, pf.goalNode.row);
    }

    /**
     * Tests the search functionality of the pathFinder.
     */
    @Test
    void testSearch() {
        pf.createNodes();
        pf.setNodes(0, 0, gp.maxWorldCol - 1, gp.maxWorldRow - 1);
        boolean result = pf.search();
        assertTrue(result);
        assertTrue(pf.goalReached);
    }

    /**
     * Verifies A* finds a path from a far-away start, then verifies a goblin spawned
     * inside LOS chases the player to game-over. The far-away leg can no longer be
     * iterated to game-over because the LOS gate disengages chase outside the radius.
     */
    @Test
    void testSearchPath() {
        RegularGoblin goblin = new RegularGoblin(gp, gp.Player, 0, 0);
        int goalCol = (gp.Player.WorldX + gp.Player.hitboxDefaultX +
                (gp.Player.collisionArea.width / 2)) / gp.tileSize;
        int goalRow = (gp.Player.WorldY + gp.Player.hitboxDefaultY +
                (gp.Player.collisionArea.height / 2)) / gp.tileSize;

        goblin.onPath = true;
        goblin.WorldX = 43 * gp.tileSize;
        goblin.WorldY = 18 * gp.tileSize;
        goblin.myPath.clear();
        gp.pathFinder.searchPath(goalCol, goalRow, goblin);
        assertFalse(goblin.myPath.isEmpty());

        goblin.WorldX = gp.Player.WorldX + gp.tileSize;
        goblin.WorldY = gp.Player.WorldY;
        for (int i = 0; i < 3000; i++) {
            goblin.update();
        }
        assertTrue(gp.map.gameEnded());
    }

    /**
     * With the player at the default map spawn, parks a goblin inside LOS and verifies
     * the chase ends the game.
     */
    @Test
    void testPlayingTopLeft() {
        spawnGoblinNextToPlayer();
        gp.status = GameStatus.PLAYING;
        for (int i = 0; i < 2000; i++) {
            gp.update();
        }
        assertTrue(gp.map.gameEnded());
    }

    /**
     * Moves the player and parks a goblin inside LOS; verifies the chase ends the game.
     */
    @Test
    void testPlayingTopRight() {
        movePlayer(10, 35);
        spawnGoblinNextToPlayer();
        gp.status = GameStatus.PLAYING;
        for (int i = 0; i < 2000; i++) {
            gp.update();
        }
        assertTrue(gp.map.gameEnded());
    }

    /**
     * Moves the player and parks a goblin inside LOS; verifies the chase ends the game.
     */
    @Test
    void testPlayingBottomLeft() {
        movePlayer(49, 12);
        spawnGoblinNextToPlayer();
        gp.status = GameStatus.PLAYING;
        for (int i = 0; i < 3000; i++) {
            gp.update();
        }
        assertTrue(gp.map.gameEnded());
    }

    /**
     * Moves the player and parks a goblin inside LOS; verifies the chase ends the game.
     */
    @Test
    void testPlayingBottomRight() {
        gp.status = GameStatus.PLAYING;
        movePlayer(53, 34);
        spawnGoblinNextToPlayer();
        for (int i = 0; i < 2000; i++) {
            gp.update();
        }
        assertTrue(gp.map.gameEnded());
    }

    /**
     * Moves the player and parks a goblin inside LOS; verifies the chase ends the game.
     */
    @Test
    void testPlayingMiddle() {
        gp.status = GameStatus.PLAYING;
        movePlayer(36, 32);
        spawnGoblinNextToPlayer();
        for (int i = 0; i < 2000; i++) {
            gp.update();
        }
        assertTrue(gp.map.gameEnded());
    }

    /**
     * Teleports the first goblin onto the player's tile so the contact-distance check
     * fires on the first update. Used by the integration tests that only care about the
     * game-loop wiring, not the chase. Map-layout independent.
     */
    private void spawnGoblinNextToPlayer() {
        var goblin = gp.getGoblinIterator().next();
        goblin.WorldX = gp.Player.WorldX;
        goblin.WorldY = gp.Player.WorldY;
    }

    /**
     * Moves the player to the specified row and column.
     *
     * @param row the row to move the player to
     * @param col the column to move the player to
     */
    private void movePlayer(int row, int col) {
        gp.Player.WorldX = col * gp.tileSize;
        gp.Player.WorldY = row * gp.tileSize;
    }

    /**
     * Tests setting nodes with invalid coordinates.
     */
    @Test
    void testSetNodesWithInvalidCoordinates() {
        pf.createNodes();

        // test different invalid coordinate scenarios and verify the method does not error
        pf.resetNodes();
        pf.setNodes(0, 0, gp.maxWorldCol, 0);
        assertNull(pf.goalNode, "goalNode should be null with invalid goalCol");

        pf.resetNodes();
        pf.setNodes(0, 0, -1, 0);
        assertNull(pf.goalNode, "goalNode should be null with negative goalCol");

        pf.resetNodes();
        pf.setNodes(0, 0, 0, gp.maxWorldRow);
        assertNull(pf.goalNode, "goalNode should be null with invalid goalRow");

        pf.resetNodes();
        pf.setNodes(0, 0, 0, -1);
        assertNull(pf.goalNode, "goalNode should be null with negative goalRow");

        pf.resetNodes();
        pf.setNodes(gp.maxWorldCol, 0, 0, 0);
        assertNull(pf.startNode, "startNode should be null with invalid startCol");

        pf.resetNodes();
        pf.setNodes(-1, 0, 0, 0);
        assertNull(pf.startNode, "startNode should be null with negative startCol");

        pf.resetNodes();
        pf.setNodes(0, gp.maxWorldRow, 0, 0);
        assertNull(pf.startNode, "startNode should be null with invalid startRow");

        pf.resetNodes();
        pf.setNodes(0, -1, 0, 0);
        assertNull(pf.startNode, "startNode should be null with negative startRow");

        pf.resetNodes();
        pf.setNodes(-1, -1, gp.maxWorldCol, gp.maxWorldRow);
        assertNull(pf.startNode, "startNode should be null with all invalid coordinates");
        assertNull(pf.goalNode, "goalNode should be null with all invalid coordinates");

        pf.resetNodes();
        pf.setNodes(0, 0, gp.maxWorldCol - 1, gp.maxWorldRow - 1);
        assertNotNull(pf.startNode, "startNode should be set with valid coordinates");
        assertNotNull(pf.goalNode, "goalNode should be set with valid coordinates");
    }
}
