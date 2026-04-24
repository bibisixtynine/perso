import { config } from './config.js';

export class Explosion {
  constructor({ x, y, radius }) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.createdAt = performance.now();
    this.lifeMs = config.explosion.lifeMs;
    this.alive = true;
  }

  update() {
    const age = performance.now() - this.createdAt;
    if (age >= this.lifeMs) {
      this.alive = false;
    }
  }

  draw(ctx) {
    const age = performance.now() - this.createdAt;
    const p = Math.min(age / this.lifeMs, 1);
    const burst = this.radius * (0.4 + p * 1.5);
    const alpha = 1 - p;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, burst);
    glow.addColorStop(0, `rgba(255,255,220,${0.9 * alpha})`);
    glow.addColorStop(0.35, `rgba(255,196,92,${0.75 * alpha})`);
    glow.addColorStop(0.7, `rgba(255,98,88,${0.45 * alpha})`);
    glow.addColorStop(1, 'rgba(255,98,88,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(this.x, this.y, burst, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(255,240,190,${0.7 * alpha})`;
    ctx.lineWidth = 3;
    for (let i = 0; i < 10; i += 1) {
      const angle = (Math.PI * 2 * i) / 10 + p * 0.6;
      const inner = burst * 0.35;
      const outer = burst * 1.08;
      ctx.beginPath();
      ctx.moveTo(this.x + Math.cos(angle) * inner, this.y + Math.sin(angle) * inner);
      ctx.lineTo(this.x + Math.cos(angle) * outer, this.y + Math.sin(angle) * outer);
      ctx.stroke();
    }

    ctx.restore();
  }

  playSound(audioCtx) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const bufferSize = Math.max(1, Math.floor(audioCtx.sampleRate * 0.22));
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      const p = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - p, 2.4);
    }

    const source = audioCtx.createBufferSource();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();

    source.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(220, now + 0.2);

    gain.gain.setValueAtTime(config.audio.masterGain * 0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    source.start(now);
  }
}
