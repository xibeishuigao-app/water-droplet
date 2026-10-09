/**
 * Procedural Web Audio API Water Droplet & Ripple Sound Synthesizer
 * Generates physical Minnaert air-cavity bubble resonance and splash sound waves without external audio files.
 */

class WaterAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private rainSource: AudioBufferSourceNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  private isRainPlaying: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.7, this.ctx.currentTime, 0.05);
    }
  }

  public setVolume(volume: number) {
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime, 0.05);
    }
  }

  /**
   * Synthesizes physical water droplet impact:
   * 1. Bubble resonance: rising sine chirp (Minnaert cavity expansion)
   * 2. Impact transient: gentle filtered white noise burst
   */
  public playDrop(intensity: number = 1.0, pitchMod: number = 1.0) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const clampedIntensity = Math.max(0.3, Math.min(2.0, intensity));

    // Base pitch depends on droplet size: larger drops = lower pitch, smaller drops = crystal high pitch
    const baseFreq = (450 + (1.0 / clampedIntensity) * 280) * (0.85 + Math.random() * 0.3) * pitchMod;
    const endFreq = baseFreq * (1.6 + Math.random() * 0.4);
    const duration = 0.08 + clampedIntensity * 0.05;

    // 1. Minnaert bubble sine oscillator
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();

    osc.type = 'sine';
    // Frequency sweeps up as the bubble cavity collapses and resonates
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration);

    // Exponential decay of bubble ring
    oscGain.gain.setValueAtTime(0.35 * Math.min(1.2, clampedIntensity), t);
    oscGain.gain.exponentialRampToValueAtTime(0.0005, t + duration);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + duration);

    // 2. High-frequency water slap transient (filtered noise click)
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.025);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(baseFreq * 2.5, t);
    bandpass.Q.setValueAtTime(3.0, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12 * Math.min(1.0, clampedIntensity), t);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);

    noiseSource.connect(bandpass);
    bandpass.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noiseSource.start(t);
  }

  /**
   * Synthesizes continuous touch drag splash ripple
   */
  public playRippleWhoosh(speed: number) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const clampedSpeed = Math.max(0.1, Math.min(1.0, speed));
    const duration = 0.06;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260 + clampedSpeed * 220, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + duration);

    gain.gain.setValueAtTime(0.04 * clampedSpeed, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + duration);
  }

  /**
   * Soft water bubble pop when fish nibbles food
   */
  public playNibble() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const freq = 650 + Math.random() * 250;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.035);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  /**
   * Playful cheerful chime when Koi grows bigger
   */
  public playGrowthSparkle() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const notes = [587.33, 739.99, 880.0]; // D5, F#5, A5
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const noteTime = t + idx * 0.045;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.06, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(noteTime);
      osc.stop(noteTime + 0.12);
    });
  }

  /**
   * Delightful crystal birth chime when baby Koi fry is hatched
   */
  public playBabyBirthChime() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const chord = [783.99, 987.77, 1174.66, 1567.98]; // G5, B5, D6, G6
    chord.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const noteTime = t + idx * 0.05;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.07, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(noteTime);
      osc.stop(noteTime + 0.18);
    });
  }

  /**
   * Synthesizes ambient gentle rainfall sound
   */
  public updateRainAmbience(intensity: 'off' | 'light' | 'moderate' | 'heavy') {
    if (this.isMuted || intensity === 'off') {
      if (this.isRainPlaying && this.rainGain && this.ctx) {
        this.rainGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.4);
      }
      return;
    }

    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (!this.isRainPlaying) {
      // Create seamless loop of stereo pink noise with gentle modulation
      const bufferSize = this.ctx.sampleRate * 3; // 3-second seamless loop
      const rainBuffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
      for (let channel = 0; channel < 2; channel++) {
        const data = rainBuffer.getChannelData(channel);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
          b6 = white * 0.115926;
        }
      }

      this.rainSource = this.ctx.createBufferSource();
      this.rainSource.buffer = rainBuffer;
      this.rainSource.loop = true;

      this.rainFilter = this.ctx.createBiquadFilter();
      this.rainFilter.type = 'lowpass';
      this.rainFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);

      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

      this.rainSource.connect(this.rainFilter);
      this.rainFilter.connect(this.rainGain);
      this.rainGain.connect(this.masterGain);

      this.rainSource.start();
      this.isRainPlaying = true;
    }

    if (this.rainGain && this.rainFilter && this.ctx) {
      let targetGain = 0.06;
      let targetFreq = 1200;
      if (intensity === 'light') {
        targetGain = 0.04;
        targetFreq = 1000;
      } else if (intensity === 'moderate') {
        targetGain = 0.08;
        targetFreq = 1600;
      } else if (intensity === 'heavy') {
        targetGain = 0.14;
        targetFreq = 2400;
      }

      this.rainGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.3);
      this.rainFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.3);
    }
  }
}

export const waterAudio = new WaterAudioEngine();
