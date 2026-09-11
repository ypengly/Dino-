/**
 * particles.js
 * A small, capped particle pool used for dust, sparkles, score popups
 * and impact effects. Avoids unbounded object creation.
 */

class Particle {
  constructor() { this.active = false; }

  spawn(x, y, opts = {}) {
    this.active = true;
    this.x = x; this.y = y;
    this.vx = opts.vx ?? (Math.random() - 0.5) * 2;
    this.vy = opts.vy ?? (Math.random() - 0.5) * 2;
    this.life = opts.life ?? 500;
    this.age = 0;
    this.size = opts.size ?? 3;
    this.color = opts.color ?? '#ffffff';
    this.gravity = opts.gravity ?? 0;
    this.text = opts.text ?? null;
    this.fontSize = opts.fontSize ?? 14;
    this.shape = opts.shape ?? 'circle';
  }

  update(dt) {
    if (!this.active) return;
    this.age += dt;
    if (this.age >= this.life) { this.active = false; return; }
    this.x += this.vx * (dt / 16.6);
    this.y += this.vy * (dt / 16.6);
    this.vy += this.gravity * (dt / 16.6);
  }

  draw(ctx) {
    if (!this.active) return;
    const t = this.age / this.life;
    const alpha = 1 - t;
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    if (this.text) {
      ctx.fillStyle = this.color;
      ctx.font = `bold ${this.fontSize}px 'Press Start 2P', monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(this.text, this.x, this.y);
    } else if (this.shape === 'circle') {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * (1 - t * 0.4), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    }
    ctx.restore();
  }
}

class ParticleSystem {
  constructor(max = CONFIG.particles.maxParticles) {
    this.pool = Array.from({ length: max }, () => new Particle());
    this.enabled = true;
  }

  setEnabled(v) { this.enabled = v; }

  spawn(x, y, opts) {
    if (!this.enabled) return;
    const p = this.pool.find((p) => !p.active);
    if (p) p.spawn(x, y, opts);
  }

  dust(x, y, count = 3) {
    for (let i = 0; i < count; i++) {
      this.spawn(x + (Math.random() - 0.5) * 10, y, {
        vx: -1 - Math.random() * 1.5,
        vy: -Math.random() * 1.2,
        life: 350 + Math.random() * 150,
        size: 2 + Math.random() * 2,
        color: 'rgba(180,170,150,0.6)',
        gravity: 0.02,
      });
    }
  }

  landingDust(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.PI + (Math.random() - 0.5) * Math.PI;
      this.spawn(x, y, {
        vx: Math.cos(angle) * (1 + Math.random() * 2),
        vy: -Math.random() * 1.5,
        life: 400 + Math.random() * 200,
        size: 2 + Math.random() * 3,
        color: 'rgba(190,180,160,0.7)',
        gravity: 0.05,
      });
    }
  }

  coinBurst(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.spawn(x, y, {
        vx: Math.cos(angle) * 2,
        vy: Math.sin(angle) * 2 - 1,
        life: 400,
        size: 2.5,
        color: '#ffd54f',
        gravity: 0.06,
      });
    }
  }

  powerUpBurst(x, y, color) {
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2.5;
      this.spawn(x, y, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 550,
        size: 3,
        color,
        gravity: 0.02,
      });
    }
  }

  collisionBurst(x, y) {
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      this.spawn(x, y, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 600,
        size: 3,
        color: Math.random() > 0.5 ? '#c0392b' : '#7f8c8d',
        gravity: 0.08,
        shape: 'square',
      });
    }
  }

  scorePopup(x, y, text, color = '#fff') {
    this.spawn(x, y, {
      vx: 0, vy: -0.8, life: 700, text, color, fontSize: 11, gravity: 0,
    });
  }

  update(dt) { this.pool.forEach((p) => p.update(dt)); }
  draw(ctx) { this.pool.forEach((p) => p.draw(ctx)); }
}
