/**
 * game.js
 * The main game orchestrator: owns the update/render loop, game state
 * machine (menu / playing / paused / gameover), collision resolution,
 * scoring, difficulty scaling, and achievement checks.
 */

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    const dims = this.computeDims();
    this.baseWidth = dims.baseWidth;
    this.baseHeight = dims.baseHeight;
    this.groundY = dims.groundY;
    this.orientation = dims.orientation;

    this.settings = Storage.getSettings();
    this.stats = Storage.getStats();
    this.achievements = Storage.getAchievements();

    this.state = 'menu'; // menu, playing, paused, gameover
    this.lastTime = 0;
    this.shakeTime = 0;
    this.shakeMag = 0;

    this.particles = new ParticleSystem();
    this.particles.setEnabled(this.settings.particles);

    this.environment = new Environment(this.baseWidth, this.baseHeight, this.groundY);
    this.player = new Player(this.groundY);
    this.spawner = new ObstacleSpawner(this.groundY, this.baseWidth);
    this.collectibleSpawner = new CollectibleSpawner(this.groundY, this.baseWidth);

    this.resetRunState();
    this.bindInput();
    this.bindUI();
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.handleResize(), 150));

    AudioEngine.setSound(this.settings.sound);
    AudioEngine.setMusic(this.settings.music);
    UI.setMuteIcon(!this.settings.sound);
    UI.showStart(this.stats.bestScore);
    UI.setMobileControlsVisible(this.isTouchDevice());

    requestAnimationFrame((t) => this.loop(t));
  }

  isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  resetRunState() {
    this.score = 0;
    this.distance = 0;
    this.coins = 0;
    this.speed = CONFIG.difficulty.startingSpeed;
    this.obstacles = [];
    this.coinItems = [];
    this.powerUpItems = [];
    this.combo = 0;
    this.lastComboTime = 0;
    this.activePowerUps = {}; // kind -> remaining ms
    this.shieldCharges = 0;
    this.hasStarted = false;
    this.frameCount = 0;
    this.runAchievedNight = false;
    this.player.reset();
    this.spawner.reset();
  }

  // ---------- Input ----------
  bindInput() {
    Input.init(this.canvas);
    Input.on('jumpStart', () => this.handleJump());
    Input.on('duckStart', () => this.handleDuckStart());
    Input.on('duckEnd', () => this.handleDuckEnd());
    Input.on('pause', () => this.togglePause());
    Input.on('mute', () => this.toggleMute());
    Input.on('restart', () => { if (this.state === 'gameover' || this.state === 'playing') this.startGame(); });

    UI.refs['btn-jump'].addEventListener('touchstart', (e) => { e.preventDefault(); this.handleJump(); }, { passive: false });
    UI.refs['btn-duck'].addEventListener('touchstart', (e) => { e.preventDefault(); this.handleDuckStart(); }, { passive: false });
    UI.refs['btn-duck'].addEventListener('touchend', (e) => { e.preventDefault(); this.handleDuckEnd(); }, { passive: false });
  }

  handleJump() {
    AudioEngine.unlock();
    if (this.state === 'menu') { this.startGame(); return; }
    if (this.state === 'gameover') { this.startGame(); return; }
    if (this.state !== 'playing') return;
    this.hasStarted = true;
    this.player.jump();
  }
  handleDuckStart() {
    if (this.state !== 'playing') return;
    this.hasStarted = true;
    this.player.startDuck();
  }
  handleDuckEnd() {
    this.player.endDuck();
  }

  togglePause() {
    if (this.state === 'playing') { this.state = 'paused'; UI.showPause(); }
    else if (this.state === 'paused') { this.state = 'playing'; UI.showHUD(); }
  }

  toggleMute() {
    this.settings.sound = !this.settings.sound;
    AudioEngine.setSound(this.settings.sound);
    UI.setMuteIcon(!this.settings.sound);
    Storage.saveSettings(this.settings);
  }

  // ---------- UI bindings ----------
  bindUI() {
    UI.refs['play-btn'].addEventListener('click', () => { AudioEngine.unlock(); this.startGame(); });
    UI.refs['pause-btn'].addEventListener('click', () => this.togglePause());
    UI.refs['mute-btn'].addEventListener('click', () => this.toggleMute());
    UI.refs['resume-btn'].addEventListener('click', () => this.togglePause());
    UI.refs['restart-btn-pause'].addEventListener('click', () => this.startGame());
    UI.refs['quit-btn'].addEventListener('click', () => { this.state = 'menu'; UI.showStart(this.stats.bestScore); });
    UI.refs['play-again-btn'].addEventListener('click', () => this.startGame());
    UI.refs['menu-btn-gameover'].addEventListener('click', () => { this.state = 'menu'; UI.showStart(this.stats.bestScore); });

    UI.refs['settings-btn-start'].addEventListener('click', () => UI.showSettings(this.settings));
    UI.refs['settings-back-btn'].addEventListener('click', () => UI.showStart(this.stats.bestScore));
    UI.refs['stats-btn-start'].addEventListener('click', () => UI.showStats(this.stats));
    UI.refs['stats-back-btn'].addEventListener('click', () => UI.showStart(this.stats.bestScore));
    UI.refs['achievements-btn-start'].addEventListener('click', () => UI.showAchievements(CONFIG.achievements, this.achievements));
    UI.refs['achievements-back-btn'].addEventListener('click', () => UI.showStart(this.stats.bestScore));

    UI.refs['setting-sound'].addEventListener('change', (e) => { this.settings.sound = e.target.checked; AudioEngine.setSound(this.settings.sound); UI.setMuteIcon(!this.settings.sound); Storage.saveSettings(this.settings); });
    UI.refs['setting-music'].addEventListener('change', (e) => { this.settings.music = e.target.checked; AudioEngine.setMusic(this.settings.music); Storage.saveSettings(this.settings); });
    UI.refs['setting-particles'].addEventListener('change', (e) => { this.settings.particles = e.target.checked; this.particles.setEnabled(this.settings.particles); Storage.saveSettings(this.settings); });
    UI.refs['setting-shake'].addEventListener('change', (e) => { this.settings.shake = e.target.checked; Storage.saveSettings(this.settings); });
    UI.refs['setting-quality'].addEventListener('change', (e) => { this.settings.quality = e.target.value; Storage.saveSettings(this.settings); });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'playing') this.togglePause();
    });
  }

  // ---------- Responsive canvas ----------
  computeDims() {
    const wrapper = this.canvas.parentElement;
    const availW = (wrapper ? wrapper.clientWidth : window.innerWidth) || window.innerWidth;
    const availH = window.innerHeight || 800;
    const aspect = availH / Math.max(1, availW);
    const isPortrait = aspect >= CONFIG.canvas.portraitAspectThreshold;
    const preset = isPortrait ? CONFIG.canvas.portrait : CONFIG.canvas.landscape;
    return {
      baseWidth: preset.baseWidth,
      baseHeight: preset.baseHeight,
      groundY: preset.groundY,
      orientation: isPortrait ? 'portrait' : 'landscape',
    };
  }

  // Rebuilds every subsystem's virtual coordinate space when the device
  // orientation category actually changes (portrait <-> landscape), rather
  // than just CSS-scaling the old aspect ratio. Any run in progress is
  // ended gracefully back to the menu since entity positions were computed
  // against the old ground line.
  rebuildForOrientation(dims) {
    this.baseWidth = dims.baseWidth;
    this.baseHeight = dims.baseHeight;
    this.groundY = dims.groundY;
    this.orientation = dims.orientation;

    this.environment = new Environment(this.baseWidth, this.baseHeight, this.groundY);
    this.player = new Player(this.groundY);
    this.spawner = new ObstacleSpawner(this.groundY, this.baseWidth);
    this.collectibleSpawner = new CollectibleSpawner(this.groundY, this.baseWidth);
    this.resetRunState();

    if (this.state === 'playing' || this.state === 'paused') {
      this.state = 'menu';
      document.body.classList.remove('game-active');
      UI.showStart(this.stats.bestScore);
    }
  }

  handleResize() {
    const dims = this.computeDims();
    if (dims.orientation !== this.orientation) {
      this.rebuildForOrientation(dims);
    }

    const wrapper = this.canvas.parentElement;
    const availW = wrapper.clientWidth;
    // Use a fixed vertical margin budget rather than the wrapper's live
    // bounding-rect top: since the wrapper is centered via flexbox, its
    // top position depends on its own height, which we are about to set —
    // reading it live here would create a circular feedback loop that
    // converges on an incorrectly narrow/short canvas.
    const verticalMargin = 32;
    const availH = window.innerHeight - verticalMargin;
    const scaleByWidth = availW / this.baseWidth;
    const scaleByHeight = Math.max(120, availH) / this.baseHeight;
    const scale = Math.min(scaleByWidth, scaleByHeight, this.baseWidth === 1000 ? 1.6 : 2.2);

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = this.baseWidth * scale;
    const displayHeight = this.baseHeight * scale;
    this.canvas.style.width = `${displayWidth}px`;
    this.canvas.style.height = `${displayHeight}px`;
    this.canvas.width = this.baseWidth * dpr;
    this.canvas.height = this.baseHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ---------- Game flow ----------
  startGame() {
    this.resetRunState();
    this.state = 'playing';
    document.body.classList.add('game-active');
    UI.showHUD();
    UI.updateCombo(0);
    this.hasStarted = true;
    this.stats.gamesPlayed += 1;
    Storage.saveStats(this.stats);
    this.checkAchievement('first_flight');
  }

  endGame() {
    this.state = 'gameover';
    document.body.classList.remove('game-active');
    this.player.die();
    AudioEngine.SFX.collision();
    this.triggerShake(10, 260);
    this.particles.collisionBurst(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);

    const isRecord = this.score > this.stats.bestScore;
    this.stats.bestScore = Math.max(this.stats.bestScore, Math.floor(this.score));
    this.stats.longestDistance = Math.max(this.stats.longestDistance, Math.floor(this.distance));
    this.stats.totalCoins += this.coins;
    this.stats.bestCombo = Math.max(this.stats.bestCombo, this.maxComboThisRun || 0);
    Storage.saveStats(this.stats);

    if (this.stats.totalCoins >= 100) this.checkAchievement('coin_collector');
    if (this.score >= 10000) this.checkAchievement('legend');

    setTimeout(() => {
      AudioEngine.SFX.gameOver();
      if (isRecord) setTimeout(() => AudioEngine.SFX.highScore(), 400);
      UI.showGameOver({ score: this.score, best: this.stats.bestScore, coins: this.coins, isRecord });
    }, 500);
  }

  checkAchievement(id) {
    if (this.achievements[id]) return;
    this.achievements[id] = true;
    Storage.saveAchievements(this.achievements);
    const def = CONFIG.achievements.find((a) => a.id === id);
    if (def) UI.toast(`\u{1F3C6} ${def.name} unlocked!`);
  }

  triggerShake(mag, duration) {
    if (!this.settings.shake) return;
    this.shakeMag = mag;
    this.shakeTime = duration;
  }

  // ---------- Update ----------
  loop(time) {
    const dt = Math.min(40, time - (this.lastTime || time));
    this.lastTime = time;

    if (this.state === 'playing') this.update(dt);
    this.render(dt);

    requestAnimationFrame((t) => this.loop(t));
  }

  difficultyRatio() {
    const maxLevels = Math.ceil(
      (CONFIG.difficulty.maximumSpeed - CONFIG.difficulty.startingSpeed) / CONFIG.difficulty.speedStep
    );
    return this.speedLevel() / maxLevels;
  }

  // Progress is deliberately quantized: speed never creeps up between
  // milestones, so the player has time to settle into each new pace. Coins
  // offer a rewarding alternate route to the next level.
  speedLevel() {
    const distanceLevels = Math.floor(this.distance / CONFIG.difficulty.distancePerSpeedStep);
    const coinLevels = Math.floor(this.coins / CONFIG.difficulty.coinsPerSpeedStep);
    const maxLevels = Math.ceil(
      (CONFIG.difficulty.maximumSpeed - CONFIG.difficulty.startingSpeed) / CONFIG.difficulty.speedStep
    );
    return Math.min(maxLevels, Math.max(distanceLevels, coinLevels));
  }

  update(dt) {
    this.frameCount++;
    const dRatio = this.difficultyRatio();

    // Increase speed only after a distance or coin milestone.
    this.speed = Math.min(
      CONFIG.difficulty.maximumSpeed,
      CONFIG.difficulty.startingSpeed + this.speedLevel() * CONFIG.difficulty.speedStep
    );

    let effectiveSpeed = this.speed;
    if (this.activePowerUps.speed > 0) effectiveSpeed *= CONFIG.powerUps.speedBoostFactor;
    if (this.activePowerUps.slow > 0) effectiveSpeed *= CONFIG.powerUps.slowMotionFactor;

    if (this.hasStarted) {
      this.distance += effectiveSpeed * (dt / (1000 / 60));
      this.score += effectiveSpeed * CONFIG.scoring.distancePerPoint * (dt / (1000 / 60)) * (this.activePowerUps.double > 0 ? 2 : 1);
    }

    // Player
    this.player.update(dt, effectiveSpeed, this.hasStarted);
    if (this.player.emitDustThisFrame() && this.hasStarted) {
      this.particles.dust(this.player.x + 8, this.groundY - 2, 2);
    }
    if (this.player.state === 'landing' && this.player.landTimer > 100) {
      this.particles.landingDust(this.player.x + this.player.width / 2, this.groundY - 2);
    }

    // Environment
    this.environment.update(dt, effectiveSpeed, this.score);
    if (this.environment.palette.phaseName === 'night' || this.environment.palette.phaseName === 'deepNight') {
      if (!this.runAchievedNight) { this.runAchievedNight = true; this.checkAchievement('night_runner'); }
    }
    if (dRatio >= 0.999) this.checkAchievement('speed_demon');

    // Power-up timers (shield is charge-based, not time-based, so it's
    // excluded from decay here and removed only when consumed on hit).
    Object.keys(this.activePowerUps).forEach((k) => {
      if (k === 'shield') return;
      if (this.activePowerUps[k] > 0) {
        this.activePowerUps[k] -= dt;
        if (this.activePowerUps[k] <= 0) delete this.activePowerUps[k];
      }
    });
    UI.updatePowerUpStatus(this.activePowerUps);

    // Combo decay
    if (this.combo > 0 && performance.now() - this.lastComboTime > CONFIG.scoring.comboWindow) {
      this.combo = 0;
      UI.updateCombo(0);
    }

    if (this.hasStarted) {
      this.updateSpawning(effectiveSpeed, dRatio, dt);
      this.updateObstacles(effectiveSpeed, dt);
      this.updateCollectibles(effectiveSpeed, dt);
      this.checkCollisions();
    }

    this.particles.update(dt);

    if (this.shakeTime > 0) this.shakeTime -= dt;

    UI.updateHUD({ score: this.score, best: Math.max(this.stats.bestScore, this.score), coins: this.coins });
  }

  updateSpawning(speed, dRatio, dt) {
    const spawned = this.spawner.maybeSpawn(speed, dRatio, this.obstacles, dt);
    if (spawned) {
      this.obstacles.push(...spawned);
      const coinItems = this.collectibleSpawner.spawnPatternNearObstacle(true);
      coinItems.forEach((item) => {
        if (item instanceof Coin) this.coinItems.push(item);
        else this.powerUpItems.push(item);
      });
    }
  }

  updateObstacles(speed, dt) {
    this.obstacles.forEach((o) => o.update(speed, dt));
    this.obstacles = this.obstacles.filter((o) => o.x + o.width > -20);
  }

  updateCollectibles(speed, dt) {
    const magnetActive = this.activePowerUps.magnet > 0;
    const magnetTarget = magnetActive ? { x: this.player.x + this.player.width / 2, y: this.player.y + this.player.height / 2 } : null;
    this.coinItems.forEach((c) => c.update(speed, dt, magnetTarget));
    this.powerUpItems.forEach((p) => p.update(speed, dt));
    this.coinItems = this.coinItems.filter((c) => !c.collected && c.x > -30);
    this.powerUpItems = this.powerUpItems.filter((p) => !p.collected && p.x > -30);
  }

  rectsOverlap(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  checkCollisions() {
    const playerBox = this.player.hitbox;

    // Obstacles
    for (const o of this.obstacles) {
      if (o.passed) continue;
      const box = o.hitbox;
      if (this.rectsOverlap(playerBox, box)) {
        if (this.shieldCharges > 0) {
          this.shieldCharges--;
          delete this.activePowerUps.shield;
          o.passed = true;
          this.particles.powerUpBurst(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#4fc3f7');
          AudioEngine.SFX.shield();
          continue;
        }
        this.endGame();
        return;
      }
      if (!o.passed && o.x + o.width < this.player.x) {
        o.passed = true;
        this.registerObstacleCleared();
      }
    }

    // Coins
    for (const c of this.coinItems) {
      if (c.collected) continue;
      if (this.rectsOverlap(playerBox, c.hitbox)) {
        c.collected = true;
        this.coins++;
        this.score += CONFIG.scoring.coinPoints * (this.activePowerUps.double > 0 ? 2 : 1);
        this.particles.coinBurst(c.x, c.y);
        AudioEngine.SFX.coin();
      }
    }

    // Power-ups
    for (const p of this.powerUpItems) {
      if (p.collected) continue;
      if (this.rectsOverlap(playerBox, p.hitbox)) {
        p.collected = true;
        this.activatePowerUp(p.kind);
        this.particles.powerUpBurst(p.x, p.y, POWERUP_TYPES[p.kind].color);
        AudioEngine.SFX.powerUp();
        this.stats.powerUpsUsed = (this.stats.powerUpsUsed || 0) + 1;
      }
    }
  }

  activatePowerUp(kind) {
    switch (kind) {
      case 'shield':
        this.shieldCharges = 1;
        this.activePowerUps.shield = true; // charge-based flag, not a countdown
        break;
      case 'magnet':
        this.activePowerUps.magnet = CONFIG.powerUps.magnetDuration;
        break;
      case 'speed':
        this.activePowerUps.speed = CONFIG.powerUps.speedBoostDuration;
        break;
      case 'slow':
        this.activePowerUps.slow = CONFIG.powerUps.slowMotionDuration;
        break;
      case 'double':
        this.activePowerUps.double = CONFIG.powerUps.doubleScoreDuration;
        break;
    }
  }

  registerObstacleCleared() {
    const multiplier = this.activePowerUps.double > 0 ? 2 : 1;
    this.score += CONFIG.scoring.obstaclePoints * multiplier;
    this.combo++;
    this.maxComboThisRun = Math.max(this.maxComboThisRun || 0, this.combo);
    this.lastComboTime = performance.now();
    if (this.combo >= 2) {
      const bonus = CONFIG.scoring.comboScoreBonus * this.combo * multiplier;
      this.score += bonus;
      this.particles.scorePopup(this.player.x, this.player.y - 10, `+${bonus}`, '#ffd54f');
      AudioEngine.SFX.combo(this.combo);
    }
    UI.updateCombo(this.combo);
    if (this.combo >= 10) this.checkAchievement('unstoppable');
  }

  // ---------- Render ----------
  render() {
    const ctx = this.ctx;
    ctx.save();

    if (this.shakeTime > 0) {
      const mag = this.shakeMag * (this.shakeTime / 260);
      ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    }

    ctx.clearRect(-20, -20, this.baseWidth + 40, this.baseHeight + 40);

    this.environment.draw(ctx, this.score);

    const tint = this.environment.palette;
    this.obstacles.forEach((o) => o.draw(ctx, tint));
    this.coinItems.forEach((c) => c.draw(ctx));
    this.powerUpItems.forEach((p) => p.draw(ctx));

    // Shield visual aura
    if (this.activePowerUps.shield > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(79,195,247,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, 34, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    this.player.draw(ctx, tint);
    this.particles.draw(ctx);

    ctx.restore();
  }
}
