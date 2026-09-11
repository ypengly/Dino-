/**
 * main.js
 * Application entry point. Waits for DOM readiness, initializes UI
 * bindings, then constructs the Game instance which owns the loop.
 */

(function () {
  function boot() {
    // Warm up the pixel font so canvas text (score popups) renders crisply
    // from the very first frame instead of falling back to a system font.
    if (document.fonts && document.fonts.load) {
      document.fonts.load("14px 'Press Start 2P'").catch(() => {});
    }
    UI.init();
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
      console.error('Game canvas not found.');
      return;
    }
    try {
      window.__dinoGame = new Game(canvas);
    } catch (err) {
      console.error('Failed to start game:', err);
      const fallback = document.createElement('div');
      fallback.style.cssText = 'padding:2rem;color:#fff;text-align:center;font-family:sans-serif;';
      fallback.textContent = 'Something went wrong starting the game. Please refresh the page.';
      document.body.appendChild(fallback);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
