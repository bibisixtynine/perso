import { config, datastore } from './config.js';

export class Pico {
  constructor({ id, x, y, radius = 68 }) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.baseRadius = radius;
    this.scale = 1;
    this.phase = Math.random() * Math.PI * 2;
    this.isActive = false;
    this.zIndex = 0;
    this.lastSoundTime = 0;
    this.vx = 0;
    this.vy = 0;
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  contains(x, y) {
    return Math.hypot(x - this.x, y - this.y) <= this.radius * this.scale * 1.06;
  }

  update(time) {
    const targetScale = this.isActive ? config.interaction.dragScaleBoost : 1;
    this.scale += (targetScale - this.scale) * 0.18;
    this.rotation = Math.sin(time * 0.003 + this.phase) * 0.14;
  }

  draw(ctx) {
    this.update(datastore.time);
    const t = datastore.time * 0.001;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);
    ctx.rotate(this.rotation);

    ctx.shadowColor = 'rgba(141, 122, 255, 0.3)';
    ctx.shadowBlur = 26;

    const shard = new Path2D();
    shard.moveTo(0, -this.radius);
    shard.bezierCurveTo(this.radius * 0.4, -this.radius * 0.42, this.radius * 0.66, this.radius * 0.18, 0, this.radius * 0.98);
    shard.bezierCurveTo(-this.radius * 0.7, this.radius * 0.2, -this.radius * 0.42, -this.radius * 0.46, 0, -this.radius);

    const gradient = ctx.createLinearGradient(0, -this.radius, 0, this.radius);
    gradient.addColorStop(0, '#f0f4ff');
    gradient.addColorStop(0.4, '#a3b1ff');
    gradient.addColorStop(1, '#5d38d6');
    ctx.fillStyle = gradient;
    ctx.fill(shard);

    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.38)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -this.radius * 0.76);
    ctx.lineTo(0, this.radius * 0.72);
    ctx.stroke();

    ctx.fillStyle = '#1f1e4f';
    ctx.beginPath();
    ctx.arc(-this.radius * 0.16, -this.radius * 0.05, this.radius * 0.08, 0, Math.PI * 2);
    ctx.arc(this.radius * 0.16, -this.radius * 0.05, this.radius * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#2e236e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-this.radius * 0.18, this.radius * 0.2);
    ctx.quadraticCurveTo(0, this.radius * 0.32 + Math.sin(t * 6 + this.phase) * 2, this.radius * 0.18, this.radius * 0.2);
    ctx.stroke();

    for (let i = 0; i < 3; i += 1) {
      const angle = -0.5 + i * 0.5 + Math.sin(t * 4 + i) * 0.02;
      ctx.strokeStyle = `rgba(179, 197, 255, ${0.28 - i * 0.06})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * this.radius * 0.9, Math.sin(angle) * this.radius * 0.9);
      ctx.lineTo(Math.cos(angle) * this.radius * 1.28, Math.sin(angle) * this.radius * 1.28);
      ctx.stroke();
    }

    ctx.restore();
  }

  playSound(audioCtx) {
    if (!audioCtx) return;
    const nowMs = performance.now();
    if (nowMs - this.lastSoundTime < config.interaction.soundThrottleMs) return;
    this.lastSoundTime = nowMs;

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(740, now);
    osc.frequency.exponentialRampToValueAtTime(987, now + 0.16);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.value = 4;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(config.audio.masterGain * 0.55, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.24);
  }
}
