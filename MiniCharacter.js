import { config } from './config.js';
import { Bloop } from './Bloop.js';
import { Melo } from './Melo.js';
import { Grizz } from './Grizz.js';
import { Pico } from './Pico.js';
import { Nova } from './Nova.js';

const CLASS_MAP = {
  bloop: Bloop,
  melo: Melo,
  grizz: Grizz,
  pico: Pico,
  nova: Nova
};

export class MiniCharacter {
  constructor({ sourceId, x, y, vx = 0, vy = 0, radius = 28, targetRadius = null, growthDurationMs = config.characters.growthDurationMs }) {
    this.sourceId = sourceId;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
    this.initialRadius = radius;
    this.targetRadius = targetRadius || radius;
    this.growthDurationMs = growthDurationMs;
    this.createdAt = performance.now();
    this.alive = true;
    this.rotation = Math.random() * Math.PI * 2;
    this.spin = (Math.random() - 0.5) * 0.08;

    const CharacterClass = CLASS_MAP[sourceId] || Bloop;
    this.character = new CharacterClass({
      id: sourceId,
      x,
      y,
      radius
    });

    this.character.scale = 0.9;
    this.character.isActive = false;
    this.character.zIndex = 0;
    this.character.growth = {
      startTime: this.createdAt,
      initialRadius: this.initialRadius,
      targetRadius: this.targetRadius,
      durationMs: this.growthDurationMs
    };
  }

  update(now) {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.05;
    this.vx *= 0.992;
    this.rotation += this.spin;

    const age = now - this.createdAt;
    const growthProgress = this.growthDurationMs <= 0
      ? 1
      : Math.min(age / this.growthDurationMs, 1);
    this.radius = this.initialRadius + (this.targetRadius - this.initialRadius) * growthProgress;
    this.character.radius = this.radius;
    this.character.baseRadius = this.radius;
    this.character.setPosition(this.x, this.y);
  }

  draw(ctx, now) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.translate(-this.x, -this.y);
    this.character.draw(ctx);
    ctx.restore();
  }
}
