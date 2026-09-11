/**
 * ui.js
 * Manages all DOM-based UI: start screen, HUD, pause menu, game-over
 * modal, settings, statistics and achievements. Canvas is reserved for
 * gameplay rendering only.
 */

const UI = (() => {
  const el = (id) => document.getElementById(id);

  const refs = {};

  function cacheRefs() {
    [
      'start-screen', 'hud', 'pause-screen', 'gameover-screen', 'settings-screen', 'stats-screen', 'achievements-screen',
      'best-score-start', 'play-btn', 'settings-btn-start', 'stats-btn-start', 'achievements-btn-start',
      'hud-score', 'hud-best', 'hud-coins', 'combo-display', 'powerup-status', 'pause-btn', 'mute-btn',
      'resume-btn', 'restart-btn-pause', 'quit-btn',
      'final-score', 'final-best', 'final-coins', 'new-record-banner', 'play-again-btn', 'menu-btn-gameover',
      'setting-sound', 'setting-music', 'setting-particles', 'setting-shake', 'setting-quality', 'settings-back-btn',
      'stats-games', 'stats-best', 'stats-distance', 'stats-coins', 'stats-combo', 'stats-powerups', 'stats-back-btn',
      'achievements-list', 'achievements-back-btn',
      'mobile-controls', 'btn-jump', 'btn-duck',
    ].forEach((id) => { refs[id] = el(id); });
  }

  function show(id) { if (refs[id]) refs[id].classList.remove('hidden'); }
  function hide(id) { if (refs[id]) refs[id].classList.add('hidden'); }

  function showScreen(name) {
    ['start-screen', 'pause-screen', 'gameover-screen', 'settings-screen', 'stats-screen', 'achievements-screen'].forEach(hide);
    if (name) show(name);
  }

  function updateHUD({ score, best, coins }) {
    refs['hud-score'].textContent = String(Math.floor(score)).padStart(7, '0');
    refs['hud-best'].textContent = String(Math.floor(best)).padStart(7, '0');
    refs['hud-coins'].textContent = `\u00d7 ${coins}`;
  }

  function updateCombo(combo) {
    if (combo >= 2) {
      refs['combo-display'].textContent = `COMBO x${combo}`;
      refs['combo-display'].classList.remove('hidden');
      refs['combo-display'].classList.add('combo-pop');
      requestAnimationFrame(() => refs['combo-display'].classList.remove('combo-pop'));
    } else {
      refs['combo-display'].classList.add('hidden');
    }
  }

  function updatePowerUpStatus(active) {
    const container = refs['powerup-status'];
    container.innerHTML = '';
    Object.entries(active).forEach(([kind, remaining]) => {
      if (!remaining) return;
      const badge = document.createElement('div');
      badge.className = `powerup-badge pu-${kind}`;
      const label = kind === 'shield' ? 'ACTIVE' : `${(remaining / 1000).toFixed(1)}s`;
      badge.textContent = `${kindLabel(kind)} ${label}`;
      container.appendChild(badge);
    });
  }

  function kindLabel(kind) {
    return { shield: '\u{1F6E1}', magnet: '\u{1F9F2}', speed: '\u26A1', slow: '\u{1F422}', double: '\u2728' }[kind] || kind;
  }

  function setMuteIcon(isMuted) {
    refs['mute-btn'].textContent = isMuted ? '\u{1F507}' : '\u{1F50A}';
  }

  function showStart(best) {
    refs['best-score-start'].textContent = `BEST: ${String(Math.floor(best)).padStart(6, '0')}`;
    showScreen('start-screen');
    hide('hud');
  }

  function showHUD() {
    showScreen(null);
    show('hud');
  }

  function showPause() { showScreen('pause-screen'); }

  function showGameOver({ score, best, coins, isRecord }) {
    refs['final-score'].textContent = Math.floor(score).toLocaleString();
    refs['final-best'].textContent = Math.floor(best).toLocaleString();
    refs['final-coins'].textContent = coins;
    if (isRecord) show('new-record-banner'); else hide('new-record-banner');
    showScreen('gameover-screen');
  }

  function showSettings(settings) {
    refs['setting-sound'].checked = settings.sound;
    refs['setting-music'].checked = settings.music;
    refs['setting-particles'].checked = settings.particles;
    refs['setting-shake'].checked = settings.shake;
    refs['setting-quality'].value = settings.quality;
    showScreen('settings-screen');
  }

  function showStats(stats) {
    refs['stats-games'].textContent = stats.gamesPlayed;
    refs['stats-best'].textContent = stats.bestScore.toLocaleString();
    refs['stats-distance'].textContent = `${(stats.longestDistance / 100).toFixed(1)} km`;
    refs['stats-coins'].textContent = stats.totalCoins;
    refs['stats-combo'].textContent = `x${stats.bestCombo}`;
    refs['stats-powerups'].textContent = stats.powerUpsUsed;
    showScreen('stats-screen');
  }

  function showAchievements(defs, unlocked) {
    const list = refs['achievements-list'];
    list.innerHTML = '';
    defs.forEach((a) => {
      const item = document.createElement('div');
      const isUnlocked = !!unlocked[a.id];
      item.className = `achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`;
      item.innerHTML = `<div class="achievement-icon">${isUnlocked ? '\u{1F3C6}' : '\u{1F512}'}</div>
        <div><div class="achievement-name">${a.name}</div><div class="achievement-desc">${a.desc}</div></div>`;
      list.appendChild(item);
    });
    showScreen('achievements-screen');
  }

  function toast(message) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = message;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('toast-show'));
    setTimeout(() => { t.classList.remove('toast-show'); setTimeout(() => t.remove(), 400); }, 2600);
  }

  function setMobileControlsVisible(visible) {
    if (visible) show('mobile-controls'); else hide('mobile-controls');
  }

  function init() {
    cacheRefs();
  }

  return {
    init, refs, show, hide, showScreen, updateHUD, updateCombo, updatePowerUpStatus, setMuteIcon,
    showStart, showHUD, showPause, showGameOver, showSettings, showStats, showAchievements,
    toast, setMobileControlsVisible,
  };
})();
