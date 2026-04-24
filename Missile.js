import { datastore, config } from './config.js';

export class Missile {
  constructor({ x, y, angle }) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = config.missile.speed;
    this.radius = 7;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.alive = true;
    this.spawnTime = performance.now();
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    const out =
      this.x < -40 ||
      this.x > datastore.width + 40 ||
      this.y < -40 ||
      this.y > datastore.height + 40;

    const expired = performance.now() - this.spawnTime > config.missile.lifeMs;
    if (out || expired) {
      this.alive = false;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    ctx.shadowColor = 'rgba(255, 180, 90, 0.65)';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#ffd36b';
    ctx.beginPath();
    ctx.moveTo(this.radius * 1.8, 0);
    ctx.lineTo(-this.radius, -this.radius * 0.8);
    ctx.lineTo(-this.radius * 0.55, 0);
    ctx.lineTo(-this.radius, this.radius * 0.8);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    const trail = ctx.createLinearGradient(-this.radius * 3.6, 0, this.radius * 0.8, 0);
    trail.addColorStop(0, 'rgba(255, 95, 95, 0)');
    trail.addColorStop(0.5, 'rgba(255, 120, 70, 0.55)');
    trail.addColorStop(1, 'rgba(255, 240, 180, 0.9)');
    ctx.strokeStyle = trail;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-this.radius * 3.4, 0);
    ctx.lineTo(this.radius * 0.4, 0);
    ctx.stroke();

    ctx.restore();
  }

  playSound(audioCtx) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.setValueAtTime(860, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.08);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.value = 2.5;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(config.audio.masterGain * 0.32, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }
}
