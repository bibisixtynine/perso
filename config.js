export const config = {
  appName: 'Chromaphonie',
  version: 'v1.2.8',
  intro: {
    durationMs: 3200
  },
  background: {
    base: '#120824',
    accentA: '#ff4fa0',
    accentB: '#6c7dff',
    accentC: '#2de2c5',
    accentD: '#ffb86b'
  },
  canvas: {
    dprMax: 2
  },
  interaction: {
    dragScaleBoost: 1.08,
    soundThrottleMs: 120,
    haloPulseSpeed: 0.004
  },
  physics: {
    friction: 0.992,
    wallBounce: 0.86,
    collisionBounce: 0.92,
    separationBias: 0.5,
    maxSpeed: 10
  },
  characters: {
    count: 5,
    baseRadius: 64,
    splitScale: 0.58,
    splitOffset: 52,
    minRadiusToSplit: 30,
    childScale: 0.52,
    growthDurationMs: 10000,
    destroyBelowRadius: 26
  },
  rocket: {
    speed: 1.5,
    fireIntervalMs: 448,
    spawnX: 120,
    spawnYRatio: 0.22
  },
  missile: {
    speed: 6.5,
    lifeMs: 2600,
    hitRadiusPadding: 10
  },
  explosion: {
    lifeMs: 520
  },
  audio: {
    masterGain: 0.12,
    attack: 0.01,
    release: 0.35
  }
};

export const datastore = {
  time: 0,
  delta: 16,
  width: 0,
  height: 0,
  centerX: 0,
  centerY: 0,
  pointer: {
    x: 0,
    y: 0,
    isDown: false,
    activeId: null,
    draggedCharacterId: null
  },
  dragOffset: {
    x: 0,
    y: 0
  },
  paletteShift: 0,
  characters: [],
  missiles: [],
  explosions: [],
  splitFragments: [],
  splitDebris: [],
  miniCharacters: [],
  rockets: [],
  audioReady: false,
  zCounter: 1,
  activeCharacter: null,
  appStartTime: 0
};
