// =====================================================================
//  Забег: маг, орды, заклинания, добыча. Логика своя, Phaser только рисует.
// =====================================================================
let G = null, SC = null, R = null, CAM = null;
const PR = 13;                                   // радиус мага
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.random() * a.length | 0];
const ADD = () => Phaser.BlendModes.ADD;

// ---------- спрайты
function img(key, x, y, depth) {
  const i = SC.add.image(x, y, key).setScale(1 / K); const o = TEXO[key]; if (o) i.setOrigin(o[0], o[1]);
  if (depth !== undefined) i.setDepth(depth); return i;
}
function glow(x, y, col, size, depth = 9e5) { return img("soft", x, y, depth).setTint(col).setBlendMode(ADD()).setScale(size / 64 / K); }
const sizeTo = (i, d) => i.setScale(d / TEXW[i.texture.key] / K);

// ---------- частицы по цветам
const EMIT = {};
function emitter(col) {
  if (EMIT[col]) return EMIT[col];
  return EMIT[col] = SC.add.particles(0, 0, "soft", { speed: { min: 50, max: 230 }, scale: { start: 0.1, end: 0 }, lifespan: { min: 220, max: 520 }, blendMode: "ADD", tint: col, emitting: false }).setDepth(1e6);
}
function burst(x, y, col, n) { emitter(col).explode(n, x, y); }

// ---------- числа урона
const NUM = []; let numI = 0;
function number(x, y, v, crit) {
  let o = NUM[numI % 36];
  if (!o) { o = NUM[numI % 36] = { t: SC.add.text(0, 0, "", { fontFamily: "Rubik", fontStyle: "800", fontSize: "14px", color: "#fff", stroke: "#1a1030", strokeThickness: 4 }).setOrigin(0.5).setDepth(2e6).setResolution(3), life: 0 }; }
  numI++;
  o.t.setText(v).setPosition(x + rnd(-6, 6), y).setAlpha(1).setVisible(true).setColor(crit ? "#ffe14a" : "#ffffff").setScale(crit ? 1.45 : 1);
  o.life = 0.65; o.vy = crit ? -70 : -50;
}
function tickNumbers(dt) { for (const o of NUM) if (o && o.life > 0) { o.life -= dt; o.t.y += o.vy * dt; o.vy *= 0.94; o.t.setAlpha(Math.min(1, o.life / 0.3)); if (o.life <= 0) o.t.setVisible(false); } }

// ---------- сетка для быстрого поиска врагов рядом
const CELL = 72; const GRID = new Map();
const gk = (ix, iy) => (ix + 30000) * 60000 + (iy + 30000);
function buildGrid() { GRID.clear(); for (const e of R.foes) { if (e.dead) continue; const k = gk(Math.floor(e.x / CELL), Math.floor(e.y / CELL)); let a = GRID.get(k); if (!a) GRID.set(k, a = []); a.push(e); } }
function near(x, y, r, cb) {
  const m = r + 64, x0 = Math.floor((x - m) / CELL), x1 = Math.floor((x + m) / CELL), y0 = Math.floor((y - m) / CELL), y1 = Math.floor((y + m) / CELL);
  for (let ix = x0; ix <= x1; ix++) for (let iy = y0; iy <= y1; iy++) { const a = GRID.get(gk(ix, iy)); if (a) for (const e of a) { if (e.dead) continue; const dx = e.x - x, dy = e.y - y, rr = r + e.r; if (dx * dx + dy * dy < rr * rr) cb(e); } }
}
function nearest(x, y, range, skip) {
  let best = null, bd = range * range;
  for (const e of R.foes) { if (e.dead || (skip && skip.has(e))) continue; const dx = e.x - x, dy = e.y - y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = e; } }
  return best;
}

// ---------- звук
const SND = {
  fire: [.22, 0, 260, .01, .03, .16, 4, 1.4, -3, 0, 0, 0, 0, .5],
  boom: [.45, 0, 80, .01, .07, .32, 4, 2.2, 0, 0, 0, 0, 0, 1, 0, .25],
  ice: [.16, 0, 1500, .004, .02, .07, 1, 1.8, -40],
  bolt: [.32, 0, 700, .004, .04, .18, 4, 3, 0, 0, 0, 0, 0, 2, 0, .4],
  hit: [.16, 0, 170, .002, .01, .05, 2, 2, -10],
  kill: [.2, 0, 340, .004, .02, .07, 1, 1.5, 0, 0, 260, .02],
  lvl: [.45, 0, 520, .02, .14, .4, 1, 1, 0, 0, 260, .08, .08],
  hurt: [.4, 0, 140, .005, .05, .16, 3, 2, -10],
  coin: [.3, 0, 1500, .005, .03, .12, 1, 1, 0, 0, 600, .04],
  chest: [.5, 0, 400, .02, .2, .5, 1, 1, 0, 0, 200, .1, .1],
  steam: [.3, 0, 200, .02, .1, .3, 4, 1, 0, 0, 0, 0, 0, .3],
};
const GEM_SND = Array.from({ length: 10 }, (_, i) => [.14, 0, 900 + i * 90, .002, .02, .05, 1, 1.2]);
const sndT = {};
function snd(name, gap = 0.05) { const t = performance.now() / 1000; if ((sndT[name] || 0) > t) return; sndT[name] = t + gap; sfx(SND[name]); }
function muteAll(on) { if (master) master.gain.value = on ? 0 : 0.32; }

// =====================================================================
//  Сцена Phaser
// =====================================================================
class Run extends Phaser.Scene {
  constructor() { super({ key: "run" }); }
  create() {
    SC = this; CAM = this.cameras.main; makeTextures(this);
    this.ground = this.add.tileSprite(0, 0, 256 * 14, 256 * 14, "tile").setOrigin(0).setDepth(-1e7).setScale(1);
    CAM.setBackgroundColor("#2f5a3a");
    this.hpG = this.add.graphics().setDepth(1.5e6);
    fitCamera(); onReady();
  }
  update(_, ms) {
    const dt = Math.min(0.05, ms / 1000);
    if (R && !R.paused && !R.over) { if (R.stop > 0) R.stop -= dt; else tick(dt * (R.slowmo || 1)); }
    if (R) { tickNumbers(dt); drawPlayerHud(); const k = 1 - Math.exp(-dt * 9); R.cx += (R.x - R.cx) * k; R.cy += (R.y - R.cy) * k; CAM.centerOn(R.cx, R.cy); }
    const cx = R ? R.cx : 0, cy = R ? R.cy : 0, vw = CAM.width / CAM.zoom, vh = CAM.height / CAM.zoom;
    this.ground.setPosition(Math.floor((cx - vw / 2) / 256) * 256 - 512, Math.floor((cy - vh / 2) / 256) * 256 - 512);
    uiFrame(dt);
  }
}
function fitCamera() {
  if (!CAM) return; const w = innerWidth, h = innerHeight;
  const fit = Math.max(0.62, Math.min(1.45, Math.min(w, h) / 430));
  CAM.setZoom(DPR * fit);
}

// =====================================================================
//  Новый забег
// =====================================================================
function newRun(start) {
  clearRun();
  const m = P.meta, mod = { dmg: 1 + 0.06 * (m.might || 0), cd: 1, area: 1, speed: 1 + 0.05 * (m.speed || 0), magnet: 1 + 0.15 * (m.magnet || 0), xp: 1 + 0.06 * (m.xp || 0) };
  const maxhp = 100 + 12 * (m.hp || 0);
  R = { t: 0, kills: 0, lvl: 1, xp: 0, need: xpNeed(1), coins: 0, hp: maxhp, maxhp, x: 0, y: 0, face: 1, moving: false, mod,
    elems: { [start]: 1 }, fus: {}, pass: {}, cd: {}, foes: [], shots: [], ebul: [], gems: [], fx: [], blades: [],
    paused: false, over: false, pend: 0, rerolls: m.reroll || 0, revived: false, ev: 0, spawnAcc: 0, boss: null, stop: 0, hurtT: 0, gemCombo: 0, gemT: 0, windA: 0, aura: null, clouds: null };
  R.spr = img("mage", 0, 0); R.orb = glow(0, 0, ELEM[start].col, 22);
  R.cx = 0; R.cy = 0; CAM.centerOn(0, 0);
  for (let i = 0; i < 8; i++) spawnFoe("slime", ...ringPos(1.05));
  yaGameplay(true);
}
function clearRun() {
  if (!R) return;
  for (const a of [R.foes, R.shots, R.ebul, R.gems]) for (const o of a) { o.spr && o.spr.destroy(); o.halo && o.halo.destroy(); }
  for (const f of R.fx) f.kill && f.kill();
  for (const b of R.blades) b.destroy();
  R.aura && R.aura.destroy(); R.snow && R.snow.destroy(); R.clouds && R.clouds.forEach(c => c.spr.destroy());
  R.spr.destroy(); R.orb.destroy(); SC.hpG.clear();
  for (const o of NUM) o && o.t.setVisible(false);
  R = null;
}
function ringPos(k = 1) {
  const v = CAM.worldView, r = Math.hypot(v.width, v.height) / 2 * k + 30, a = Math.random() * Math.PI * 2;
  return [R.x + Math.cos(a) * r, R.y + Math.sin(a) * r];
}

// =====================================================================
//  Враги
// =====================================================================
function spawnFoe(type, x, y, elite) {
  const d = FOES[type], m = d.boss ? 1 : hpMul(R.t) * (elite ? 9 : 1);
  const e = { type, d, x, y, kx: 0, ky: 0, hp: d.hp * m, r: d.r * (elite ? 1.5 : 1), sp: d.sp * (elite ? 1.05 : 1), dmg: d.dmg * (elite ? 1.6 : 1),
    xp: d.xp * (elite ? 12 : 1), slowT: 0, frzT: 0, flash: 0, hw: {}, seed: Math.random() * 7, elite, shootT: rnd(1.5, 3.5), dead: false, kb: d.heavy ?? 1 };
  e.maxhp = e.hp;
  e.spr = img("f_" + type, x, y); e.base = (elite ? 1.5 : 1) / K; e.spr.setScale(e.base);
  if (elite || d.boss) { e.halo = glow(x, y, elite ? 0xffd23a : 0xff4a6a, e.r * 4.2, 0); e.halo.setAlpha(0.55); }
  if (d.boss) { R.boss = e; bossBar(e); }
  R.foes.push(e); return e;
}
function hurtFoe(e, dmg, col, kx = 0, ky = 0, noNum) {
  if (e.dead) return;
  const crit = Math.random() < 0.08; dmg = Math.max(1, Math.round(dmg * R.mod.dmg * rnd(0.9, 1.1) * (crit ? 2 : 1)));
  e.hp -= dmg; e.flash = 0.08; e.kx += kx * e.kb; e.ky += ky * e.kb;
  if (!noNum && (crit || e.d.boss || e.elite || Math.random() < 0.3)) number(e.x, e.y - e.r - 6, dmg, crit);
  snd("hit", 0.04);
  if (e.hp <= 0) killFoe(e, col);
}
function killFoe(e, col) {
  e.dead = true; R.kills++;
  burst(e.x, e.y, e.d.col, e.d.boss ? 40 : e.elite ? 22 : 7); if (col) burst(e.x, e.y, col, 4);
  const s = e.spr; SC.tweens.add({ targets: s, scaleX: e.base * 1.5, scaleY: e.base * 0.4, alpha: 0, duration: 160, onComplete: () => s.destroy() });
  if (e.halo) { const h = e.halo; SC.tweens.add({ targets: h, alpha: 0, duration: 300, onComplete: () => h.destroy() }); }
  snd("kill", 0.03);
  // добыча
  let v = e.xp; const kind = v >= 10 ? "gem3" : v >= 3 ? "gem2" : "gem1";
  dropGem(e.x, e.y, kind, v);
  const r = Math.random();
  if (e.elite || e.d.boss) { drop(e.x + 14, e.y, "chest"); R.stop = 0.09; CAM.shake(260, 0.006); }
  else if (r < 0.035) drop(e.x + rnd(-8, 8), e.y, "coin");
  else if (r < 0.045) drop(e.x, e.y, "meat");
  else if (r < 0.048) drop(e.x, e.y, "magnetP");
  if (e.d.boss) { R.boss = null; bossBar(null); for (let i = 0; i < 12; i++) drop(e.x + rnd(-50, 50), e.y + rnd(-50, 50), "coin"); banner(e.d.name + " повержен!"); }
}
function updateFoes(dt) {
  const t = R.t;
  for (const e of R.foes) {
    if (e.dead) continue;
    let sm = 1; if (e.frzT > 0) { e.frzT -= dt; sm = 0; } else if (e.slowT > 0) { e.slowT -= dt; sm = 0.45; }
    let dx = R.x - e.x, dy = R.y - e.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    let vx = dx, vy = dy;
    if (e.type === "bat") { const w = Math.sin(t * 6 + e.seed) * 0.6; vx -= dy * w; vy += dx * w; }
    if (e.d.ranged) {
      if (d < 210) { vx = -dy * 0.8 - dx * 0.3; vy = dx * 0.8 - dy * 0.3; }
      e.shootT -= dt * sm; if (e.shootT <= 0 && d < 340) { e.shootT = rnd(2.4, 3.2); enemyShot(e.x, e.y, dx, dy); }
    }
    if (e.d.charger) {
      e.cT = (e.cT ?? rnd(1, 3)) - dt * sm;
      if (e.st === "wind") { vx = vy = 0; if (e.cT <= 0) { e.st = "dash"; e.cT = 0.5; } }
      else if (e.st === "dash") { vx = e.dx * 6.5; vy = e.dy * 6.5; if (Math.random() < 0.5) burst(e.x, e.y + e.r, 0xc8a070, 1); if (e.cT <= 0) { e.st = ""; e.cT = rnd(2.2, 3.2); } }
      else if (e.cT <= 0 && d < 280) { e.st = "wind"; e.cT = 0.6; e.dx = dx; e.dy = dy; }
    }
    if (e.d.boss) { e.shootT -= dt; if (e.shootT <= 0) { e.shootT = e.type === "boss2" ? 2.2 : 3.2; for (let k = 0; k < (e.type === "boss2" ? 14 : 9); k++) { const a = k / (e.type === "boss2" ? 14 : 9) * Math.PI * 2 + t; enemyShot(e.x, e.y, Math.cos(a), Math.sin(a)); } } }
    e.x += (vx * e.sp * sm + e.kx) * dt; e.y += (vy * e.sp * sm + e.ky) * dt;
    const kd = Math.exp(-dt * 9); e.kx *= kd; e.ky *= kd;
    // если отстал далеко — переносим вперёд по ходу мага
    if (d > 1100 && !e.d.boss) { const p = ringPos(1.02); e.x = p[0]; e.y = p[1]; }
  }
  // расталкивание
  for (const a of GRID.values()) {
    const n = Math.min(a.length, 14);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const p = a[i], q = a[j], dx = q.x - p.x, dy = q.y - p.y, rr = (p.r + q.r) * 0.85, d2 = dx * dx + dy * dy;
      if (d2 < rr * rr && d2 > 0.01) { const d = Math.sqrt(d2), push = (rr - d) * 0.35 / d; const wp = p.d.boss ? 0.05 : 1, wq = q.d.boss ? 0.05 : 1; p.x -= dx * push * wp; p.y -= dy * push * wp; q.x += dx * push * wq; q.y += dy * push * wq; }
    }
  }
  // отрисовка
  for (const e of R.foes) {
    if (e.dead) continue; const s = e.spr;
    s.setPosition(e.x, e.y).setDepth(e.y);
    const w = Math.sin(t * (e.type === "bat" ? 22 : 9) + e.seed);
    if (e.type === "bat") s.setScale(e.base * (1 + w * 0.18), e.base); else s.setScale(e.base * (1 + w * 0.05), e.base * (1 - w * 0.06));
    s.setFlipX(R.x < e.x);
    if (e.st === "wind") { s.setTint(0xff7a7a); s.x += Math.sin(t * 60) * 1.5; } else if (e.flash > 0) { e.flash -= 1 / 60; s.setTintFill(0xffffff); } else if (e.frzT > 0) s.setTint(0x88e8ff); else if (e.slowT > 0) s.setTint(0xc0f0ff); else s.clearTint();
    if (e.halo) e.halo.setPosition(e.x, e.y).setDepth(e.y - 1);
  }
  R.foes = R.foes.filter(e => !e.dead);
}
function enemyShot(x, y, dx, dy) {
  const s = img("dot", x, y, 1.2e6).setTint(0xff3a5a).setScale(12 / 16 / K); const h = glow(x, y, 0xff2a4a, 30, 1.19e6);
  R.ebul.push({ x, y, vx: dx * 150, vy: dy * 150, life: 4, spr: s, halo: h });
}
function updateEnemyShots(dt) {
  for (const b of R.ebul) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; b.spr.setPosition(b.x, b.y); b.halo.setPosition(b.x, b.y);
    if (Math.hypot(b.x - R.x, b.y - R.y) < PR + 5) { b.life = 0; damagePlayer(9); }
    if (b.life <= 0) { b.spr.destroy(); b.halo.destroy(); b.dead = true; }
  }
  R.ebul = R.ebul.filter(b => !b.dead);
}

// =====================================================================
//  Маг
// =====================================================================
function updatePlayer(dt) {
  const v = inputVec(), sp = 150 * R.mod.speed;
  R.moving = v.x !== 0 || v.y !== 0;
  R.x += v.x * sp * dt; R.y += v.y * sp * dt; if (v.x) R.face = v.x > 0 ? 1 : -1;
  if (R.moving) { R.mx = v.x; R.my = v.y; }
  const b = R.moving ? Math.sin(R.t * 15) : Math.sin(R.t * 3) * 0.4;
  R.spr.setPosition(R.x, R.y + 4).setDepth(R.y + 4).setFlipX(R.face < 0).setScale(1 / K * (1 - b * 0.04), 1 / K * (1 + b * 0.06));
  R.spr.rotation = R.moving ? v.x * 0.08 : 0;
  R.orb.setPosition(R.x + 15 * R.face, R.y - 12 + b * 1.5).setDepth(R.y + 5).setScale((24 + Math.sin(R.t * 8) * 4) / 64 / K);
  if (R.hurtT > 0) { R.hurtT -= dt; R.spr.setTint(Math.floor(R.hurtT * 30) % 2 ? 0xff7a7a : 0xffffff); } else R.spr.clearTint();
  // контакт с врагами
  near(R.x, R.y, PR, e => { if (e.frzT > 0 || (e.hitT || 0) > R.t) return; e.hitT = R.t + 1.0; damagePlayer(e.dmg); });
  if (R.pass.heart) R.hp = Math.min(R.maxhp, R.hp + R.pass.heart * 0.25 * dt);
}
function damagePlayer(v, cont) {
  if (R.over) return;
  R.hp -= v;
  if (R.hurtT <= 0) { R.hurtT = 0.35; snd("hurt", 0.25); CAM.shake(90, 0.003); hurtFlash(); }
  if (R.hp <= 0) { R.hp = 0; die(); }
}
function drawPlayerHud() {
  const g = SC.hpG; g.clear(); if (!R) return;
  const w = 34, x = R.x - w / 2, y = R.y + 22, k = R.hp / R.maxhp;
  g.fillStyle(0x1a1030, 0.85).fillRoundedRect(x - 1.5, y - 1.5, w + 3, 7, 3);
  g.fillStyle(k > 0.35 ? 0x5aef7a : 0xff4a5a, 1).fillRoundedRect(x, y, Math.max(0, w * k), 4, 2);
}

// =====================================================================
//  Заклинания
// =====================================================================
const area = v => v * R.mod.area;
function cdReady(id, base, dt) { R.cd[id] = (R.cd[id] ?? base * 0.3) - dt; if (R.cd[id] > 0) return false; R.cd[id] = base * R.mod.cd; return true; }

function castFire(dt, l) {
  const E = ELEM.fire; if (!cdReady("fire", E.cd[l], dt)) return;
  const skip = new Set();
  for (let i = 0; i < E.n[l]; i++) {
    const t = nearest(R.x, R.y, 460, skip); if (!t && i > 0) break; if (t) skip.add(t);
    const a = t ? Math.atan2(t.y - R.y, t.x - R.x) : Math.atan2(R.my || 0, R.mx || 1);
    shoot("fire", R.x + 15 * R.face, R.y - 12, a + (t ? 0 : rnd(-0.3, 0.3)), 360, { dmg: E.dmg[l], boom: E.boom[l], life: 1.6, r: 7 });
  }
  snd("fire", 0.08);
}
function castIce(dt, l) {
  const E = ELEM.ice; if (!cdReady("ice", E.cd[l], dt)) return;
  R.iceA = (R.iceA || 0) + 0.45; const n = E.n[l];
  for (let i = 0; i < n; i++) shoot("ice", R.x, R.y - 4, R.iceA + i / n * Math.PI * 2, 430, { dmg: E.dmg[l], pierce: E.pierce[l], life: 0.75, r: 6 });
  snd("ice", 0.08);
}
function castWind(dt, l) {
  const E = ELEM.wind, n = E.n[l];
  while (R.blades.length < n) R.blades.push(img("blade", R.x, R.y, 1.1e6).setTint(ELEM.wind.col).setBlendMode(ADD()));
  R.windA += E.spin[l] * dt; const rad = area(E.rad[l]);
  R.blades.forEach((b, i) => {
    const a = R.windA + i / n * Math.PI * 2, x = R.x + Math.cos(a) * rad, y = R.y - 4 + Math.sin(a) * rad * 0.82;
    b.setPosition(x, y).setRotation(a + Math.PI / 2).setScale(area(1) / K);
    if (Math.random() < dt * 20) burst(x, y, ELEM.wind.col, 1);
    near(x, y, area(15), e => { if ((e.hw.w || 0) > R.t) return; e.hw.w = R.t + 0.4; const dx = e.x - R.x, dy = e.y - R.y, d = Math.hypot(dx, dy) || 1; hurtFoe(e, E.dmg[l], ELEM.wind.col, dx / d * 260, dy / d * 260); });
  });
}
function castBolt(dt, l) {
  const E = ELEM.bolt; if (!cdReady("bolt", E.cd[l], dt)) return;
  const near8 = R.foes.filter(e => !e.dead && Math.hypot(e.x - R.x, e.y - R.y) < 340); if (!near8.length) { R.cd.bolt = 0.2; return; }
  chain(pick(near8), R.x + 15 * R.face, R.y - 14, E.n[l], E.dmg[l], 130, ELEM.bolt.col, 0);
  snd("bolt", 0.1);
}
function chain(first, sx, sy, n, dmg, jump, col, freeze) {
  const hit = new Set(); let cur = first, px = sx, py = sy;
  for (let i = 0; i < n && cur; i++) {
    zap(px, py, cur.x, cur.y - cur.r * 0.3, col); hit.add(cur); burst(cur.x, cur.y, col, 5);
    if (freeze) cur.frzT = freeze;
    hurtFoe(cur, dmg, col); px = cur.x; py = cur.y;
    cur = nearest(px, py, area(jump), hit);
  }
}
function zap(x1, y1, x2, y2, col) {
  const g = SC.add.graphics().setDepth(1.3e6).setBlendMode(ADD()), d = Math.hypot(x2 - x1, y2 - y1), n = Math.max(3, d / 16 | 0), nx = -(y2 - y1) / (d || 1), ny = (x2 - x1) / (d || 1);
  const pts = []; for (let i = 0; i <= n; i++) { const k = i / n, o = i && i < n ? rnd(-9, 9) : 0; pts.push([x1 + (x2 - x1) * k + nx * o, y1 + (y2 - y1) * k + ny * o]); }
  for (const [w, c, a] of [[6, col, 0.5], [2.4, 0xffffff, 1]]) { g.lineStyle(w, c, a); g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts) g.lineTo(p[0], p[1]); g.strokePath(); }
  SC.tweens.add({ targets: g, alpha: 0, duration: 200, onComplete: () => g.destroy() });
}
function shoot(kind, x, y, a, sp, o) {
  const col = ELEM[kind].col; let s;
  if (kind === "fire") s = glow(x, y, col, 30, 1.2e6);
  else s = img("shard", x, y, 1.2e6).setTint(col).setRotation(a);
  R.shots.push(Object.assign({ kind, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, spr: s, hit: new Set(), col }, o));
}
function updateShots(dt) {
  for (const p of R.shots) {
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.spr.setPosition(p.x, p.y);
    if (p.kind === "fire") { p.spr.setScale((28 + Math.sin(R.t * 30) * 4) / 64 / K); if (Math.random() < dt * 40) burst(p.x, p.y, 0xff5a1a, 1); }
    near(p.x, p.y, p.r, e => {
      if (p.dead || p.hit.has(e)) return; p.hit.add(e);
      if (p.kind === "fire") { explode(p.x, p.y, area(p.boom), p.dmg, ELEM.fire.col, 180); p.dead = true; }
      else { hurtFoe(e, p.dmg, p.col, p.vx * 0.25, p.vy * 0.25); e.slowT = 1.3; burst(e.x, e.y, p.col, 3); if (--p.pierce <= 0) p.dead = true; }
    });
    if (p.life <= 0) p.dead = true;
    if (p.dead) p.spr.destroy();
  }
  R.shots = R.shots.filter(p => !p.dead);
}
function explode(x, y, rad, dmg, col, kb, freeze) {
  near(x, y, rad, e => { const dx = e.x - x, dy = e.y - y, d = Math.hypot(dx, dy) || 1; hurtFoe(e, dmg, col, dx / d * kb, dy / d * kb); if (freeze) e.frzT = freeze; });
  const f = glow(x, y, col, rad * 2.6, 1.25e6); SC.tweens.add({ targets: f, alpha: 0, scale: f.scale * 1.25, duration: 260, onComplete: () => f.destroy() });
  const r = img("ring", x, y, 1.26e6).setTint(col).setBlendMode(ADD()); sizeTo(r, rad * 0.6); const s1 = rad * 2.1 / 128 / K;
  SC.tweens.add({ targets: r, scale: s1, alpha: 0, duration: 280, ease: "Cubic.out", onComplete: () => r.destroy() });
  burst(x, y, col, Math.min(26, 6 + rad / 4 | 0)); snd("boom", 0.06);
}

// ---------- слияния
const FUSE_CAST = {
  fireWind(dt) {
    if (cdReady("fireWind", 3.2, dt)) {
      const t = nearest(R.x, R.y, 500); const o = { x: R.x + rnd(-30, 30), y: R.y + rnd(-30, 30), life: 4.5, tick: 0, tx: t ? t.x : R.x, ty: t ? t.y : R.y, re: 0 };
      o.spr = img("swirl", o.x, o.y, 1.15e6).setTint(0xff8a2a).setBlendMode(ADD()); o.g = glow(o.x, o.y, 0xff5a1a, 90, 1.14e6).setAlpha(0.6);
      o.kill = () => { o.spr.destroy(); o.g.destroy(); };
      o.step = dt => {
        o.life -= dt; o.re -= dt; if (o.re <= 0) { o.re = 1; const t = nearest(o.x, o.y, 400); if (t) { o.tx = t.x; o.ty = t.y; } }
        const dx = o.tx - o.x, dy = o.ty - o.y, d = Math.hypot(dx, dy) || 1; o.x += dx / d * 85 * dt; o.y += dy / d * 85 * dt;
        const rad = area(42); o.spr.setPosition(o.x, o.y).setRotation(R.t * 12).setScale(rad * 2.2 / 80 / K * (1 + Math.sin(R.t * 20) * 0.06)); o.g.setPosition(o.x, o.y);
        if (Math.random() < dt * 30) burst(o.x + rnd(-15, 15), o.y, 0xff6a1a, 1);
        near(o.x, o.y, rad * 1.6, e => { e.x += (o.x - e.x) * dt * 2.2; e.y += (o.y - e.y) * dt * 2.2; });
        o.tick -= dt; if (o.tick <= 0) { o.tick = 0.25; near(o.x, o.y, rad, e => hurtFoe(e, 9, 0xff8a2a, 0, 0)); }
        return o.life > 0;
      };
      R.fx.push(o);
    }
  },
  fireIce(dt) {
    if (!cdReady("fireIce", 2.8, dt)) return;
    const o = { r: 10, max: area(175), hit: new Set() }; o.spr = img("ring", R.x, R.y, 1.26e6).setTint(0xf0f6ff).setBlendMode(ADD());
    o.kill = () => o.spr.destroy(); snd("steam", 0.2);
    o.step = dt => {
      o.r += 520 * dt; o.spr.setPosition(R.x, R.y).setScale(o.r * 2 / 128 / K).setAlpha(Math.max(0, 1 - o.r / o.max));
      near(R.x, R.y, o.r, e => { if (o.hit.has(e)) return; o.hit.add(e); const dx = e.x - R.x, dy = e.y - R.y, d = Math.hypot(dx, dy) || 1; hurtFoe(e, 30, 0xf0f6ff, dx / d * 320, dy / d * 320); });
      for (let i = 0; i < 3; i++) { const a = Math.random() * 7; burst(R.x + Math.cos(a) * o.r, R.y + Math.sin(a) * o.r, 0xe0f0ff, 1); }
      return o.r < o.max;
    };
    R.fx.push(o);
  },
  fireBolt(dt) {
    if (!cdReady("fireBolt", 2.3, dt)) return;
    const vis = R.foes.filter(e => !e.dead && Math.abs(e.x - R.x) < 420 && Math.abs(e.y - R.y) < 420);
    for (let k = 0; k < 2 && vis.length; k++) {
      const t = pick(vis), tx = t.x, ty = t.y, o = { t: 0.55 };
      o.mark = img("ring", tx, ty, -1e5).setTint(0xff3a2a).setAlpha(0.7); sizeTo(o.mark, area(70) * 2);
      o.rock = glow(tx + 160, ty - 420, 0xff6a2a, 50, 1.3e6);
      o.kill = () => { o.mark.destroy(); o.rock.destroy(); };
      o.step = dt => {
        o.t -= dt; const k = Math.max(0, o.t / 0.55);
        o.rock.setPosition(tx + 160 * k, ty - 420 * k); burst(o.rock.x, o.rock.y, 0xff4a1a, 1); o.mark.setAlpha(0.35 + Math.sin(R.t * 30) * 0.3);
        if (o.t <= 0) { explode(tx, ty, area(70), 55, 0xff5a2a, 220); CAM.shake(70, 0.002); crater(tx, ty); return false; }
        return true;
      };
      R.fx.push(o);
    }
  },
  iceWind(dt) {
    const rad = area(115);
    if (!R.aura) { R.aura = glow(R.x, R.y, 0x9ae8ff, 10, -2e5).setAlpha(0.32); R.snow = SC.add.particles(0, 0, "spark", { x: { min: -rad, max: rad }, y: { min: -rad, max: rad }, speed: { min: 10, max: 40 }, scale: { start: 0.5 / K, end: 0 }, lifespan: 900, frequency: 30, tint: 0xe0f6ff, blendMode: "ADD" }).setDepth(1.1e6); }
    R.aura.setPosition(R.x, R.y).setScale(rad * 2.4 / 64 / K); R.snow.setPosition(R.x, R.y);
    if (cdReady("iceWind", 0.5, dt)) near(R.x, R.y, rad, e => { e.slowT = 0.7; hurtFoe(e, 5, 0xc8f0ff, 0, 0, true); });
  },
  iceBolt(dt) {
    if (!cdReady("iceBolt", 1.9, dt)) return;
    const t = nearest(R.x, R.y, 360); if (!t) { R.cd.iceBolt = 0.2; return; }
    chain(t, R.x + 15 * R.face, R.y - 14, 7, 24, 150, 0xa8f4ff, 1.2); snd("bolt", 0.1);
  },
  windBolt(dt) {
    if (!R.clouds) R.clouds = [0, 1].map(i => ({ a: i * Math.PI, cd: 0.3 * i, spr: img("cloud", R.x, R.y, 1.4e6).setAlpha(0.95) }));
    for (const c of R.clouds) {
      c.a += 0.9 * dt; const x = R.x + Math.cos(c.a) * area(150), y = R.y - 30 + Math.sin(c.a) * area(120);
      c.spr.setPosition(x, y - 40 + Math.sin(R.t * 2 + c.a) * 3).setScale((1 + Math.sin(R.t * 3) * 0.03) / K);
      c.cd -= dt; if (c.cd <= 0) { const t = nearest(x, y, area(120)); if (t) { c.cd = 0.65 * R.mod.cd; zap(x, y - 30, t.x, t.y, 0xd8e0ff); explode(t.x, t.y, area(32), 22, 0xd8e0ff, 80); } else c.cd = 0.15; }
    }
  },
};
function crater(x, y) { const c = glow(x, y, 0x000000, 120, -5e5).setBlendMode(Phaser.BlendModes.NORMAL).setAlpha(0.35); SC.tweens.add({ targets: c, alpha: 0, delay: 1500, duration: 1500, onComplete: () => c.destroy() }); }
function updateSpells(dt) {
  for (const id in R.elems) { const l = R.elems[id] - 1; ({ fire: castFire, ice: castIce, wind: castWind, bolt: castBolt })[id](dt, l); }
  for (const id in R.fus) FUSE_CAST[id](dt);
  R.fx = R.fx.filter(f => { const ok = f.step(dt); if (!ok) f.kill(); return ok; });
}

// =====================================================================
//  Добыча и опыт
// =====================================================================
function dropGem(x, y, kind, v) {
  if (R.gems.length > 320) { const g = R.gems[Math.random() * R.gems.length | 0]; if (g.v) { g.v += v; return; } }
  drop(x, y, kind, v);
}
function drop(x, y, kind, v = 0) {
  const s = img(kind, x, y, -1e5 + y * 0.001); const g = { x, y, kind, v, spr: s, pull: kind === "chest" ? false : false, vy: -60, h: 0, sp: 0 };
  R.gems.push(g);
}
function updateGems(dt) {
  const mr = 95 * R.mod.magnet * (1 + 0.35 * (R.pass.magnet || 0));
  R.gemT -= dt; if (R.gemT <= 0) R.gemCombo = 0;
  for (const g of R.gems) {
    if (g.h < 0 || g.vy < 0) { g.vy += 500 * dt; g.h = Math.min(0, (g.h || 0) + g.vy * dt); }
    const dx = R.x - g.x, dy = R.y - g.y, d = Math.hypot(dx, dy);
    if (!g.pull && d < (g.kind === "chest" ? 30 : mr)) g.pull = true;
    if (g.pull) { g.sp = Math.min(900, g.sp + 1400 * dt); g.x += dx / (d || 1) * g.sp * dt; g.y += dy / (d || 1) * g.sp * dt; }
    g.spr.setPosition(g.x, g.y + g.h + Math.sin(R.t * 4 + g.x) * 1.2);
    if (d < 16) { g.dead = true; g.spr.destroy(); collect(g); }
  }
  R.gems = R.gems.filter(g => !g.dead);
}
function collect(g) {
  if (g.v) { R.xp += g.v * R.mod.xp; R.gemCombo = Math.min(9, R.gemCombo + 1); R.gemT = 0.35; sfx(GEM_SND[R.gemCombo]); while (R.xp >= R.need) { R.xp -= R.need; R.lvl++; R.need = xpNeed(R.lvl); levelUp(); } }
  else if (g.kind === "coin") { R.coins += 1; snd("coin", 0.05); }
  else if (g.kind === "meat") { R.hp = Math.min(R.maxhp, R.hp + 30); number(R.x, R.y - 30, "+30 ❤", false); snd("coin"); }
  else if (g.kind === "magnetP") { for (const o of R.gems) if (o.v) o.pull = true; snd("chest"); }
  else if (g.kind === "chest") { R.coins += 10; snd("chest"); burst(R.x, R.y, 0xffd23a, 30); openChest(); }
}
function levelUp() { R.pend++; burst(R.x, R.y, 0xffe45c, 24); snd("lvl", 0.2); if (!R.paused) showLevelUp(); }

// варианты на выбор
function options(n = 3) {
  const pool = [], ne = Object.keys(R.elems).length, np = Object.keys(R.pass).length;
  for (const id of ELEM_IDS) { const l = R.elems[id]; if (l && l < 5) pool.push({ k: "e", id, w: 3 }); else if (!l && ne < MAX_ELEM) pool.push({ k: "e", id, w: 2.2 }); }
  for (const id in PASS) { const l = R.pass[id]; if (l && l < 5) pool.push({ k: "p", id, w: 1.4 }); else if (!l && np < MAX_PASS) pool.push({ k: "p", id, w: 1 }); }
  const fus = Object.keys(FUSE).filter(id => !R.fus[id] && (R.elems[FUSE[id].a] || 0) >= 3 && (R.elems[FUSE[id].b] || 0) >= 3).map(id => ({ k: "f", id }));
  const out = fus.slice(0, 1);
  while (out.length < n && pool.length) { let s = pool.reduce((a, o) => a + o.w, 0), r = Math.random() * s; const i = pool.findIndex(o => (r -= o.w) <= 0); out.push(pool.splice(i < 0 ? 0 : i, 1)[0]); }
  if (!out.length) out.push({ k: "heal" }, { k: "gold" });
  return out;
}
function applyOption(o) {
  if (o.k === "e") { R.elems[o.id] = (R.elems[o.id] || 0) + 1; R.orb.setTint(ELEM[o.id].col); }
  else if (o.k === "p") {
    const l = R.pass[o.id] = (R.pass[o.id] || 0) + 1;
    if (o.id === "might") R.mod.dmg += 0.12; if (o.id === "haste") R.mod.cd *= 0.92; if (o.id === "area") R.mod.area += 0.12; if (o.id === "boots") R.mod.speed += 0.1;
    if (o.id === "heart") { R.maxhp += 25; R.hp = Math.min(R.maxhp, R.hp + 40); }
  }
  else if (o.k === "f") { R.fus[o.id] = 1; P.fusions[o.id] = 1; banner(FUSE[o.id].name + "!"); CAM.flash(250, 255, 240, 200); burst(R.x, R.y, FUSE[o.id].col, 40); }
  else if (o.k === "heal") R.hp = R.maxhp;
  else if (o.k === "gold") R.coins += 15;
}

// =====================================================================
//  Время, волны, события
// =====================================================================
function director(dt) {
  const min = Math.min(9, R.t / 60 | 0), W = WAVES[min];
  R.spawnAcc += dt;
  if (R.spawnAcc > 0.15) {
    R.spawnAcc = 0; const need = targetCount(R.t) - R.foes.length;
    for (let i = 0; i < Math.min(need, (0.6 + min * 0.3) * (Math.random() < 0.5 ? 1 : 2) | 0 || 1); i++) { let s = 0; for (const k in W) s += W[k]; let r = Math.random() * s, type = "slime"; for (const k in W) if ((r -= W[k]) <= 0) { type = k; break; } spawnFoe(type, ...ringPos(1.05)); }
  }
  const ev = EVENTS[R.ev];
  if (ev && R.t >= ev.t) {
    R.ev++; banner(ev.say);
    if (ev.kind === "ring") { const v = CAM.worldView, rad = Math.max(v.width, v.height) * 0.62; for (let i = 0; i < ev.n; i++) { const a = i / ev.n * Math.PI * 2; spawnFoe(ev.foe, R.x + Math.cos(a) * rad, R.y + Math.sin(a) * rad); } }
    else if (ev.kind === "elite") spawnFoe(ev.foe, ...ringPos(1.02), true);
    else if (ev.kind === "boss") { spawnFoe(ev.foe, ...ringPos(1.02)); CAM.shake(400, 0.004); }
  }
}
function tick(dt) {
  R.t += dt;
  buildGrid();
  updatePlayer(dt); if (R.over) return;
  director(dt); updateFoes(dt); buildGrid();
  updateSpells(dt); updateShots(dt); updateEnemyShots(dt); updateGems(dt);
  if (R.t >= RUN_TIME && !R.over) win();
}
function win() {
  R.over = true; yaGameplay(false);
  for (const e of R.foes) { e.dead = true; burst(e.x, e.y, e.d.col, 5); e.spr.destroy(); e.halo && e.halo.destroy(); }
  R.foes = []; CAM.flash(600, 255, 255, 220); snd("chest");
  setTimeout(() => endRun(true), 1200);
}
function die() {
  R.over = true; yaGameplay(false); CAM.shake(300, 0.008); burst(R.x, R.y, 0xff4a5a, 30);
  setTimeout(() => R.revived ? endRun(false) : showRevive(), 900);
}
function revive() {
  R.revived = true; R.over = false; R.hp = R.maxhp * 0.6; R.hurtT = 1.5;
  explode(R.x, R.y, 260, 999, 0xffe45c, 500); CAM.flash(300, 255, 240, 180); yaGameplay(true);
}
window.__mag = { get R() { return R; }, newRun, applyOption, options, spawnFoe, levelUp, tick, nearest };
