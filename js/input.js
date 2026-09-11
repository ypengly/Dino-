/**
 * input.js
 * Unifies keyboard and touch input into simple semantic events that the
 * game logic can consume, regardless of platform.
 */

const Input = (() => {
  const listeners = {
    jumpStart: [], jumpEnd: [], duckStart: [], duckEnd: [],
    pause: [], mute: [], restart: [],
  };

  function on(evt, cb) { if (listeners[evt]) listeners[evt].push(cb); }
  function emit(evt, data) { listeners[evt].forEach((cb) => cb(data)); }

  let duckHeld = false;

  function bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'Space':
        case 'ArrowUp':
          e.preventDefault();
          emit('jumpStart');
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!duckHeld) { duckHeld = true; emit('duckStart'); }
          break;
        case 'KeyP':
          emit('pause');
          break;
        case 'KeyM':
          emit('mute');
          break;
        case 'KeyR':
          emit('restart');
          break;
      }
    }, { passive: false });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowDown') {
        duckHeld = false;
        emit('duckEnd');
      }
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        emit('jumpEnd');
      }
    });
  }

  function bindTouch(canvas) {
    let touchStartY = 0;
    let touchStartTime = 0;
    let isDucking = false;
    let moved = false;

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      touchStartY = t.clientY;
      touchStartTime = Date.now();
      moved = false;
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      const dy = t.clientY - touchStartY;
      if (dy > 35 && !isDucking) {
        isDucking = true;
        moved = true;
        emit('duckStart');
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (isDucking) {
        isDucking = false;
        emit('duckEnd');
      } else if (!moved) {
        emit('jumpStart');
        setTimeout(() => emit('jumpEnd'), 60);
      }
    }, { passive: false });
  }

  function bindMouse(canvas) {
    canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      emit('jumpStart');
    });
    canvas.addEventListener('mouseup', () => emit('jumpEnd'));
  }

  function init(canvas) {
    bindKeyboard();
    bindTouch(canvas);
    bindMouse(canvas);
    // Prevent page scroll/bounce on mobile while playing
    document.addEventListener('touchmove', (e) => {
      if (document.body.classList.contains('game-active')) e.preventDefault();
    }, { passive: false });
  }

  return { init, on };
})();
