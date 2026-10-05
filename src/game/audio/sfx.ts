export class Sfx {
  muted = false;
  private ctx: AudioContext | null = null;
  private music = false;
  private musicTimer: number | null = null;
  private intensity = 0;
  private beat = 0;

  ensure(): void {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  jump(): void {
    this.tone(320, 520, 0.09, 'square', 0.05);
  }

  slide(): void {
    this.tone(240, 90, 0.12, 'triangle', 0.05);
  }

  lane(): void {
    this.tone(180, 240, 0.05, 'sine', 0.03);
  }

  collect(): void {
    this.tone(680, 980, 0.07, 'sine', 0.05);
    this.later(() => this.tone(980, 1320, 0.08, 'sine', 0.04), 60);
  }

  powerup(): void {
    this.tone(392, 523, 0.08, 'square', 0.05);
    this.later(() => this.tone(523, 659, 0.08, 'square', 0.05), 70);
    this.later(() => this.tone(659, 784, 0.1, 'square', 0.05), 140);
  }

  hit(): void {
    this.noise(0.18, 0.08);
    this.tone(140, 50, 0.22, 'sawtooth', 0.07);
  }

  reject(): void {
    this.tone(440, 220, 0.16, 'square', 0.05);
    this.later(() => this.tone(220, 110, 0.22, 'square', 0.06), 140);
  }

  gameOver(): void {
    this.tone(330, 196, 0.2, 'triangle', 0.06);
    this.later(() => this.tone(196, 130, 0.28, 'triangle', 0.06), 180);
    this.later(() => this.tone(130, 80, 0.35, 'sawtooth', 0.05), 380);
  }

  scan(): void {
    this.tone(880, 880, 0.04, 'square', 0.03);
    this.later(() => this.tone(1320, 1320, 0.04, 'square', 0.03), 80);
    this.later(() => this.tone(880, 880, 0.04, 'square', 0.03), 160);
  }

  stamp(): void {
    this.tone(90, 70, 0.1, 'square', 0.05);
    this.noise(0.08, 0.04);
  }

  nearMiss(): void {
    this.tone(740, 980, 0.06, 'sine', 0.04);
    this.later(() => this.tone(980, 1180, 0.05, 'sine', 0.03), 40);
  }

  startMusic(): void {
    this.ensure();
    if (this.muted || !this.ctx || this.music) return;
    this.music = true;
    this.scheduleBeat();
  }

  stopMusic(): void {
    this.music = false;
    if (this.musicTimer !== null) {
      window.clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  setIntensity(value: number): void {
    this.intensity = value;
  }

  private scheduleBeat(): void {
    if (!this.music || this.muted) return;
    const gap = 420 - this.intensity * 140;
    const base = 196 + this.intensity * 40;
    const notes = [0, 3, 7, 10, 7, 3];
    const step = notes[this.beat % notes.length]!;
    this.beat += 1;
    this.tone(base * Math.pow(1.059, step), base * Math.pow(1.059, step), 0.12, 'triangle', 0.018);
    this.musicTimer = window.setTimeout(() => this.scheduleBeat(), gap);
  }

  private later(fn: () => void, ms: number): void {
    window.setTimeout(fn, ms);
  }

  private tone(
    from: number,
    to: number,
    duration: number,
    type: OscillatorType,
    gainValue: number,
  ): void {
    if (this.muted) return;
    this.ensure();
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), ctx.currentTime + duration);
    gain.gain.setValueAtTime(gainValue, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.02);
  }

  private noise(duration: number, gainValue: number): void {
    if (this.muted) return;
    this.ensure();
    const ctx = this.ctx;
    if (!ctx) return;
    const length = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = buffer;
    gain.gain.value = gainValue;
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  }
}
