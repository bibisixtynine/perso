import { datastore, config } from './config.js';

export class Rocket {
  constructor({ x, y, vx = 1.8, vy = -0.6 }) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.speed = config.rocket.speed;
    this.radius = 22;
    this.wobblePhase = Math.random() * Math.PI * 2;
    this.lastShotTime = 0;
    this.lastHumTime = 0;
  }

  update(time) {
    const t = time * 0.001;
    this.x += this.vx * this.speed;
    this.y += this.vy * this.speed + Math.sin(t * 1.7 + this.wobblePhase) * 0.18;

    const margin = 60;
    if (this.x < margin || this.x > datastore.width - margin) {
      this.vx *= -1;
      this.x = Math.max(margin, Math.min(datastore.width - margin, this.x));
    }
    if (this.y < margin || this.y > datastore.height * 0.42) {
      this.vy *= -1;
      this.y = Math.max(margin, Math.min(datastore.height * 0.42, this.y));
    }

    const drift = Math.sin(t * 0.9 + this.wobblePhase) * 0.015;
    const cos = Math.cos(drift);
    const sin = Math.sin(drift);
    const nextVx = this.vx * cos - this.vy * sin;
    const nextVy = this.vx * sin + this.vy * cos;
    const len = Math.hypot(nextVx, nextVy) || 1;
    this.vx = nextVx / len;
    this.vy = nextVy / len;
  }

  canShoot(nowMs) {
    return nowMs - this.lastShotTime >= config.rocket.fireIntervalMs;
  }

  markShot(nowMs) {
    this.lastShotTime = nowMs;
  }

  getAngle() {
    return Math.atan2(this.vy, this.vx);
  }

  getNosePosition() {
    const angle = this.getAngle();
    return {
      x: this.x + Math.cos(angle) * this.radius * 1.4,
      y: this.y + Math.sin(angle) * this.radius * 1.4
    };
  }

  draw(ctx) {
    const t = datastore.time * 0.001;
    const angle = this.getAngle();

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);

    ctx.shadowColor = 'rgba(255, 130, 90, 0.35)';
    ctx.shadowBlur = 24;

    const flameLen = 18 + Math.sin(t * 18) * 5;
    const flame = ctx.createLinearGradient(-this.radius * 1.1, 0, -this.radius * 2.2 - flameLen, 0);
    flame.addColorStop(0, 'rgba(255,240,180,0.95)');
    flame.addColorStop(0.45, 'rgba(255,163,76,0.85)');
    flame.addColorStop(1, 'rgba(255,77,77,0)');
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.moveTo(-this.radius * 0.9, -8);
    ctx.quadraticCurveTo(-this.radius * 2 - flameLen * 0.3, 0, -this.radius * 0.9, 8);
    ctx.fill();

    ctx.shadowBlur = 0;
    const body = ctx.createLinearGradient(-this.radius, 0, this.radius * 1.2, 0);
    body.addColorStop(0, '#f5f0ff');
    body.addColorStop(0.45, '#b79dff');
    body.addColorStop(1, '#ff6b9e');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(this.radius * 1.3, 0);
    ctx.quadraticCurveTo(this.radius * 0.2, -this.radius * 0.8, -this.radius, -this.radius * 0.45);
    ctx.lineTo(-this.radius * 0.9, this.radius * 0.45);
    ctx.quadraticCurveTo(this.radius * 0.2, this.radius * 0.8, this.radius * 1.3, 0);
    ctx.fill();

    ctx.fillStyle = '#7a56f5';
    ctx.beginPath();
    ctx.moveTo(-this.radius * 0.35, -this.radius * 0.4);
    ctx.lineTo(-this.radius * 1.05, -this.radius * 0.95);
    ctx.lineTo(-this.radius * 0.72, -this.radius * 0.2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-this.radius * 0.35, this.radius * 0.4);
    ctx.lineTo(-this.radius * 1.05, this.radius * 0.95);
    ctx.lineTo(-this.radius * 0.72, this.radius * 0.2);
    ctx.fill();

    ctx.fillStyle = '#14213d';
    ctx.beginPath();
    ctx.arc(this.radius * 0.28, 0, this.radius * 0.32, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-this.radius * 0.2, -this.radius * 0.18);
    ctx.lineTo(this.radius * 0.9, -this.radius * 0.02);
    ctx.stroke();

    ctx.restore();
  }

  playSound(audioCtx) {
    if (!audioCtx) return;
    const nowMs = performance.now();
    if (nowMs - this.lastHumTime < 1400) return;
    this.lastHumTime = nowMs;

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.25);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, now);
    filter.Q.value = 4;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(config.audio.masterGain * 0.2, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.42);
  }
}
