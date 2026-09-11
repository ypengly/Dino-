/**
 * obstacles.js
 * Ground & flying obstacles, plus a fairness-aware procedural spawner
 * that guarantees every generated section is theoretically survivable.
 */

const CACTUS_TYPES = [
  { key: 'small', width: 18, height: 34, clusters: 1 },
  { key: 'large', width: 26, height: 46, clusters: 1 },
  { key: 'double', width: 40, height: 40, clusters: 2 },
  { key: 'triple', width: 56, height: 36, clusters: 3 },
  { key: 'rock', width: 30, height: 22, clusters: 1, isRock: true },
];

class Obstacle {
  constructor(type, x, groundY) {
    this.type = type;
    this.width = type.width;
    this.height = type.height;
    this.x = x;
    this.groundY = groundY;
    this.y = groundY - this.height;
    this.kind = 'ground';
    this.passed = false;
  }

  get hitbox() {
    const pad = 3;
    return { x: this.x + pad, y: this.y + pad, width: this.width - pad * 2, height: this.height - pad * 2 };
  }

  update(speed, dt) { this.x -= speed * (dt / (1000 / 60)); }

  draw(ctx, tint) {
    ctx.fillStyle = this.type.isRock ? (tint ? tint.rock : '#7a7a7a') : (tint ? tint.cactus : '#2f6b3a');
    if (this.type.isRock) {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.height);
      ctx.lineTo(this.x + 4, this.y + 4);
      ctx.lineTo(this.x + this.width * 0.5, this.y);
      ctx.lineTo(this.x + this.width - 4, this.y + 6);
      ctx.lineTo(this.x + this.width, this.y + this.height);
      ctx.closePath();
      ctx.fill();
      return;
    }
    const segW = this.width / this.type.clusters;
    for (let i = 0; i < this.type.clusters; i++) {
      const sx = this.x + i * segW;
      const sh = this.height * (0.75 + (i % 2) * 0.25);
      const sy = this.y + (this.height - sh);
      roundRect(ctx, sx + segW * 0.2, sy, segW * 0.6, sh, 3);
      ctx.fill();
      // arms
      ctx.fillRect(sx + segW * 0.05, sy + sh * 0.25, segW * 0.22, sh * 0.14);
      ctx.fillRect(sx + segW * 0.73, sy + sh * 0.4, segW * 0.22, sh * 0.14);
    }
  }
}

const FLYING_TYPES = [
  { key: 'low', width: 34, height: 24, heightAboveGround: 55 },   // must duck
  { key: 'mid', width: 34, height: 24, heightAboveGround: 95 },   // must jump or pass under while running small
  { key: 'high', width: 34, height: 24, heightAboveGround: 140 }, // safe if running, still can hit tall jump
];

class FlyingObstacle {
  constructor(type, x, groundY) {
    this.type = type;
    this.width = type.width;
    this.height = type.height;
    this.x = x;
    this.groundY = groundY;
    this.y = groundY - type.heightAboveGround;
    this.kind = 'flying';
    this.wingPhase = Math.random() * Math.PI * 2;
    this.passed = false;
  }

  get hitbox() {
    const pad = 4;
    return { x: this.x + pad, y: this.y + pad, width: this.width - pad * 2, height: this.height - pad * 2 };
  }

  update(speed, dt) {
    this.x -= speed * (dt / (1000 / 60));
    this.wingPhase += dt * 0.012;
  }

  draw(ctx, tint) {
    ctx.fillStyle = tint ? tint.bird : '#5a4a3a';
    const flap = Math.sin(this.wingPhase) * 8;
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    // body
    ctx.beginPath();
    ctx.ellipse(0, 0, this.width * 0.3, this.height * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    // wings
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(-this.width * 0.5, -flap);
    ctx.lineTo(-2, 4);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(this.width * 0.5, -flap);
    ctx.lineTo(2, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

/**
 * ObstacleSpawner
 * Decides what & when to spawn based on current speed, ensuring the
 * minimum gap always allows the player enough reaction + landing time.
 */
class ObstacleSpawner {
  constructor(groundY, canvasWidth) {
    this.groundY = groundY;
    this.canvasWidth = canvasWidth;
    this.reset();
  }

  reset() {
    this.timer = 0;
    this.nextSpawnDistance = 400;
    this.distanceSinceSpawn = 0;
  }

  // Estimate the minimum safe gap (in px) required at a given speed so
  // that a full jump arc plus reaction time fits before the next obstacle.
  minimumSafeGap(speed) {
    const jumpTimeFrames = Math.abs(CONFIG.physics.jumpVelocity) / CONFIG.physics.gravity * 2;
    const jumpDistance = jumpTimeFrames * speed;
    const reactionDistance = speed * 18; // ~18 frames reaction time
    const base = Math.max(CONFIG.difficulty.minimumObstacleGap, jumpDistance * 0.9 + reactionDistance);
    return Math.min(CONFIG.difficulty.maxObstacleGap, base);
  }

  maybeSpawn(speed, difficultyRatio, obstacles, dt) {
    this.distanceSinceSpawn += speed * (dt / (1000 / 60));
    const requiredGap = this.minimumSafeGap(speed);

    if (this.distanceSinceSpawn < requiredGap) return null;

    // Roll chance scaled with difficulty so early game has breathing room.
    const spawnChance = 0.010 + difficultyRatio * 0.018;
    if (Math.random() > spawnChance) return null;

    this.distanceSinceSpawn = 0;
    return this.buildFormation(speed, difficultyRatio);
  }

  buildFormation(speed, difficultyRatio) {
    const items = [];
    const startX = this.canvasWidth + 20;

    // Keep the opening focused on simple jumpable obstacles. Flying hazards
    // appear only after the player has settled into the controls.
    const flying = difficultyRatio >= 0.2 && Math.random() < CONFIG.spawn.flyingChance * difficultyRatio;

    if (flying) {
      const typeIdx = Math.random() < 0.4 ? 0 : (Math.random() < 0.7 ? 1 : 2);
      const type = FLYING_TYPES[typeIdx];
      items.push(new FlyingObstacle(type, startX, this.groundY));
      return items;
    }

    // Ground obstacle formation: pick single/double/triple based on difficulty
    let formationSize = 1;
    const roll = Math.random();
    if (difficultyRatio > 0.3 && roll < CONFIG.spawn.tripleObstacleChance) formationSize = 3;
    else if (difficultyRatio > 0.12 && roll < CONFIG.spawn.doubleObstacleChance) formationSize = 2;

    let typePool = CACTUS_TYPES.filter((t) => t.clusters === 1);
    if (formationSize === 2) typePool = [CACTUS_TYPES.find((t) => t.key === 'double')];
    if (formationSize === 3) typePool = [CACTUS_TYPES.find((t) => t.key === 'triple')];

    const type = typePool[Math.floor(Math.random() * typePool.length)];
    items.push(new Obstacle(type, startX, this.groundY));

    return items;
  }
}
