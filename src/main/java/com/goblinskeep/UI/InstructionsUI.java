package com.goblinskeep.UI;

import com.goblinskeep.app.GamePanel;
import com.goblinskeep.objects.Key;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents the instructions UI component, displaying game instructions.
 */
public class InstructionsUI extends DefaultUI{

    /** Reference to the main game panel. */
    public GamePanel gp;

    /** Image of Key. */
    public BufferedImage keyImage;

    private BufferedImage backgroundImage;
    private List<String> messages = new ArrayList<>();

    /**
     * Constructs an InstructionsUI with the specified GamePanel.
     *
     * @param gp the GamePanel instance
     */
    public InstructionsUI(GamePanel gp) {
        super(gp);
        this.gp = gp;
        Key key = new Key();
        keyImage = key.image;
        totalSelections = 1;
        try {
            backgroundImage = ImageIO.read(getClass().getResourceAsStream("/UI_img/titleScreen.png"));
        } catch (IOException e) {
            e.printStackTrace();
        }
        createMessage();

    }

    /**
     * Draws the instructions UI.
     *
     * @param g2 the Graphics2D object used for drawing
     */
    public void draw(Graphics2D g2) {
        if (backgroundImage != null) {
            g2.drawImage(backgroundImage, 0, 0, gp.screenWidth, gp.screenHeight, null);
        }
        borderThickness = 3;
        //dim the background image
        g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.6f));
        g2.setColor(Color.BLACK);
        g2.fillRect(0, 0, gp.screenWidth, gp.screenHeight);

        // Reset the composite to full opacity
        g2.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 1.0f));
        g2.setStroke(new BasicStroke(3));
        g2.setFont(gameFont.deriveFont(60f));
        String title = "INSTRUCTIONS";
        int x = getCenteredXAxisText(title, g2);
        int y = gp.tileSize * 2;
        g2.setColor(Color.WHITE);
        //draw title text
        drawTextWithBorder(g2,title, x, y);

        //draw instructions text
        borderThickness = 1;
        g2.setFont(UIFont.deriveFont(25f));
        for (int i = 0; i < messages.size(); i++){
            drawTextWithBorder(g2,messages.get(i), getCenteredXAxisText(messages.get(i), g2), (gp.tileSize/2) * (8 + i) );
        }


        String menu = "BACK TO MENU";

        //draw menu option
        borderThickness = 2;
        g2.setFont(gameFont.deriveFont(40f));
        drawCursorOptionsCentered(g2, new String[]{menu}, 11);

    }

    /**
     * Creates the instruction messages to be displayed.
     */
    private void createMessage(){
        messages.add("After getting trapped in the Goblin kings maze-like castle,");
        messages.add("you must now find your way out and escape to the woods");
        messages.add("MOVEMENT: WASD or Arrow Keys to move UP,LEFT,DOWN,RIGHT");
        messages.add("MUSIC: Press M to toggle background music on/off");
        messages.add("HOW TO ESCAPE: ");
        messages.add("Collect the 5 key fragments to unlock the lever");
        messages.add("After the lever is unlocked find it and activate it to open the escape door");
        messages.add("Once the escape door is opened, find it to escape out the castle");
        messages.add("Collect meat to increase your score");
        messages.add("If you step into an acid puddle you will lose score");
        messages.add("If the roaming goblins capture you or your score becomes negative you will lose");
        messages.add("");
        messages.add("Credits: Hugo Najafi, Maxime Nereyabagabo, Arun Paudel, Vamsi Suggu");
    }


    /**
     * Gets the current option selected in the menu.
     *
     * @return the current option
     */
    @Override
    public Options getCurrentOption() {
        switch (cursorSelection){
            case 0:
                return Options.MENU;
        }
        return null;
    }
}