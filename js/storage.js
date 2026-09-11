/**
 * storage.js
 * Thin wrapper around LocalStorage. Fails gracefully if storage is
 * unavailable (private browsing, disabled cookies, etc).
 */

const Storage = (() => {
  let available = true;
  try {
    const testKey = '__dino_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
  } catch (e) {
    available = false;
    console.warn('LocalStorage unavailable, progress will not be saved.');
  }

  function get(key, fallback) {
    if (!available) return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function set(key, value) {
    if (!available) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* ignore quota errors */
    }
  }

  const defaultSettings = {
    sound: true,
    music: true,
    particles: true,
    shake: true,
    quality: 'high',
  };

  const defaultStats = {
    gamesPlayed: 0,
    bestScore: 0,
    longestDistance: 0,
    totalCoins: 0,
    bestCombo: 0,
    powerUpsUsed: 0,
  };

  const api = {
    getSettings() {
      return Object.assign({}, defaultSettings, get(CONFIG.storageKeys.settings, {}));
    },
    saveSettings(settings) {
      set(CONFIG.storageKeys.settings, settings);
    },
    getStats() {
      return Object.assign({}, defaultStats, get(CONFIG.storageKeys.stats, {}));
    },
    saveStats(stats) {
      set(CONFIG.storageKeys.stats, stats);
    },
    getAchievements() {
      return get(CONFIG.storageKeys.achievements, {});
    },
    saveAchievements(unlocked) {
      set(CONFIG.storageKeys.achievements, unlocked);
    },
    isAvailable() {
      return available;
    },
  };

  return api;
})();
