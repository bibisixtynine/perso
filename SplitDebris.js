export class SplitDebris {
  constructor({ x, y, vx, vy, size, lifeMs = 700, color = '#ffffff', shape = 'dot' }) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.lifeMs = lifeMs;
    this.color = color;
    this.shape = shape;
    this.createdAt = performance.now();
    this.rotation = Math.random() * Math.PI * 2;
    this.spin = (Math.random() - 0.5) * 0.3;
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
    this.vy += 0.06;
    this.vx *= 0.992;
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
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.5;

    if (this.shape === 'line') {
      ctx.beginPath();
      ctx.moveTo(-this.size, 0);
      ctx.lineTo(this.size, 0);
      ctx.stroke();
    } else if (this.shape === 'diamond') {
      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      ctx.lineTo(this.size, 0);
      ctx.lineTo(0, this.size);
      ctx.lineTo(-this.size, 0);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
