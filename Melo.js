import { config, datastore } from './config.js';

export class Melo {
  constructor({ id, x, y, radius = 74 }) {
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
    this.petals = 7;
    this.vx = 0;
    this.vy = 0;
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  contains(x, y) {
    return Math.hypot(x - this.x, y - this.y) <= this.radius * this.scale * 1.02;
  }

  update(time) {
    const targetScale = this.isActive ? config.interaction.dragScaleBoost : 1;
    this.scale += (targetScale - this.scale) * 0.14;
    this.rotation = Math.sin(time * 0.0017 + this.phase) * 0.22;
  }

  draw(ctx) {
    this.update(datastore.time);
    const t = datastore.time * 0.001;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);
    ctx.rotate(this.rotation);

    ctx.shadowColor = 'rgba(255, 186, 91, 0.28)';
    ctx.shadowBlur = 28;

    for (let i = 0; i < this.petals; i += 1) {
      const angle = (Math.PI * 2 * i) / this.petals;
      ctx.save();
      ctx.rotate(angle + Math.sin(t * 1.5 + i + this.phase) * 0.03);
      const petalGradient = ctx.createLinearGradient(0, -this.radius * 0.12, 0, this.radius * 0.9);
      petalGradient.addColorStop(0, '#fff2bf');
      petalGradient.addColorStop(0.5, '#ffb454');
      petalGradient.addColorStop(1, '#ff6b6b');
      ctx.fillStyle = petalGradient;
      ctx.beginPath();
      ctx.moveTo(0, -this.radius * 0.18);
      ctx.bezierCurveTo(this.radius * 0.2, this.radius * 0.08, this.radius * 0.28, this.radius * 0.72, 0, this.radius * 0.95);
      ctx.bezierCurveTo(-this.radius * 0.28, this.radius * 0.72, -this.radius * 0.2, this.radius * 0.08, 0, -this.radius * 0.18);
      ctx.fill();
      ctx.restore();
    }

    ctx.shadowBlur = 0;
    const core = ctx.createRadialGradient(0, 0, this.radius * 0.08, 0, 0, this.radius * 0.56);
    core.addColorStop(0, '#fffef0');
    core.addColorStop(0.45, '#ffe56a');
    core.addColorStop(1, '#db6c00');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.56, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4c2b00';
    ctx.beginPath();
    ctx.arc(-this.radius * 0.17, -this.radius * 0.08, this.radius * 0.08, 0, Math.PI * 2);
    ctx.arc(this.radius * 0.17, -this.radius * 0.08, this.radius * 0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#7c4200';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-this.radius * 0.2, this.radius * 0.16);
    ctx.quadraticCurveTo(0, this.radius * 0.34 + Math.sin(t * 5 + this.phase) * 2, this.radius * 0.2, this.radius * 0.16);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 240, 170, 0.42)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 1.12 + Math.sin(t * 3 + this.phase) * 4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  playSound(audioCtx) {
    if (!audioCtx) return;
    const nowMs = performance.now();
    if (nowMs - this.lastSoundTime < config.interaction.soundThrottleMs) return;
    this.lastSoundTime = nowMs;

    const now = audioCtx.currentTime;
    const oscA = audioCtx.createOscillator();
    const oscB = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    oscA.type = 'triangle';
    oscB.type = 'sine';
    oscA.frequency.setValueAtTime(440, now);
    oscB.frequency.setValueAtTime(660, now);
    oscB.detune.setValueAtTime(7, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(config.audio.masterGain * 0.7, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);

    oscA.connect(gain);
    oscB.connect(gain);
    gain.connect(audioCtx.destination);

    oscA.start(now);
    oscB.start(now);
    oscA.stop(now + 0.5);
    oscB.stop(now + 0.5);
  }
}
