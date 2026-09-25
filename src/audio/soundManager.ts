/**
 * China Ball Web Audio Synthesizer & Tactile Haptics
 * Zero-asset, low-latency procedural sound effects for kicks, post hits, referee whistle, crowd cheer and goal horns.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggleMute(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  public isMuted(): boolean {
    return !this.enabled;
  }

  // Tactile haptic feedback with safe check
  public vibrate(pattern: number | number[]) {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch {}
  }

  // Realistic ball kick sound: punchy low-end sub-thump + crisp ball snap
  public playKick(power: number = 1) {
    this.vibrate(12);
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;

      // 1. Sub-punch (deep body of a leather soccer ball)
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(160 * Math.min(power, 1.2), t);
      subOsc.frequency.exponentialRampToValueAtTime(32, t + 0.08);

      subGain.gain.setValueAtTime(0.55 * Math.min(1.2, power), t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(t);
      subOsc.stop(t + 0.10);

      // 2. Mid resonance (leather skin slap)
      const midOsc = this.ctx.createOscillator();
      const midGain = this.ctx.createGain();
      midOsc.type = 'triangle';
      midOsc.frequency.setValueAtTime(280 * power, t);
      midOsc.frequency.exponentialRampToValueAtTime(80, t + 0.05);

      midGain.gain.setValueAtTime(0.25 * power, t);
      midGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      midOsc.connect(midGain);
      midGain.connect(this.ctx.destination);
      midOsc.start(t);
      midOsc.stop(t + 0.07);

      // 3. Noise click (shoe contact with ball texture)
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.02);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.28, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.02);
      noise.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(t);
    } catch {
      // AudioContext failed safely
    }
  }

  // Metallic post hit ("CLANG!" / "PING!")
  public playPostHit() {
    this.vibrate([25, 30, 45]);
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      [880, 1760, 2640, 3520].forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq + (i * 15), t);

        gain.gain.setValueAtTime(0.35 / (i + 1), t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.6);
      });
    } catch {
      // AudioContext failed safely
    }
  }

  // Ball hitting stadium wall
  public playWallBounce() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(42, t + 0.06);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    } catch {
      // Safe
    }
  }

  // Net rustle / swoosh sound when the ball billows into the goal
  public playNetSwoosh() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.28);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.linearRampToValueAtTime(400, t + 0.25);
      filter.Q.value = 1.8;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(t);
    } catch {}
  }

  // Referee Whistle ("Fshhh-tweet-tweet!")
  public playWhistle() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2400, t);
      osc.frequency.linearRampToValueAtTime(2700, t + 0.06);
      osc.frequency.linearRampToValueAtTime(2450, t + 0.12);
      osc.frequency.linearRampToValueAtTime(2800, t + 0.18);

      gain.gain.setValueAtTime(0.0, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 0.02);
      gain.gain.setValueAtTime(0.35, t + 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    } catch {
      // Safe
    }
  }

  // Goal celebration horn, crowd roar & celebratory vibration
  public playGoal() {
    this.vibrate([40, 50, 80, 50, 140]);
    this.playNetSwoosh();
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      this.playWhistle();

      // Stadium fanfare chords
      const t = this.ctx.currentTime + 0.1;
      const chords = [392, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
      chords.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.10, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 1.4);
      });
    } catch {
      // Safe
    }
  }
}

export const sounds = new SoundManager();
