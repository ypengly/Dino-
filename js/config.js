/**
 * config.js
 * All balancing values and constants live here so the game can be tuned
 * without touching game logic.
 */

const CONFIG = {
  canvas: {
    // Two virtual playfield presets. The *physics/pixel* coordinate space
    // itself changes (not just CSS scaling) so portrait phones get a
    // taller, better-proportioned play area instead of a tiny letterboxed
    // strip stretched from the desktop layout.
    landscape: { baseWidth: 1000, baseHeight: 340, groundY: 270 },
    portrait: { baseWidth: 480, baseHeight: 640, groundY: 520 },
    // An aspect ratio (height/width) at or above this is treated as portrait.
    portraitAspectThreshold: 1.05,
  },

  physics: {
    gravity: 0.62,
    jumpVelocity: -12.6,
    duckGravityMultiplier: 1.6,
    maxFallSpeed: 16,
  },

  player: {
    x: 90,
    width: 44,
    height: 47,
    duckHeight: 30,
    hitboxInset: 6, // shrink hitbox on every side for fairness
    runFrameTime: 80, // ms per running frame
    legFrames: 2,
  },

  difficulty: {
    // Keep the opening calm, then advance in visible, predictable steps.
    // A player earns a level from either sustained distance or coin pickups.
    startingSpeed: 3,
    maximumSpeed: 7,
    speedStep: 0.4,
    distancePerSpeedStep: 2400,
    coinsPerSpeedStep: 15,
    minimumObstacleGap: 260, // px, smallest allowed base gap
    maxObstacleGap: 640,
    obstacleGapSpeedFactor: 34, // extra gap per unit of speed
  },

  spawn: {
    minGroundGapFrames: 45, // minimum frames between spawns at any speed
    coinChance: 0.55,
    powerUpChance: 0.10,
    flyingChance: 0.32,
    doubleObstacleChance: 0.22,
    tripleObstacleChance: 0.10,
  },

  scoring: {
    distancePerPoint: 0.11, // points per unit distance traveled
    obstaclePoints: 10,
    coinPoints: 5,
    comboWindow: 1400, // ms window to keep combo alive
    comboScoreBonus: 5, // extra points per combo step
    maxComboMultiplierDisplay: 99,
  },

  powerUps: {
    shieldDuration: 999999, // unused as a timer — shield persists until consumed by a hit (see game.js)
    magnetDuration: 7000,
    speedBoostDuration: 5000,
    slowMotionDuration: 5000,
    doubleScoreDuration: 8000,
    magnetRadius: 140,
    speedBoostFactor: 1.15,
    slowMotionFactor: 0.55,
  },

  environment: {
    // Score thresholds at which the sky phase transitions (cumulative distance-based score)
    phaseDistances: [0, 1400, 3200, 5200, 7200],
    phaseNames: ['morning', 'day', 'sunset', 'night', 'deepNight'],
    transitionWindow: 500, // distance units to crossfade between phases
    parallax: {
      sky: 0.02,
      clouds: 0.06,
      mountains: 0.15,
      trees: 0.35,
      ground: 1,
    },
  },

  particles: {
    maxParticles: 220,
  },

  storageKeys: {
    best: 'dino_best_score',
    coins: 'dino_total_coins',
    games: 'dino_games_played',
    distance: 'dino_longest_distance',
    combo: 'dino_best_combo',
    settings: 'dino_settings',
    achievements: 'dino_achievements',
    stats: 'dino_stats',
  },

  achievements: [
    { id: 'first_flight', name: 'FIRST FLIGHT', desc: 'Play your first game.' },
    { id: 'coin_collector', name: 'COIN COLLECTOR', desc: 'Collect 100 coins.' },
    { id: 'speed_demon', name: 'SPEED DEMON', desc: 'Reach maximum speed.' },
    { id: 'night_runner', name: 'NIGHT RUNNER', desc: 'Survive until night.' },
    { id: 'unstoppable', name: 'UNSTOPPABLE', desc: 'Reach a 10x combo.' },
    { id: 'legend', name: 'LEGEND', desc: 'Reach 10,000 points.' },
  ],
};
