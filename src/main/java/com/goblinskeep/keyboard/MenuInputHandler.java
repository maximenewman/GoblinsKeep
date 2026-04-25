package com.goblinskeep.keyboard;


import com.goblinskeep.UI.*;
import com.goblinskeep.app.GamePanel;
import com.goblinskeep.app.GameStatus;

import java.awt.event.KeyEvent;
import java.awt.event.KeyListener;

/**
 * Handles keyboard input for all UI menu systems in the game.
 */
public class MenuInputHandler implements KeyListener {
    private final GamePanel gp;
    private final MenuUI menuUI;
    private final PauseUI pauseUI;
    private final EndUI endUI;
    private final InstructionsUI instructionsUI;
    private boolean cursorRelease = true;


    /**
     * Constructs a MenuInputHandler with the specified GamePanel.
     *
     * @param gp the GamePanel instance
     */
    public MenuInputHandler(GamePanel gp) {
        this.gp = gp;
        menuUI = gp.getMenuUI();
        pauseUI = gp.ui.pauseUI;
        endUI = gp.endUI;
        instructionsUI = gp.instructionsUI;
    }

    /**
     * This method is not used but must be implemented as part of the KeyListener interface.
     *
     * @param e the KeyEvent
     */
    @Override
    public void keyTyped(KeyEvent e) {
        // This method is not used

    }

    /**
     * Handles key press events for menu navigation and game state toggling.
     *
     * @param e The KeyEvent containing the pressed key information.
     */
    @Override
    public void keyPressed(KeyEvent e) {
        int code = e.getKeyCode();

        switch(code){
            case KeyEvent.VK_ESCAPE:
            case KeyEvent.VK_P:
                // Toggle between playing and paused status
                if (gp.status == GameStatus.PLAYING){
                    gp.status = GameStatus.PAUSED;
                } else if (gp.status == GameStatus.PAUSED){
                    gp.status = GameStatus.PLAYING;
                }
                break;
            case KeyEvent.VK_M:
                gp.toggleMusic();
                break;
            case KeyEvent.VK_SPACE:
            case KeyEvent.VK_ENTER:
            case KeyEvent.VK_UP:
            case KeyEvent.VK_DOWN:
                // Handle menu navigation and selection for each UI when their state is active
                if (gp.status == GameStatus.MENU){
                    handleMenuKeyEvent(menuUI, GameStatus.MENU, code);
                } else if (gp.status == GameStatus.PAUSED) {
                    handleMenuKeyEvent(pauseUI, GameStatus.PAUSED, code);
                } else if (gp.status == GameStatus.END){
                    handleMenuKeyEvent(endUI, GameStatus.END, code);
                } else if (gp.status == GameStatus.INSTRUCTIONS){
                    handleMenuKeyEvent(instructionsUI, GameStatus.INSTRUCTIONS, code);
                }
                break;
        }

    }

    /**
     * Handles menu navigation and selection based on the current game status and key input.
     *
     * @param ui      The UI component to handle.
     * @param status  The current game status.
     * @param keyCode The key code of the pressed key.
     */
    public void handleMenuKeyEvent(DefaultUI ui, GameStatus status, int keyCode) {
        if (gp.status == status) {
            switch (keyCode) {
                //for selecting an option
                case KeyEvent.VK_SPACE:
                case KeyEvent.VK_ENTER:
                    switch (ui.getCurrentOption()) {
                        case RESUME:
                            gp.status = GameStatus.PLAYING;
                            break;
                        case RESTART:
                            gp.status = GameStatus.RESTART;
                            break;
                        case QUIT:
                            System.exit(0);
                            break;
                        case MENU:
                            gp.status = GameStatus.MENU;
                            break;
                        case INSTRUCTIONS:
                            gp.status = GameStatus.INSTRUCTIONS;
                            break;

                    }
                    break;
                case KeyEvent.VK_UP:
                    if (cursorRelease) {
                        // Move cursor up in the menu
                        ui.moveCursorUp();
                        cursorRelease = false;
                    }
                    break;
                case KeyEvent.VK_DOWN:
                    if (cursorRelease) {
                        // Move cursor down in the menu
                        ui.moveCursorDown();
                        cursorRelease = false;
                    }
                    break;
            }
        }
    }

    /**
     * Detects when a key is released and updates the cursor release state.
     *
     * @param e The KeyEvent containing the released key information.
     */
    @Override
    public void keyReleased(KeyEvent e) {
        int code = e.getKeyCode();
        if (code == KeyEvent.VK_UP || code == KeyEvent.VK_DOWN) {
            cursorRelease = true;
        }
    }

}

