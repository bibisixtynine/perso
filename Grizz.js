import { config, datastore } from './config.js';

export class Grizz {
  constructor({ id, x, y, radius = 82 }) {
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
    return Math.hypot(x - this.x, y - this.y) <= this.radius * this.scale;
  }

  update(time) {
    const targetScale = this.isActive ? config.interaction.dragScaleBoost : 1;
    this.scale += (targetScale - this.scale) * 0.14;
    this.sway = Math.sin(time * 0.0013 + this.phase) * 0.05;
  }

  draw(ctx) {
    this.update(datastore.time);
    const t = datastore.time * 0.001;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);
    ctx.rotate(this.sway);

    ctx.shadowColor = 'rgba(62, 236, 215, 0.22)';
    ctx.shadowBlur = 32;

    const shell = new Path2D();
    shell.moveTo(-this.radius * 0.7, -this.radius * 0.68);
    shell.quadraticCurveTo(0, -this.radius * 1.02, this.radius * 0.7, -this.radius * 0.64);
    shell.lineTo(this.radius * 0.88, this.radius * 0.45);
    shell.quadraticCurveTo(this.radius * 0.2, this.radius * 1.08, -this.radius * 0.82, this.radius * 0.48);
    shell.closePath();

    const g = ctx.createLinearGradient(-this.radius, -this.radius, this.radius, this.radius);
    g.addColorStop(0, '#b8fff4');
    g.addColorStop(0.48, '#1dd6c1');
    g.addColorStop(1, '#0c5c72');
    ctx.fillStyle = g;
    ctx.fill(shell);

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.moveTo(-this.radius * 0.42, -this.radius * 0.4);
    ctx.quadraticCurveTo(0, -this.radius * 0.64, this.radius * 0.34, -this.radius * 0.18);
    ctx.quadraticCurveTo(0, -this.radius * 0.24, -this.radius * 0.42, -this.radius * 0.4);
    ctx.fill();

    ctx.fillStyle = '#083742';
    ctx.beginPath();
    ctx.arc(-this.radius * 0.22, -this.radius * 0.02, this.radius * 0.09, 0, Math.PI * 2);
    ctx.arc(this.radius * 0.22, -this.radius * 0.02, this.radius * 0.09, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#0a3f49';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-this.radius * 0.26, this.radius * 0.22);
    ctx.quadraticCurveTo(0, this.radius * 0.44 + Math.sin(t * 3.5 + this.phase) * 2, this.radius * 0.26, this.radius * 0.22);
    ctx.stroke();

    for (let i = 0; i < 3; i += 1) {
      const y = -this.radius * 0.18 + i * this.radius * 0.22;
      ctx.strokeStyle = `rgba(170, 255, 246, ${0.35 - i * 0.08})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-this.radius * 0.42, y);
      ctx.quadraticCurveTo(0, y + Math.sin(t * 2 + i + this.phase) * 8, this.radius * 0.42, y);
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

    osc.type = 'square';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(92, now + 0.22);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(520, now);
    filter.Q.value = 8;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(config.audio.masterGain * 0.65, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.32);
  }
}
