/**
 * Web Audio counterpart to Java's Sound.java. Holds one slot per OGG track,
 * plays at most one source at a time, and tracks elapsed time for pause/resume.
 *
 * Differences from Java:
 *   • {@link loadAll} pre-decodes every track up-front so {@link play} /
 *     {@link loop} are sync at runtime — Web Audio decoding is async.
 *   • {@link unlock} resumes the AudioContext, which browsers keep suspended
 *     until a user gesture. Call from a one-time keydown / pointerdown hook.
 *   • An {@link enabled} flag mirrors the Java {@code musicEnabled} toggle —
 *     {@link play} / {@link loop} no-op while it's false; {@link toggle} is
 *     wired to the M key.
 */
export class Sound {
  static readonly MAIN_MENU = 0;
  static readonly INTRO = 1;

  private static readonly SOUND_PATHS: readonly string[] = [
    `${import.meta.env.BASE_URL}sound/mainmenu.ogg`,
    `${import.meta.env.BASE_URL}sound/Intro.ogg`,
  ];

  /** Default enabled. Toggled by the M key. */
  enabled = true;

  private readonly ctx: AudioContext;
  private readonly buffers: (AudioBuffer | null)[] = [];
  private source: AudioBufferSourceNode | null = null;
  private currentSlot = -1;
  /** AudioContext time when the current source started (or 0 when none). */
  private startedAt = 0;
  /** Elapsed playback offset captured by the last {@link pause}. */
  private pausedOffset = 0;
  /** Whether the current source was started in loop mode — restored on resume. */
  private isLooping = false;

  constructor() {
    this.ctx = new AudioContext();
    this.buffers.length = Sound.SOUND_PATHS.length;
    this.buffers.fill(null);
  }

  /**
   * Fetches and decodes every track. Resolves once all are ready so subsequent
   * {@link setFile} / {@link play} calls are sync.
   */
  async loadAll(): Promise<void> {
    await Promise.all(
      Sound.SOUND_PATHS.map(async (path, i) => {
        const response = await fetch(path);
        const arrayBuffer = await response.arrayBuffer();
        this.buffers[i] = await this.ctx.decodeAudioData(arrayBuffer);
      }),
    );
  }

  /** Selects which decoded buffer subsequent {@link play} / {@link loop} use. */
  setFile(slot: number): void {
    if (slot < 0 || slot >= Sound.SOUND_PATHS.length) {
      throw new RangeError(`Sound slot out of range: ${slot}`);
    }
    this.currentSlot = slot;
  }

  /**
   * Resumes the AudioContext if browsers have suspended it (autoplay policy).
   * Call from a one-time user-gesture handler at the start of the page life.
   */
  async unlock(): Promise<void> {
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
  }

  /** Plays the selected buffer once from the start. */
  play(): void {
    if (!this.enabled) return;
    this.startSource(0, false);
  }

  /** Plays the selected buffer in a loop from the start. */
  loop(): void {
    if (!this.enabled) return;
    this.startSource(0, true);
  }

  /** Stops the current source and discards its position. */
  stop(): void {
    if (!this.source) return;
    try {
      this.source.stop();
    } catch {
      // start()'s internal state may already be "ended" — ignore.
    }
    this.source.disconnect();
    this.source = null;
  }

  /** Stops the current source but remembers its elapsed time for {@link resume}. */
  pause(): void {
    if (!this.source) return;
    const elapsed = this.ctx.currentTime - this.startedAt;
    const buffer = this.currentBuffer();
    this.pausedOffset = buffer ? elapsed % buffer.duration : elapsed;
    this.stop();
  }

  /** Restarts the current buffer from the {@link pause} offset, with prior loop mode. */
  resume(): void {
    if (!this.enabled) return;
    this.startSource(this.pausedOffset, this.isLooping);
  }

  /**
   * Flips {@link enabled}. Pauses on disable, restarts the loop on re-enable.
   * Position-reset is acceptable for an ambient background loop and keeps the
   * resume math simple.
   */
  toggle(): void {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.loop();
    } else {
      this.pause();
    }
  }

  private startSource(offset: number, looping: boolean): void {
    const buffer = this.currentBuffer();
    if (!buffer) return;
    this.stop();
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = looping;
    source.connect(this.ctx.destination);
    source.start(0, offset);
    this.source = source;
    this.startedAt = this.ctx.currentTime - offset;
    this.isLooping = looping;
  }

  private currentBuffer(): AudioBuffer | null {
    if (this.currentSlot < 0) return null;
    return this.buffers[this.currentSlot] ?? null;
  }
}
