/**
 * audio.js
 * All sounds are generated procedurally via the Web Audio API, so no
 * external audio assets are required. Sounds gracefully no-op if the
 * AudioContext cannot be created or hasn't been unlocked yet.
 */

const AudioEngine = (() => {
  let ctx = null;
  let masterGain = null;
  let unlocked = false;
  let soundOn = true;
  let musicOn = true;
  let musicNodes = null;

  function ensureContext() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.5;
      masterGain.connect(ctx.destination);
      return true;
    } catch (e) {
      console.warn('Web Audio API unavailable.', e);
      return false;
    }
  }

  function unlock() {
    if (unlocked) return;
    if (!ensureContext()) return;
    if (ctx.state === 'suspended') ctx.resume();
    unlocked = true;
  }

  function setSound(on) { soundOn = on; }
  function setMusic(on) {
    musicOn = on;
    if (!on) stopMusic();
    else startMusic();
  }

  function tone({ freq = 440, type = 'sine', duration = 0.12, gain = 0.25, glideTo = null, delay = 0 }) {
    if (!soundOn || !ensureContext()) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, glideTo), t0 + duration);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  function noiseBurst({ duration = 0.15, gain = 0.3, delay = 0, filterFreq = 1200 }) {
    if (!soundOn || !ensureContext()) return;
    const t0 = ctx.currentTime + delay;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    src.connect(filter);
    filter.connect(g);
    g.connect(masterGain);
    src.start(t0);
    src.stop(t0 + duration + 0.02);
  }

  const SFX = {
    jump: () => tone({ freq: 380, glideTo: 720, type: 'square', duration: 0.14, gain: 0.18 }),
    land: () => noiseBurst({ duration: 0.08, gain: 0.18, filterFreq: 400 }),
    coin: () => {
      tone({ freq: 880, type: 'triangle', duration: 0.09, gain: 0.2 });
      tone({ freq: 1320, type: 'triangle', duration: 0.12, gain: 0.16, delay: 0.05 });
    },
    powerUp: () => {
      tone({ freq: 440, glideTo: 1100, type: 'sawtooth', duration: 0.25, gain: 0.15 });
      tone({ freq: 660, glideTo: 1320, type: 'sine', duration: 0.3, gain: 0.12, delay: 0.05 });
    },
    shield: () => tone({ freq: 200, glideTo: 500, type: 'sine', duration: 0.3, gain: 0.2 }),
    collision: () => {
      noiseBurst({ duration: 0.25, gain: 0.35, filterFreq: 800 });
      tone({ freq: 160, glideTo: 40, type: 'sawtooth', duration: 0.3, gain: 0.25 });
    },
    gameOver: () => {
      tone({ freq: 300, glideTo: 120, type: 'triangle', duration: 0.5, gain: 0.2 });
    },
    highScore: () => {
      [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, type: 'triangle', duration: 0.18, gain: 0.18, delay: i * 0.11 }));
    },
    click: () => tone({ freq: 520, type: 'square', duration: 0.06, gain: 0.12 }),
    combo: (level) => tone({ freq: 500 + level * 40, type: 'triangle', duration: 0.1, gain: 0.15 }),
  };

  function startMusic() {
    if (!musicOn || !ensureContext() || musicNodes) return;
    // Simple ambient drone pad, very low volume, non-intrusive.
    const notes = [110, 146.83, 164.81];
    const gain = ctx.createGain();
    gain.gain.value = 0.035;
    gain.connect(masterGain);
    const oscs = notes.map((f) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      o.connect(gain);
      o.start();
      return o;
    });
    musicNodes = { oscs, gain };
  }

  function stopMusic() {
    if (!musicNodes) return;
    musicNodes.oscs.forEach((o) => { try { o.stop(); } catch (e) {} });
    musicNodes = null;
  }

  return { unlock, setSound, setMusic, SFX, ensureContext, get context() { return ctx; } };
})();
