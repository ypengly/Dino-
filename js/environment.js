/**
 * environment.js
 * Handles the day/night cycle, parallax scenery layers, and ambient
 * decoration (clouds, mountains, trees, stars, moon/sun).
 */

const SKY_PALETTES = {
  morning: { top: '#ffd9a0', bottom: '#ffe9c9', ground: '#d9b98a', accent: '#ffffff',
    dino: '#4a5a4a', dinoDark: '#33403a', cactus: '#2f6b3a', rock: '#8a8578', bird: '#5a4a3a', sun: '#ffdd88' },
  day: { top: '#7ec8f0', bottom: '#cdeeff', ground: '#c9a876', accent: '#ffffff',
    dino: '#3f4f3f', dinoDark: '#2b362b', cactus: '#2f6b3a', rock: '#8a8578', bird: '#4a3a2a', sun: '#fff6c8' },
  sunset: { top: '#ff8a5b', bottom: '#ffd08a', ground: '#b98a63', accent: '#ffe0c2',
    dino: '#4a3f3a', dinoDark: '#332b28', cactus: '#5a6b3a', rock: '#8a7568', bird: '#3a2a20', sun: '#ff7043' },
  night: { top: '#1a2340', bottom: '#2c3a63', ground: '#4a4258', accent: '#c9d6ff',
    dino: '#7a8a9a', dinoDark: '#4a5560', cactus: '#2a3b4a', rock: '#5a5a68', bird: '#2a2a3a', moon: '#e8e8d8' },
  deepNight: { top: '#05070f', bottom: '#141a30', ground: '#2a2638', accent: '#8a9ad0',
    dino: '#6a7a8a', dinoDark: '#3a4550', cactus: '#1a2b3a', rock: '#3a3a48', bird: '#1a1a2a', moon: '#d8d8e8' },
};

function lerpColor(a, b, t) {
  const pa = hexToRgb(a); const pb = hexToRgb(b);
  const r = Math.round(pa.r + (pb.r - pa.r) * t);
  const g = Math.round(pa.g + (pb.g - pa.g) * t);
  const bl = Math.round(pa.b + (pb.b - pa.b) * t);
  return `rgb(${r},${g},${bl})`;
}
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return { r: parseInt(h.substring(0, 2), 16), g: parseInt(h.substring(2, 4), 16), b: parseInt(h.substring(4, 6), 16) };
}

class Environment {
  constructor(width, height, groundY) {
    this.width = width;
    this.height = height;
    this.groundY = groundY;
    this.distance = 0;
    this.clouds = this.makeLayer(5, () => ({ x: Math.random() * width, y: 20 + Math.random() * 60, s: 0.6 + Math.random() * 0.8 }));
    this.mountains = this.makeLayer(4, (i) => ({ x: i * (width / 3), y: this.groundY - 40, s: 1 + Math.random() * 0.6 }));
    this.trees = this.makeLayer(6, () => ({ x: Math.random() * width, s: 0.8 + Math.random() * 0.5 }));
    this.stars = Array.from({ length: 60 }, () => ({ x: Math.random() * width, y: Math.random() * (groundY - 30), r: Math.random() * 1.6, tw: Math.random() * Math.PI * 2 }));
    this.birds = [];
  }

  makeLayer(count, factory) {
    return Array.from({ length: count }, (_, i) => factory(i));
  }

  getPalette(score) {
    const names = CONFIG.environment.phaseNames;
    const distances = CONFIG.environment.phaseDistances;
    let idx = 0;
    for (let i = 0; i < distances.length; i++) if (score >= distances[i]) idx = i;
    const nextIdx = Math.min(idx + 1, names.length - 1);
    const rangeStart = distances[idx];
    const rangeEnd = distances[nextIdx] === rangeStart ? rangeStart + 1 : distances[nextIdx];
    const t = idx === nextIdx ? 0 : Math.min(1, (score - rangeStart) / (rangeEnd - rangeStart));
    const a = SKY_PALETTES[names[idx]];
    const b = SKY_PALETTES[names[nextIdx]];
    return {
      top: lerpColor(a.top, b.top, t), bottom: lerpColor(a.bottom, b.bottom, t),
      ground: lerpColor(a.ground, b.ground, t), accent: lerpColor(a.accent, b.accent, t),
      dino: lerpColor(a.dino, b.dino, t), dinoDark: lerpColor(a.dinoDark, b.dinoDark, t),
      cactus: lerpColor(a.cactus, b.cactus, t), rock: lerpColor(a.rock, b.rock, t), bird: lerpColor(a.bird, b.bird, t),
      sun: a.sun || null, moon: a.moon || b.moon || null,
      phaseName: t < 0.5 ? names[idx] : names[nextIdx],
      nightAmount: Math.max(0, Math.min(1, (idx + t - 2))), // 0 during day, ramps into night phases
    };
  }

  update(dt, speed, score) {
    const frameScale = dt / (1000 / 60);
    this.distance += speed * frameScale;
    const p = CONFIG.environment.parallax;
    this.clouds.forEach((c) => { c.x -= speed * p.clouds * frameScale; if (c.x < -60) c.x = this.width + Math.random() * 100; });
    this.mountains.forEach((m) => { m.x -= speed * p.mountains * frameScale; if (m.x < -200) m.x = this.width + 50; });
    this.trees.forEach((t) => { t.x -= speed * p.trees * frameScale; if (t.x < -30) t.x = this.width + Math.random() * 60; });
    this.stars.forEach((s) => { s.tw += dt * 0.002; });
    this.palette = this.getPalette(score);
  }

  draw(ctx, score) {
    const pal = this.palette || this.getPalette(score);
    // sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, this.groundY);
    grad.addColorStop(0, pal.top);
    grad.addColorStop(1, pal.bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, this.groundY);

    // stars fade in with night amount
    const nightAlpha = Math.max(0, Math.min(1, (pal.nightAmount)));
    if (nightAlpha > 0.02) {
      ctx.save();
      ctx.globalAlpha = nightAlpha;
      this.stars.forEach((s) => {
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = nightAlpha * (0.5 + 0.5 * Math.sin(s.tw));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    // sun or moon
    const celestialX = this.width * 0.82;
    const celestialY = 55;
    if (nightAlpha < 0.5 && pal.sun) {
      ctx.fillStyle = pal.sun;
      ctx.beginPath(); ctx.arc(celestialX, celestialY, 26, 0, Math.PI * 2); ctx.fill();
    } else if (pal.moon) {
      ctx.fillStyle = pal.moon;
      ctx.beginPath(); ctx.arc(celestialX, celestialY, 20, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = pal.top;
      ctx.beginPath(); ctx.arc(celestialX + 8, celestialY - 4, 18, 0, Math.PI * 2); ctx.fill();
    }

    // mountains
    ctx.fillStyle = nightAlpha > 0.5 ? 'rgba(20,20,40,0.55)' : 'rgba(120,100,90,0.35)';
    this.mountains.forEach((m) => {
      ctx.beginPath();
      ctx.moveTo(m.x - 90 * m.s, this.groundY);
      ctx.lineTo(m.x, this.groundY - 70 * m.s);
      ctx.lineTo(m.x + 90 * m.s, this.groundY);
      ctx.closePath();
      ctx.fill();
    });

    // clouds
    ctx.fillStyle = nightAlpha > 0.5 ? 'rgba(200,210,255,0.15)' : 'rgba(255,255,255,0.85)';
    this.clouds.forEach((c) => {
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, 22 * c.s, 10 * c.s, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x + 16 * c.s, c.y + 4 * c.s, 16 * c.s, 8 * c.s, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x - 16 * c.s, c.y + 4 * c.s, 14 * c.s, 7 * c.s, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // ground
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY);
    ctx.strokeStyle = nightAlpha > 0.5 ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, this.groundY); ctx.lineTo(this.width, this.groundY); ctx.stroke();

    // trees (small silhouettes along the ground)
    ctx.fillStyle = nightAlpha > 0.5 ? 'rgba(10,15,10,0.5)' : 'rgba(60,80,40,0.45)';
    this.trees.forEach((t) => {
      const baseY = this.groundY;
      ctx.fillRect(t.x - 1.5, baseY - 14 * t.s, 3, 14 * t.s);
      ctx.beginPath();
      ctx.arc(t.x, baseY - 16 * t.s, 8 * t.s, 0, Math.PI * 2);
      ctx.fill();
    });

    // night screen tint for extra atmosphere
    if (nightAlpha > 0.05) {
      ctx.fillStyle = `rgba(10,10,30,${nightAlpha * 0.18})`;
      ctx.fillRect(0, 0, this.width, this.groundY);
    }
  }
}
