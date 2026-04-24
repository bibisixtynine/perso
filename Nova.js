import { config, datastore } from './config.js';

export class Nova {
  constructor({ id, x, y, radius = 76 }) {
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
    return Math.hypot(x - this.x, y - this.y) <= this.radius * this.scale * 1.04;
  }

  update(time) {
    const targetScale = this.isActive ? config.interaction.dragScaleBoost : 1;
    this.scale += (targetScale - this.scale) * 0.12;
    this.twinkle = Math.sin(time * 0.004 + this.phase) * 0.08;
  }

  draw(ctx) {
    this.update(datastore.time);
    const t = datastore.time * 0.001;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);
    ctx.rotate(this.twinkle);

    ctx.shadowColor = 'rgba(255, 236, 125, 0.32)';
    ctx.shadowBlur = 34;

    const star = new Path2D();
    const points = 8;
    for (let i = 0; i < points * 2; i += 1) {
      const angle = (-Math.PI / 2) + (Math.PI * i) / points;
      const r = i % 2 === 0 ? this.radius : this.radius * 0.46;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) star.moveTo(px, py);
      else star.lineTo(px, py);
    }
    star.closePath();

    const glow = ctx.createRadialGradient(0, 0, this.radius * 0.08, 0, 0, this.radius * 1.05);
    glow.addColorStop(0, '#fffdf0');
    glow.addColorStop(0.38, '#ffe884');
    glow.addColorStop(0.72, '#ff9a57');
    glow.addColorStop(1, '#b64152');
    ctx.fillStyle = glow;
    ctx.fill(star);

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.34)';
    ctx.beginPath();
    ctx.arc(-this.radius * 0.18, -this.radius * 0.28, this.radius * 0.16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#462347';
    ctx.beginPath();
    ctx.arc(-this.radius * 0.18, -this.radius * 0.02, this.radius * 0.08, 0, Math.PI * 2);
    ctx.arc(this.radius * 0.18, -this.radius * 0.02, this.radius * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#633145';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-this.radius * 0.2, this.radius * 0.18);
    ctx.quadraticCurveTo(0, this.radius * 0.3 + Math.sin(t * 4.4 + this.phase) * 2, this.radius * 0.2, this.radius * 0.18);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 238, 155, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * (1.2 + Math.sin(t * 3.2 + this.phase) * 0.03), 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  playSound(audioCtx) {
    if (!audioCtx) return;
    const nowMs = performance.now();
    if (nowMs - this.lastSoundTime < config.interaction.soundThrottleMs) return;
    this.lastSoundTime = nowMs;

    const now = audioCtx.currentTime;
    const gain = audioCtx.createGain();
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(523.25, now);
    osc2.frequency.setValueAtTime(783.99, now);
    osc2.detune.setValueAtTime(-4, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(config.audio.masterGain * 0.6, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.56);
    osc2.stop(now + 0.56);
  }
}
