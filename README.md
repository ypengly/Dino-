# 🦖 Enhanced Dino Run

<div align="center">

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Canvas 2D](https://img.shields.io/badge/Canvas-2D-22C55E?style=for-the-badge)
![Web Audio](https://img.shields.io/badge/Web_Audio-API-FF6B6B?style=for-the-badge)
![No Dependencies](https://img.shields.io/badge/Zero-Dependencies-4CAF50?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

**A polished, commercial-quality Chrome Dino-style endless runner**

*Vanilla HTML5 · CSS3 · JavaScript — no frameworks, no engine, no backend*

[🎮 Play](#-running-locally) • [✨ Features](#-features) • [🎯 Gameplay](#-gameplay) • [🏗️ Architecture](#-project-structure) • [🚀 Deployment](#-deployment)

</div>

---

## 📖 Overview

**Enhanced Dino Run** takes the classic offline-browser dinosaur game and rebuilds it from scratch as a **full indie-quality experience** — with a fairness-aware procedural obstacle generator, a five-phase day/night cycle with parallax scenery, five distinct power-ups, a combo scoring system, achievements, statistics, and first-class mobile touch controls.

Everything renders on a single **HTML5 Canvas** at 60 FPS.

### Core Idea

> **No image files. No audio files. No engine.**
>
> Every visual is drawn procedurally on Canvas. Every sound is synthesized with the Web Audio API. Drop the folder on any static host and it just works.

---

## ✨ Features

<div align="center">

| 🎲 Fair Procedural Obstacles | 🌗 Day / Night Cycle |
|:---:|:---:|
| Every gap is mathematically guaranteed to be survivable | 5 phases: Morning → Day → Sunset → Night → Deep Night |
| **⚡ Five Power-Ups** | **🪙 Pattern-Based Coins** |
| Shield · Magnet · Boost · Slow Motion · Double Score | Lines, arcs, staircases, and vertical risk/reward stacks |
| **🔥 Combo System** | **🌄 Multi-Layer Parallax** |
| Escalating bonus points with audio feedback | Sky, clouds, mountains, trees, ground — all scroll at different speeds |
| **🎨 Fully Procedural Sprites** | **💾 LocalStorage Persistence** |
| Dino, cacti, rocks, birds — all code-drawn, nothing can go missing | Best score, coins, achievements, settings — all survive refresh |
| **🏆 Achievements & Stats** | **📱 Mobile-First Controls** |
| Six unlockable awards and a lifetime statistics screen | Tap to jump, swipe/hold to duck, on-screen buttons |
| **🔊 Procedural Audio** | **⚙️ Full Settings Panel** |
| Jump, land, coin, power-up, collision — synthesized live | Sound, music, particles, shake, quality toggle |

</div>

### Detailed Feature List

- **Procedurally generated, fairness-checked obstacles** — every gap is mathematically guaranteed to be survivable given the player's jump arc and reaction time
- **Ground & flying obstacles** — small/large/double/triple cacti, rocks, and three altitudes of flying enemies that demand jumping or ducking
- **Five power-ups** — Shield, Coin Magnet, Speed Boost, Slow Motion, and Double Score, each with unique visuals, sounds, and HUD timers
- **Coins with pattern-based layouts** — straight lines, arcs, staircases, vertical risk/reward stacks
- **Combo system** with escalating bonus points and audio feedback
- **Dynamic 5-phase day/night cycle** with smooth color-lerped transitions, sun/moon, twinkling stars, and screen tint
- **Multi-layer parallax** for real depth
- **Procedural, code-drawn sprites** — no image assets required
- **Full animation state machine** — idle, running, jumping, falling, ducking, landing, death, with squash/stretch, tilt, and dust particles
- **Capped particle system** — dust, coin sparkles, power-up bursts, collision debris, floating score popups, all pooled to a fixed maximum
- **Procedural Web Audio sound effects** — generated with oscillators/noise
- **LocalStorage persistence** — best score, total coins, games played, longest distance, best combo, settings, achievements
- **Achievements** — six unlockable awards with a dedicated screen
- **Statistics screen** — lifetime totals across every run
- **Full settings panel** — sound, music, particles, screen shake, quality toggle
- **Responsive, mobile-first controls** — tap to jump, swipe down/hold to duck, plus dedicated on-screen buttons, scaled Canvas, safe-area padding for notches
- **Pause menu**, **game-over modal** with new-high-score celebration, and **keyboard shortcuts**

---

## 🎯 Gameplay

The dinosaur runs automatically. Your job is to:

1. **Jump over** ground obstacles
2. **Duck under** or **jump over** flying enemies
3. **Grab coins** for bonus score
4. **Chain obstacle clears** into combos
5. **Survive** as the world gradually speeds up

All while the sky cycles from **morning to deep night**.

---

## 🎮 Controls

### Desktop

| Key | Action |
|-----|--------|
| `SPACE` / `↑` | Jump |
| `↓` | Duck |
| `P` | Pause |
| `M` | Mute |
| `R` | Restart |

### Mobile

| Gesture | Action |
|---------|--------|
| Tap | Jump |
| Swipe down / hold | Duck |
| ⏸ button | Pause |
| 🔊 button | Mute |
| On-screen JUMP / DUCK buttons | Jump / Duck |

---

## ⚡ Power-Ups

| Icon | Name | Effect |
|:---:|------|--------|
| 🛡️ | **Shield** | Absorbs one collision |
| 🧲 | **Coin Magnet** | Pulls nearby coins toward you |
| ⚡ | **Speed Boost** | Temporarily increases speed & multiplier |
| 🐢 | **Slow Motion** | Temporarily slows incoming obstacles |
| ✨ | **Double Score** | Doubles all score gained for a limited time |

---

## 📈 Difficulty System

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

**How it works:**

- Speed starts at a forgiving pace
- Increases by `speedStep` only when you complete a distance milestone **or** collect enough coins for a milestone
- The obstacle spawner independently computes a **minimum safe gap** from your current speed and jump physics

The result: difficulty never crosses into "impossible."

---

## 🏗️ Project Structure

```
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
│   ├── game.js          # Core loop, state machine, collisions, scoring
│   ├── player.js        # Dinosaur physics & procedural animation
│   ├── obstacles.js     # Ground/flying obstacles + fair spawner
│   ├── collectibles.js  # Coins & power-ups
│   ├── particles.js     # Pooled particle system
│   ├── environment.js   # Day/night cycle & parallax scenery
│   ├── audio.js         # Procedural Web Audio sound engine
│   ├── input.js         # Keyboard / mouse / touch unification
│   ├── ui.js            # DOM screens, HUD, modals
│   ├── storage.js       # LocalStorage wrapper
│   └── config.js        # All balancing values & constants
│
├── assets/
│   ├── images/          # Reserved for optional art
│   └── audio/           # Reserved for optional audio
│
└── screenshots/
```

> 💡 **The game works with zero files in `assets/`.** Every visual is drawn procedurally, every sound is synthesized. You can drop sprite sheets or audio files in later without breaking anything.

### Module Responsibilities

| File | Role |
|------|------|
| `main.js` | Bootstraps the entire app — creates the game and starts the loop |
| `game.js` | Core loop, state machine, collisions, scoring |
| `player.js` | Dinosaur physics and procedural animation |
| `obstacles.js` | Ground/flying obstacles + fairness-checked spawner |
| `collectibles.js` | Coins & power-ups |
| `particles.js` | Pooled particle system (fixed max) |
| `environment.js` | Day/night cycle & parallax scenery |
| `audio.js` | Procedural Web Audio sound engine |
| `input.js` | Unifies keyboard, mouse, and touch |
| `ui.js` | DOM screens, HUD, modals |
| `storage.js` | LocalStorage wrapper with fallback |
| `config.js` | Every tunable value in one place |

---

## 🛠️ Technology

| Layer | Technology |
|-------|-----------|
| **Structure** | HTML5 (semantic markup, Canvas) |
| **Styling** | CSS3 (responsive layout, animations) |
| **Logic** | Vanilla JavaScript (ES6 classes) |
| **Rendering** | HTML5 Canvas 2D |
| **Audio** | Web Audio API (procedural synthesis) |
| **Persistence** | LocalStorage |

**No** React, Vue, Angular, Phaser, Three.js, Unity, Godot, Bootstrap, Tailwind, or any game engine is used.

---

## 🚀 Running Locally

Because the game uses **no ES module imports** and **no `fetch`**, you can often just open `index.html` directly in your browser.

For the most reliable experience (and to avoid browser restrictions around local files), serve it with a simple static server:

```bash
# Python 3
python3 -m http.server 8080

# Node (if you have npx available)
npx serve .
```

Then visit `http://localhost:8080`.

---

## 📱 Mobile Support

- Canvas **scales responsively** to fit any viewport while preserving aspect ratio
- Accounts for **device pixel ratio** for crisp rendering on high-DPI screens
- Fully playable in **portrait orientation**
- **Touch controls** appear automatically on touch-capable devices
- **Safe-area padding** for notched phones

---

## 💾 LocalStorage

The following data is persisted automatically and survives page refreshes:

- Best score, total coins collected, games played, longest distance, best combo
- Unlocked achievements
- Sound / music / particle / shake / quality settings

> 🛡️ **Graceful degradation:** If LocalStorage is unavailable (e.g., private browsing), the game detects this and skips persistence without crashing.

---

## ⚡ Performance

| Technique | Benefit |
|-----------|---------|
| `requestAnimationFrame` with delta-time scaling | Consistent gameplay speed across any refresh rate |
| Fixed-max **pooled particle system** | No GC stalls during heavy effects |
| **Zero DOM manipulation** during gameplay | Only Canvas draw calls — no layout thrash |
| **Procedural sprites** | No image loading, no decode, no memory for textures |

---

## 🎨 Customization

Want to change how the game feels? Everything is centralized in `js/config.js`:

| Category | What You Can Tune |
|----------|-------------------|
| **Physics** | Gravity, jump velocity, max fall speed |
| **Difficulty** | Starting/max speed, progress milestones, obstacle gap bounds |
| **Spawn Rates** | Coin chance, power-up chance, flying-obstacle chance, formation chances |
| **Scoring** | Points per source, combo window, combo bonus |
| **Power-Ups** | Durations, magnet radius, speed/slow factors |
| **Environment** | Phase transition distances, parallax speeds |

> 📖 The file is fully commented with sensible defaults already balanced for a satisfying difficulty curve.

---

## 🌐 Browser Support

Tested against current versions of **Chrome**, **Firefox**, **Safari**, and **Edge** on both desktop and mobile.

**Requires:**

- HTML5 Canvas 2D
- ES6 classes
- Web Audio API *(sound gracefully disables itself if unavailable)*
- LocalStorage *(progress gracefully disables itself if unavailable)*

---

## 🔧 Troubleshooting

### No Sound Is Playing

Browsers block audio until the user interacts with the page. The game **unlocks audio automatically** on the first tap/click/keypress. If you still hear nothing, check the 🔊 button in the HUD or the SOUND toggle in Settings.

### The Game Looks Stretched or Blurry on My Phone

Try rotating your device or refreshing. The Canvas recalculates its size on every `resize` event, including orientation changes.

### My High Score Didn't Save

Some private/incognito browser modes disable LocalStorage entirely. The game will still work, but progress won't persist between sessions in that case.

### I See a Blank/Black Screen

Open your browser's developer console (`F12`) and check for errors — this is most commonly caused by loading the files from `file://` in a browser that restricts local script execution. Use a local server instead (see [Running Locally](#-running-locally)).

---

## 🚢 Deployment

No backend or build step is required — this is a **fully static site**.

### GitHub Pages

1. Push this repository to GitHub
2. In repository **Settings → Pages**, set the source to the `main` branch, root folder
3. Your game will be live at `https://<username>.github.io/<repository>/`

### Vercel

1. Import the repository at [vercel.com/new](https://vercel.com/new)
2. Leave the framework preset as **"Other"** — no build command is needed
3. Deploy

### Netlify

1. Drag and drop the project folder onto [app.netlify.com/drop](https://app.netlify.com/drop), or connect the Git repository
2. Leave the build command empty and the publish directory as the project root
3. Deploy

---

## 🗺️ Roadmap

### ✅ Current

- [x] Fairness-checked procedural obstacle generator
- [x] Ground & flying obstacles with 3 altitudes
- [x] Five power-ups with visuals, sounds, and HUD timers
- [x] Pattern-based coin layouts
- [x] Combo scoring system
- [x] Five-phase day/night cycle with parallax
- [x] Fully procedural Canvas sprites
- [x] Full animation state machine
- [x] Pooled particle system
- [x] Procedural Web Audio sound engine
- [x] LocalStorage persistence with graceful fallback
- [x] Achievements and lifetime statistics
- [x] Full settings panel
- [x] Mobile-first touch controls
- [x] Pause menu and game-over modal
- [x] Keyboard shortcuts

### 🔜 Future Ideas

- [ ] Optional sprite-sheet art pipeline (drop-in replacement)
- [ ] Daily challenge seeds for competitive, reproducible runs
- [ ] Online leaderboard (would require a lightweight backend)
- [ ] Additional obstacle biomes (desert, city, arctic) tied to distance
- [ ] Gamepad support

---

## 🤝 Contributing

Contributions are welcome. Please:

1. Fork the repository
2. Follow the existing module structure — one concern per file
3. Keep it vanilla — no frameworks, no build step, no dependencies
4. Test on both desktop and mobile
5. Submit a Pull Request

### Guidelines

- **Never add a required external dependency**
- **Keep all tunables in `js/config.js`**
- **Preserve 60 FPS** — profile before adding heavy effects
- **Preserve graceful degradation** — audio and storage must never crash the game

---

## 📜 License

Released under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- **Chrome Dino** — for the original spark
- **The HTML5 Canvas community** — for proving you don't need an engine
- **Every player who beat their own high score** — this game is for you

---

<div align="center">

### 🦖 RUN. JUMP. DUCK. SURVIVE.

**No engine. No assets. No excuses.**

<br>

⭐ If this game helped you, consider giving it a star.

<br>

[⬆ Back to Top](#-enhanced-dino-run)

</div>
