import { config, datastore } from './config.js';

export class Bloop {
  constructor({ id, x, y, radius = 78 }) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.baseRadius = radius;
    this.colorA = '#ff77c8';
    this.colorB = '#ffd3f0';
    this.shadow = 'rgba(255, 103, 187, 0.28)';
    this.phase = Math.random() * Math.PI * 2;
    this.wobble = 0;
    this.scale = 1;
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
    const dx = x - this.x;
    const dy = y - this.y;
    return Math.hypot(dx, dy) <= this.radius * this.scale * 0.95;
  }

  update(time) {
    this.wobble = Math.sin(time * 0.0028 + this.phase) * 0.08;
    const targetScale = this.isActive ? config.interaction.dragScaleBoost : 1;
    this.scale += (targetScale - this.scale) * 0.16;
  }

  draw(ctx) {
    const t = datastore.time * 0.001;
    this.update(datastore.time);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);

    ctx.shadowColor = this.shadow;
    ctx.shadowBlur = 32;

    const body = new Path2D();
    body.moveTo(0, -this.radius * 1.02);
    body.bezierCurveTo(
      this.radius * 0.95,
      -this.radius * 0.95,
      this.radius * 1.08,
      this.radius * 0.3,
      0,
      this.radius * 1.02
    );
    body.bezierCurveTo(
      -this.radius * 1.1,
      this.radius * 0.35,
      -this.radius * 0.9,
      -this.radius * 0.98,
      0,
      -this.radius * 1.02
    );

    const gradient = ctx.createRadialGradient(
      -this.radius * 0.2,
      -this.radius * 0.35,
      this.radius * 0.1,
      0,
      0,
      this.radius * 1.15
    );
    gradient.addColorStop(0, this.colorB);
    gradient.addColorStop(0.55, this.colorA);
    gradient.addColorStop(1, '#a91f72');
    ctx.fillStyle = gradient;
    ctx.rotate(this.wobble);
    ctx.fill(body);

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.32)';
    ctx.beginPath();
    ctx.ellipse(-this.radius * 0.24, -this.radius * 0.38, this.radius * 0.28, this.radius * 0.14, -0.5, 0, Math.PI * 2);
    ctx.fill();

    const auraRadius = this.radius * (1.18 + Math.sin(t * 2 + this.phase) * 0.04);
    ctx.strokeStyle = 'rgba(255, 180, 233, 0.35)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#361128';
    ctx.beginPath();
    ctx.arc(-this.radius * 0.24, -this.radius * 0.08, this.radius * 0.09, 0, Math.PI * 2);
    ctx.arc(this.radius * 0.24, -this.radius * 0.05, this.radius * 0.09, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#5d173f';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-this.radius * 0.22, this.radius * 0.25);
    ctx.quadraticCurveTo(0, this.radius * 0.45 + Math.sin(t * 4 + this.phase) * 3, this.radius * 0.22, this.radius * 0.2);
    ctx.stroke();

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

    osc.type = 'sine';
    osc.frequency.setValueAtTime(196, now);
    osc.frequency.exponentialRampToValueAtTime(138, now + 0.28);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);
    filter.Q.value = 3;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(config.audio.masterGain, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.42);
  }
}
