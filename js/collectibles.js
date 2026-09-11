/**
 * collectibles.js
 * Coins and power-ups: patterns, animation, and collection behaviour.
 */

class Coin {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 9;
    this.collected = false;
    this.phase = Math.random() * Math.PI * 2;
    this.magnetized = false;
  }

  get hitbox() {
    return { x: this.x - this.radius, y: this.y - this.radius, width: this.radius * 2, height: this.radius * 2 };
  }

  update(speed, dt, magnetTarget) {
    const frameScale = dt / (1000 / 60);
    this.phase += dt * 0.006;
    if (magnetTarget && !this.magnetized) {
      const dx = magnetTarget.x - this.x;
      const dy = magnetTarget.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < CONFIG.powerUps.magnetRadius) this.magnetized = true;
    }
    if (this.magnetized && magnetTarget) {
      const dx = magnetTarget.x - this.x;
      const dy = magnetTarget.y - this.y;
      const dist = Math.hypot(dx, dy) || 1;
      const pull = 9;
      this.x += (dx / dist) * pull * frameScale;
      this.y += (dy / dist) * pull * frameScale;
    } else {
      this.x -= speed * frameScale;
    }
  }

  draw(ctx) {
    const bob = Math.sin(this.phase) * 3;
    const squeeze = Math.abs(Math.cos(this.phase * 1.3));
    ctx.save();
    ctx.translate(this.x, this.y + bob);
    const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, this.radius * 1.6);
    grad.addColorStop(0, '#fff6c8');
    grad.addColorStop(1, '#e8b923');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, this.radius * (0.4 + squeeze * 0.6), this.radius, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a6790f';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
}

const POWERUP_TYPES = {
  shield: { color: '#4fc3f7', icon: '\u{1F6E1}' },
  magnet: { color: '#e040fb', icon: '\u{1F9F2}' },
  speed: { color: '#ff7043', icon: '\u26A1' },
  slow: { color: '#66bb6a', icon: '\u{1F422}' },
  double: { color: '#ffd54f', icon: '\u2728' },
};

class PowerUp {
  constructor(kind, x, y) {
    this.kind = kind;
    this.x = x;
    this.y = y;
    this.radius = 13;
    this.phase = Math.random() * Math.PI * 2;
    this.collected = false;
  }

  get hitbox() {
    return { x: this.x - this.radius, y: this.y - this.radius, width: this.radius * 2, height: this.radius * 2 };
  }

  update(speed, dt) {
    this.x -= speed * (dt / (1000 / 60));
    this.phase += dt * 0.005;
  }

  draw(ctx) {
    const bob = Math.sin(this.phase) * 4;
    const def = POWERUP_TYPES[this.kind];
    ctx.save();
    ctx.translate(this.x, this.y + bob);
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + Math.sin(this.phase * 2) * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = def.color + 'cc';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.icon, 0, 1);
    ctx.restore();
  }
}

/**
 * CollectibleSpawner
 * Generates coin patterns and occasional power-ups, positioned so they
 * are reachable given the player's jump arc.
 */
class CollectibleSpawner {
  constructor(groundY, canvasWidth) {
    this.groundY = groundY;
    this.canvasWidth = canvasWidth;
  }

  spawnPatternNearObstacle(hasObstacleGapAhead) {
    const items = [];
    if (Math.random() > CONFIG.spawn.coinChance) return items;

    const startX = this.canvasWidth + 60 + Math.random() * 120;
    const pattern = Math.floor(Math.random() * 5);
    const baseY = this.groundY - 40;

    switch (pattern) {
      case 0: // straight line
        for (let i = 0; i < 5; i++) items.push(new Coin(startX + i * 34, baseY));
        break;
      case 1: // arc
        for (let i = 0; i < 6; i++) {
          const t = i / 5;
          const y = baseY - Math.sin(t * Math.PI) * 55;
          items.push(new Coin(startX + i * 30, y));
        }
        break;
      case 2: // staircase
        for (let i = 0; i < 5; i++) items.push(new Coin(startX + i * 32, baseY - i * 16));
        break;
      case 3: // vertical sequence (risk/reward, requires jump timing)
        for (let i = 0; i < 4; i++) items.push(new Coin(startX + 10, baseY - 20 - i * 26));
        break;
      case 4: // risk/reward single high-value cluster
        for (let i = 0; i < 3; i++) items.push(new Coin(startX + i * 20, baseY - 70));
        break;
    }

    if (Math.random() < CONFIG.spawn.powerUpChance) {
      const kinds = Object.keys(POWERUP_TYPES);
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      items.push(new PowerUp(kind, startX + 90, this.groundY - 50));
    }

    return items;
  }
}
