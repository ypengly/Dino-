/**
 * player.js
 * The dinosaur: physics, state machine, procedural rendering & animation.
 */

class Player {
  constructor(groundY) {
    this.groundY = groundY;
    this.reset();
  }

  reset() {
    this.x = CONFIG.player.x;
    this.width = CONFIG.player.width;
    this.height = CONFIG.player.height;
    this.y = this.groundY - this.height;
    this.vy = 0;
    this.isJumping = false;
    this.isDucking = false;
    this.isDead = false;
    this.wantsDuck = false;
    this.state = 'idle'; // idle, running, jumping, falling, ducking, landing, death
    this.runFrame = 0;
    this.runTimer = 0;
    this.landTimer = 0;
    this.tilt = 0;
    this.squash = 1;
    this.footstepTimer = 0;
    this.hasMovedOnce = false;
  }

  get currentHeight() {
    return this.isDucking && !this.isJumping ? CONFIG.player.duckHeight : this.height;
  }

  get hitbox() {
    // this.y and this.currentHeight are always kept in sync by update(),
    // so the hitbox is simply an inset of the player's current bounding box.
    const inset = CONFIG.player.hitboxInset;
    const h = this.currentHeight;
    return {
      x: this.x + inset,
      y: this.y + inset * 0.5,
      width: this.width - inset * 2,
      height: h - inset,
    };
  }

  jump() {
    if (this.isDead) return;
    if (!this.isJumping) {
      this.isJumping = true;
      this.vy = CONFIG.physics.jumpVelocity;
      this.squash = 1.15;
      AudioEngine.SFX.jump();
      return true;
    }
    return false;
  }

  startDuck() {
    this.wantsDuck = true;
  }
  endDuck() {
    this.wantsDuck = false;
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.state = 'death';
    this.vy = -6;
  }

  update(dt, gameSpeed, hasStarted) {
    this.hasMovedOnce = hasStarted;
    const frameScale = dt / (1000 / 60);
    const g = CONFIG.physics.gravity * (this.wantsDuck && this.isJumping ? CONFIG.physics.duckGravityMultiplier : 1);

    if (this.isDead) {
      this.vy += g * 0.6 * frameScale;
      this.y += this.vy * frameScale;
      this.tilt = Math.min(90, this.tilt + 6);
      if (this.y > this.groundY - this.height) {
        this.y = this.groundY - this.height;
        this.vy = 0;
      }
      return;
    }

    this.isDucking = this.wantsDuck && !this.isJumping ? true : (this.wantsDuck && this.isJumping);

    if (this.isJumping) {
      this.vy += g * frameScale;
      this.vy = Math.min(this.vy, CONFIG.physics.maxFallSpeed);
      this.y += this.vy * frameScale;
      this.tilt = Math.max(-18, Math.min(18, this.vy * 1.4));

      if (this.y >= this.groundY - this.height) {
        this.y = this.groundY - this.height;
        this.isJumping = false;
        this.vy = 0;
        this.tilt = 0;
        this.state = 'landing';
        this.landTimer = 140;
        this.squash = 1.25;
        AudioEngine.SFX.land();
      } else {
        this.state = this.vy < 0 ? 'jumping' : 'falling';
      }
    } else {
      this.y = this.groundY - this.currentHeight;
      if (this.landTimer > 0) {
        this.landTimer -= dt;
        this.state = 'landing';
      } else if (this.isDucking) {
        this.state = 'ducking';
      } else if (hasStarted) {
        this.state = 'running';
      } else {
        this.state = 'idle';
      }
    }

    // Squash/stretch relax
    this.squash += (1 - this.squash) * 0.2;

    // Run animation timer
    if (this.state === 'running' || this.state === 'ducking') {
      this.runTimer += dt * (gameSpeed / CONFIG.difficulty.startingSpeed);
      if (this.runTimer > CONFIG.player.runFrameTime) {
        this.runTimer = 0;
        this.runFrame = (this.runFrame + 1) % CONFIG.player.legFrames;
        this.footstepTimer = 1;
      }
    }
  }

  emitDustThisFrame() {
    if (this.footstepTimer > 0) {
      this.footstepTimer = 0;
      return true;
    }
    return false;
  }

  draw(ctx, tint) {
    ctx.save();
    const cx = this.x + this.width / 2;
    const cy = this.y + this.currentHeight / 2;
    ctx.translate(cx, cy);
    ctx.rotate((this.tilt * Math.PI) / 180);
    ctx.scale(1 / this.squash, this.squash);
    ctx.translate(-cx, -cy);

    const bodyColor = tint ? tint.dino : '#4a5a4a';
    const darkColor = tint ? tint.dinoDark : '#33403a';
    const eyeColor = '#1a1a1a';

    const h = this.currentHeight;
    const w = this.width;
    const top = this.y;

    ctx.fillStyle = bodyColor;

    if (this.isDucking && !this.isJumping) {
      // Ducking: long low body
      ctx.beginPath();
      roundRect(ctx, this.x, top + h * 0.25, w * 1.25, h * 0.6, 6);
      ctx.fill();
      // head
      ctx.beginPath();
      roundRect(ctx, this.x + w * 0.95, top, w * 0.5, h * 0.55, 5);
      ctx.fill();
      // legs (running feel)
      ctx.fillStyle = darkColor;
      const legOffset = this.runFrame === 0 ? 0 : 6;
      ctx.fillRect(this.x + 6 + legOffset, top + h - 4, 8, 6);
      ctx.fillRect(this.x + w * 1.1 - legOffset, top + h - 4, 8, 6);
    } else {
      // Body
      ctx.beginPath();
      roundRect(ctx, this.x + w * 0.12, top + h * 0.28, w * 0.62, h * 0.6, 7);
      ctx.fill();
      // Tail
      ctx.beginPath();
      ctx.moveTo(this.x + w * 0.12, top + h * 0.42);
      ctx.lineTo(this.x - w * 0.28, top + h * 0.32);
      ctx.lineTo(this.x + w * 0.05, top + h * 0.6);
      ctx.closePath();
      ctx.fill();
      // Head
      ctx.beginPath();
      roundRect(ctx, this.x + w * 0.5, top, w * 0.5, h * 0.5, 6);
      ctx.fill();
      // Jaw
      ctx.fillRect(this.x + w * 0.5, top + h * 0.38, w * 0.42, h * 0.14);
      // Eye
      ctx.fillStyle = eyeColor;
      ctx.beginPath();
      ctx.arc(this.x + w * 0.82, top + h * 0.18, 2.4, 0, Math.PI * 2);
      ctx.fill();
      // Arm
      ctx.fillStyle = darkColor;
      ctx.fillRect(this.x + w * 0.45, top + h * 0.55, w * 0.12, h * 0.16);

      // Legs animation
      const legH = h * 0.32;
      const legY = top + h - legH + 2;
      if (this.state === 'jumping' || this.state === 'falling') {
        ctx.fillRect(this.x + w * 0.18, legY, 8, legH);
        ctx.fillRect(this.x + w * 0.42, legY, 8, legH);
      } else if (this.runFrame === 0) {
        ctx.fillRect(this.x + w * 0.15, legY, 8, legH);
        ctx.fillRect(this.x + w * 0.46, legY - 5, 8, legH - 6);
      } else {
        ctx.fillRect(this.x + w * 0.15, legY - 5, 8, legH - 6);
        ctx.fillRect(this.x + w * 0.46, legY, 8, legH);
      }
    }

    if (this.isDead) {
      // X eyes for comedic death effect on top of head area
      ctx.strokeStyle = eyeColor;
      ctx.lineWidth = 1.5;
      const ex = this.x + w * 0.82;
      const ey = top + h * 0.18;
      ctx.beginPath();
      ctx.moveTo(ex - 3, ey - 3); ctx.lineTo(ex + 3, ey + 3);
      ctx.moveTo(ex + 3, ey - 3); ctx.lineTo(ex - 3, ey + 3);
      ctx.stroke();
    }

    ctx.restore();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
