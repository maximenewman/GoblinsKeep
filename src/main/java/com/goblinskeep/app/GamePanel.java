package com.goblinskeep.app;

import java.awt.Color;
import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.util.ArrayList;
import java.util.Iterator;
import javax.swing.JPanel;
import com.goblinskeep.entity.CollisionChecker;
import com.goblinskeep.entity.Goblin;
import com.goblinskeep.entity.Player;
import com.goblinskeep.tile.TileManager;
import com.goblinskeep.keyboard.MenuInputHandler;
import com.goblinskeep.keyboard.PlayerInputHandler;
import com.goblinskeep.objects.ObjectManager;
import com.goblinskeep.pathFinder.pathFinder;
import com.goblinskeep.UI.InstructionsUI;
import com.goblinskeep.UI.EndUI;
import com.goblinskeep.UI.MenuUI;
import com.goblinskeep.UI.UI;


/**
 * The core game panel that manages rendering, game logic, and the game loop.
 * This class extends {@link JPanel} and implements {@link Runnable} to handle game updates and rendering.
 */
public class GamePanel extends JPanel implements Runnable
{
    /** Original tile size during design (in pixels). */
    private  final int originalTileSize = 16;

    /** Scaling factor to adjust tile size for display resolution. */
    private  final int scale = 3;

    /** Final tile size after scaling. */
    public  final int tileSize = originalTileSize * scale;

    /** Maximum number of columns in the game screen. */
    public  final int maxScreenCol = 16; //Width of game

    /** Maximum number of rows in the game screen. */
    public  final int maxScreenRow = 12; //Height of game

    /** Width of the game screen in pixels. */
    public  final int screenWidth = tileSize * maxScreenCol; //Scaling

    /** Height of the game screen in pixels. */
    public  final int screenHeight = tileSize * maxScreenRow; //Scaling

    /** Maximum number of columns in the game world. */
    public  final int maxWorldCol = 60;

    /** Maximum number of rows in the game world. */
    public  final int maxWorldRow = 66;

    /** Tile manager responsible for handling tiles. */
    public TileManager tileM;

    /** The player character. */
    public Player Player;

    /** Handles collision detection between entities and objects. */
    public CollisionChecker collisionChecker;

    /** Handles keyboard input for player movement. */
    public PlayerInputHandler PlayerInput = new PlayerInputHandler();

    /** The game loop thread. */
    public Thread gameThread;

    /** List of goblins (enemy entities) in the game. */
    public ArrayList<Goblin> goblins;

    /** Background-music player. Tracks the {@link GameStatus} state machine. */
    public Sound sound = new Sound();

    /** Object manager responsible for handling interactable objects. */
    public ObjectManager obj;

    /** The game's user interface (UI) manager. */
    public UI ui = new UI(this);

    /** UI displayed when the game ends. */
    public EndUI endUI = new EndUI(this);

    /** Represents the current game state. */
    public GameStatus status;

    /** Previous game state, used to detect transitions for music dispatch. */
    private GameStatus previousStatus;

    /** The game's map generator, responsible for setting up the environment. */
    public MapHandler map;

    /** The menu UI screen. */
    private final MenuUI menuUI = new MenuUI(this);

    /** The instructions UI screen. */
    public InstructionsUI instructionsUI = new InstructionsUI(this);

    /** Pathfinding engine used for navigating goblins. */
    public pathFinder pathFinder;

    /** used to trigger debugMode. */
    public boolean debugMode;

    /**
     * Whether background music is allowed to play. Toggled by the M key.
     * Defaults to {@code false} so unit tests that construct GamePanel — and tests that
     * drive {@code update()} through state transitions — don't allocate audio lines or
     * emit sound. {@link App#main(String[])} flips this on at startup.
     */
    public boolean musicEnabled = false;
    /**
     * Constructs a new GamePanel, initializing the game screen, input handlers, and game state.
     */
    public GamePanel(){
        this.setPreferredSize(new Dimension(screenWidth, screenHeight));
        this.setBackground(Color.black);
        this.collisionChecker = new CollisionChecker(this);

        // Register input handlers
        this.addKeyListener(PlayerInput);
        // Handles keyboard input when in the menu.
        MenuInputHandler keyboard = new MenuInputHandler(this);
        this.addKeyListener(keyboard);

        // Set the initial game state to the main menu. Music is kicked off by App.main
        // after construction so test environments don't allocate audio resources.
        previousStatus = null;
        status = GameStatus.MENU;
        setGame();

        // Enable double buffering for smoother rendering
        this.setDoubleBuffered(true);
        this.setFocusable(true);
        this.repaint();
    }

    /**
     * Initializes the game by setting up the map, player, goblins, and objects.
     */
    private void setGame() {
        map = new MapHandler(this);
        this.Player.speed = 5;
        pathFinder = new pathFinder(this);
        ui.restart();
    }


    /**
     * Starts the game thread, which runs the main game loop.
     */
    public void startGameThread(){
        gameThread = new Thread(this);
        gameThread.start();
    }


    /**
     * The main game loop, responsible for updating game logic and rendering frames.
     * Runs continuously while the game is active.
     */
    @Override
    public void run(){
        // Target Frames Per Second (FPS) for smooth gameplay.
        int FPS = 60;
        double drawInterval = 1000000000/ FPS; // Time per frame in nanoseconds. We use 1 billion -> 1 nano sec = 1 sec
        double delta = 0;
        long timer = 0;
        long LastTime = System.nanoTime();
        long CurrentTime;

        while(gameThread != null){
            CurrentTime = System.nanoTime();
            delta += (CurrentTime - LastTime) / drawInterval;
            timer += (CurrentTime - LastTime);
            LastTime = CurrentTime;

            // Update game logic and repaint the screen
            if(delta >= 1){
                update();
                repaint();
                delta--;
            }
            if(timer >= 1000000000){
                timer = 0;
            }
        }
        
    }


    /**
     * Updates the game logic, including player movement and enemy AI.
     * This method is called in each iteration of the game loop.
     */
    public void update(){
        if (status != previousStatus) {
            onStatusChanged(previousStatus, status);
            previousStatus = status;
        }
        if (status == GameStatus.PLAYING) {
            if (map.gameEnded()){
                status = GameStatus.END;
            } else {
                Player.update();
                map.updateTimer();
                for (Goblin goblin : goblins) {
                    goblin.update();
                }
            }
        } else if (status == GameStatus.PAUSED) {
            //do nothing if paused
        } else if (status == GameStatus.RESTART){
            restartGame();
            status = GameStatus.PLAYING;
        }
    }

    /**
     * Dispatches music transitions when the game status changes.
     * INSTRUCTIONS doesn't restart the menu loop on the way back so the player isn't
     * jarred by an audio reset. PAUSED pauses the current clip; PLAYING resumes when
     * coming from PAUSED (preserves position) and otherwise loads the gameplay loop.
     */
    private void onStatusChanged(GameStatus oldStatus, GameStatus newStatus) {
        switch (newStatus) {
            case MENU:
                if (oldStatus != GameStatus.INSTRUCTIONS) {
                    stopMusic();
                    playMusic(Sound.MAIN_MENU);
                }
                break;
            case PLAYING:
                if (oldStatus == GameStatus.PAUSED) {
                    resumeMusic();
                } else {
                    stopMusic();
                    playMusic(Sound.INTRO);
                }
                break;
            case PAUSED:
            case END:
                pauseMusic();
                break;
            case INSTRUCTIONS:
            case RESTART:
                break;
        }
    }

    /** Loads slot {@code i} from {@link Sound} and loops it. No-op when music is disabled. */
    public void playMusic(int i) {
        if (!musicEnabled) {
            return;
        }
        sound.setFile(i);
        sound.loop();
    }

    /** Stops and unloads the current background clip. */
    public void stopMusic() {
        sound.stop();
    }

    /** Pauses the current clip while remembering its position. */
    public void pauseMusic() {
        sound.pause();
    }

    /** Resumes a paused clip from where {@link #pauseMusic()} left off (if music is enabled). */
    public void resumeMusic() {
        if (musicEnabled) {
            sound.resume();
        }
    }

    /**
     * Flips the {@link #musicEnabled} flag. Disabling pauses the current clip; enabling
     * restarts the currently loaded loop from the start (position-reset is acceptable for
     * an ambient background loop and avoids carrying stale positions across state changes).
     */
    public void toggleMusic() {
        musicEnabled = !musicEnabled;
        if (musicEnabled) {
            sound.loop();
        } else {
            sound.pause();
        }
    }


    /**
     * Renders all game components based on the current game state.
     * This method is automatically called after each update.
     *
     * @param g The graphics context used for drawing.
     */
    public void paintComponent(Graphics g){
        super.paintComponent(g);
        /*
         * Graphics2D extends Graphics and provides more methods
         * coordinate transformations, color management etc
         */
        Graphics2D g2 = (Graphics2D)g;

        if (status == GameStatus.MENU){
            menuUI.draw(g2);
        } else if (status == GameStatus.END) {
            endUI.draw(g2);
        } else if (status == GameStatus.INSTRUCTIONS) {
            instructionsUI.draw(g2);
        } else {
            tileM.draw(g2);
            obj.draw(g2,this);
            Player.draw(g2);
            for (Goblin goblin : goblins) {
                goblin.draw(g2);
            }
            ui.draw(g2);
        }

        g2.dispose();
    }


    /**
     * Returns an iterator for iterating over the goblin entities.
     *
     * @return An iterator for the list of goblins.
     */
    public Iterator<Goblin> getGoblinIterator(){
        return goblins.iterator();
    }


    /**
     * Returns the menu UI instance.
     *
     * @return The menu UI.
     */
    public MenuUI getMenuUI(){
        return menuUI;
    }


    /**
     * Restarts the game by reloading all game components using the setGame() method
     */
    public void restartGame() {
        setGame();
    }

}