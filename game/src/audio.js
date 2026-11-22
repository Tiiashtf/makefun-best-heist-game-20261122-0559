// audio.js — every sound is synthesized with WebAudio, no audio files.
// One job: short cues for pickup, alarm, being caught, the vault, and tools.
// The game never needs a network fetch for sound, and M mutes everything.

export class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.alarmNodes = null;
  }

  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopAlarm();
    return this.muted;
  }

  tone(freq, dur, type = 'sine', vol = 0.12, when = 0, slideTo = null) {
    if (this.muted) return;
    const ctx = this.ensure();
    if (!ctx) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  play(name) {
    if (this.muted) return;
    switch (name) {
      case 'pickup':
        this.tone(880, 0.09, 'sine', 0.14);
        this.tone(1318, 0.14, 'sine', 0.12, 0.07);
        break;
      case 'spotted':
        this.tone(220, 0.25, 'square', 0.1, 0, 440);
        break;
      case 'caught':
        this.tone(330, 0.5, 'sawtooth', 0.14, 0, 110);
        this.tone(165, 0.6, 'sawtooth', 0.1, 0.1, 55);
        break;
      case 'vaultClick':
        this.tone(1200, 0.05, 'square', 0.1);
        break;
      case 'vaultMiss':
        this.tone(180, 0.2, 'square', 0.12, 0, 120);
        break;
      case 'vaultOpen':
        this.tone(523, 0.12, 'sine', 0.14);
        this.tone(659, 0.12, 'sine', 0.14, 0.1);
        this.tone(784, 0.25, 'sine', 0.14, 0.2);
        break;
      case 'smoke':
        this.tone(300, 0.3, 'sine', 0.08, 0, 90);
        break;
      case 'emp':
        this.tone(1400, 0.18, 'sawtooth', 0.07, 0, 200);
        break;
      case 'coin':
        this.tone(2400, 0.06, 'sine', 0.1);
        this.tone(1800, 0.08, 'sine', 0.08, 0.12);
        break;
      case 'levelClear':
        [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.16, 'sine', 0.13, i * 0.11));
        break;
      case 'win':
        [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.22, 'sine', 0.13, i * 0.13));
        break;
      default:
        break;
    }
  }

  // A two-tone siren while the alarm is high; call every frame, it manages itself.
  alarmLoop(active) {
    if (this.muted || !active) {
      this.stopAlarm();
      return;
    }
    const ctx = this.ensure();
    if (!ctx || this.alarmNodes) return;
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 660;
    lfo.type = 'sine';
    lfo.frequency.value = 1.4;
    lfoGain.gain.value = 220;
    gain.gain.value = 0.035;
    lfo.connect(lfoGain).connect(osc.frequency);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    lfo.start();
    this.alarmNodes = { osc, lfo, gain };
  }

  stopAlarm() {
    if (!this.alarmNodes) return;
    try {
      this.alarmNodes.osc.stop();
      this.alarmNodes.lfo.stop();
    } catch { /* already stopped */ }
    this.alarmNodes = null;
  }
}
