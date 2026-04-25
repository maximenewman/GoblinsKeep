package com.goblinskeep.app;

import javax.swing.JFrame;

/**
 * The main entry point of the Goblin's Keep game.
 * This class initializes the game window and starts the game loop.d
 */
public class App 
{
    /**
     * The main method initializes the game window and starts the game loop.
     *
     * @param args Command-line arguments (not used).
     */
    public static void main( String[] args )
    {
        //create a new window JFrame for the game
        JFrame window = new JFrame();

        // Set the default close operation to exit the application when the window is closed
        window.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);

        // Prevent the window from being resized
        window.setResizable(false);

        // Set the title of the game window
        window.setTitle("Goblin's Keep");

        // Create an instance of GamePanel, which will handle game rendering and logic
        GamePanel gamepanel = new GamePanel();

        // Add the game panel to the window
        window.add(gamepanel);

        //Adjusts the window size based on the preferred size of its components.
        //This ensures that the GamePanel fits properly within the JFrame.
        window.pack();

        // Center the window on the screen
        window.setLocationRelativeTo(null);

        // Enable music and start the menu loop. Done here (not in the GamePanel
        // constructor) so unit tests can construct a GamePanel silently.
        gamepanel.musicEnabled = true;
        gamepanel.playMusic(Sound.MAIN_MENU);

        // Start the game loop/thread
        gamepanel.startGameThread();

        // Make the window visible
        window.setVisible(true);
    }
}
