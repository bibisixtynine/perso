import { datastore } from './config.js';

export class SplitFragment {
  constructor({ x, y, vx, vy, radius, lifeMs = 1100, rotation = 0, spin = 0, palette = {}, shape = 'blob', side = 1 }) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
    this.lifeMs = lifeMs;
    this.rotation = rotation;
    this.spin = spin;
    this.palette = palette;
    this.shape = shape;
    this.side = side;
    this.createdAt = performance.now();
    this.alive = true;
  }

  update() {
    const age = performance.now() - this.createdAt;
    if (age >= this.lifeMs) {
      this.alive = false;
      return;
    }

    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.08;
    this.vx *= 0.995;
    this.rotation += this.spin;
  }

  draw(ctx) {
    const age = performance.now() - this.createdAt;
    const p = Math.min(age / this.lifeMs, 1);
    const alpha = 1 - p;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.globalAlpha = alpha;
    ctx.shadowColor = this.palette.shadow || 'rgba(255,255,255,0.2)';
    ctx.shadowBlur = 16;

    if (this.shape === 'flower') {
      for (let i = 0; i < 4; i += 1) {
        ctx.save();
        ctx.rotate(((Math.PI * 2) / 4) * i + this.side * 0.18);
        const g = ctx.createLinearGradient(0, -this.radius * 0.1, 0, this.radius * 0.7);
        g.addColorStop(0, this.palette.a || '#fff2bf');
        g.addColorStop(0.55, this.palette.b || '#ffb454');
        g.addColorStop(1, this.palette.c || '#ff6b6b');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, -this.radius * 0.15);
        ctx.bezierCurveTo(this.radius * 0.18, this.radius * 0.06, this.radius * 0.24, this.radius * 0.55, 0, this.radius * 0.72);
        ctx.bezierCurveTo(-this.radius * 0.24, this.radius * 0.55, -this.radius * 0.18, this.radius * 0.06, 0, -this.radius * 0.15);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = this.palette.core || '#ffe56a';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 0.36, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.shape === 'shell') {
      const shell = new Path2D();
      shell.moveTo(-this.radius * 0.6, -this.radius * 0.58);
      shell.quadraticCurveTo(0, -this.radius * 0.86, this.radius * 0.62, -this.radius * 0.5);
      shell.lineTo(this.radius * 0.76, this.radius * 0.34);
      shell.quadraticCurveTo(this.radius * 0.16, this.radius * 0.92, -this.radius * 0.7, this.radius * 0.4);
      shell.closePath();
      const g = ctx.createLinearGradient(-this.radius, -this.radius, this.radius, this.radius);
      g.addColorStop(0, this.palette.a || '#b8fff4');
      g.addColorStop(0.5, this.palette.b || '#1dd6c1');
      g.addColorStop(1, this.palette.c || '#0c5c72');
      ctx.fillStyle = g;
      ctx.fill(shell);
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 2; i += 1) {
        const y = -this.radius * 0.08 + i * this.radius * 0.24;
        ctx.beginPath();
        ctx.moveTo(-this.radius * 0.32, y);
        ctx.quadraticCurveTo(0, y + this.side * 4, this.radius * 0.34, y);
        ctx.stroke();
      }
    } else if (this.shape === 'crystal') {
      const shard = new Path2D();
      shard.moveTo(0, -this.radius * 0.9);
      shard.bezierCurveTo(this.radius * 0.34, -this.radius * 0.34, this.radius * 0.52, this.radius * 0.16, 0, this.radius * 0.88);
      shard.bezierCurveTo(-this.radius * 0.56, this.radius * 0.2, -this.radius * 0.34, -this.radius * 0.4, 0, -this.radius * 0.9);
      const g = ctx.createLinearGradient(0, -this.radius, 0, this.radius);
      g.addColorStop(0, this.palette.a || '#f0f4ff');
      g.addColorStop(0.45, this.palette.b || '#a3b1ff');
      g.addColorStop(1, this.palette.c || '#5d38d6');
      ctx.fillStyle = g;
      ctx.fill(shard);
      ctx.strokeStyle = 'rgba(255,255,255,0.26)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -this.radius * 0.66);
      ctx.lineTo(0, this.radius * 0.62);
      ctx.stroke();
    } else if (this.shape === 'star') {
      const star = new Path2D();
      const points = 6;
      for (let i = 0; i < points * 2; i += 1) {
        const angle = (-Math.PI / 2) + (Math.PI * i) / points;
        const r = i % 2 === 0 ? this.radius : this.radius * 0.44;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (i === 0) star.moveTo(px, py);
        else star.lineTo(px, py);
      }
      star.closePath();
      const g = ctx.createRadialGradient(0, 0, this.radius * 0.08, 0, 0, this.radius);
      g.addColorStop(0, this.palette.a || '#fffdf0');
      g.addColorStop(0.4, this.palette.b || '#ffe884');
      g.addColorStop(0.72, this.palette.c || '#ff9a57');
      g.addColorStop(1, this.palette.d || '#b64152');
      ctx.fillStyle = g;
      ctx.fill(star);
    } else {
      const body = new Path2D();
      body.moveTo(0, -this.radius * 0.92);
      body.bezierCurveTo(this.radius * 0.84, -this.radius * 0.86, this.radius * 0.94, this.radius * 0.24, 0, this.radius * 0.94);
      body.bezierCurveTo(-this.radius * 0.96, this.radius * 0.28, -this.radius * 0.82, -this.radius * 0.9, 0, -this.radius * 0.92);
      const g = ctx.createRadialGradient(-this.radius * 0.16, -this.radius * 0.24, this.radius * 0.08, 0, 0, this.radius);
      g.addColorStop(0, this.palette.a || '#ffd3f0');
      g.addColorStop(0.58, this.palette.b || '#ff77c8');
      g.addColorStop(1, this.palette.c || '#a91f72');
      ctx.fillStyle = g;
      ctx.fill(body);
    }

    ctx.restore();
  }
}
