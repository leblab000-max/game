// =====================================================================
//  Бой: арена, волны, оружие, враги, добыча. Логика своя, Phaser рисует.
// =====================================================================
let G = null, SC = null, R = null, CAM = null;
const PR = 13;                                   // радиус мага
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.random() * a.length | 0];
const ADD = () => Phaser.BlendModes.ADD;
const clampA = (v, m = 0) => Math.max(-ARENA + m, Math.min(ARENA - m, v));

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
function number(x, y, v, crit, col) {
  let o = NUM[numI % 36];
  if (!o) { o = NUM[numI % 36] = { t: SC.add.text(0, 0, "", { fontFamily: "Rubik", fontStyle: "800", fontSize: "14px", color: "#fff", stroke: "#1a1030", strokeThickness: 4 }).setOrigin(0.5).setDepth(2e6).setResolution(3), life: 0 }; }
  numI++;
  o.t.setText(v).setPosition(x + rnd(-6, 6), y).setAlpha(1).setVisible(true).setColor(col || (crit ? "#ffe14a" : "#ffffff")).setScale(crit ? 1.45 : 1);
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
  throw: [.14, 0, 900, .002, .01, .05, 4, 1, -20],
  swing: [.3, 0, 180, .01, .03, .12, 4, 1, -6, 0, 0, 0, 0, .2],
  hit: [.16, 0, 170, .002, .01, .05, 2, 2, -10],
  kill: [.2, 0, 340, .004, .02, .07, 1, 1.5, 0, 0, 260, .02],
  lvl: [.45, 0, 520, .02, .14, .4, 1, 1, 0, 0, 260, .08, .08],
  hurt: [.4, 0, 140, .005, .05, .16, 3, 2, -10],
  coin: [.3, 0, 1500, .005, .03, .12, 1, 1, 0, 0, 600, .04],
  chest: [.5, 0, 400, .02, .2, .5, 1, 1, 0, 0, 200, .1, .1],
  steam: [.3, 0, 200, .02, .1, .3, 4, 1, 0, 0, 0, 0, 0, .3],
  brew: [.5, 0, 300, .05, .3, .6, 0, 1, 0, 0, 0, 0, .12, .2, 0, 0, 0, .7],
  wave: [.5, 0, 260, .02, .2, .5, 1, 1, 0, 0, 390, .12, .14],
};
const GEM_SND = Array.from({ length: 10 }, (_, i) => [.12, 0, 900 + i * 90, .002, .02, .05, 1, 1.2]);
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
    this.ground = this.add.tileSprite(-2560, -2560, 5120, 5120, "tile").setOrigin(0).setDepth(-1e7).setTileScale(1 / K);
    CAM.setBackgroundColor("#2f5a3a");
    drawArenaEdge(this);
    this.hpG = this.add.graphics().setDepth(1.5e6);
    fitCamera(); onReady();
  }
  update(_, ms) {
    const dt = Math.min(0.05, ms / 1000);
    if (R && !R.paused && !R.over) { if (R.stop > 0) R.stop -= dt; else { if (R.slowT > 0) R.slowT -= dt; tick(R.slowT > 0 ? dt * 0.3 : dt); } }
    if (R) { tickNumbers(dt); drawPlayerHud(); const k = 1 - Math.exp(-dt * 9); R.cx += (R.x - R.cx) * k; R.cy += (R.y - R.cy) * k; CAM.centerOn(R.cx, R.cy); }
    uiFrame(dt);
  }
}
function fitCamera() {
  if (!CAM) return; const w = innerWidth, h = innerHeight;
  const fit = Math.max(0.62, Math.min(1.45, Math.min(w, h) / 430));
  CAM.setZoom(DPR * fit);
}
// край арены: тёмный лес за оградой из камней
function drawArenaEdge(sc) {
  const g = sc.add.graphics().setDepth(-9e6), A = ARENA, F = 3000;
  g.fillStyle(0x14281c, 0.82);
  g.fillRect(-F, -F, 2 * F, F - A); g.fillRect(-F, A, 2 * F, F - A); g.fillRect(-F, -A, F - A, 2 * A); g.fillRect(A, -A, F - A, 2 * A);
  let s = 3; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const stone = (x, y) => { const rr = 9 + r() * 7; g.fillStyle(0x5a6470, 1).fillCircle(x, y + 2, rr); g.fillStyle(0x8a94a0, 1).fillCircle(x - 1, y, rr * 0.85); g.fillStyle(0xb0b8c4, 1).fillCircle(x - rr * 0.3, y - rr * 0.3, rr * 0.3); };
  for (let t = -A; t <= A; t += 22) { stone(t, -A); stone(t, A); stone(-A, t); stone(A, t); }
  for (let i = 0; i < 90; i++) { const side = i % 4, t = rnd(-A - 200, A + 200), o = rnd(40, 260); const x = side === 0 ? t : side === 1 ? t : side === 2 ? -A - o : A + o, y = side === 0 ? -A - o : side === 1 ? A + o : t; const rr = 22 + r() * 22; g.fillStyle(0x0e2016, 1).fillCircle(x + 4, y + 6, rr); g.fillStyle(0x1e4a2c, 1).fillCircle(x, y, rr); g.fillStyle(0x2c6a3c, 1).fillCircle(x - rr * 0.3, y - rr * 0.3, rr * 0.55); }
}

// =====================================================================
//  Новый забег
// =====================================================================
function newRun(cid) {
  const C = CHARS[cid], start = C.start;
  clearRun();
  const m = P.meta;
  const st = { dmg: 1 + 0.05 * (m.might || 0), atk: 1, area: 1, speed: 1 + 0.04 * (m.speed || 0), crit: 0.05, regen: 0, magnet: 1, gain: 1 + 0.05 * (m.gain || 0) };
  const maxhp = 100 + 10 * (m.hp || 0);
  R = { t: 0, kills: 0, lvl: 1, xp: 0, need: xpNeed(1), cr: 15 + 10 * (m.start || 0), hp: maxhp, maxhp, x: 0, y: 0, face: 1, moving: false, st,
    weap: [], items: {}, foes: [], shots: [], ebul: [], gems: [], fx: [], spq: [],
    paused: false, over: false, pend: 0, revived: false, boss: null, stop: 0, hurtT: 0, gemCombo: 0, gemT: 0,
    wave: 0, waveT: 0, inWave: false, ev: 0, spawnAcc: 0, freeRolls: m.reroll || 0, cx: 0, cy: 0, earned: 0 };
  R.spr = img("mage", 0, 0); R.orb = glow(0, 0, 0xc8a8ff, 22);
  CAM.centerOn(0, 0);
  R.ch = C; if (C.st) applySt(C.st);
  addWeapon(start, 0);
  startWave(1);
}
function clearRun() {
  if (!R) return;
  for (const a of [R.foes, R.shots, R.ebul, R.gems]) for (const o of a) { o.spr && o.spr.destroy(); o.halo && o.halo.destroy(); }
  for (const f of R.fx) f.kill && f.kill();
  for (const q of R.spq) q.mark.destroy();
  for (const w of R.weap) dropWeaponFx(w);
  R.spr.destroy(); R.orb.destroy(); SC.hpG.clear();
  for (const o of NUM) o && o.t.setVisible(false);
  R = null;
}
function applySt(st, k = 1) { for (const key in st) { if (key === "maxhp") { R.maxhp += st[key] * k; R.hp = Math.min(R.maxhp, R.hp + st[key] * k); } else R.st[key] += st[key] * k; } }

// ---------- оружие в руках
function addWeapon(id, tier) {
  if (R.weap.length >= MAX_WEAP) return false;
  R.weap.push({ id, tier, def: wdef(id), cd: rnd(0.1, 0.5), s: {} });
  const e = wdef(id).elem; if (e) R.orb.setTint(ELEM[e].col);
  return true;
}
function dropWeaponFx(w) { const s = w.s; (s.blades || []).forEach(b => b.destroy()); s.aura && s.aura.destroy(); s.snow && s.snow.destroy(); (s.clouds || []).forEach(c => c.spr.destroy()); w.s = {}; }
function removeWeapon(i) { const w = R.weap[i]; dropWeaponFx(w); R.weap.splice(i, 1); }

// =====================================================================
//  Волны
// =====================================================================
function startWave(w) {
  R.wave = w; R.waveT = waveTime(w); R.ev = 0; R.inWave = true; R.spawnAcc = 0; R.hp = R.maxhp;
  for (const x of R.weap) x.cd = rnd(0.1, 0.5);
  banner(w === WAVES_TOTAL ? "Последняя волна!" : "Волна " + w);
  if (w === 1 && !P.tut) hint("Веди пальцем по экрану — маг побежит. Колдует он сам", 6); snd("wave", 0.5);
  for (let i = 0; i < 4 + w; i++) queueSpawn(pickFoe());
  yaGameplay(true);
}
function pickFoe() { const W = waveMix(R.wave); let s = 0; for (const k in W) s += W[k]; let r = Math.random() * s; for (const k in W) if ((r -= W[k]) <= 0) return k; return "slime"; }
function spawnPoint() { for (let i = 0; i < 12; i++) { const x = rnd(-ARENA + 40, ARENA - 40), y = rnd(-ARENA + 40, ARENA - 40); if (Math.hypot(x - R.x, y - R.y) > 230) return [x, y]; } return [-R.x * 0.8, -R.y * 0.8]; }
function queueSpawn(type, elite, at) {
  const [x, y] = at || spawnPoint(); const mark = img("ring", x, y, -2e5).setTint(elite || FOES[type].boss ? 0xffd23a : 0xff3a4a).setAlpha(0.8); sizeTo(mark, FOES[type].boss ? 90 : 30);
  R.spq.push({ type, elite, x, y, t: FOES[type].boss ? 1.6 : 0.9, mark });
}
function director(dt) {
  R.spawnAcc += dt * spawnRate(R.wave);
  while (R.spawnAcc >= 1) { R.spawnAcc -= 1; if (R.foes.length + R.spq.length < waveCap(R.wave)) queueSpawn(pickFoe()); }
  for (const q of R.spq) { q.t -= dt; q.mark.setScale(q.mark.scale * (1 + Math.sin(R.t * 20) * 0.02)).setAlpha(0.4 + Math.sin(R.t * 18) * 0.4); if (q.t <= 0) { q.mark.destroy(); q.done = true; spawnFoe(q.type, q.x, q.y, q.elite); burst(q.x, q.y, 0x8a6aff, 6); } }
  R.spq = R.spq.filter(q => !q.done);
  const evs = WAVE_EVENTS[R.wave] || [], ev = evs[R.ev], el = waveTime(R.wave) - R.waveT;
  if (ev && el >= ev.at) {
    R.ev++; banner(ev.say);
    if (ev.kind === "ring") { const rad = 300; for (let i = 0; i < ev.n; i++) { const a = i / ev.n * Math.PI * 2; queueSpawn(ev.foe, false, [clampA(R.x + Math.cos(a) * rad, 30), clampA(R.y + Math.sin(a) * rad, 30)]); } }
    else if (ev.kind === "elite") queueSpawn(ev.foe, true);
    else if (ev.kind === "boss") { queueSpawn(ev.foe); CAM.shake(400, 0.004); }
  }
}
function endWave() {
  R.inWave = false; yaGameplay(false);
  for (const e of R.foes) { if (e.dead) continue; e.dead = true; burst(e.x, e.y, e.d.col, 4); const s = e.spr; SC.tweens.add({ targets: s, alpha: 0, scale: s.scale * 0.3, duration: 250, onComplete: () => s.destroy() }); e.halo && e.halo.destroy(); }
  R.foes = []; R.boss = null; bossBar(null);
  for (const b of R.ebul) { b.spr.destroy(); b.halo.destroy(); } R.ebul = [];
  for (const q of R.spq) q.mark.destroy(); R.spq = [];
  for (const g of R.gems) g.pull = true;
  snd("wave", 0.5);
  if (R.wave >= WAVES_TOTAL) return win();
  banner("Волна " + R.wave + " пройдена!");
  setTimeout(() => { if (!R) return; for (const g of [...R.gems]) { g.spr.destroy(); collect(g, true); } R.gems = []; waveDone(); }, 1100);
}

// =====================================================================
//  Враги
// =====================================================================
function spawnFoe(type, x, y, elite) {
  const d = FOES[type], m = d.boss ? 1 + (R.wave > 10 ? 0 : 0) : hpMul(R.wave) * (elite ? 10 : 1);
  const e = { type, d, x, y, kx: 0, ky: 0, hp: d.hp * m, r: d.r * (elite ? 1.5 : 1), sp: d.sp * (elite ? 1.05 : 1) * (1 + R.wave * 0.012), dmg: d.dmg * (1 + R.wave * 0.06) * (elite ? 1.5 : 1),
    cr: d.cr * (elite ? 15 : 1), slowT: 0, frzT: 0, burnT: 0, burnD: 0, flash: 0, hw: {}, seed: Math.random() * 7, elite, shootT: rnd(1.5, 3.5), dead: false, kb: d.heavy ?? 1 };
  e.maxhp = e.hp;
  e.spr = img("f_" + type, x, y); e.base = (elite ? 1.5 : 1) / K; e.spr.setScale(e.base);
  if (elite || d.boss) { e.halo = glow(x, y, elite ? 0xffd23a : 0xff4a6a, e.r * 4.2, 0); e.halo.setAlpha(0.55); }
  if (d.boss) { R.boss = e; bossBar(e); }
  R.foes.push(e); return e;
}
// множитель урона от персонажа: стихия и вид оружия
let MUL = 1;
function wMul(d) {
  const C = R.ch; let m = 1;
  if (C.el) { const els = d.fuse ? [FUSE[d.id].a, FUSE[d.id].b] : d.elem ? [d.elem] : []; for (const e of els) m *= Math.pow(C.el[e] || 1, 1 / els.length); }
  if (C.kind) m *= d.kind === "melee" ? (C.kind.melee || 1) : (C.kind._far || 1);
  return m;
}
function hurtFoe(e, dmg, col, kx = 0, ky = 0, noNum, elem, tier) {
  if (e.dead) return;
  const crit = Math.random() < R.st.crit; dmg = Math.max(1, Math.round(dmg * MUL * R.st.dmg * rnd(0.9, 1.1) * (crit ? 2 : 1)));
  e.hp -= dmg; e.flash = 0.08; e.sq = 0.14; e.kx += kx * e.kb; e.ky += ky * e.kb;
  if (!noNum && (crit || e.d.boss || e.elite || Math.random() < 0.35)) number(e.x, e.y - e.r - 6, dmg, crit);
  snd("hit", 0.04);
  if (elem) elemHit(e, elem, tier || 0, dmg);
  if (e.hp <= 0) killFoe(e, col);
}
// эффект стихии при попадании заряженным оружием
function elemHit(e, el, t, dmg) {
  if (e.dead) return;
  if (el === "fire") { e.burnT = 2.5; e.burnD = Math.max(e.burnD, dmg * 0.3 + 2); }
  else if (el === "ice") { e.slowT = 1.3; if (Math.random() < 0.08 + 0.04 * t) e.frzT = 0.9; }
  else if (el === "wind") { const dx = e.x - R.x, dy = e.y - R.y, d = Math.hypot(dx, dy) || 1; e.kx += dx / d * 160 * e.kb; e.ky += dy / d * 160 * e.kb; }
  else if (el === "bolt" && !elemHit.busy) { elemHit.busy = true; const n = nearest(e.x, e.y, 110, new Set([e])); if (n) { zap(e.x, e.y, n.x, n.y, ELEM.bolt.col); hurtFoe(n, dmg * 0.5, ELEM.bolt.col, 0, 0, true); } elemHit.busy = false; }
}
function killFoe(e, col) {
  e.dead = true; R.kills++; P.kills = (P.kills || 0) + 1;
  burst(e.x, e.y, e.d.col, e.d.boss ? 40 : e.elite ? 22 : 7); if (col) burst(e.x, e.y, col, 4);
  const s = e.spr, kl = Math.hypot(e.kx, e.ky) || 1, fx = e.kx / kl * Math.min(60, 20 + kl * 0.15), fy = e.ky / kl * Math.min(60, 20 + kl * 0.15);
  s.setTintFill(0xffffff); SC.tweens.add({ targets: s, x: s.x + fx, y: s.y + fy - 10, angle: (fx >= 0 ? 1 : -1) * rnd(120, 260), scaleX: e.base * 0.6, scaleY: e.base * 0.6, alpha: 0, duration: 280, ease: "Quad.out", onComplete: () => s.destroy() });
  if (e.halo) { const h = e.halo; SC.tweens.add({ targets: h, alpha: 0, duration: 300, onComplete: () => h.destroy() }); }
  snd("kill", 0.03);
  const v = e.cr; dropGem(e.x, e.y, v >= 10 ? "gem3" : v >= 2 ? "gem2" : "gem1", v);
  if (e.elite || e.d.boss) { drop(e.x + 14, e.y, "chest"); R.stop = 0.09; CAM.shake(260, 0.006); }
  else if (Math.random() < 0.012) drop(e.x, e.y, "meat");
  if (e.d.boss) { R.slowT = 0.9; CAM.flash(400, 255, 230, 180); R.boss = null; bossBar(null); for (let i = 0; i < 10; i++) dropGem(e.x + rnd(-60, 60), e.y + rnd(-60, 60), "gem3", 10); banner(e.d.name + " повержен!"); }
}
function updateFoes(dt) {
  const t = R.t;
  for (const e of R.foes) {
    if (e.dead) continue;
    let sm = 1; if (e.frzT > 0) { e.frzT -= dt; sm = 0; } else if (e.slowT > 0) { e.slowT -= dt; sm = 0.5; }
    if (e.burnT > 0) { e.burnT -= dt; e.hp -= e.burnD * dt; e.bT = (e.bT || 0) - dt; if (e.bT <= 0) { e.bT = 0.5; burst(e.x, e.y - 4, 0xff6a1a, 2); number(e.x, e.y - e.r - 4, Math.round(e.burnD * 0.5), false, "#ff9a4a"); } if (e.hp <= 0) { killFoe(e, 0xff6a1a); continue; } }
    let dx = R.x - e.x, dy = R.y - e.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    let vx = dx, vy = dy;
    if (e.type === "bat") { const w = Math.sin(t * 6 + e.seed) * 0.6; vx -= dy * w; vy += dx * w; }
    if (e.d.ranged) {
      if (d < 200) { vx = -dy * 0.8 - dx * 0.3; vy = dx * 0.8 - dy * 0.3; }
      e.shootT -= dt * sm; if (e.shootT <= 0 && d < 330) { e.shootT = rnd(2.4, 3.2); enemyShot(e.x, e.y, dx, dy); }
    }
    if (e.d.charger) {
      e.cT = (e.cT ?? rnd(1, 3)) - dt * sm;
      if (e.st === "wind") { vx = vy = 0; if (e.cT <= 0) { e.st = "dash"; e.cT = 0.5; } }
      else if (e.st === "dash") { vx = e.dx * 6.5; vy = e.dy * 6.5; if (Math.random() < 0.5) burst(e.x, e.y + e.r, 0xc8a070, 1); if (e.cT <= 0) { e.st = ""; e.cT = rnd(2.2, 3.2); } }
      else if (e.cT <= 0 && d < 280) { e.st = "wind"; e.cT = 0.6; e.dx = dx; e.dy = dy; }
    }
    if (e.d.boss) { e.shootT -= dt; if (e.shootT <= 0) { const n = e.type === "boss2" ? 14 : 9; e.shootT = e.type === "boss2" ? 2.2 : 3.2; for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2 + t; enemyShot(e.x, e.y, Math.cos(a), Math.sin(a)); } } }
    const cs = R.ch.slow || 1; e.x = clampA(e.x + (vx * e.sp * sm * cs + e.kx) * dt, e.r); e.y = clampA(e.y + (vy * e.sp * sm * cs + e.ky) * dt, e.r);
    const kd = Math.exp(-dt * 9); e.kx *= kd; e.ky *= kd;
  }
  for (const a of GRID.values()) {
    const n = Math.min(a.length, 14);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const p = a[i], q = a[j], dx = q.x - p.x, dy = q.y - p.y, rr = (p.r + q.r) * 0.85, d2 = dx * dx + dy * dy;
      if (d2 < rr * rr && d2 > 0.01) { const d = Math.sqrt(d2), push = (rr - d) * 0.35 / d; const wp = p.d.boss ? 0.05 : 1, wq = q.d.boss ? 0.05 : 1; p.x -= dx * push * wp; p.y -= dy * push * wp; q.x += dx * push * wq; q.y += dy * push * wq; }
    }
  }
  for (const e of R.foes) {
    if (e.dead) continue; const s = e.spr;
    s.setPosition(e.x, e.y).setDepth(e.y);
    const w = Math.sin(t * (e.type === "bat" ? 22 : 9) + e.seed);
    const q = e.sq > 0 ? (e.sq -= 1 / 60, e.sq / 0.14) : 0;
    if (e.type === "bat") s.setScale(e.base * (1 + w * 0.18 + q * 0.25), e.base * (1 - q * 0.2)); else s.setScale(e.base * (1 + w * 0.05 + q * 0.28), e.base * (1 - w * 0.06 - q * 0.22));
    s.setFlipX(R.x < e.x);
    if (e.st === "wind") { s.setTint(0xff7a7a); s.x += Math.sin(t * 60) * 1.5; }
    else if (e.flash > 0) { e.flash -= 1 / 60; s.setTintFill(0xffffff); }
    else if (e.frzT > 0) s.setTint(0x88e8ff); else if (e.burnT > 0) s.setTint(0xffb080); else if (e.slowT > 0) s.setTint(0xc0f0ff); else s.clearTint();
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
    if (Math.hypot(b.x - R.x, b.y - R.y) < PR + 5) { b.life = 0; damagePlayer(8 + R.wave * 0.6); }
    if (b.life <= 0) { b.spr.destroy(); b.halo.destroy(); b.dead = true; }
  }
  R.ebul = R.ebul.filter(b => !b.dead);
}

// =====================================================================
//  Маг
// =====================================================================
function updatePlayer(dt) {
  const v = inputVec(), sp = 150 * R.st.speed;
  R.moving = v.x !== 0 || v.y !== 0;
  R.x = clampA(R.x + v.x * sp * dt, PR + 6); R.y = clampA(R.y + v.y * sp * dt, PR + 6); if (v.x) R.face = v.x > 0 ? 1 : -1;
  if (R.moving) { R.mx = v.x; R.my = v.y; }
  const b = R.moving ? Math.sin(R.t * 15) : Math.sin(R.t * 3) * 0.4;
  R.spr.setPosition(R.x, R.y + 4).setDepth(R.y + 4).setFlipX(R.face < 0).setScale(1 / K * (1 - b * 0.04), 1 / K * (1 + b * 0.06));
  R.spr.rotation = R.moving ? v.x * 0.08 : 0;
  R.orb.setPosition(R.x + 15 * R.face, R.y - 12 + b * 1.5).setDepth(R.y + 5).setScale((24 + Math.sin(R.t * 8) * 4) / 64 / K);
  if (R.hurtT > 0) { R.hurtT -= dt; R.spr.setTint(Math.floor(R.hurtT * 30) % 2 ? 0xff7a7a : 0xffffff); } else R.spr.clearTint();
  near(R.x, R.y, PR, e => { if (e.frzT > 0 || (e.hitT || 0) > R.t) return; e.hitT = R.t + 1.0; damagePlayer(e.dmg); });
  if (R.st.regen) R.hp = Math.min(R.maxhp, R.hp + R.st.regen * dt);
}
function damagePlayer(v) {
  if (R.over || !R.inWave) return;
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
//  Оружие
// =====================================================================
const area = v => v * R.st.area;
const hand = () => [R.x + 15 * R.face, R.y - 12];
function ready(w, base, dt) { w.cd -= dt; if (w.cd > 0) return false; w.cd = base / R.st.atk; return true; }
function targets(n, range) { const skip = new Set(), out = []; for (let i = 0; i < n; i++) { const t = nearest(R.x, R.y, range, skip); if (!t) break; skip.add(t); out.push(t); } return out; }

const CAST = {
  fireball(w, d, t, dt) {
    if (!ready(w, d.cd[t], dt)) return; const ts = targets(d.n[t], 460); if (!ts.length) { w.cd = 0.15; return; }
    const [hx, hy] = hand(); for (const e of ts) shoot("fire", hx, hy, Math.atan2(e.y - hy, e.x - hx), 360, { dmg: d.dmg[t], boom: d.boom[t], life: 1.6, r: 7, col: ELEM.fire.col });
    snd("fire", 0.08);
  },
  shard(w, d, t, dt) {
    if (!ready(w, d.cd[t], dt)) return; const e = nearest(R.x, R.y, 400); if (!e) { w.cd = 0.15; return; }
    const a0 = Math.atan2(e.y - R.y, e.x - R.x), n = d.n[t], spread = 0.16;
    for (let i = 0; i < n; i++) shoot("ice", R.x, R.y - 4, a0 + (i - (n - 1) / 2) * spread, 430, { dmg: d.dmg[t], pierce: d.pierce[t], life: 0.8, r: 6, col: ELEM.ice.col, elem: "ice", tier: t });
    snd("ice", 0.08);
  },
  blade(w, d, t, dt) {
    const n = d.n[t], col = d.elem ? ELEM[d.elem].col : 0xffffff; w.s.blades = w.s.blades || [];
    while (w.s.blades.length < n) w.s.blades.push(img("blade", R.x, R.y, 1.1e6).setTint(col).setBlendMode(ADD()));
    w.s.a = (w.s.a || Math.random() * 6) + d.spin[t] * R.st.atk * dt; const rad = area(d.rad[t]);
    w.s.blades.forEach((b, i) => {
      const a = w.s.a + i / n * Math.PI * 2, x = R.x + Math.cos(a) * rad, y = R.y - 4 + Math.sin(a) * rad * 0.82;
      b.setPosition(x, y).setRotation(a + Math.PI / 2).setScale(area(1) / K);
      if (Math.random() < dt * 20) burst(x, y, col, 1);
      near(x, y, area(15), e => { const key = w.id + w.tier; if ((e.hw[key] || 0) > R.t) return; e.hw[key] = R.t + 0.4; const dx = e.x - R.x, dy = e.y - R.y, dd = Math.hypot(dx, dy) || 1; hurtFoe(e, d.dmg[t], col, dx / dd * 260, dy / dd * 260, false, "wind", t); });
    });
  },
  chain(w, d, t, dt) {
    if (!ready(w, d.cd[t], dt)) return; const c = R.foes.filter(e => !e.dead && Math.hypot(e.x - R.x, e.y - R.y) < 340); if (!c.length) { w.cd = 0.2; return; }
    const [hx, hy] = hand(); chain(pick(c), hx, hy - 2, d.n[t], d.dmg[t], 130, ELEM.bolt.col, 0); snd("bolt", 0.1);
  },
  dagger(w, d, t, dt) {
    if (!ready(w, d.cd[t], dt)) return; const ts = targets(d.n[t], 420); if (!ts.length) { w.cd = 0.1; return; }
    const col = d.elem ? ELEM[d.elem].col : 0xe8ecf4;
    for (const e of ts) shoot("dagger", R.x, R.y - 6, Math.atan2(e.y - R.y, e.x - R.x), 560, { dmg: d.dmg[t], pierce: 1, life: 0.75, r: 6, col, elem: d.elem, tier: t });
    snd("throw", 0.05);
  },
  melee(w, d, t, dt) {
    if (!ready(w, d.cd[t], dt)) return; const rad = area(d.rad[t]); const e = nearest(R.x, R.y, rad + 20); if (!e) { w.cd = 0.1; return; }
    const a0 = Math.atan2(e.y - R.y, e.x - R.x), col = d.elem ? ELEM[d.elem].col : 0xfff0d0;
    near(R.x, R.y, rad, f => { let da = Math.atan2(f.y - R.y, f.x - R.x) - a0; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) < 1.1) hurtFoe(f, d.dmg[t], col, Math.cos(a0) * 300, Math.sin(a0) * 300, false, d.elem, t); });
    const g = SC.add.graphics().setDepth(1.2e6).setBlendMode(ADD()); g.fillStyle(col, 0.45); g.slice(R.x, R.y, rad, a0 - 1.1, a0 + 1.1, false); g.fillPath(); g.lineStyle(4, 0xffffff, 0.9); g.beginPath(); g.arc(R.x, R.y, rad, a0 - 1.1, a0 + 1.1); g.strokePath();
    SC.tweens.add({ targets: g, alpha: 0, duration: 180, onComplete: () => g.destroy() }); snd("swing", 0.08);
  },
  missile(w, d, t, dt) {
    if (!ready(w, d.cd[t], dt)) return; if (!R.foes.length) { w.cd = 0.1; return; }
    const col = d.elem ? ELEM[d.elem].col : 0xc88aff, [hx, hy] = hand();
    for (let i = 0; i < d.n[t]; i++) shoot("missile", hx, hy, -Math.PI / 2 + rnd(-1, 1), 250, { dmg: d.dmg[t], pierce: 1, life: 3, r: 7, col, elem: d.elem, tier: t });
    snd("fire", 0.08);
  },
  arrow(w, d, t, dt) {
    if (!ready(w, d.cd[t], dt)) return; const ts = targets(d.n[t], 520); if (!ts.length) { w.cd = 0.1; return; }
    const col = d.elem ? ELEM[d.elem].col : 0xf4e0b0;
    for (const e of ts) shoot("dagger", R.x, R.y - 6, Math.atan2(e.y - R.y, e.x - R.x), 720, { dmg: d.dmg[t], pierce: d.pierce[t], life: 0.9, r: 6, col, elem: d.elem, tier: t, arrow: 1 });
    snd("throw", 0.05);
  },
  boomer(w, d, t, dt) {
    if (!ready(w, d.cd[t], dt)) return; const ts = targets(d.n[t], 360); if (!ts.length) { w.cd = 0.1; return; }
    const col = d.elem ? ELEM[d.elem].col : 0xd8a060;
    for (const e of ts) shoot("boomer", R.x, R.y - 6, Math.atan2(e.y - R.y, e.x - R.x), 480, { dmg: d.dmg[t], pierce: 999, life: 3, r: 10, col, elem: d.elem, tier: t, age: 0 });
    snd("swing", 0.08);
  },
  totem(w, d, t, dt) {
    if (!ready(w, d.cd[t], dt)) return; if (!R.foes.length) { w.cd = 0.3; return; }
    const col = d.elem ? ELEM[d.elem].col : 0xc8a8ff, o = { x: R.x, y: R.y + 6, life: d.life[t], cd: 0.3 };
    o.spr = img("totem", o.x, o.y, o.y); o.g = glow(o.x, o.y - 16, col, 30, o.y + 1);
    o.kill = () => { burst(o.x, o.y, col, 8); o.spr.destroy(); o.g.destroy(); };
    o.step = dt => {
      o.life -= dt; o.cd -= dt; o.g.setScale((26 + Math.sin(R.t * 8) * 4) / 64 / K);
      if (o.cd <= 0) { const e = nearest(o.x, o.y, 300); if (e) { o.cd = 0.55 / R.st.atk; shoot("dagger", o.x, o.y - 16, Math.atan2(e.y - o.y + 16, e.x - o.x), 520, { dmg: d.dmg[t], pierce: 1, life: 0.7, r: 6, col, elem: d.elem, tier: t }); } else o.cd = 0.15; }
      return o.life > 0;
    };
    o.mul = MUL; R.fx.push(o); burst(o.x, o.y, col, 10);
  },
  whip(w, d, t, dt) {
    if (!ready(w, d.cd[t], dt)) return; const len = area(d.len[t]), col = d.elem ? ELEM[d.elem].col : 0xf0d8b0, y0 = R.y - 6;
    const sides = d.n[t] > 1 ? [1, -1] : [R.face];
    for (const s of sides) {
      near(R.x + s * len / 2, y0, len / 2, e => { if ((e.x - R.x) * s > 0 && Math.abs(e.y - y0) < 26 + e.r) hurtFoe(e, d.dmg[t], col, s * 220, 0, false, d.elem, t); });
      const c = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(R.x, y0 - 2), new Phaser.Math.Vector2(R.x + s * len * 0.5, y0 - 34), new Phaser.Math.Vector2(R.x + s * len, y0 + 2));
      const g = SC.add.graphics().setDepth(1.2e6).setBlendMode(ADD()); g.lineStyle(8, col, 0.45).strokePoints(c.getPoints(16)); g.lineStyle(3, 0xffffff, 1).strokePoints(c.getPoints(16));
      SC.tweens.add({ targets: g, alpha: 0, duration: 200, onComplete: () => g.destroy() }); burst(R.x + s * len, y0, col, 4);
    }
    snd("swing", 0.08);
  },
  bomb(w, d, t, dt) {
    if (!ready(w, d.cd[t], dt)) return; const c = R.foes.filter(e => !e.dead && Math.hypot(e.x - R.x, e.y - R.y) < 380); if (!c.length) { w.cd = 0.2; return; }
    const col = d.elem ? ELEM[d.elem].col : 0xffa040;
    for (let i = 0; i < d.n[t]; i++) {
      const e = pick(c), [sx, sy] = hand(), tx = e.x, ty = e.y, o = { k: 0 };
      o.spr = img("dot", sx, sy, 1.3e6).setTint(0x2a2440).setScale(14 / 16 / K); o.g = glow(sx, sy, col, 18, 1.31e6);
      o.kill = () => { o.spr.destroy(); o.g.destroy(); };
      o.step = dt => {
        o.k += dt / 0.55; const k = Math.min(1, o.k), x = sx + (tx - sx) * k, y = sy + (ty - sy) * k - Math.sin(Math.PI * k) * 90;
        o.spr.setPosition(x, y).setRotation(k * 8); o.g.setPosition(x - 4, y - 6).setAlpha(0.5 + Math.sin(R.t * 40) * 0.5);
        if (k >= 1) { explode(tx, ty, area(d.boom[t]), d.dmg[t], col, 220, 0, d.elem); return false; }
        return true;
      };
      o.mul = MUL; R.fx.push(o);
    }
    snd("throw", 0.1);
  },
  fusion(w, d, t, dt) { FUSE_CAST[w.id](w, t, dt); },
};
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
  for (const [wd, c, a] of [[6, col, 0.5], [2.4, 0xffffff, 1]]) { g.lineStyle(wd, c, a); g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts) g.lineTo(p[0], p[1]); g.strokePath(); }
  SC.tweens.add({ targets: g, alpha: 0, duration: 200, onComplete: () => g.destroy() });
}
function shoot(kind, x, y, a, sp, o) {
  let s;
  if (kind === "fire" || kind === "missile") s = glow(x, y, o.col, 30, 1.2e6);
  else if (kind === "boomer") s = img("blade", x, y, 1.2e6).setTint(o.col).setScale(0.75 / K);
  else s = img("shard", x, y, 1.2e6).setTint(o.col).setRotation(a);
  if (kind === "dagger") s.setScale(o.arrow ? 1.15 / K : 0.75 / K, o.arrow ? 0.4 / K : 0.6 / K);
  R.shots.push(Object.assign({ kind, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, sp, spr: s, hit: new Set(), mul: MUL }, o));
}
function updateShots(dt) {
  for (const p of R.shots) {
    if (p.kind === "missile") {
      if (!p.tgt || p.tgt.dead) p.tgt = nearest(p.x, p.y, 500);
      if (p.tgt) { const want = Math.atan2(p.tgt.y - p.y, p.tgt.x - p.x), cur = Math.atan2(p.vy, p.vx); let da = Math.atan2(Math.sin(want - cur), Math.cos(want - cur)); const na = cur + Math.max(-6 * dt, Math.min(6 * dt, da)); p.sp = Math.min(520, p.sp + 300 * dt); p.vx = Math.cos(na) * p.sp; p.vy = Math.sin(na) * p.sp; }
      if (Math.random() < dt * 30) burst(p.x, p.y, p.col, 1);
    }
    if (p.kind === "boomer") {
      p.age += dt; p.spr.rotation += dt * 22;
      if (!p.back && p.age > 0.45) { p.back = true; p.hit.clear(); }
      if (p.back) { const dx = R.x - p.x, dy = R.y - 6 - p.y, dd = Math.hypot(dx, dy) || 1; p.vx = dx / dd * 520; p.vy = dy / dd * 520; if (dd < 18) p.life = 0; }
      else { p.vx *= 1 - dt * 2.2; p.vy *= 1 - dt * 2.2; }
    }
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.spr.setPosition(p.x, p.y);
    if (p.kind === "fire") { p.spr.setScale((28 + Math.sin(R.t * 30) * 4) / 64 / K); if (Math.random() < dt * 40) burst(p.x, p.y, 0xff5a1a, 1); }
    if (p.kind === "dagger") p.spr.setRotation(Math.atan2(p.vy, p.vx));
    MUL = p.mul;
    near(p.x, p.y, p.r, e => {
      if (p.dead || p.hit.has(e)) return; p.hit.add(e);
      if (p.kind === "fire") { explode(p.x, p.y, area(p.boom), p.dmg, ELEM.fire.col, 180, 0, "fire"); p.dead = true; }
      else { hurtFoe(e, p.dmg, p.col, p.vx * 0.2, p.vy * 0.2, false, p.elem, p.tier); burst(e.x, e.y, p.col, 3); if (--p.pierce <= 0) p.dead = true; }
    });
    if (p.life <= 0 || Math.abs(p.x) > ARENA + 80 || Math.abs(p.y) > ARENA + 80) p.dead = true;
    if (p.dead) p.spr.destroy();
  }
  R.shots = R.shots.filter(p => !p.dead);
}
function explode(x, y, rad, dmg, col, kb, freeze, elem) {
  near(x, y, rad, e => { const dx = e.x - x, dy = e.y - y, d = Math.hypot(dx, dy) || 1; hurtFoe(e, dmg, col, dx / d * kb, dy / d * kb, false, elem, 0); if (freeze) e.frzT = freeze; });
  const f = glow(x, y, col, rad * 2.6, 1.25e6); SC.tweens.add({ targets: f, alpha: 0, scale: f.scale * 1.25, duration: 260, onComplete: () => f.destroy() });
  const r = img("ring", x, y, 1.26e6).setTint(col).setBlendMode(ADD()); sizeTo(r, rad * 0.6); const s1 = rad * 2.1 / 128 / K;
  SC.tweens.add({ targets: r, scale: s1, alpha: 0, duration: 280, ease: "Cubic.out", onComplete: () => r.destroy() });
  burst(x, y, col, Math.min(26, 6 + rad / 4 | 0)); snd("boom", 0.06);
}

// ---------- слияния (урон растёт с рангом)
const fcd = (w, base, t, dt) => ready(w, base * (1 - 0.08 * t), dt);
const FUSE_CAST = {
  fireWind(w, t, dt) {
    if (!fcd(w, 3.2, t, dt)) return; const M = FUSE_MUL[t];
    const tg = nearest(R.x, R.y, 500); const o = { x: R.x + rnd(-30, 30), y: R.y + rnd(-30, 30), life: 4.5, tick: 0, tx: tg ? tg.x : R.x, ty: tg ? tg.y : R.y, re: 0 };
    o.spr = img("swirl", o.x, o.y, 1.15e6).setTint(0xff8a2a).setBlendMode(ADD()); o.g = glow(o.x, o.y, 0xff5a1a, 90, 1.14e6).setAlpha(0.6);
    o.kill = () => { o.spr.destroy(); o.g.destroy(); };
    o.step = dt => {
      o.life -= dt; o.re -= dt; if (o.re <= 0) { o.re = 1; const n = nearest(o.x, o.y, 400); if (n) { o.tx = n.x; o.ty = n.y; } }
      const dx = o.tx - o.x, dy = o.ty - o.y, d = Math.hypot(dx, dy) || 1; o.x = clampA(o.x + dx / d * 85 * dt); o.y = clampA(o.y + dy / d * 85 * dt);
      const rad = area(42); o.spr.setPosition(o.x, o.y).setRotation(R.t * 12).setScale(rad * 2.2 / 80 / K * (1 + Math.sin(R.t * 20) * 0.06)); o.g.setPosition(o.x, o.y);
      if (Math.random() < dt * 30) burst(o.x + rnd(-15, 15), o.y, 0xff6a1a, 1);
      near(o.x, o.y, rad * 1.6, e => { e.x += (o.x - e.x) * dt * 2.2; e.y += (o.y - e.y) * dt * 2.2; });
      o.tick -= dt; if (o.tick <= 0) { o.tick = 0.25; near(o.x, o.y, rad, e => hurtFoe(e, 9 * M, 0xff8a2a, 0, 0, false, "fire", t)); }
      return o.life > 0;
    };
    o.mul = MUL; R.fx.push(o);
  },
  fireIce(w, t, dt) {
    if (!fcd(w, 2.8, t, dt)) return; const M = FUSE_MUL[t];
    const o = { r: 10, max: area(175), hit: new Set() }; o.spr = img("ring", R.x, R.y, 1.26e6).setTint(0xf0f6ff).setBlendMode(ADD());
    o.kill = () => o.spr.destroy(); snd("steam", 0.2);
    o.step = dt => {
      o.r += 520 * dt; o.spr.setPosition(R.x, R.y).setScale(o.r * 2 / 128 / K).setAlpha(Math.max(0, 1 - o.r / o.max));
      near(R.x, R.y, o.r, e => { if (o.hit.has(e)) return; o.hit.add(e); const dx = e.x - R.x, dy = e.y - R.y, d = Math.hypot(dx, dy) || 1; hurtFoe(e, 30 * M, 0xf0f6ff, dx / d * 320, dy / d * 320); });
      for (let i = 0; i < 3; i++) { const a = Math.random() * 7; burst(R.x + Math.cos(a) * o.r, R.y + Math.sin(a) * o.r, 0xe0f0ff, 1); }
      return o.r < o.max;
    };
    o.mul = MUL; R.fx.push(o);
  },
  fireBolt(w, t, dt) {
    if (!fcd(w, 2.3, t, dt)) return; const M = FUSE_MUL[t];
    const vis = R.foes.filter(e => !e.dead && Math.abs(e.x - R.x) < 420 && Math.abs(e.y - R.y) < 420);
    for (let k = 0; k < 2 + (t >= 2 ? 1 : 0) && vis.length; k++) {
      const tg = pick(vis), tx = tg.x, ty = tg.y, o = { t: 0.55 };
      o.mark = img("ring", tx, ty, -1e5).setTint(0xff3a2a).setAlpha(0.7); sizeTo(o.mark, area(70) * 2);
      o.rock = glow(tx + 160, ty - 420, 0xff6a2a, 50, 1.3e6);
      o.kill = () => { o.mark.destroy(); o.rock.destroy(); };
      o.step = dt => {
        o.t -= dt; const k = Math.max(0, o.t / 0.55);
        o.rock.setPosition(tx + 160 * k, ty - 420 * k); burst(o.rock.x, o.rock.y, 0xff4a1a, 1); o.mark.setAlpha(0.35 + Math.sin(R.t * 30) * 0.3);
        if (o.t <= 0) { explode(tx, ty, area(70), 55 * M, 0xff5a2a, 220, 0, "fire"); CAM.shake(70, 0.002); crater(tx, ty); return false; }
        return true;
      };
      o.mul = MUL; R.fx.push(o);
    }
  },
  iceWind(w, t, dt) {
    const rad = area(115 + t * 10), s = w.s;
    if (!s.aura) { s.aura = glow(R.x, R.y, 0x9ae8ff, 10, -2e5).setAlpha(0.32); s.snow = SC.add.particles(0, 0, "spark", { x: { min: -rad, max: rad }, y: { min: -rad, max: rad }, speed: { min: 10, max: 40 }, scale: { start: 0.5 / K, end: 0 }, lifespan: 900, frequency: 30, tint: 0xe0f6ff, blendMode: "ADD" }).setDepth(1.1e6); }
    s.aura.setPosition(R.x, R.y).setScale(rad * 2.4 / 64 / K); s.snow.setPosition(R.x, R.y);
    if (fcd(w, 0.5, 0, dt)) near(R.x, R.y, rad, e => { e.slowT = 0.7; if (Math.random() < 0.04) e.frzT = 0.8; hurtFoe(e, 5 * FUSE_MUL[t], 0xc8f0ff, 0, 0, true); });
  },
  iceBolt(w, t, dt) {
    if (!fcd(w, 1.9, t, dt)) return;
    const tg = nearest(R.x, R.y, 360); if (!tg) { w.cd = 0.2; return; }
    const [hx, hy] = hand(); chain(tg, hx, hy - 2, 7 + t * 2, 24 * FUSE_MUL[t], 150, 0xa8f4ff, 1.2); snd("bolt", 0.1);
  },
  windBolt(w, t, dt) {
    const s = w.s; if (!s.clouds) s.clouds = [0, 1].map(i => ({ a: i * Math.PI, cd: 0.3 * i, spr: img("cloud", R.x, R.y, 1.4e6).setAlpha(0.95) }));
    for (const c of s.clouds) {
      c.a += 0.9 * dt; const x = R.x + Math.cos(c.a) * area(150), y = R.y - 30 + Math.sin(c.a) * area(120);
      c.spr.setPosition(x, y - 40 + Math.sin(R.t * 2 + c.a) * 3).setScale((1 + Math.sin(R.t * 3) * 0.03) / K);
      c.cd -= dt; if (c.cd <= 0) { const tg = nearest(x, y, area(120)); if (tg) { c.cd = 0.65 * (1 - 0.08 * t) / R.st.atk; zap(x, y - 30, tg.x, tg.y, 0xd8e0ff); explode(tg.x, tg.y, area(32), 22 * FUSE_MUL[t], 0xd8e0ff, 80, 0, "bolt"); } else c.cd = 0.15; }
    }
  },
};
function crater(x, y) { const c = glow(x, y, 0x000000, 120, -5e5).setBlendMode(Phaser.BlendModes.NORMAL).setAlpha(0.35); SC.tweens.add({ targets: c, alpha: 0, delay: 1500, duration: 1500, onComplete: () => c.destroy() }); }
function updateWeapons(dt) {
  for (const w of R.weap) { MUL = wMul(w.def); CAST[w.def.kind](w, w.def, w.tier, dt); }
  R.fx = R.fx.filter(f => { MUL = f.mul || 1; const ok = f.step(dt); if (!ok) f.kill(); return ok; });
  MUL = 1;
}

// =====================================================================
//  Добыча: кристаллы — это и опыт, и деньги
// =====================================================================
function dropGem(x, y, kind, v) {
  if (R.gems.length > 300) { const g = R.gems[Math.random() * R.gems.length | 0]; if (g.v) { g.v += v; return; } }
  drop(x, y, kind, v);
}
function drop(x, y, kind, v = 0) { R.gems.push({ x, y, kind, v, spr: img(kind, x, y, -1e5 + y * 0.001), pull: false, vy: -60, h: 0, sp: 0 }); }
function updateGems(dt) {
  const mr = 80 * R.st.magnet;
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
function collect(g, quiet) {
  if (g.v) {
    if (!P.tut && !R.tGem) { R.tGem = 1; hint("💎 Кристаллы — это опыт и деньги для лавки", 4); }
    gemPop();
    R.xp += g.v; R.cr += g.v * 1.7 / (1 + R.wave * 0.08) * R.st.gain; R.earned += g.v;
    if (!quiet) { R.gemCombo = Math.min(9, R.gemCombo + 1); R.gemT = 0.35; sfx(GEM_SND[R.gemCombo]); }
    while (R.xp >= R.need) { R.xp -= R.need; R.lvl++; R.need = xpNeed(R.lvl); R.pend++; if (!quiet) { burst(R.x, R.y, 0xffe45c, 18); snd("lvl", 0.2); number(R.x, R.y - 34, "Уровень!", false, "#ffe45c"); } }
  }
  else if (g.kind === "meat") { R.hp = Math.min(R.maxhp, R.hp + 25); number(R.x, R.y - 30, "+25", false, "#5aef7a"); snd("coin"); }
  else if (g.kind === "chest") { const id = pick(Object.keys(ITEMS)); R.items[id] = (R.items[id] || 0) + 1; applySt(ITEMS[id].st); snd("chest"); burst(R.x, R.y, 0xffd23a, 30); banner("Сундук: " + ITEMS[id].name + "!"); }
}

// =====================================================================
//  Ход игры
// =====================================================================
function tick(dt) {
  R.t += dt;
  buildGrid();
  updatePlayer(dt); if (R.over) return;
  if (R.inWave) { director(dt); R.waveT -= dt; }
  updateFoes(dt); buildGrid();
  if (R.inWave) updateWeapons(dt);
  updateShots(dt); updateEnemyShots(dt); updateGems(dt);
  if (R.inWave && R.waveT <= 0) endWave();
}
function win() { R.over = true; yaGameplay(false); CAM.flash(600, 255, 255, 220); snd("chest"); setTimeout(() => endRun(true), 1300); }
function die() { R.over = true; yaGameplay(false); CAM.shake(300, 0.008); burst(R.x, R.y, 0xff4a5a, 30); setTimeout(() => R.revived ? endRun(false) : showRevive(), 900); }
function revive() { R.revived = true; R.over = false; R.hp = R.maxhp * 0.6; R.hurtT = 1.5; explode(R.x, R.y, 260, 999, 0xffe45c, 500); CAM.flash(300, 255, 240, 180); yaGameplay(true); }
window.__mag = { get R() { return R; }, newRun, tick, nearest, addWeapon, removeWeapon, spawnFoe, startWave, applySt };
