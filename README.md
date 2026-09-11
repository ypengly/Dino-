# 🦖 Enhanced Dino Run

A polished, commercial-quality **Chrome Dino-style endless runner**, built entirely with vanilla HTML5, CSS3, and JavaScript — no frameworks, no game engine, no backend.

> Drop a screenshot or GIF into `screenshots/` and reference it here once you've captured one from your own run.

## Overview

Enhanced Dino Run takes the classic offline-browser dinosaur game and rebuilds it from scratch as a full indie-quality experience: a fairness-aware procedural obstacle generator, a five-phase day/night cycle with parallax scenery, five distinct power-ups, a combo scoring system, achievements, statistics, and first-class mobile touch controls — all rendered on a single HTML5 Canvas at 60 FPS.

## Features

- **Procedurally generated, fairness-checked obstacles** — every gap is mathematically guaranteed to be survivable given the player's jump arc and reaction time.
- **Ground & flying obstacles** — small/large/double/triple cacti, rocks, and three altitudes of flying enemies that demand jumping or ducking.
- **Five power-ups** — Shield, Coin Magnet, Speed Boost, Slow Motion, and Double Score, each with unique visuals, sounds, and HUD timers.
- **Coins with pattern-based layouts** — straight lines, arcs, staircases, vertical risk/reward stacks.
- **Combo system** with escalating bonus points and audio feedback.
- **Dynamic 5-phase day/night cycle** (Morning → Day → Sunset → Night → Deep Night) with smooth color-lerped transitions, sun/moon, twinkling stars, and a screen tint.
- **Multi-layer parallax** — sky, clouds, mountains, trees, and ground all scroll at different speeds for real depth.
- **Procedural, code-drawn sprites** — the dinosaur, cacti, rocks, and birds are all drawn on Canvas; no image assets are required, so nothing can go missing.
- **Full animation state machine** — idle, running, jumping, falling, ducking, landing, and death, with squash/stretch, tilt, and dust particles.
- **Capped particle system** — dust, coin sparkles, power-up bursts, collision debris, and floating score popups, all pooled to a fixed maximum.
- **Procedural Web Audio sound effects** — jump, land, coin, power-up, shield, collision, game over, high score, and UI clicks, generated with oscillators/noise (no audio files).
- **LocalStorage persistence** — best score, total coins, games played, longest distance, best combo, settings, and achievements all survive a refresh.
- **Achievements** — six unlockable awards with a dedicated screen.
- **Statistics screen** — lifetime totals across every run.
- **Full settings panel** — sound, music, particles, screen shake, and a quality toggle.
- **Responsive, mobile-first controls** — tap to jump, swipe down/hold to duck, plus dedicated on-screen buttons, scaled Canvas, and safe-area padding for notches.
- **Pause menu**, **game-over modal** with new-high-score celebration, and keyboard shortcuts (`SPACE`/`↑` jump, `↓` duck, `P` pause, `M` mute, `R` restart).

## Gameplay

The dinosaur runs automatically. Your job is to jump over ground obstacles, duck under or jump over flying enemies, grab coins for bonus score, and chain obstacle clears into combos — all while the world gradually speeds up and the sky cycles from morning to deep night.

## Controls

### Desktop
| Key | Action |
|---|---|
| `SPACE` / `↑` | Jump |
| `↓` | Duck |
| `P` | Pause |
| `M` | Mute |
| `R` | Restart |

### Mobile
| Gesture | Action |
|---|---|
| Tap | Jump |
| Swipe down / hold | Duck |
| ⏸ button | Pause |
| 🔊 button | Mute |
| On-screen JUMP / DUCK buttons | Jump / Duck |

## Power-ups

| Icon | Name | Effect |
|---|---|---|
| 🛡️ | Shield | Absorbs one collision |
| 🧲 | Coin Magnet | Pulls nearby coins toward you |
| ⚡ | Speed Boost | Temporarily increases speed & multiplier |
| 🐢 | Slow Motion | Temporarily slows incoming obstacles |
| ✨ | Double Score | Doubles all score gained for a limited time |

## Difficulty System

All balancing values live in [`js/config.js`](js/config.js):

```javascript
difficulty: {
  startingSpeed: 3,
  maximumSpeed: 7,
  speedStep: 0.4,
  distancePerSpeedStep: 2400,
  coinsPerSpeedStep: 15,
  minimumObstacleGap: 260,
  maxObstacleGap: 640,
}
```

Speed starts at a forgiving pace and increases by `speedStep` only when you complete a distance milestone or collect enough coins for a milestone. The obstacle spawner independently computes a **minimum safe gap** from your current speed and jump physics, so difficulty never crosses into "impossible."

## Technology

- HTML5 (semantic structure, Canvas)
- CSS3 (responsive layout, animations, no framework)
- Vanilla JavaScript (ES6 classes, no build step)
- HTML5 Canvas 2D for all gameplay rendering
- Web Audio API for procedural sound effects
- LocalStorage for persistence

No React, Vue, Angular, Phaser, Three.js, Unity, Godot, Bootstrap, Tailwind, or any game engine is used.

## Project Structure

```text
enhanced-dino/
│
├── index.html
├── README.md
├── LICENSE
├── .gitignore
│
├── css/
│   ├── style.css
│   └── responsive.css
│
├── js/
│   ├── main.js          # Bootstraps the app
│   ├── game.js           # Core loop, state machine, collisions, scoring
│   ├── player.js          # Dinosaur physics & procedural animation
│   ├── obstacles.js       # Ground/flying obstacles + fair spawner
│   ├── collectibles.js    # Coins & power-ups
│   ├── particles.js       # Pooled particle system
│   ├── environment.js     # Day/night cycle & parallax scenery
│   ├── audio.js           # Procedural Web Audio sound engine
│   ├── input.js           # Keyboard / mouse / touch unification
│   ├── ui.js              # DOM screens, HUD, modals
│   ├── storage.js         # LocalStorage wrapper
│   └── config.js          # All balancing values & constants
│
├── assets/
│   ├── images/            # Reserved for optional art (game works without any)
│   └── audio/             # Reserved for optional audio (game works without any)
│
└── screenshots/
```

The game does not require any files in `assets/` — every visual is drawn procedurally on Canvas and every sound is synthesized with the Web Audio API. You can drop sprite sheets or audio files into those folders later without breaking anything currently in place.

## Installation

```bash
git clone <repository-url>
cd enhanced-dino
```

## Running Locally

Because the game uses `fetch`-free vanilla JS with no ES module imports, you can open `index.html` directly in most browsers. For the most reliable experience (and to avoid any browser security restrictions around local files), serve it with a simple static server:

```bash
# Python 3
python3 -m http.server 8080

# Node (if you have npx available)
npx serve .
```

Then visit `http://localhost:8080` in your browser.

## Mobile Support

The Canvas scales responsively to fit any viewport while preserving aspect ratio, accounts for device pixel ratio for crisp rendering on high-DPI screens, and remains fully playable in portrait orientation. Touch controls appear automatically on touch-capable devices.

## LocalStorage

The following data is persisted automatically and survives page refreshes:

- Best score, total coins collected, games played, longest distance, best combo
- Unlocked achievements
- Sound / music / particle / shake / quality settings

If LocalStorage is unavailable (e.g. private browsing with storage disabled), the game detects this and simply skips persistence without crashing.

## Performance

- Rendering is driven by `requestAnimationFrame` with delta-time scaling, so gameplay speed is consistent across refresh rates.
- The particle system is pooled to a fixed maximum (`CONFIG.particles.maxParticles`) to avoid garbage-collection stalls.
- No DOM elements are created or destroyed during gameplay — only Canvas drawing calls.

## Customization

Want to change how the game feels? Everything is centralized in `js/config.js`:

- **Physics** — gravity, jump velocity, max fall speed
- **Difficulty** — starting/maximum speed, progress milestones, obstacle gap bounds
- **Spawn rates** — coin chance, power-up chance, flying-obstacle chance, formation chances
- **Scoring** — points per source, combo window, combo bonus
- **Power-ups** — durations, magnet radius, speed/slow factors
- **Environment** — phase transition distances, parallax speeds

## Configuration

See the fully-commented [`js/config.js`](js/config.js) for every tunable value with sensible defaults already balanced for a satisfying difficulty curve.

## Browser Support

Tested against current versions of Chrome, Firefox, Safari, and Edge on both desktop and mobile. Requires a browser with support for:

- HTML5 Canvas 2D
- ES6 classes
- Web Audio API (sound gracefully disables itself if unavailable)
- LocalStorage (progress gracefully disables itself if unavailable)

## Troubleshooting

**No sound is playing.** Browsers block audio until the user interacts with the page. The game unlocks audio automatically on the first tap/click/keypress — if you still hear nothing, check the 🔊 button in the HUD or the SOUND toggle in Settings.

**The game looks stretched or blurry on my phone.** Try rotating your device or refreshing; the Canvas recalculates its size on every `resize` event, including orientation changes.

**My high score didn't save.** Some private/incognito browser modes disable LocalStorage entirely. The game will still work, but progress won't persist between sessions in that case.

**I see a blank/black screen.** Open your browser's developer console (F12) and check for errors — this is most commonly caused by loading the files from `file://` in a browser that restricts local script execution. Use a local server instead (see *Running Locally*).

## Deployment

No backend or build step is required — this is a fully static site.

### GitHub Pages
1. Push this repository to GitHub.
2. In repository **Settings → Pages**, set the source to the `main` branch, root folder.
3. Your game will be live at `https://<username>.github.io/<repository>/`.

### Vercel
1. Import the repository at [vercel.com/new](https://vercel.com/new).
2. Leave the framework preset as "Other" — no build command is needed.
3. Deploy.

### Netlify
1. Drag and drop the project folder onto [app.netlify.com/drop](https://app.netlify.com/drop), or connect the Git repository.
2. Leave the build command empty and the publish directory as the project root.
3. Deploy.

## Future Improvements

- Optional sprite-sheet art pipeline for hand-drawn visuals (drop-in replacement for the procedural Canvas renderer)
- Daily challenge seeds for competitive, reproducible runs
- Online leaderboard (would require a lightweight backend or a service like Firebase)
- Additional obstacle biomes (desert, city, arctic) tied to distance milestones
- Gamepad support

## License

Released under the [MIT License](LICENSE).
