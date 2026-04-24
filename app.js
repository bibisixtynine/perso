import { config, datastore } from './config.js';
import { Bloop } from './Bloop.js';
import { Melo } from './Melo.js';
import { Grizz } from './Grizz.js';
import { Pico } from './Pico.js';
import { Nova } from './Nova.js';
import { Rocket } from './Rocket.js';
import { Missile } from './Missile.js';
import { Explosion } from './Explosion.js';
import { SplitFragment } from './SplitFragment.js';
import { SplitDebris } from './SplitDebris.js';
import { MiniCharacter } from './MiniCharacter.js';

export function app() {
  const canvas = document.getElementById('stage');
  const ctx = canvas.getContext('2d');
  let audioCtx = null;
  let lastFrame = performance.now();

  const state = {
    canvas,
    ctx,
    audioCtx,
    animationId: 0
  };

  function ensureAudio() {
    if (!state.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      state.audioCtx = new AudioContextClass();
      datastore.audioReady = true;
    }

    if (state.audioCtx.state === 'suspended') {
      state.audioCtx.resume();
    }

    return state.audioCtx;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, config.canvas.dprMax);
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    datastore.width = width;
    datastore.height = height;
    datastore.centerX = width / 2;
    datastore.centerY = height / 2;
  }

  function createCharacters() {
    const { width, height } = datastore;
    const y = height * 0.56;
    const xPositions = [0.15, 0.33, 0.5, 0.67, 0.84].map((ratio) => width * ratio);
    const verticalOffsets = [-30, 22, -12, 28, -18];

    datastore.characters = [
      new Bloop({ id: 'bloop', x: xPositions[0], y: y + verticalOffsets[0], radius: 78 }),
      new Melo({ id: 'melo', x: xPositions[1], y: y + verticalOffsets[1], radius: 74 }),
      new Grizz({ id: 'grizz', x: xPositions[2], y: y + verticalOffsets[2], radius: 82 }),
      new Pico({ id: 'pico', x: xPositions[3], y: y + verticalOffsets[3], radius: 68 }),
      new Nova({ id: 'nova', x: xPositions[4], y: y + verticalOffsets[4], radius: 76 })
    ];

    datastore.characters.forEach((character, index) => {
      character.zIndex = index;
    });
  }

  function clampCharacter(character) {
    const margin = character.radius * character.scale * 1.1;
    character.x = Math.max(margin, Math.min(datastore.width - margin, character.x));
    character.y = Math.max(margin, Math.min(datastore.height - margin, character.y));
  }

  function drawBackground() {
    const { width, height, time } = datastore;
    const t = time * 0.001;

    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, '#120824');
    bg.addColorStop(0.45, '#23124b');
    bg.addColorStop(1, '#081a2f');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const blobs = [
      { x: width * 0.18 + Math.sin(t * 0.8) * 40, y: height * 0.22 + Math.cos(t * 0.7) * 30, r: Math.max(width, height) * 0.28, c: 'rgba(255, 77, 160, 0.20)' },
      { x: width * 0.78 + Math.cos(t * 0.6) * 46, y: height * 0.3 + Math.sin(t * 0.4) * 36, r: Math.max(width, height) * 0.34, c: 'rgba(64, 122, 255, 0.18)' },
      { x: width * 0.5 + Math.sin(t * 0.5) * 32, y: height * 0.78 + Math.cos(t * 0.9) * 24, r: Math.max(width, height) * 0.3, c: 'rgba(45, 226, 197, 0.15)' },
      { x: width * 0.42 + Math.cos(t * 0.9) * 20, y: height * 0.12 + Math.sin(t * 0.8) * 15, r: Math.max(width, height) * 0.18, c: 'rgba(255, 184, 107, 0.12)' }
    ];

    blobs.forEach((blob) => {
      const radial = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
      radial.addColorStop(0, blob.c);
      radial.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = radial;
      ctx.beginPath();
      ctx.arc(blob.x, blob.y, blob.r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i += 1) {
      const yBase = height * (0.18 + i * 0.16);
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(255,255,255,0.09)' : 'rgba(255,180,120,0.08)';
      ctx.lineWidth = 18 - i * 2;
      ctx.beginPath();
      ctx.moveTo(-40, yBase + Math.sin(t * 1.1 + i) * 12);
      ctx.bezierCurveTo(
        width * 0.25,
        yBase - 40 + Math.cos(t * 1.5 + i) * 20,
        width * 0.65,
        yBase + 40 + Math.sin(t * 0.8 + i) * 22,
        width + 40,
        yBase + Math.cos(t * 1.1 + i) * 12
      );
      ctx.stroke();
    }
    ctx.restore();

    for (let i = 0; i < 40; i += 1) {
      const px = ((i * 197) % width) + Math.sin(t * 0.3 + i) * 12;
      const py = (((i * 131) + 70) % height) + Math.cos(t * 0.25 + i) * 10;
      const radius = 1.2 + ((i * 17) % 4);
      ctx.fillStyle = `rgba(255,255,255,${0.08 + (i % 5) * 0.02})`;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawIntroOverlay(now) {
    const elapsed = now - datastore.appStartTime;
    if (elapsed >= config.intro.durationMs) return;

    const fadeWindow = Math.min(900, config.intro.durationMs * 0.35);
    const alpha = elapsed > config.intro.durationMs - fadeWindow
      ? 1 - (elapsed - (config.intro.durationMs - fadeWindow)) / fadeWindow
      : 1;

    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);

    const overlay = ctx.createLinearGradient(0, 0, 0, datastore.height);
    overlay.addColorStop(0, 'rgba(10, 7, 24, 0.18)');
    overlay.addColorStop(1, 'rgba(10, 7, 24, 0.42)');
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, datastore.width, datastore.height);

    const titleY = datastore.centerY - 10;
    const versionY = datastore.centerY + 34;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = 'rgba(255, 140, 200, 0.35)';
    ctx.shadowBlur = 24;
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.font = '700 42px Inter, system-ui, sans-serif';
    ctx.fillText(config.appName, datastore.centerX, titleY);

    ctx.shadowBlur = 14;
    ctx.fillStyle = 'rgba(255, 222, 189, 0.92)';
    ctx.font = '500 18px Inter, system-ui, sans-serif';
    ctx.fillText(config.version, datastore.centerX, versionY);

    ctx.restore();
  }

  function sortCharacters() {
    datastore.characters.sort((a, b) => a.zIndex - b.zIndex);
  }

  function bringToFront(character) {
    datastore.zCounter += 1;
    character.zIndex = datastore.zCounter;
    sortCharacters();
  }

  function getPointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  function pickCharacter(x, y) {
    const characters = [...datastore.characters].sort((a, b) => b.zIndex - a.zIndex);
    return characters.find((character) => character.contains(x, y)) || null;
  }

  function clearActiveState() {
    datastore.characters.forEach((character) => {
      character.isActive = false;
    });
    datastore.activeCharacter = null;
  }

  function startDrag(event) {
    const pos = getPointerPosition(event);
    datastore.pointer.x = pos.x;
    datastore.pointer.y = pos.y;
    datastore.pointer.isDown = true;
    datastore.pointer.activeId = event.pointerId;

    const picked = pickCharacter(pos.x, pos.y);
    if (!picked) return;

    ensureAudio();
    picked.playSound(state.audioCtx);
    bringToFront(picked);
    clearActiveState();
    picked.isActive = true;
    datastore.activeCharacter = picked;
    datastore.pointer.draggedCharacterId = picked.id;
    datastore.dragOffset.x = pos.x - picked.x;
    datastore.dragOffset.y = pos.y - picked.y;

    canvas.classList.add('dragging');
    canvas.setPointerCapture?.(event.pointerId);
  }

  function moveDrag(event) {
    const pos = getPointerPosition(event);
    datastore.pointer.x = pos.x;
    datastore.pointer.y = pos.y;
    if (!datastore.pointer.isDown) return;
    if (datastore.pointer.activeId !== event.pointerId) return;

    const active = datastore.activeCharacter;
    if (!active) return;

    active.setPosition(pos.x - datastore.dragOffset.x, pos.y - datastore.dragOffset.y);
    clampCharacter(active);
  }

  function endDrag(event) {
    if (datastore.pointer.activeId !== null && datastore.pointer.activeId !== event.pointerId) return;

    datastore.pointer.isDown = false;
    datastore.pointer.activeId = null;
    datastore.pointer.draggedCharacterId = null;
    canvas.classList.remove('dragging');
    datastore.characters.forEach((character) => {
      character.isActive = false;
    });
    datastore.activeCharacter = null;
  }

  function spawnSplitEffect(character, impactAngle) {
    const fragmentRadius = Math.max(16, character.radius * 0.34);
    const palettes = {
      bloop: {
        shape: 'blob',
        palette: { a: '#ffd3f0', b: '#ff77c8', c: '#a91f72', shadow: 'rgba(255, 103, 187, 0.28)' },
        debrisColors: ['#ffd3f0', '#ff77c8', '#a91f72'],
        debrisShape: 'dot'
      },
      melo: {
        shape: 'flower',
        palette: { a: '#fff2bf', b: '#ffb454', c: '#ff6b6b', core: '#ffe56a', shadow: 'rgba(255, 186, 91, 0.28)' },
        debrisColors: ['#fff2bf', '#ffb454', '#ff6b6b'],
        debrisShape: 'diamond'
      },
      grizz: {
        shape: 'shell',
        palette: { a: '#b8fff4', b: '#1dd6c1', c: '#0c5c72', shadow: 'rgba(62, 236, 215, 0.22)' },
        debrisColors: ['#b8fff4', '#1dd6c1', '#0c5c72'],
        debrisShape: 'line'
      },
      pico: {
        shape: 'crystal',
        palette: { a: '#f0f4ff', b: '#a3b1ff', c: '#5d38d6', shadow: 'rgba(141, 122, 255, 0.3)' },
        debrisColors: ['#f0f4ff', '#a3b1ff', '#5d38d6'],
        debrisShape: 'line'
      },
      nova: {
        shape: 'star',
        palette: { a: '#fffdf0', b: '#ffe884', c: '#ff9a57', d: '#b64152', shadow: 'rgba(255, 236, 125, 0.32)' },
        debrisColors: ['#fffdf0', '#ffe884', '#ff9a57'],
        debrisShape: 'diamond'
      }
    };

    const style = palettes[character.id] || palettes.bloop;
    const baseRotation = impactAngle + Math.PI / 2;

    for (let i = 0; i < 6; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const spread = impactAngle + (i - 2.5) * 0.38;
      datastore.splitFragments.push(
        new SplitFragment({
          x: character.x + Math.cos(spread) * (8 + Math.random() * 10),
          y: character.y + Math.sin(spread) * (8 + Math.random() * 10),
          vx: Math.cos(spread) * (2.2 + Math.random() * 2.4),
          vy: Math.sin(spread) * (1.8 + Math.random() * 2.2) - 1.4,
          radius: fragmentRadius * (0.86 + Math.random() * 0.34),
          rotation: baseRotation + i * 0.28,
          spin: side * (0.04 + Math.random() * 0.06),
          palette: style.palette,
          shape: style.shape,
          side
        })
      );
    }

    for (let i = 0; i < 18; i += 1) {
      const angle = impactAngle + (Math.random() - 0.5) * 2.2 + (i % 3 === 0 ? Math.PI : 0);
      const speed = 1.8 + Math.random() * 4.2;
      const color = style.debrisColors[i % style.debrisColors.length];
      datastore.splitDebris.push(
        new SplitDebris({
          x: character.x + (Math.random() - 0.5) * 20,
          y: character.y + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.8,
          size: 2 + Math.random() * 3.5,
          color,
          shape: style.debrisShape,
          lifeMs: 500 + Math.random() * 360
        })
      );
    }

    if (character.radius <= config.characters.destroyBelowRadius) {
      return [];
    }

    const childRadius = Math.max(character.radius * config.characters.childScale, config.characters.destroyBelowRadius - 2);
    const childTargetRadius = Math.max(character.radius * 0.92, childRadius);
    const children = [];

    for (let i = 0; i < 2; i += 1) {
      const side = i === 0 ? -1 : 1;
      const angle = impactAngle + side * (0.65 + Math.random() * 0.55) + (Math.random() - 0.5) * 1.1;
      const speed = 3.8 + Math.random() * 3.6;
      children.push(
        new MiniCharacter({
          sourceId: character.id,
          x: character.x + Math.cos(angle) * (14 + Math.random() * 20),
          y: character.y + Math.sin(angle) * (14 + Math.random() * 20),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (1.4 + Math.random() * 1.8),
          radius: childRadius,
          targetRadius: childTargetRadius,
          growthDurationMs: config.characters.growthDurationMs
        })
      );
    }

    return children;
  }

  function updateCharacterGrowth(now) {
    datastore.characters.forEach((character) => {
      if (!character.growth) return;
      const { startTime, initialRadius, targetRadius, durationMs } = character.growth;
      const progress = durationMs <= 0
        ? 1
        : Math.min((now - startTime) / durationMs, 1);
      const nextRadius = initialRadius + (targetRadius - initialRadius) * progress;
      character.radius = nextRadius;
      character.baseRadius = nextRadius;
      if (progress >= 1) {
        delete character.growth;
      }
    });
  }

  function updateCharacterPhysics() {
    const draggedId = datastore.pointer.draggedCharacterId;

    datastore.characters.forEach((character) => {
      if (character.id === draggedId && character.isActive) return;

      character.x += character.vx || 0;
      character.y += character.vy || 0;
      character.vx = (character.vx || 0) * config.physics.friction;
      character.vy = (character.vy || 0) * config.physics.friction;

      const speed = Math.hypot(character.vx, character.vy);
      if (speed > config.physics.maxSpeed) {
        const ratio = config.physics.maxSpeed / speed;
        character.vx *= ratio;
        character.vy *= ratio;
      }

      const scaledRadius = character.radius * character.scale;
      if (character.x < scaledRadius) {
        character.x = scaledRadius;
        character.vx = Math.abs(character.vx) * config.physics.wallBounce;
      } else if (character.x > datastore.width - scaledRadius) {
        character.x = datastore.width - scaledRadius;
        character.vx = -Math.abs(character.vx) * config.physics.wallBounce;
      }

      if (character.y < scaledRadius) {
        character.y = scaledRadius;
        character.vy = Math.abs(character.vy) * config.physics.wallBounce;
      } else if (character.y > datastore.height - scaledRadius) {
        character.y = datastore.height - scaledRadius;
        character.vy = -Math.abs(character.vy) * config.physics.wallBounce;
      }
    });

    for (let i = 0; i < datastore.characters.length; i += 1) {
      for (let j = i + 1; j < datastore.characters.length; j += 1) {
        const a = datastore.characters[i];
        const b = datastore.characters[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy) || 0.0001;
        const minDistance = a.radius * a.scale + b.radius * b.scale;

        if (distance >= minDistance) continue;

        const nx = dx / distance;
        const ny = dy / distance;
        const overlap = minDistance - distance;
        const aDragged = a.id === draggedId && a.isActive;
        const bDragged = b.id === draggedId && b.isActive;

        if (!aDragged && !bDragged) {
          a.x -= nx * overlap * 0.5 * config.physics.separationBias;
          a.y -= ny * overlap * 0.5 * config.physics.separationBias;
          b.x += nx * overlap * 0.5 * config.physics.separationBias;
          b.y += ny * overlap * 0.5 * config.physics.separationBias;
        } else if (aDragged && !bDragged) {
          b.x += nx * overlap * config.physics.separationBias;
          b.y += ny * overlap * config.physics.separationBias;
        } else if (!aDragged && bDragged) {
          a.x -= nx * overlap * config.physics.separationBias;
          a.y -= ny * overlap * config.physics.separationBias;
        }

        const relativeVx = (b.vx || 0) - (a.vx || 0);
        const relativeVy = (b.vy || 0) - (a.vy || 0);
        const separatingSpeed = relativeVx * nx + relativeVy * ny;
        if (separatingSpeed > 0) continue;

        const massA = Math.max(a.radius, 1);
        const massB = Math.max(b.radius, 1);
        const impulse = (-(1 + config.physics.collisionBounce) * separatingSpeed) / ((1 / massA) + (1 / massB));
        const impulseX = impulse * nx;
        const impulseY = impulse * ny;

        if (!aDragged) {
          a.vx = (a.vx || 0) - impulseX / massA;
          a.vy = (a.vy || 0) - impulseY / massA;
        }
        if (!bDragged) {
          b.vx = (b.vx || 0) + impulseX / massB;
          b.vy = (b.vy || 0) + impulseY / massB;
        }
      }
    }
  }

  function applyExplosionImpulse(centerX, centerY, sourceCharacter = null) {
    const blastRadius = 220;
    const maxImpulse = 12;

    datastore.characters.forEach((character) => {
      if (character === sourceCharacter) return;

      const dx = character.x - centerX;
      const dy = character.y - centerY;
      const distance = Math.hypot(dx, dy) || 0.0001;
      if (distance > blastRadius) return;

      const falloff = 1 - distance / blastRadius;
      const impulse = maxImpulse * falloff;
      const nx = dx / distance;
      const ny = dy / distance;

      character.vx = (character.vx || 0) + nx * impulse;
      character.vy = (character.vy || 0) + ny * impulse - falloff * 1.4;
    });
  }

  function updateScene(now) {
    datastore.rockets.forEach((rocket) => {
      rocket.update(now);
      rocket.playSound(state.audioCtx);

      if (datastore.characters.length && rocket.canShoot(now)) {
        const nose = rocket.getNosePosition();
        const target = datastore.characters[Math.floor(Math.random() * datastore.characters.length)];
        const angle = Math.atan2(target.y - nose.y, target.x - nose.x);
        const missile = new Missile({ x: nose.x, y: nose.y, angle });
        datastore.missiles.push(missile);
        rocket.markShot(now);
        missile.playSound(state.audioCtx);
      }
    });

    datastore.missiles.forEach((missile) => missile.update());
    datastore.explosions.forEach((explosion) => explosion.update());
    datastore.splitFragments.forEach((fragment) => fragment.update());
    datastore.splitDebris.forEach((debris) => debris.update());
    datastore.miniCharacters.forEach((miniCharacter) => miniCharacter.update(now));

    datastore.missiles.forEach((missile) => {
      if (!missile.alive) return;

      const hitCharacter = datastore.characters.find((character) => {
        const hitRadius = character.radius * character.scale + config.missile.hitRadiusPadding;
        return Math.hypot(missile.x - character.x, missile.y - character.y) <= hitRadius;
      });

      if (!hitCharacter) return;

      missile.alive = false;
      const explosion = new Explosion({ x: hitCharacter.x, y: hitCharacter.y, radius: hitCharacter.radius * 0.9 });
      datastore.explosions.push(explosion);
      explosion.playSound(state.audioCtx);
      applyExplosionImpulse(hitCharacter.x, hitCharacter.y, hitCharacter);
      const spawnedChildren = spawnSplitEffect(hitCharacter, missile.angle);

      datastore.characters = datastore.characters.filter((character) => character !== hitCharacter);
      if (spawnedChildren.length) {
        spawnedChildren.forEach((child) => {
          datastore.zCounter += 1;
          child.character.zIndex = datastore.zCounter;
          datastore.characters.push(child.character);
        });
      }
    });

    datastore.missiles = datastore.missiles.filter((missile) => missile.alive);
    datastore.explosions = datastore.explosions.filter((explosion) => explosion.alive);
    datastore.splitFragments = datastore.splitFragments.filter((fragment) => fragment.alive);
    datastore.splitDebris = datastore.splitDebris.filter((debris) => debris.alive);
    datastore.miniCharacters = datastore.miniCharacters.filter((miniCharacter) => miniCharacter.alive);
  }

  function render(now) {
    datastore.delta = now - lastFrame;
    datastore.time = now;
    lastFrame = now;

    updateCharacterGrowth(now);
    updateScene(now);
    updateCharacterPhysics();
    drawBackground();
    sortCharacters();
    datastore.characters.forEach((character) => character.draw(ctx));
    datastore.splitFragments.forEach((fragment) => fragment.draw(ctx));
    datastore.splitDebris.forEach((debris) => debris.draw(ctx));
    datastore.miniCharacters.forEach((miniCharacter) => miniCharacter.draw(ctx, now));
    datastore.missiles.forEach((missile) => missile.draw(ctx));
    datastore.explosions.forEach((explosion) => explosion.draw(ctx));
    datastore.rockets.forEach((rocket) => rocket.draw(ctx));
    drawIntroOverlay(now);

    state.animationId = requestAnimationFrame(render);
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch((error) => {
          console.warn('Service worker non enregistré:', error);
        });
      });
    }
  }

  function bindEvents() {
    window.addEventListener('resize', () => {
      resize();
      if (!datastore.characters.length) return;
      datastore.characters.forEach((character) => clampCharacter(character));
    });

    canvas.addEventListener('pointerdown', startDrag);
    canvas.addEventListener('pointermove', moveDrag);
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('pointerleave', (event) => {
      if (event.pointerType === 'mouse') {
        endDrag(event);
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearActiveState();
        canvas.classList.remove('dragging');
      }
    });
  }

  function init() {
    datastore.appStartTime = performance.now();
    resize();
    createCharacters();
    datastore.rockets = [
      new Rocket({
        x: config.rocket.spawnX,
        y: datastore.height * config.rocket.spawnYRatio,
        vx: 1.8,
        vy: -0.6
      }),
      new Rocket({
        x: datastore.width - config.rocket.spawnX,
        y: datastore.height * (config.rocket.spawnYRatio + 0.08),
        vx: -1.6,
        vy: 0.55
      })
    ];
    bindEvents();
    registerServiceWorker();
    state.animationId = requestAnimationFrame(render);
  }

  init();
  return state;
}

window.addEventListener('DOMContentLoaded', () => {
  app();
});
