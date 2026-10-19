// =====================================================================
//  КОТАПУЛЬТА — физика (Matter.js), уровни, коты, мыши, разрушения
// =====================================================================
let soundOn = true, musicOn = false, P = null, dirty = true;
const $ = id => document.getElementById(id);
function load(key, def) { try { const v = localStorage.getItem("cat_" + key); return v === null ? def : JSON.parse(v); } catch (e) { return def; } }
function save(key, val) { try { localStorage.setItem("cat_" + key, JSON.stringify(val)); } catch (e) {} }
const { Engine, Bodies, Body, Composite, Events, Vector, Sleeping } = Matter;
// когда что-то сломалось, соседи должны «проснуться» и упасть, а не висеть в воздухе
function wakeNear(p, R = 420) { for (const o of Composite.allBodies(S.world)) if (!o.isStatic && o.isSleeping && Vector.magnitude(Vector.sub(o.position, p)) < R) Sleeping.set(o, false); }
const WH = 900, GY = 820;
const SLING = { x: 230, y: GY - 175 };
const MAXPULL = 125, POWER = 0.19, GRAV = 1.35;
const MAT = {
  wood: { hp: 70, density: 0.0012, friction: 0.8, pts: 500 },
  ice: { hp: 26, density: 0.0009, friction: 0.12, pts: 300 },
  stone: { hp: 150, density: 0.0028, friction: 0.95, pts: 800 },
};
const CATS = {
  ginger: { name: "Рыжик", r: 26, density: 0.005, desc: "Обычный кот" },
  fat: { name: "Борис", r: 34, density: 0.012, desc: "Тяжёлый — пробивает камень" },
  triple: { name: "Чук, Гек и Кекс", r: 22, density: 0.005, desc: "Нажми в полёте — разделится на трёх котят" },
  rocket: { name: "Ласточка", r: 24, density: 0.006, desc: "Нажми в полёте — резкий рывок вперёд" },
  bomb: { name: "Уголёк", r: 25, density: 0.006, desc: "Нажми в полёте — БАБАХ!" },
};
const MICE = { normal: { r: 20, hp: 13 }, helmet: { r: 21, hp: 34 }, king: { r: 34, hp: 70 } };
// ---------------------------------------------------------------- конструктор уровней
// главы: у каждой своё место, время суток и настроение
const CHAPTERS = [
  { name: "Глава 1. Родная деревня", theme: "day", from: 0 },
  { name: "Глава 2. Мельница на закате", theme: "dusk", from: 5 },
  { name: "Глава 3. Зимний лес", theme: "winter", from: 10 },
  { name: "Глава 4. Крысиный замок", theme: "night", from: 15 },
];
const chapterOf = n => CHAPTERS.reduce((c, ch, i) => n >= ch.from ? i : c, 0);
const LV = (() => {
  const L = [];
  const lv = (title, cats, w, build) => L.push({ title, cats, w, build });
  const post = (o, x, y, h, m, w = 26) => o.push({ t: "b", x, y: y - h / 2, w, h, m });
  const plank = (o, x, y, w, m, h = 26) => o.push({ t: "b", x, y: y - h / 2, w, h, m });
  const box = (o, x, y, s, m) => o.push({ t: "b", x, y: y - s / 2, w: s, h: s, m });
  const roof = (o, x, y, w, m) => o.push({ t: "tri", x, y, w, h: w * 0.55, m });
  const ball = (o, x, y, r, m = "stone") => o.push({ t: "ball", x, y: y - r, r, m });
  const tnt = (o, x, y) => o.push({ t: "tnt", x, y: y - 24, s: 48 });
  const mouse = (o, x, y, k = "normal") => o.push({ t: "m", x, y: y - MICE[k].r, k });
  const rock = (o, x, top, w) => { o.push({ t: "rock", x, y: (top + GY + 40) / 2, w, h: GY + 40 - top }); return top; };   // неподвижный холм, на нём строят
  const floor = (o, x, y, m, wd = 140, h = 100, k = "normal") => { post(o, x - wd / 2 + 13, y, h, m); post(o, x + wd / 2 - 13, y, h, m); plank(o, x, y - h, wd + 26, m); if (k) mouse(o, x, y, k); return y - h - 26; };
  const tower = (o, x, mats, wd = 140, kinds = [], y0 = GY) => { let y = y0; mats.forEach((m, i) => { y = floor(o, x, y, m, wd, 100, kinds[i] === undefined ? "normal" : kinds[i]); }); return y; };
  const pyr = (o, x, y, n, m, s = 50) => { for (let r = 0; r < n; r++) for (let i = 0; i < n - r; i++) box(o, x + (i - (n - r - 1) / 2) * s, y - r * s, s, m); return y - n * s; };
  const hut = (o, x, y, m, rm, k = "normal") => { const t = floor(o, x, y, m, 150, 100, k); roof(o, x, t, 170, rm); return t; };
  // Глава 1 — деревня
  lv("Сарай у околицы", ["ginger", "ginger", "ginger"], 1500, o => { hut(o, 1050, GY, "wood", "wood"); });
  lv("Двухэтажный амбар", ["ginger", "ginger", "ginger"], 1550, o => { tower(o, 1050, ["wood", "wood"]); roof(o, 1050, GY - 240, 170, "wood"); box(o, 1250, GY, 50, "wood"); box(o, 1250, GY - 50, 50, "wood"); mouse(o, 1250, GY - 100); });
  lv("Ледник за баней", ["ginger", "ginger", "ginger"], 1600, o => { hut(o, 950, GY, "ice", "ice"); hut(o, 1200, GY, "wood", "ice"); });
  lv("Пороховой склад", ["ginger", "ginger", "ginger"], 1650, o => { const t = pyr(o, 1100, GY, 4, "wood"); mouse(o, 1100, t); box(o, 1320, GY, 50, "ice"); mouse(o, 1320, GY - 50); tnt(o, 1030, GY - 200); });
  lv("Дом на холме", ["ginger", "ginger", "ginger"], 1700, o => { const top = rock(o, 1150, GY - 140, 360); tower(o, 1110, ["wood", "ice"], 140, [], top); roof(o, 1110, top - 240, 170, "ice"); tnt(o, 1260, top); mouse(o, 1300, top); });
  // Глава 2 — мельница на закате
  lv("Каменный погреб", ["fat", "ginger", "ginger"], 1700, o => { hut(o, 1050, GY, "stone", "stone", "helmet"); floor(o, 1300, GY, "wood"); ball(o, 1300, GY - 120, 30); });
  lv("Обрыв у реки", ["fat", "ginger", "ginger"], 1800, o => { const top = rock(o, 1250, GY - 220, 420); tower(o, 1180, ["wood", "wood"], 140, [], top); mouse(o, 1380, top); mouse(o, 1420, top, "helmet"); ball(o, 1080, top, 28); });
  lv("Пирамида мельника", ["ginger", "fat", "ginger"], 1800, o => { const t = pyr(o, 1000, GY, 3, "stone", 56); mouse(o, 1000, t, "helmet"); tower(o, 1280, ["wood", "wood"]); ball(o, 1280, GY - 260, 26); mouse(o, 1460, GY); });
  lv("Две башни", ["fat", "fat", "ginger", "ginger"], 1900, o => { tower(o, 1050, ["stone", "wood", "ice"], 140, ["helmet", "normal", "normal"]); tower(o, 1330, ["wood", "stone"]); tnt(o, 1190, GY); tnt(o, 1190, GY - 48); });
  lv("Мост генерала", ["ginger", "fat", "fat"], 1900, o => { post(o, 1020, GY, 150, "stone", 26); post(o, 1380, GY, 150, "stone", 26); plank(o, 1200, GY - 150, 400, "stone", 24); mouse(o, 1120, GY); mouse(o, 1280, GY); hut(o, 1200, GY - 174, "wood", "wood", "king"); });
  // Глава 3 — зимний лес
  lv("Ледяные избушки", ["triple", "triple", "ginger"], 1800, o => { hut(o, 980, GY, "ice", "ice"); hut(o, 1170, GY, "ice", "ice"); hut(o, 1360, GY, "ice", "ice"); });
  lv("Сосулька", ["triple", "fat", "triple"], 1900, o => { tower(o, 1080, ["ice", "wood", "ice"]); roof(o, 1080, GY - 360, 170, "ice"); const t = pyr(o, 1380, GY, 3, "ice"); mouse(o, 1380, t, "helmet"); tnt(o, 1230, GY); });
  lv("Снежный утёс", ["bomb", "triple", "fat"], 2000, o => { const top = rock(o, 1300, GY - 200, 480); tower(o, 1220, ["ice", "stone"], 140, ["normal", "helmet"], top); tower(o, 1420, ["wood", "ice"], 140, [], top); tnt(o, 1320, top); });
  lv("Ёлочная пирамида", ["fat", "triple", "bomb"], 2000, o => { const t = pyr(o, 1200, GY, 5, "wood", 48); mouse(o, 1200, t, "helmet"); mouse(o, 990, GY); mouse(o, 1410, GY); tnt(o, 1200, GY - 240 - 48); ball(o, 990, GY - 100, 24, "wood"); });
  lv("Зимовье генерала", ["triple", "bomb", "ginger", "fat"], 2100, o => { tower(o, 1080, ["stone", "wood", "ice", "wood"], 140, ["helmet", "normal", "normal", "normal"]); roof(o, 1080, GY - 480, 170, "wood"); hut(o, 1360, GY, "stone", "stone", "king"); tnt(o, 1220, GY); });
  // Глава 4 — крысиный замок
  lv("Ворота замка", ["rocket", "rocket", "ginger"], 2000, o => { box(o, 1100, GY, 80, "stone"); box(o, 1100, GY - 80, 80, "stone"); box(o, 1100, GY - 160, 80, "stone"); hut(o, 1450, GY, "wood", "wood"); hut(o, 1650, GY, "wood", "ice"); });
  lv("Сторожевая башня", ["rocket", "fat", "bomb"], 2100, o => { tower(o, 1250, ["stone", "stone", "wood"], 140, ["helmet", "normal", "normal"]); roof(o, 1250, GY - 360, 170, "stone"); tower(o, 1550, ["wood", "ice"]); tnt(o, 1400, GY); ball(o, 1550, GY - 260, 26); });
  lv("Крепостная стена", ["triple", "rocket", "fat", "bomb"], 2100, o => { const top = rock(o, 1450, GY - 160, 420); const t = pyr(o, 1120, GY, 4, "stone", 54); mouse(o, 1120, t, "helmet"); tower(o, 1420, ["ice", "wood"], 140, [], top); roof(o, 1420, top - 240, 170, "ice"); mouse(o, 1620, top, "helmet"); tnt(o, 1280, GY); });
  lv("Казармы", ["rocket", "triple", "bomb", "fat"], 2200, o => { tower(o, 1080, ["stone", "stone"], 140, ["helmet", "helmet"]); tower(o, 1330, ["wood", "ice", "wood", "ice"]); roof(o, 1330, GY - 480, 170, "wood"); tower(o, 1600, ["stone", "wood", "stone"], 140, ["helmet", "normal", "normal"]); tnt(o, 1205, GY); tnt(o, 1465, GY); });
  lv("Тронный зал Короля", ["fat", "rocket", "bomb", "fat", "rocket"], 2300, o => { post(o, 1170, GY, 180, "stone", 28); post(o, 1630, GY, 180, "stone", 28); plank(o, 1400, GY - 180, 500, "stone", 26); mouse(o, 1300, GY, "helmet"); mouse(o, 1500, GY, "helmet"); tnt(o, 1400, GY); hut(o, 1290, GY - 206, "ice", "ice"); hut(o, 1510, GY - 206, "wood", "wood"); const t = pyr(o, 1400, GY - 206 - 140, 1, "stone", 40); mouse(o, 1400, t, "king"); const t2 = pyr(o, 1900, GY, 3, "wood"); mouse(o, 1900, t2); });
  return L;
})();
const LEVELS = LV.length;
// ---------------------------------------------------------------- уровень
let S = null;
function startLevel(n) {
  const def = LV[n], engine = Engine.create({ enableSleeping: true, positionIterations: 12, velocityIterations: 10 });
  engine.gravity.y = GRAV;
  const world = engine.world, ground = Bodies.rectangle(def.w / 2, GY + 100, def.w + 3000, 200, { isStatic: true, friction: 1, label: "ground" });
  Composite.add(world, ground);
  const objs = []; def.build(objs);
  const blocks = [], mice = [], rocks = []; let maxPts = 0;
  const opt = (M, extra) => Object.assign({ density: M.density, friction: M.friction * 0.75, frictionStatic: 0.7, restitution: 0.08, slop: 0.03, label: "block", sleepThreshold: 60 }, extra);
  for (const o of objs) {
    let b = null;
    if (o.t === "b") { b = Bodies.rectangle(o.x, o.y, o.w, o.h, opt(MAT[o.m], { chamfer: { radius: 2 } })); b.sw = o.w; b.sh = o.h; b.shape = "rect"; }
    else if (o.t === "tri") { b = Bodies.fromVertices(o.x, o.y - o.h / 3, [[{ x: -o.w / 2, y: o.h / 2 }, { x: o.w / 2, y: o.h / 2 }, { x: 0, y: -o.h / 2 }]], opt(MAT[o.m])); b.shape = "poly"; b.sw = o.w; b.sh = o.h; }
    else if (o.t === "ball") { b = Bodies.circle(o.x, o.y, o.r, opt(MAT[o.m], { restitution: 0.15 })); b.r = o.r; b.shape = "ball"; }
    else if (o.t === "rock") { const r = Bodies.rectangle(o.x, o.y, o.w, o.h, { isStatic: true, friction: 1, label: "ground", chamfer: { radius: [30, 30, 0, 0] } }); r.rock = { w: o.w, h: o.h }; Composite.add(world, r); rocks.push(r); continue; }
    else if (o.t === "tnt") { b = Bodies.rectangle(o.x, o.y, o.s, o.s, opt({ density: 0.001, friction: 0.7 })); b.sw = b.sh = o.s; b.shape = "tnt"; b.tnt = true; }
    if (b) {
      b.mat = o.t === "tnt" ? "tnt" : o.m;
      const area = o.t === "b" ? o.w * o.h : o.t === "tri" ? o.w * o.h / 2 : o.t === "ball" ? Math.PI * o.r * o.r : 2000;
      b.hp = o.t === "tnt" ? 14 : MAT[o.m].hp * Math.max(0.6, area / 2000); b.hp0 = b.hp;
      b.crk = Array.from({ length: 4 }, () => [Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5]);
      blocks.push(b); maxPts += o.t === "tnt" ? 0 : MAT[o.m].pts; continue;
    }
    const M = MICE[o.k], m = Bodies.circle(o.x, o.y, M.r, { density: 0.0016, friction: 0.5, frictionStatic: 0.6, restitution: 0.25, label: "mouse", sleepThreshold: 60 });
    m.hp = M.hp; m.hp0 = M.hp; m.r = M.r; m.kind = o.k; m.seed = Math.random() * 9; mice.push(m); maxPts += o.k === "king" ? 10000 : 5000;
  }
  Composite.add(world, [...blocks, ...mice]);
  maxPts += (def.cats.length - 1) * 10000;
  S = { n, def, engine, world, blocks, mice, rocks, kills: 0, breaks: 0, queue: def.cats.slice(), cat: null, flying: [], shards: [], state: "intro", t: 0, score: 0, maxPts, parts: [], pops: [], dust: [], trail: [], trailT: 0, camX: def.w, shake: 0, slow: 0, taunt: 0, settleT: 0, extra: 0, used: false };
  Events.on(engine, "collisionStart", onHit);
  setTimeout(() => { if (S && S.n === n && S.state === "intro") S.state = "load"; }, 1700);
}
function onHit(ev) {
  if (!S || S.t < 1.3) return;
  for (const p of ev.pairs) {
    const a = p.bodyA, b = p.bodyB;
    if (a.shard || b.shard) continue;
    const rv = Vector.sub(a.velocity, b.velocity), sp = Math.abs(Vector.dot(rv, p.collision.normal));
    if (sp < 0.9) continue;
    const ma = a.isStatic ? b.mass : a.mass, mb = b.isStatic ? a.mass : b.mass, imp = sp * sp * ma * mb / (ma + mb) * 0.11;
    const mul = o => o.label === "cat" ? (o.kind === "fat" ? 2.4 : 1.6) : 1;
    hurt(a, imp * mul(b), sp); hurt(b, imp * mul(a), sp);
    if (a.label === "cat") a.squash = 0.25; if (b.label === "cat") b.squash = 0.25;
    if (sp > 3 && imp > 2) {
      const c = p.collision.supports && p.collision.supports[0]; if (c) S.dust.push({ x: c.x, y: c.y, t: 0, s: Math.min(40, 10 + imp * 1.5) });
      S.shake = Math.max(S.shake, Math.min(10, imp * 0.25));
    }
  }
}
function hurt(body, imp, sp) {
  if (body.label === "block" && !body.dead) {
    const dmg = imp * 14; if (dmg < 2) return;
    body.hp -= dmg;
    if (sp > 3) sfx(body.mat === "ice" ? [.25, .1, 1400, 0, .01, .06, 0, 1, 0, 0, 0, 0, 0, 1] : body.mat === "stone" ? [.3, .1, 140, 0, .01, .08, 4, 1, 0, 0, 0, 0, 0, 2] : [.3, .1, 260, 0, .01, .07, 4, 1, 0, 0, 0, 0, 0, 1.5]);
    if (body.hp <= 0) body.tnt ? explode(body) : breakBlock(body);
  } else if (body.label === "mouse" && !body.dead) {
    const dmg = imp * 9; if (dmg < 1.2) return;
    body.hp -= dmg; body.ouch = 0.7; if (body.hp <= 0) killMouse(body); else sfx([.3, 0, 900, 0, .02, .08, 1, 1, 30]);
  }
}
function addScore(pts, x, y, col = "#fff") { S.score += pts; S.pops.push({ x, y, text: String(pts), col, t: 0, big: pts >= 5000 }); dirty = true; }
const MATCOL = { wood: ["#c8873a", "#8a5a22"], ice: ["#bfefff", "#7ad0f0"], stone: ["#a8adb8", "#6a707c"], tnt: ["#d83a2a", "#ffd02a"] };
// обломки — настоящие маленькие тела, кувыркаются и падают
function shatter(b, n) {
  const col = MATCOL[b.mat], size = b.sw || (b.r ? b.r * 2 : 40), size2 = b.sh || size;
  for (let k = 0; k < n; k++) {
    const w = 8 + Math.random() * 14, h = 5 + Math.random() * 8, x = b.position.x + (Math.random() - 0.5) * size * 0.8, y = b.position.y + (Math.random() - 0.5) * size2 * 0.8;
    const s = Bodies.rectangle(x, y, w, h, { density: 0.0008, friction: 0.5, restitution: 0.3, collisionFilter: { group: -1 }, label: "shard" });
    s.shard = true; s.sw = w * 1.3; s.sh = w * 1.1; s.col = col[k % 2]; s.spr = b.mat === "tnt" ? null : `deb_${b.mat}_${1 + k % 3}`; s.life = 1.6 + Math.random();
    Body.setVelocity(s, { x: b.velocity.x * 0.5 + (Math.random() - 0.5) * 8, y: b.velocity.y * 0.5 - Math.random() * 7 }); Body.setAngularVelocity(s, (Math.random() - 0.5) * 0.5);
    Composite.add(S.world, s); S.shards.push(s);
  }
  for (let k = 0; k < 6; k++) S.parts.push({ x: b.position.x + (Math.random() - 0.5) * 30, y: b.position.y + (Math.random() - 0.5) * 30, vx: (Math.random() - 0.5) * 6, vy: -Math.random() * 5, s: 4 + Math.random() * 5, a: 0, va: 0.3, col: col[k % 2], t: 0 });
}
function breakBlock(b) {
  b.dead = true; Composite.remove(S.world, b); wakeNear(b.position); shatter(b, b.mat === "ice" ? 8 : 6);
  S.breaks++; addScore(MAT[b.mat].pts, b.position.x, b.position.y);
  sfx(b.mat === "ice" ? [.4, .2, 1800, 0, .02, .25, 0, 1, 0, 0, 0, 0, 0, 2] : b.mat === "stone" ? [.5, .2, 90, 0, .03, .3, 4, 1, 0, 0, 0, 0, 0, 2] : [.45, .2, 200, 0, .02, .25, 4, 1, 0, 0, 0, 0, 0, 1.5]);
}
function explode(b, fake) {
  b.dead = true; if (!fake) Composite.remove(S.world, b); wakeNear(b.position, 600);
  const c = b.position, R = 210;
  for (const o of Composite.allBodies(S.world)) {
    if (o.isStatic) continue; const d = Vector.sub(o.position, c), L = Vector.magnitude(d); if (L > R || L < 1) continue;
    const k = 1 - L / R; Body.setVelocity(o, Vector.add(o.velocity, Vector.mult(Vector.normalise(d), 16 * k)));
    if (!o.shard) hurt(o, 9 * k, 6);
  }
  shatter(b, 10); S.shake = 18; S.dust.push({ x: c.x, y: c.y, t: 0, s: 120, boom: true });
  for (let k = 0; k < 24; k++) S.parts.push({ x: c.x, y: c.y, vx: (Math.random() - 0.5) * 18, vy: (Math.random() - 0.7) * 16, s: 6 + Math.random() * 8, a: 0, va: 0.2, col: k % 2 ? "#ffd02a" : "#ff6a2a", t: 0, puff: true });
  sfx([.9, .1, 60, .01, .1, .7, 4, 2, 0, 0, 0, 0, 0, 2.2]); vibe(80);
}
function killMouse(m) {
  m.dead = true; Composite.remove(S.world, m); wakeNear(m.position, 300);
  for (let k = 0; k < 16; k++) S.parts.push({ x: m.position.x, y: m.position.y, vx: (Math.random() - 0.5) * 10, vy: -Math.random() * 9, s: 5 + Math.random() * 7, a: 0, va: 0.2, col: k % 3 ? "#ffffff" : "#b8b8c8", t: 0, puff: true });
  S.kills++; const pts = m.kind === "king" ? 10000 : 5000; addScore(pts, m.position.x, m.position.y - 30, "#ffd02a");
  sfx([.55, 0, 700, .01, .1, .35, 1, 1, 0, 0, -300, .08, .05]); vibe(30);
  if (S.mice.every(x => x.dead)) S.slow = 0.9;
}
// ---- рогатка и полёт
function loadCat() {
  if (!S.queue.length) return false;
  const kind = S.queue.shift(); S.cat = { kind, r: CATS[kind].r, x: SLING.x, y: SLING.y }; const bl = BARKS[kind]; S.bark = { text: `${CATS[kind].name}: ${bl[Math.floor(Math.random() * bl.length)]}`, t: 0 }; S.state = "aim"; S.used = false; dirty = true;
  sfx([.3, 0, 600, .02, .05, .12, 1, 1, 0, 0, 300, .04]); return true;
}
function trajectory(dx, dy) {
  const g = GRAV * 0.001 * (1000 / 60) ** 2, pts = []; let x = SLING.x + dx, y = SLING.y + dy, vx = -dx * POWER, vy = -dy * POWER;
  for (let i = 0; i < 80; i++) { x += vx; vy += g; y += vy; if (i % 4 === 3) pts.push([x, y]); if (y > GY) break; }
  return pts;
}
function fire(dx, dy) {
  const C = CATS[S.cat.kind];
  const b = Bodies.circle(SLING.x + dx, SLING.y + dy, C.r, { density: C.density, friction: 0.35, restitution: 0.38, frictionAir: 0.0004, label: "cat" });
  b.kind = S.cat.kind; b.r = C.r; b.born = S.t;
  Composite.add(S.world, b); Body.setVelocity(b, { x: -dx * POWER, y: -dy * POWER });
  S.flying = [b]; S.cat = null; S.kills = 0; S.breaks = 0; S.shout = null; S.state = "fly"; S.settleT = 0; S.flyT = 0; S.trail = []; S.killsBefore = S.mice.filter(m => m.dead).length;
  sfx([.5, .05, 300, .01, .05, .2, 1, 1, 6, 0, 0, 0, 0, .5]); sfx([.3, 0, 700, .05, .2, .3, 2, 1, 0, 0, -200, .1, .05, 0, 4]); vibe(15);
}
function ability() {
  if (S.state !== "fly" || S.used) return;
  const b = S.flying[0]; if (!b || S.t - b.born > 4 || b.landed) return;
  if (b.kind === "triple") {
    S.used = true; const v = b.velocity;
    for (const ang of [-0.22, 0.22]) {
      const k = Bodies.circle(b.position.x, b.position.y, 18, { density: 0.005, friction: 0.7, restitution: 0.3, frictionAir: 0.0005, label: "cat" });
      k.kind = "kitten"; k.r = 18; k.born = S.t; Composite.add(S.world, k); Body.setVelocity(k, Vector.rotate(v, ang)); S.flying.push(k);
    }
    Body.scale(b, 18 / 22, 18 / 22); b.r = 18; b.kind = "kitten";
    for (let k = 0; k < 10; k++) S.parts.push({ x: b.position.x, y: b.position.y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, s: 5, a: 0, va: 0, col: "#ffffff", t: 0, puff: true });
    sfx([.4, 0, 1000, .01, .05, .15, 1, 1, 0, 0, 500, .04]);
  } else if (b.kind === "bomb") {
    S.used = true; b.r = 1; explode({ position: b.position, velocity: b.velocity, mat: "tnt", sw: 40, sh: 40, dead: false }, true); b.gone = true; Composite.remove(S.world, b);
  } else if (b.kind === "rocket") {
    S.used = true; const sp = Math.max(19, Vector.magnitude(b.velocity) * 1.9);
    Body.setVelocity(b, Vector.mult(Vector.normalise(b.velocity), sp)); b.boost = 0.6;
    sfx([.5, .1, 120, .01, .2, .3, 3, 1, 3, 0, 0, 0, 0, 1.5]);
  }
}
// ---- шаг мира
let acc = 0;
function step(dt) {
  if (!S) return;
  const k = S.slow > 0 ? 0.3 : 1; if (S.slow > 0) S.slow -= dt;
  acc += Math.min(dt, 0.1) * k;
  while (acc >= 1 / 60) {
    acc -= 1 / 60; S.t += 1 / 60;
    Engine.update(S.engine, 1000 / 60);
    for (const m of S.mice) if (!m.dead && (m.position.y > WH + 200 || m.position.x < -200 || m.position.x > S.def.w + 300)) killMouse(m);
    for (const b of S.blocks) if (!b.dead && (b.position.y > WH + 200 || b.position.x > S.def.w + 400)) { b.dead = true; Composite.remove(S.world, b); if (!b.tnt) addScore(MAT[b.mat].pts, b.position.x, GY); }
    for (const s of S.shards) { s.life -= 1 / 60; if (s.life <= 0 && !s.gone) { s.gone = true; Composite.remove(S.world, s); } }
    S.shards = S.shards.filter(s => !s.gone);
    for (const f of S.flying) if (f.squash) f.squash = Math.max(0, f.squash - 1 / 60);
    if (S.state === "fly") {
      S.flyT += 1 / 60; S.trailT += 1 / 60;
      const c = S.flying[0];
      for (const f of S.flying) if (!f.landed && S.t - f.born > 0.3 && f.speed < 4) f.landed = true;
      if (c && !c.gone && !c.landed && S.trailT > 0.045) { S.trailT = 0; S.trail.push([c.position.x, c.position.y, S.trail.length % 3 === 0 ? 7 : 4]); }
      for (const f of S.flying) if (!f.gone && (f.position.x > S.def.w + 300 || f.position.x < -300 || f.position.y > WH + 300)) { f.gone = true; Composite.remove(S.world, f); }
      const moving = Composite.allBodies(S.world).some(b => !b.isStatic && !b.shard && !b.isSleeping && Vector.magnitude(b.velocity) > 0.3);
      S.settleT = moving ? 0 : S.settleT + 1 / 60;
      if (S.settleT > 0.7 || S.flyT > 10) endShot();
    }
  }
  for (const p of S.parts) { p.t += dt; p.x += p.vx * k; p.y += p.vy * k; p.vy += 0.35 * k; p.a += p.va; }
  S.parts = S.parts.filter(p => p.t < 1.2);
  for (const p of S.pops) p.t += dt; S.pops = S.pops.filter(p => p.t < 1.3);
  for (const d of S.dust) d.t += dt; S.dust = S.dust.filter(d => d.t < 0.8);
  for (const m of S.mice) if (m.ouch) m.ouch = Math.max(0, m.ouch - dt);
  if (S.taunt > 0) S.taunt -= dt;
  S.shake *= 0.85; if (S.shake < 0.3) S.shake = 0;
}
function endShot() {
  if (S.kills >= 2 || S.breaks >= 6) { const w = S.kills >= 3 ? "ТРОЙНОЙ УДАР!" : S.kills === 2 ? "ДВОЙНОЙ УДАР!" : "РАЗГРОМ!"; const bonus = (S.kills >= 2 ? S.kills * 2000 : 0) + (S.breaks >= 6 ? S.breaks * 200 : 0); S.score += bonus; S.shout = { text: w, sub: `+${bonus}`, t: 0 }; sfx([.5, 0, 660, .02, .2, .4, 1, 1, 0, 0, 330, .08, .08]); }
  for (const b of S.flying) if (!b.gone) Composite.remove(S.world, b);
  S.flying = [];
  if (S.mice.every(m => m.dead)) return win();
  if (S.mice.filter(m => m.dead).length === S.killsBefore) { S.taunt = 1.6; const king = S.mice.some(m => !m.dead && m.kind === "king"), tl = king ? KING_TAUNTS : TAUNTS; S.tauntText = tl[Math.floor(Math.random() * tl.length)]; sfx([.35, 0, 900, .02, .05, .1, 1, 1, 0, 0, 200, .04, .06, 0, 0, 0, 0, .8]); }
  if (!loadCat()) return lose();
}
function win() {
  S.state = "won";
  const bonus = S.queue.length * 10000; if (bonus) addScore(bonus, SLING.x, SLING.y - 80, "#ffd02a");
  const ratio = S.score / S.maxPts, st = ratio >= 0.7 ? 3 : ratio >= 0.48 ? 2 : 1;
  P.stars[S.n] = Math.max(P.stars[S.n] || 0, st); P.best[S.n] = Math.max(P.best[S.n] || 0, S.score);
  if (P.lvl <= S.n) P.lvl = S.n + 1; S.stars = st; saveP(); if (typeof yaScore === "function") yaScore();
  sfx([.6, 0, 523, .02, .3, .6, 1, 1, 0, 0, 262, .1, .25, 0, 0, 0, .2]); dirty = true;
}
function lose() { S.state = "lost"; S.taunt = 3; S.tauntText = "Рыбка наша!"; sfx([.5, 0, 220, .05, .2, .6, 3, 1, -2, 0, 0, 0, 0, .3]); dirty = true; }
function extraCat() { S.queue.push("ginger"); S.extra++; S.state = "load"; loadCat(); dirty = true; }
function newProfile() { return { lvl: 0, stars: [], best: [], seen: {}, t: 0 }; }
function saveP() { P.t = Date.now(); save("p", P); if (typeof yaPush === "function") yaPush(); }
const totalStars = () => P.stars.reduce((a, b) => a + (b || 0), 0);
function vibe(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }
function muteAll(m) { if (master) master.gain.value = m ? 0 : 0.32; }
window.addEventListener("pointerdown", () => { if (soundOn) audio(); }, { passive: true });
