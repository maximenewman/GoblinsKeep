package com.goblinskeep.app;

import java.net.URL;
import javax.sound.sampled.AudioFormat;
import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.Clip;

/**
 * Wraps a single {@link Clip} for background-music playback.
 * Audio files are addressed by index into a fixed slot array — see {@link #SOUND_PATHS}
 * for the slot-to-resource mapping. Decoding relies on the vorbisspi service provider
 * declared in {@code pom.xml} so OGG files load through {@code AudioSystem} the same
 * way native WAV files would.
 */
public class Sound {

    /** Slot index for the main-menu loop. */
    public static final int MAIN_MENU = 0;

    /** Slot index for the in-game intro loop. */
    public static final int INTRO = 1;

    private static final String[] SOUND_PATHS = {
        "/sound/mainmenu.ogg",
        "/sound/Intro.ogg"
    };

    private final URL[] soundURL = new URL[SOUND_PATHS.length];
    private Clip clip;
    private long pausedPositionMicros;

    /**
     * Resolves all sound resources at construction so a missing file fails fast at
     * startup instead of mid-game.
     */
    public Sound() {
        for (int i = 0; i < SOUND_PATHS.length; i++) {
            soundURL[i] = getClass().getResource(SOUND_PATHS[i]);
            if (soundURL[i] == null) {
                throw new RuntimeException("Sound resource not found: " + SOUND_PATHS[i]);
            }
        }
    }

    /**
     * Loads the audio clip at the given slot index, replacing the currently held clip.
     * Decodes vorbisspi's compressed VORBISENC stream into PCM_SIGNED — {@code Clip}
     * cannot open a compressed stream directly.
     *
     * @param i slot index — see {@link #MAIN_MENU}, {@link #INTRO}
     */
    public void setFile(int i) {
        try (AudioInputStream encoded = AudioSystem.getAudioInputStream(soundURL[i])) {
            AudioFormat sourceFormat = encoded.getFormat();
            AudioFormat pcmFormat = new AudioFormat(
                AudioFormat.Encoding.PCM_SIGNED,
                sourceFormat.getSampleRate(),
                16,
                sourceFormat.getChannels(),
                sourceFormat.getChannels() * 2,
                sourceFormat.getSampleRate(),
                false);
            try (AudioInputStream pcm = AudioSystem.getAudioInputStream(pcmFormat, encoded)) {
                clip = AudioSystem.getClip();
                clip.open(pcm);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to load audio: " + soundURL[i], e);
        }
    }

    /** Plays the loaded clip from the start, once. */
    public void play() {
        clip.setMicrosecondPosition(0);
        clip.start();
    }

    /** Plays the loaded clip from the start, looping forever. */
    public void loop() {
        clip.setMicrosecondPosition(0);
        clip.loop(Clip.LOOP_CONTINUOUSLY);
    }

    /** Stops and closes the loaded clip; the clip can no longer be resumed. */
    public void stop() {
        if (clip != null) {
            clip.stop();
            clip.close();
        }
    }

    /** Stops the loaded clip but remembers its position so {@link #resume()} can pick up. */
    public void pause() {
        if (clip != null) {
            pausedPositionMicros = clip.getMicrosecondPosition();
            clip.stop();
        }
    }

    /** Resumes a paused clip from where {@link #pause()} left off. */
    public void resume() {
        if (clip != null) {
            clip.setMicrosecondPosition(pausedPositionMicros);
            clip.start();
        }
    }
}
