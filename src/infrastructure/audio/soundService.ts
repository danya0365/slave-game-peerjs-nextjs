/**
 * Sound Service - Generate game sounds using Web Audio API
 * No external audio files needed!
 */

type SoundType =
  | "cardPlay"
  | "cardSelect"
  | "pass"
  | "win"
  | "lose"
  | "turnStart"
  | "gameStart"
  | "error"
  | "playerJoin"
  | "playerReady"
  | "countdown"
  | "click";

type BgmType = "waiting" | "game";

class SoundService {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.3;
  private bgmEnabled: boolean = true;
  private bgmVolume: number = 0.15;
  private bgmInterval: NodeJS.Timeout | null = null;
  private bgmPlaying: boolean = false;
  private currentBgmType: BgmType | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    }
    return this.audioContext;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopBgm();
    }
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getVolume(): number {
    return this.volume;
  }

  // BGM Controls
  setBgmEnabled(enabled: boolean) {
    this.bgmEnabled = enabled;
    if (!enabled) {
      this.stopBgm();
    }
  }

  setBgmVolume(volume: number) {
    this.bgmVolume = Math.max(0, Math.min(1, volume));
  }

  isBgmEnabled(): boolean {
    return this.bgmEnabled;
  }

  isBgmPlaying(): boolean {
    return this.bgmPlaying;
  }

  /**
   * Play a sound effect
   */
  play(type: SoundType) {
    if (!this.enabled || typeof window === "undefined") return;

    try {
      const ctx = this.getAudioContext();
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      switch (type) {
        case "cardPlay":
          this.playCardSound(ctx);
          break;
        case "cardSelect":
          this.playSelectSound(ctx);
          break;
        case "pass":
          this.playPassSound(ctx);
          break;
        case "win":
          this.playWinSound(ctx);
          break;
        case "lose":
          this.playLoseSound(ctx);
          break;
        case "turnStart":
          this.playTurnSound(ctx);
          break;
        case "gameStart":
          this.playGameStartSound(ctx);
          break;
        case "error":
          this.playErrorSound(ctx);
          break;
        case "playerJoin":
          this.playPlayerJoinSound(ctx);
          break;
        case "playerReady":
          this.playPlayerReadySound(ctx);
          break;
        case "countdown":
          this.playCountdownSound(ctx);
          break;
        case "click":
          this.playClickSound(ctx);
          break;
      }
    } catch (e) {
      console.warn("Sound play failed:", e);
    }
  }

  // Card play - snap/click sound
  private playCardSound(ctx: AudioContext) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(this.volume * 0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }

  // Card select - soft click
  private playSelectSound(ctx: AudioContext) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(this.volume * 0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }

  // Pass - whoosh sound
  private playPassSound(ctx: AudioContext) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }

  // Win - happy ascending melody
  private playWinSound(ctx: AudioContext) {
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.connect(gain);
      gain.connect(ctx.destination);

      const startTime = ctx.currentTime + i * 0.12;

      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(this.volume * 0.4, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

      osc.start(startTime);
      osc.stop(startTime + 0.15);
    });
  }

  // Lose - sad descending melody
  private playLoseSound(ctx: AudioContext) {
    const notes = [392, 349, 330, 262]; // G4, F4, E4, C4

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.connect(gain);
      gain.connect(ctx.destination);

      const startTime = ctx.currentTime + i * 0.2;

      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(this.volume * 0.3, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);

      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  }

  // Turn start - notification ding
  private playTurnSound(ctx: AudioContext) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }

  // Game start - fanfare
  private playGameStartSound(ctx: AudioContext) {
    const notes = [262, 330, 392, 523]; // C4, E4, G4, C5

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.connect(gain);
      gain.connect(ctx.destination);

      const startTime = ctx.currentTime + i * 0.08;

      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(this.volume * 0.35, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  }

  // Error - buzz
  private playErrorSound(ctx: AudioContext) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(150, ctx.currentTime);

    gain.gain.setValueAtTime(this.volume * 0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }

  // Player join - welcome chime
  private playPlayerJoinSound(ctx: AudioContext) {
    const notes = [440, 554, 659]; // A4, C#5, E5

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.connect(gain);
      gain.connect(ctx.destination);

      const startTime = ctx.currentTime + i * 0.1;

      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(this.volume * 0.3, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

      osc.start(startTime);
      osc.stop(startTime + 0.15);
    });
  }

  // Player ready - confirmation sound
  private playPlayerReadySound(ctx: AudioContext) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(this.volume * 0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }

  // Countdown tick
  private playCountdownSound(ctx: AudioContext) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(600, ctx.currentTime);

    gain.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }

  // Simple click
  private playClickSound(ctx: AudioContext) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(1000, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(this.volume * 0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.03);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.03);
  }

  // Background music - ambient loop
  startBgm(type: BgmType = "waiting") {
    if (!this.bgmEnabled || typeof window === "undefined") return;

    // If already playing same type, do nothing
    if (this.bgmPlaying && this.currentBgmType === type) return;

    // Stop current BGM if switching types
    if (this.bgmPlaying) {
      this.stopBgm();
    }

    this.bgmPlaying = true;
    this.currentBgmType = type;

    if (type === "waiting") {
      this.playWaitingBgm();
    } else {
      this.playGameBgm();
    }
  }

  // Waiting room BGM - calm ambient
  private playWaitingBgm() {
    const playAmbientNote = () => {
      if (
        !this.bgmPlaying ||
        !this.bgmEnabled ||
        this.currentBgmType !== "waiting"
      )
        return;

      try {
        const ctx = this.getAudioContext();
        if (ctx.state === "suspended") {
          ctx.resume();
        }

        // Soft ambient chord
        const notes = [130.81, 164.81, 196]; // C3, E3, G3
        const now = ctx.currentTime;

        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sine";
          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(this.bgmVolume * 0.3, now + 0.5);
          gain.gain.linearRampToValueAtTime(this.bgmVolume * 0.2, now + 2);
          gain.gain.linearRampToValueAtTime(0, now + 3);

          osc.start(now + i * 0.05);
          osc.stop(now + 3);
        });
      } catch (e) {
        console.warn("Waiting BGM failed:", e);
      }
    };

    playAmbientNote();
    this.bgmInterval = setInterval(playAmbientNote, 4000);
  }

  // Game BGM - more energetic rhythm
  private playGameBgm() {
    let beatIndex = 0;

    const playBeat = () => {
      if (
        !this.bgmPlaying ||
        !this.bgmEnabled ||
        this.currentBgmType !== "game"
      )
        return;

      try {
        const ctx = this.getAudioContext();
        if (ctx.state === "suspended") {
          ctx.resume();
        }

        const now = ctx.currentTime;

        // Rhythmic bass pattern
        const bassNotes = [98, 110, 123, 110]; // G2, A2, B2, A2
        const bassNote = bassNotes[beatIndex % bassNotes.length];

        // Bass
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = "sine";
        bassOsc.connect(bassGain);
        bassGain.connect(ctx.destination);
        bassOsc.frequency.setValueAtTime(bassNote, now);
        bassGain.gain.setValueAtTime(this.bgmVolume * 0.25, now);
        bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        bassOsc.start(now);
        bassOsc.stop(now + 0.3);

        // Add subtle chord on every 4th beat
        if (beatIndex % 4 === 0) {
          const chordNotes = [196, 247, 294]; // G3, B3, D4
          chordNotes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "triangle";
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(this.bgmVolume * 0.15, now + 0.1);
            gain.gain.linearRampToValueAtTime(0, now + 0.8);
            osc.start(now + i * 0.02);
            osc.stop(now + 0.8);
          });
        }

        beatIndex++;
      } catch (e) {
        console.warn("Game BGM failed:", e);
      }
    };

    playBeat();
    this.bgmInterval = setInterval(playBeat, 500); // 120 BPM
  }

  stopBgm() {
    this.bgmPlaying = false;
    this.currentBgmType = null;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  getCurrentBgmType(): BgmType | null {
    return this.currentBgmType;
  }

  toggleBgm(type?: BgmType) {
    if (this.bgmPlaying) {
      this.stopBgm();
    } else {
      this.startBgm(type || "waiting");
    }
    return this.bgmPlaying;
  }
}

// Singleton instance
export const soundService = new SoundService();
